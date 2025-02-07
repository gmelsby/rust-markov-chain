import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import OutputControlPanel from './Components/OutputControlPanel';
import ChainSelector from './Components/ChainSelector';
import './App.css'

const CHOICES = 5;
const CHAIN_VERSION = 'v1';



function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [ngramLength, setNgramLength] = useState(2);
  const [output, setOutput] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // When chain is loaded, resets output
  useEffect(() => {
    if (loaded) {
      setOutput([]);
    }
  }, [loaded]);

  return (
    <>
      <h1>Markov Chain</h1>
      <ChainSelector {...{ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded }} chainVersion={CHAIN_VERSION} />
      <div className='text-start whitespace-pre-line'>
        <p>
          {output.join("")}
        </p>
      </div>
      {loaded && <OutputControlPanel {...{ markovChain, ngramLength, output, setOutput, loaded }} choices={CHOICES} />}
    </>
  )
}
export default App;