import { useState, useEffect } from 'react'
import { WasmMarkovChain } from 'markov_chain_wasm';
import OutputControlPanel from './Components/OutputControlPanel';
import ChainSelector from './Components/ChainSelector';

const CHOICES = 15;
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
      <div className="bg-neutral-700">
        <ChainSelector {...{ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, setOutput }} chainVersion={CHAIN_VERSION} />
      </div>
      {output.length !== 0 && <div className='max-w-7xl m-auto'>
        <div className='mx-3 text-start whitespace-pre-line p-5 mb-40 rounded-lg bg-neutral-700/40'>
          <p>
            {output.join("")}
          </p>
        </div>
      </div >
      }
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl m-auto">
        {loaded && <OutputControlPanel {...{ markovChain, ngramLength, output, setOutput, loaded }} choices={CHOICES} />}
      </div>
    </>
  )
}
export default App;