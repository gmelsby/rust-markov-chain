import { useState, useEffect, useRef, useCallback } from 'react';
import { WasmMarkovChain, Token } from 'markov_chain_wasm';
import WordButtons from './WordButtons';
import Button from './Button';
import { MdArrowDownward, MdFastForward, MdOutlineBackspace, MdPause, MdPlayArrow, MdRefresh } from 'react-icons/md';

function OutputControlPanel({ markovChain, ngramLength, output, setOutput, loaded, choices, autoScroll, setAutoScroll }:
  {
    markovChain: WasmMarkovChain | null,
    ngramLength: number,
    output: Token[],
    setOutput: React.Dispatch<React.SetStateAction<Token[]>>,
    loaded: boolean,
    choices: number,
    autoScroll: boolean,
    setAutoScroll: React.Dispatch<React.SetStateAction<boolean>>,
  }) {

  const [wordOptions, setWordOptions] = useState<Token[]>([]);
  const [generating, setGenerating] = useState(false);
  const [fastForward, setFastForward] = useState(false);
  const [possibleStarts, setPossibleStarts] = useState<Token[][]>([]);
  const outputRef = useRef<Token[]>(output);

  // Keeps track of tokens that come before visible output, for use when backspacing towards start of output
  const [preOutput, setPreOutput] = useState<Token[]>([]);

  const createStarts = useCallback(() => {
    if (markovChain !== null && !markovChain.is_empty()) {
      const possibleList: Token[][] = [];
      for (let i = 0; i < choices + 5; i++) {
        const candidate: Token[] = markovChain.find_paragraph_start();
        console.log(candidate);
        if (!possibleList.some(o => o[o.length - 1].get_int() === candidate[candidate.length - 1].get_int())) {
          possibleList.push(candidate);
        }
      }
      setPossibleStarts(possibleList);
    }
  }, [markovChain, choices])

  // Handles the submission at the start of output
  const handleSubmitStart = useCallback((startVec: Token[]) => {
    console.log('handling submit start');
    if (markovChain && !markovChain.is_empty()) {
      const preStartTokens = startVec.slice(0, -1);
      markovChain.load_ngram(new Uint32Array(preStartTokens.map(t => t.get_int())));
      const tk = startVec[startVec.length - 1].get_int();
      const formattedTk = markovChain.put_next_token(tk).trim();
      // Set states accordingly
      setPreOutput(preStartTokens);
      setOutput(o => [...o, new Token(formattedTk, tk)]);
    }
  }, [markovChain, setOutput]);



  // Creates starts when chain initializes or is reset to 0 length
  useEffect(() => {
    if (loaded && markovChain !== null && !markovChain?.is_empty() && output.length == 0) {
      console.log('creating starts');
      createStarts();
    }
  }, [markovChain, loaded, createStarts, output.length]);

  // Provides new options for the wordOptions list whenever output length changes
  // While generating is true, skips updating wordOptions because users cannot select them
  useEffect(() => {
    if (markovChain && !markovChain.is_empty() && output.length > 0 && !generating) {
      console.log('updating word options');
      setWordOptions(markovChain.peek_next_tokens(choices));
    }
  }, [markovChain, output, generating, choices]);

  // Keeps outputRef current set to output whenever output changes
  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  // Generates tokens when generate is flipped to true
  useEffect(() => {
    let timeoutId: number;
    const generateTokens = async () => {
      if (markovChain && !markovChain.is_empty() && generating) {
        console.log('generating');
        if (outputRef.current.length === 0 && possibleStarts.length !== 0) {
          handleSubmitStart(possibleStarts[0]);
        } else {
          const nextToken = markovChain.peek_next_tokens(1);
          const formattedToken = markovChain.put_next_token(nextToken[0].get_int());
          setOutput(t => {
            return [...t, new Token(formattedToken, nextToken[0].get_int())];
          });
        }
        timeoutId = setTimeout(generateTokens, fastForward ? 0 : 50);
      }

    }

    if (generating) {
      generateTokens();
    }

    return () => clearTimeout(timeoutId);

  }, [markovChain, generating, possibleStarts, fastForward, setOutput, handleSubmitStart]);


  // Handler for refreshing token options
  const handleRefresh = () => {
    if (!markovChain || markovChain.is_empty()) {
      return;
    }
    if (output.length === 0) {
      createStarts();
    } else {
      setWordOptions(markovChain.peek_next_tokens(choices));
    }
  }

  const handleGenerateToggle = () => {
    if (markovChain && !markovChain.is_empty()) {
      // Turn off fast forward when turning generating off
      if (generating) {
        setFastForward(false);
      }

      setGenerating((g: boolean) => !g);
    }
  }

  const handleSubmitToken = (tk: number) => {
    if (markovChain && !markovChain.is_empty()) {
      console.log(tk);
      const formattedTk = markovChain.put_next_token(tk);
      setOutput(o => [...o, new Token(formattedTk, tk)]);
    }
  }

  const handleBackspace = useCallback(() => {
    console.log("backspace");
    if (markovChain && !markovChain.is_empty() && output.length + preOutput.length > ngramLength) {
      // use preOutput if our output length is not long enough
      const tkSlice = output.length > ngramLength ?
        // Second to last complete n-gram in output
        output.slice(-(1 + ngramLength), -1)
        :
        // Get suitable amount of preOutput elements with as many elements from output (minus last one) as possible
        preOutput.slice(output.length - 1).concat(output.slice(0, -1));

      console.log(tkSlice.map(t => t.get_str()));

      markovChain.load_ngram(new Uint32Array(tkSlice.map((tk) => tk.get_int())));
      setOutput(o => o.slice(0, -1));
    }
  }, [markovChain, ngramLength, output, preOutput, setOutput]);

  // To be passed to WordButtons as prop
  const wordButtonList = output.length === 0 ?
    possibleStarts.map(startVec => ({
      onClick: () => handleSubmitStart(startVec),
      key: startVec[startVec.length - 1].get_str(),
      content: startVec[startVec.length - 1].get_str()
    }))
    :
    wordOptions.map(option => ({
      onClick: () => handleSubmitToken(option.get_int()),
      key: option.get_str(),
      content: option.get_str() === '\n' ? '\\n' : option.get_str()
    }));

  return (
    <>
      <div className="flex flex-row justify-between">
        <div className="p-2 inline-flex justify-start space-x-1 bg-neutral-700 xl:rounded-t-2xl rounded-tr-2xl">
          <Button
            size='sm'
            onClick={handleGenerateToggle}
          >
            {generating ?
              <MdPause />
              :
              <MdPlayArrow />
            }
          </Button>
          {generating ?
            <Button
              size='sm'
              onClick={() => setFastForward(f => !f)}
              active={fastForward}
            >
              <MdFastForward />
            </Button>
            :
            <>
              <Button
                size='sm'
                disabled={(wordButtonList.length !== choices && output.length > 0) || generating}
                onClick={handleRefresh}
              >
                <MdRefresh />
              </Button>

              <Button
                size='sm'
                disabled={output.length + preOutput.length <= ngramLength || generating}
                onClick={handleBackspace}
                onLongPress={handleBackspace}
                longPressOptions={{ repeat: true }}
              >
                <MdOutlineBackspace />
              </Button>
            </>
          }
        </div >
        {!autoScroll && <div
          className="p-2 bg-neutral-950 rounded-full cursor-pointer w-10 h-10 flex justify-center items-center mx-1.5"
          onClick={() => setAutoScroll(true)}
        >
          <MdArrowDownward />
        </div>}
      </div>
      <div className="bg-neutral-700 xl:rounded-tr-2xl">
        {!generating && <WordButtons buttonList={wordButtonList} />}
      </div>
    </>
  )

}

export default OutputControlPanel;