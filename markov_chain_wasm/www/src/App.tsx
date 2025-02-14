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
  const outputDivRef = useRef<HTMLDivElement>(null);
  const paddingDivRef = useRef<HTMLDivElement>(null);
  const lastKnownScrollYRef = useRef<number>(0);
  // When chain is loaded, resets output
  useEffect(() => {
    if (loaded) {
      setOutput([]);
    }
  }, [loaded]);

  // When output is cleared, turn autoScroll on
  useEffect(() => {
    if (!output.length) {
      setAutoScroll(true);
    }
  }, [output.length]);

  // Sets up resize observer to scroll to bottom
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (paddingDivRef.current)
        paddingDivRef.current.scrollIntoView({ behavior: 'smooth' });
    })

    if (autoScroll && outputDivRef.current) {
      resizeObserver.observe(outputDivRef.current);
    }

    return (() => {
      resizeObserver.disconnect();
    })
  }, [autoScroll]);


  // Set up event listener to determine if user has scrolled up or scrolled to the bottom
  useEffect(() => {
    const handleScroll = () => {
      if (outputDivRef.current) {
        // Handle scrolling up
        if (autoScroll &&
          lastKnownScrollYRef.current >= window.scrollY + 5 &&
          window.scrollY + window.innerHeight < document.documentElement.scrollHeight
          // case where iOS Safari "scrolls up" with spring behavior from beyond the document end
        ) {

          setAutoScroll(false);
        }
        // Handle scrolling down
        else {
          // Check if scrolled to bottom
          if (!autoScroll && window.scrollY + window.innerHeight + 10 >= document.documentElement.scrollHeight) {
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
  }, [autoScroll]);

  return (
    <div className="">
      <div className="bg-neutral-700">
        <h1>Markov Chain</h1>
        <ChainSelector {...{ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, setOutput }} chainVersion={CHAIN_VERSION} />
      </div>
      <div className='max-w-7xl m-auto mt-5 pb-25' ref={outputDivRef}>
        <div className={`mx-3 text-start whitespace-pre-wrap p-5 rounded-lg bg-neutral-700/40 ${output.length === 0 ? 'opacity-0' : ''}`}>
          <p>
            {output.map((tk) => tk.get_str()).join("")}
          </p>
        </div>
      </div>
      <div className='h-10 mb-5' ref={paddingDivRef}></div>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl m-auto">
        {loaded && <OutputControlPanel {...{ markovChain, ngramLength, output, setOutput, loaded, autoScroll, setAutoScroll }} choices={CHOICES} />}
      </div>
    </div>
  )
}
export default App;