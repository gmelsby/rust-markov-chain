import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import './App.css'

function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    const initializeChain = async () => {
      const chain = new WasmMarkovChain(2); // Example n-gram length
      setMarkovChain(chain);
    };

    initializeChain();
  }, []);

  const handleLoadChain = async () => {
    if (markovChain) {
      await markovChain.load_chain('/chains/testchain', 1);
      console.log("loaded chain 1");
      await markovChain.load_chain('/chains/testchain2', 1);
      console.log("loaded chain 2");
      const nextToken = markovChain.peek_next_tokens(5);
      console.log(nextToken);
      setOutput([markovChain.find_sentence_start()]);
      console.log(markovChain.peek_next_tokens(5));
    }
  };

  const handleGenerate = () => {
    if (markovChain) {
      console.log("generating");
      const nextTokens = markovChain.peek_next_tokens(5);
      const formattedToken = markovChain.put_next_token(nextTokens[0]);
      setOutput(t => {
        console.log("setting output");
        console.log(nextTokens);
        return [...t, formattedToken];
      });
    }
  };

  const handleReset = () => {
    setMarkovChain(new WasmMarkovChain(2));
  }

  const handleClear = () => {
    setOutput([]);
  }

  return (
    <>
      <h1>Markov Chain</h1>
      <div className="card">
        <button onClick={() => handleLoadChain()}>
          Click to Load
        </button>
        <button onClick={() => handleGenerate()}>
          Click to Generate
        </button>
        <button onClick={() => handleReset()}>
          Click to Reset Chain
        </button>
        <button onClick={() => handleClear()}>
          Click to Clear Text
        </button>

        <p>
          {output.join("")}
        </p>
      </div>
    </>
  )
}

export default App
