import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import './App.css'

function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [chainList, setChainList] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<{ name: string, weight: number }[]>([]);
  const [ngramLength, setNgramLength] = useState(2);
  const [output, setOutput] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const initializeChain = async () => {
      const chain = new WasmMarkovChain(ngramLength);
      setMarkovChain(chain);
    };

    initializeChain();
  }, [ngramLength]);

  useEffect(() => {
    const fetchChains = async () => {
      const chainResponse = await fetch('chains/');
      const chainObjects = await chainResponse.json();
      setChainList(chainObjects.map((o: { name: string }) => o.name))
    }

    fetchChains();

  }, []);



  const handleLoadChain = async () => {
    if (markovChain && selectedChains.length > 0) {
      for (const chainObject of selectedChains) {
        await markovChain.load_chain(`/chains/${chainObject.name}/${ngramLength}`, chainObject.weight);
        console.log(`loaded chain ${chainObject.name}`);
      }
      const sentenceList = markovChain.find_sentence_start();
      console.log(sentenceList);

      const sentenceListTwo = markovChain.find_sentence_start();
      console.log(sentenceListTwo);

      markovChain.load_ngram(sentenceList.slice(0, -1));
      console.log(markovChain.peek_next_tokens(5));

      const fmtToken = markovChain.put_next_token(sentenceList[sentenceList.length - 1]);
      console.log("put");
      setOutput(o => [...o, fmtToken]);
      console.log(markovChain.peek_next_tokens(5));
    }
  };

  useEffect(() => {
    let timeoutId: number;
    const generateTokens = async () => {
      if (markovChain && !markovChain.is_empty() && generating) {
        console.log("generating");
        const nextTokens = markovChain.peek_next_tokens(5);
        console.log(nextTokens);
        const formattedToken = markovChain.put_next_token(nextTokens[0]);
        setOutput(t => {
          return [...t, formattedToken];
        });

        timeoutId = setTimeout(generateTokens, 70);
      }

    }

    if (generating) {
      generateTokens();
    }

    return () => clearTimeout(timeoutId);

  }, [markovChain, generating]);


  const handleStop = () => {
    setGenerating(false);
  }

  const handleGenerate = () => {
    if (markovChain && !markovChain.is_empty()) {
      setGenerating(true);
    };
  }

  const handleReset = () => {
    setMarkovChain(new WasmMarkovChain(3));
  }

  const handleClear = () => {
    setOutput([]);
  }

  return (
    <>
      <h1>Markov Chain</h1>
      <h2>{chainList.map(chain => <span onClick={() => setSelectedChains(chains => [...chains, { name: chain, weight: 1 }])} key={chain}>{chain} </span>)}</h2>
      <h2>{selectedChains.map(c => c.name).join(" ")}</h2>
      <select value={ngramLength} onChange={e => setNgramLength(Number(e.target.value))}>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
      <div>
        <button onClick={() => handleLoadChain()}>
          Click to Load
        </button>
        <button onClick={generating ? handleStop : handleGenerate}>
          Click to {generating ? 'Stop' : 'Generate'}
        </button>
        <button onClick={() => handleReset()}>
          Click to Reset Chain
        </button>
        <button onClick={() => handleClear()}>
          Click to Clear Text
        </button>

      </div>
      <div className='card'>
        <p>
          {output.join("")}
        </p>
      </div>

    </>
  )
}
export default App;