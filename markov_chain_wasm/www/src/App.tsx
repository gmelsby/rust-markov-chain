import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import './App.css'

function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const initializeChain = async () => {
      const chain = new WasmMarkovChain(2); // Example n-gram length
      setMarkovChain(chain);
    };

    initializeChain();
  }, []);

  const handleLoadChain = async () => {
    if (markovChain) {
      await markovChain.load_chain(`/chains/${import.meta.env.VITE_CHAIN_1}/2`, 1);
      console.log("loaded chain 1");
      await markovChain.load_chain(`/chains/${import.meta.env.VITE_CHAIN_2}/2`, 1);
      console.log("loaded chain 2");
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

        timeoutId = setTimeout(generateTokens, 100);
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