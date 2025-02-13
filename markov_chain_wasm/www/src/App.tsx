import { useState, useEffect, useRef } from 'react'
import { WasmMarkovChain, Token } from 'markov_chain_wasm';
import OutputControlPanel from './Components/OutputControlPanel';
import ChainSelector from './Components/ChainSelector';

const CHOICES = 15;
const CHAIN_VERSION = 'v2';



function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [ngramLength, setNgramLength] = useState(2);
  const [output, setOutput] = useState<Token[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollDivRef = useRef<HTMLDivElement>(null);
  const lastKnownScrollYRef = useRef<number>(0);
  // When chain is loaded, resets output
  useEffect(() => {
    if (loaded) {
      setOutput([]);
    }
  }, [loaded]);

  // As output is updated, scrolls to bottom if autoScroll enabled
  useEffect(() => {
    if (autoScroll && scrollDivRef.current) {
      scrollDivRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (!output.length) {
      setAutoScroll(true);
    }
  }, [autoScroll, output.length])

  // Set up event listener to determine if user has scrolled up or scrolled to the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (scrollDivRef.current) {
        // Handle scrolling up
        if (lastKnownScrollYRef.current >= window.scrollY) {

          setAutoScroll(false);
        }
        // Handle scrolling down
        else {
          // Check if scrolled to bottom
          if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
            setAutoScroll(true);
          }
        }
      }
      lastKnownScrollYRef.current = window.scrollY;
      console.log(lastKnownScrollYRef)
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <>
      <div className="bg-neutral-700">
        <h1>Markov Chain</h1>
        <ChainSelector {...{ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, setOutput }} chainVersion={CHAIN_VERSION} />
      </div>
      <div className='max-w-7xl m-auto mt-5 pb-45' ref={scrollDivRef}>
        <div className={`mx-3 text-start whitespace-pre-wrap p-5 rounded-lg bg-neutral-700/40 ${output.length === 0 ? 'opacity-0' : ''}`}>
          <p>
            {output.map((tk) => tk.get_str()).join("")}
          </p>
        </div>
      </div >
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl m-auto">
        {loaded && <OutputControlPanel {...{ markovChain, ngramLength, output, setOutput, loaded, autoScroll, setAutoScroll }} choices={CHOICES} />}
      </div>
    </>
  )
}
export default App;