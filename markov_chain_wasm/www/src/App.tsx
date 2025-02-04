import { useState, useEffect, useRef, useCallback } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import './App.css'

const CHOICES = 5;

function SelectedChainDisplay({ chain, changeWeight, loadedChainList }:
  {
    chain:
    {
      name: string,
      weight: number,
    },
    changeWeight: (newWeight: number) => void;
    loadedChainList: string[],
  }) {

  return (
    <div>
      {chain.name}
      <input
        type="range"
        min="0.1"
        max="10"
        step="0.1"
        value={chain.weight}
        onChange={e => changeWeight(Number(e.target.value))}
      />
      {chain.weight}
      {loadedChainList.includes(chain.name) ? '✅' : '⭕️'}
    </div>
  );


}

function ChainSelector({ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded }:
  {
    setMarkovChain: React.Dispatch<React.SetStateAction<WasmMarkovChain | null>>,
    ngramLength: number,
    setNgramLength: React.Dispatch<React.SetStateAction<number>>,
    loaded: boolean,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    setOutput: React.Dispatch<React.SetStateAction<string[]>>,
  }) {
  const [chainList, setChainList] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<{ name: string, weight: number }[]>([]);
  const [loadedChainList, setLoadedChainList] = useState<string[]>([]);
  const [chainOption, setChainOption] = useState<string>("");

  // Fetch list of possible chains
  useEffect(() => {
    const fetchChains = async () => {
      const chainResponse = await fetch('chains/');
      const chainObjects = await chainResponse.json();
      setChainList(chainObjects.map((o: { name: string }) => o.name));
    }

    fetchChains();
  }, []);

  // Sets the chainOption to the first possible choice
  useEffect(() => {
    if (chainList.length) {
      const possibleChains = chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c));
      if (possibleChains.length) {
        setChainOption(possibleChains[0]);
      }
    }
  }, [chainList, chainList.length, selectedChains, selectedChains.length]);

  // Reset loaded status upon change in markov chain specification
  useEffect(() => {
    setLoaded(false);
    setLoadedChainList([]);
  }, [selectedChains.length, ngramLength, setLoaded, setLoadedChainList])


  const handleLoadChain = async () => {
    if (selectedChains.length > 0) {
      const newChain = new WasmMarkovChain(ngramLength);
      for (const chainObject of selectedChains) {
        console.log(selectedChains);
        await newChain.load_chain(`/chains/${chainObject.name}/${ngramLength}`, chainObject.weight);
        setLoadedChainList(l => [...l, chainObject.name]);
        console.log(`loaded chain ${chainObject.name}`);
      }
      setMarkovChain(newChain);
      setLoaded(true);
    }
  };

  // Curried function that changes the weight of a selected chain
  const changeChainWeight = (name: string) => {
    return (newWeight: number) => {
      setSelectedChains(chains => chains.map(chain => chain.name === name ? { ...chain, weight: newWeight } : chain));
      setLoaded(false);
      setLoadedChainList([]);
    }
  };

  return (
    <div>
      <button onClick={() => {
        if (chainOption.length) {
          setSelectedChains(chains => [...chains, { name: chainOption, weight: 1 }]);
        }
      }}>
        Add
      </button>
      <select value={chainOption} onChange={e => setChainOption(e.target.value)}> {chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain} </option>)}</select >
      <div>{selectedChains.map(c =>
        <SelectedChainDisplay chain={c} key={c.name} changeWeight={changeChainWeight(c.name)} loadedChainList={loadedChainList} />
      )}</div>

      <select value={ngramLength} onChange={e => setNgramLength(Number(e.target.value))}>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>

      {
        !loaded && selectedChains.length > 0 && <button onClick={() => handleLoadChain()}>
          Click to Load
        </button>
      }

    </div >
  )

}

function OutputControlPanel({ markovChain, ngramLength, output, setOutput, loaded }:
  {
    markovChain: WasmMarkovChain | null,
    ngramLength: number,
    output: string[],
    setOutput: React.Dispatch<React.SetStateAction<string[]>>,
    loaded: boolean,
  }) {

  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [possibleStarts, setPossibleStarts] = useState<string[][]>([]);
  const wordOptionsRef = useRef<string[]>(wordOptions);
  const outputRef = useRef<string[]>(output);

  const createStarts = useCallback(() => {
    if (markovChain !== null && !markovChain.is_empty()) {
      const possibleList: string[][] = [];
      while (possibleList.length < CHOICES) {
        const candidate = markovChain.find_sentence_start();
        console.log(candidate);
        if (!possibleList.some(o => o[o.length - 1] === candidate[candidate.length - 1])) {
          possibleList.push(candidate);
        }
      }
      setPossibleStarts(possibleList);
    }
  }, [markovChain])

  const handleSubmitStart = useCallback((startVec: string[]) => {
    console.log('handling submit start');
    if (markovChain && !markovChain.is_empty()) {
      markovChain.load_ngram(startVec.slice(0, -1));
      const formattedTk = markovChain.put_next_token(startVec[startVec.length - 1]);
      setOutput(o => [...o, formattedTk]);
    }
  }, [markovChain, setOutput]);



  useEffect(() => {
    if (loaded && markovChain !== null && !markovChain?.is_empty() && output.length == 0) {
      console.log('creating starts');
      createStarts();
    }
  }, [markovChain, loaded, createStarts, output.length]);

  useEffect(() => {
    if (markovChain && !markovChain.is_empty() && output.length > 0) {
      setWordOptions(markovChain.peek_next_tokens(CHOICES))
    }
  }, [markovChain, output]);

  useEffect(() => {
    wordOptionsRef.current = wordOptions;
  }, [wordOptions]);

  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  useEffect(() => {
    let timeoutId: number;
    const generateTokens = async () => {
      if (markovChain && !markovChain.is_empty() && generating) {
        console.log('generating');
        if (outputRef.current.length === 0 && possibleStarts.length !== 0) {
          handleSubmitStart(possibleStarts[0]);
        } else {
          console.log(wordOptionsRef.current);
          const formattedToken = markovChain.put_next_token(wordOptionsRef.current[0]);
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
      </div>}
      <div>
        <button onClick={handleGenerateToggle}>{generating ? 'Stop' : 'Generate'}</button>
        <button onClick={handleBackspace}>{'<-'}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  )

}

function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [ngramLength, setNgramLength] = useState(2);
  const [output, setOutput] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initializeChain = async () => {
      const chain = new WasmMarkovChain(ngramLength);
      setMarkovChain(chain);
    };

    initializeChain();
  }, [ngramLength]);

  // When chain is loaded, resets output
  useEffect(() => {
    if (loaded) {
      setOutput([]);
    }
  }, [loaded]);

  return (
    <>
      <h1>Markov Chain</h1>
      <ChainSelector {...{ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, setOutput }} />
      <div className='card'>
        <p>
          {output.join("")}
        </p>
      </div>
      {loaded && <OutputControlPanel {...{ markovChain, ngramLength, output, setOutput, loaded }} />}
    </>
  )
}
export default App;