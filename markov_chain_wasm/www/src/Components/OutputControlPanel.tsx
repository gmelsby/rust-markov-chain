import { useState, useEffect, useRef, useCallback } from 'react';
import { WasmMarkovChain } from 'markov_chain_wasm';

function OutputControlPanel({ markovChain, ngramLength, output, setOutput, loaded, choices }:
  {
    markovChain: WasmMarkovChain | null,
    ngramLength: number,
    output: string[],
    setOutput: React.Dispatch<React.SetStateAction<string[]>>,
    loaded: boolean,
    choices: number,
  }) {

  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [possibleStarts, setPossibleStarts] = useState<string[][]>([]);
  const outputRef = useRef<string[]>(output);

  const createStarts = useCallback(() => {
    if (markovChain !== null && !markovChain.is_empty()) {
      const possibleList: string[][] = [];
      while (possibleList.length < choices) {
        const candidate = markovChain.find_sentence_start();
        console.log(candidate);
        if (!possibleList.some(o => o[o.length - 1] === candidate[candidate.length - 1])) {
          possibleList.push(candidate);
        }
      }
      setPossibleStarts(possibleList);
    }
  }, [markovChain, choices])

  const handleSubmitStart = useCallback((startVec: string[]) => {
    console.log('handling submit start');
    if (markovChain && !markovChain.is_empty()) {
      markovChain.load_ngram(startVec.slice(0, -1));
      const formattedTk = markovChain.put_next_token(startVec[startVec.length - 1]);
      setOutput(o => [...o, formattedTk]);
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
          const formattedToken = markovChain.put_next_token(nextToken[0]);
          setOutput(t => {
            return [...t, formattedToken];
          });
        }
        timeoutId = setTimeout(generateTokens, 50);
      }

    }

    if (generating) {
      generateTokens();
    }

    return () => clearTimeout(timeoutId);

  }, [markovChain, generating, possibleStarts, setOutput, handleSubmitStart]);


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
      setGenerating((g: boolean) => !g);
    }
  }

  const handleSubmitToken = (tk: string) => {
    if (markovChain && !markovChain.is_empty()) {
      console.log(tk);
      const formattedTk = markovChain.put_next_token(tk);
      setOutput(o => [...o, formattedTk]);
    }
  }

  const handleBackspace = () => {
    if (markovChain && !markovChain.is_empty() && output.length > ngramLength) {
      markovChain.load_ngram(output.slice(-(1 + ngramLength), -1));
      setOutput(o => o.slice(0, -1));
    }
  }

  const handleReset = () => {
    if (markovChain && !markovChain.is_empty()) {
      setGenerating(false);
      setOutput([]);
      createStarts();
    }
  }

  return (
    <div>
      {!generating && <div>
        {output.length === 0 ?
          possibleStarts.map(startVec => <button onClick={() => handleSubmitStart(startVec)} key={startVec.join('')}>{startVec[startVec.length - 1]}</button>)
          : wordOptions.map(option =>
            <button onClick={() => handleSubmitToken(option)} key={option}> {option === '\n' ? '\\n' : option} </button>
          )}

        {wordOptions.length === choices && <button onClick={handleRefresh}>Refresh Options</button>}
      </div>}
      <div>
        <button onClick={handleGenerateToggle}>{generating ? 'Stop' : 'Generate'}</button>
        <button onClick={handleBackspace}>{'<-'}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div >
  )

}

export default OutputControlPanel;