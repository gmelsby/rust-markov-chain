import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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
      console.log("loaded chain");
      const nextToken = markovChain.peek_next_tokens(5);
      console.log(nextToken);
    }
  };

  const handleGenerate = () => {
    if (markovChain) {
      for (let step = 0; step < 1000; step++) {
        setOutput(t => {
          const nextTokens = markovChain.peek_next_tokens(5);
          console.log(nextTokens);
          const formattedToken = markovChain.put_next_token(nextTokens[0]);
          return [...t, formattedToken];
        });
      }
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => handleLoadChain()}>
          Click to Load
        </button>
        <button onClick={() => handleGenerate()}>
          Click to Generate
        </button>

        <p>
          {output.join("")}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
