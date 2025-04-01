import { useState, useEffect, useRef, useCallback } from "react";
import { WasmMarkovChain } from "markov_chain_wasm";
import OutputControlPanel from "./Components/OutputControlPanel";
import TopBar from "./Components/TopBar";
import ChainControlPanel from "./Components/ChainControlPanel";
import useScroll from "./Hooks/useScroll";
import ChainContextProvider from './Context/ChainContextProvider';

const CHOICES = 15;
const CHAIN_VERSION = "v3";

function App() {
  const [markovChain, setMarkovChain] = useState<WasmMarkovChain | null>(null);
  const [ngramLength, setNgramLength] = useState(2);
  const [output, setOutput] = useState<{ str: string; int: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const outputDivRef = useRef<HTMLDivElement>(null);
  const paddingDivRef = useRef<HTMLDivElement>(null);

  const { lastKnownScrollY, scrollDirection, scrollLength } = useScroll();

  // Reset output to empty
  const resetOutput = useCallback(() => {
    setOutput([]);
    setAutoScroll(true);
  }, []);

  // When chain is loaded, resets output
  useEffect(() => {
    if (loaded) {
      resetOutput();
    }
  }, [loaded, resetOutput]);

  // Sets up resize observer to scroll to bottom
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (paddingDivRef.current)
        paddingDivRef.current.scrollIntoView({ behavior: "smooth" });
    });

    if (autoScroll && outputDivRef.current) {
      resizeObserver.observe(outputDivRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoScroll]);

  // Set up useEffect to trigger when lastKnownScrollY or scrollDirection changes
  useEffect(() => {
    if (outputDivRef.current) {
      // Handle scrolling up
      if (scrollDirection === "up" && scrollLength < 0) {
        setAutoScroll(false);
      } else if (
        // Check if scrolled to bottom (or close enough)
        lastKnownScrollY + window.innerHeight + 20 >=
        document.documentElement.scrollHeight
      ) {
        setAutoScroll(true);
      }
    }
  }, [lastKnownScrollY, scrollDirection, scrollLength]);

  return (
    <ChainContextProvider chainVersion={CHAIN_VERSION}>
      <TopBar {...{ scrollDirection, lastKnownScrollY }} />
      <div className="z-20 sticky">
        <ChainControlPanel
          {...{
            setMarkovChain,
            ngramLength,
            setNgramLength,
            loaded,
            setLoaded,
            setOutput,
          }}
          resetChain={resetOutput}
        />
      </div>
      <div
        className={`max-w-7xl m-auto mt-5 pb-25 ${loaded ? "min-h-50" : ""} ${output.length === 0 ? "opacity-0" : ""}`}
        ref={outputDivRef}
      >
        <div
          className={
            "mx-3 text-start whitespace-pre-wrap p-5 rounded-lg bg-neutral-700/80"
          }
        >
          <p>{output.map((tk) => tk.str).join("")}</p>
        </div>
      </div>
      <div className="h-10 mb-5" ref={paddingDivRef}></div>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl m-auto z-0">
        {loaded && (
          <OutputControlPanel
            {...{
              markovChain,
              ngramLength,
              output,
              setOutput,
              loaded,
              autoScroll,
              setAutoScroll,
            }}
            choices={CHOICES}
          />
        )}
      </div>
    </ChainContextProvider>
  );
}
export default App;
