import { WasmMarkovChain } from "markov_chain_wasm";
import { useState, useEffect } from "react";
import SelectedChainDisplay from "./SelectedChainDisplay";
import Button from "./Button";
import AddChain from "./AddChain";
import ProgressBar from "./ProgressBar";
import { MdOutlineArrowForward } from "react-icons/md";
import { IconContext } from "react-icons";

function ChainControlPanel({
  setMarkovChain,
  ngramLength,
  setNgramLength,
  loaded,
  setLoaded,
  chainVersion,
  resetChain,
}: {
  setMarkovChain: React.Dispatch<React.SetStateAction<WasmMarkovChain | null>>;
  ngramLength: number;
  setNgramLength: React.Dispatch<React.SetStateAction<number>>;
  loaded: boolean;
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  chainVersion: string;
  resetChain: () => void;
}) {
  const [selectedChains, setSelectedChains] = useState<
    { name: string; weight: number; source: "user" | "server" }[]
  >([]);
  const [loadedChainList, setLoadedChainList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset loaded status upon change in markov chain specification
  useEffect(() => {
    setLoaded(false);
  }, [selectedChains.length, ngramLength, setLoaded, setLoadedChainList]);

  // Reset loading status helper states if loaded is set to false
  useEffect(() => {
    if (!loaded) {
      setLoading(false);
      setLoadedChainList([]);
    }
  }, [loaded]);

  const handleLoadChains = async () => {
    setLoading(true);
    if (selectedChains.length > 0) {
      const newChain = new WasmMarkovChain(ngramLength);
      for (const chainObject of selectedChains) {
        // Switch statement for determining where to load chain from
        switch (chainObject.source) {
          case "server":
            // Necessary to do each chain one at a time
            await newChain.load_chain_from_server(
              `/chains/${chainVersion}/${chainObject.name}/${ngramLength}`,
              chainObject.weight,
            );
            break;
          case "user":
            // Necessary to do each chain one at a time
            await newChain.load_chain_from_indexeddb(
              `chains/${chainVersion}`,
              ngramLength.toString(),
              chainObject.name,
              chainObject.weight,
            );
        }
        setLoadedChainList((l) => [
          ...l,
          `${chainObject.name}-${chainObject.source}`,
        ]);
      }
      setMarkovChain(newChain);
      setLoaded(true);
      setLoading(false);
    }
  };

  // Curried function that changes the weight of a selected chain
  const changeChainWeight = (name: string, source: string) => {
    return (newWeight: number) => {
      setSelectedChains((chains) =>
        chains.map((chain) =>
          chain.name === name && chain.source === source
            ? { ...chain, weight: newWeight }
            : chain,
        ),
      );
      setLoaded(false);
      setLoadedChainList([]);
    };
  };

  // Removes a chain with passed in name and source from selectedChains
  const removeChain = (name: string, source: string) => {
    setSelectedChains((chains) =>
      chains.filter((c) => !(c.name === name && c.source === source)),
    );
  };

  return (
    <>
      <div className="flex flex-wrap mb-0 p-5 border-b-4 border-r-2 border-l-2 border-neutral-700 rounded-b-2xl bg-neutral-800/20 justify-between">
        <div className="flex grow border-2 border-neutral-500 rounded-2xl bg-neutral-700 m-4 min-w-0">
          <div className="shrink-0 bg-neutral-950/90 flex flex-col my-3 justify-center rounded-br-full rounded-tr-full w-8">
            <div className="[writing-mode:vertical-lr] rotate-180 flex items-center justify-center">
              <p className="text-neutral-300 font-bold">Chains</p>
            </div>
          </div>

          <div className="flex flex-wrap shrink grow ml-2 min-w-0">
            {selectedChains.map((c, i) => (
              <SelectedChainDisplay
                chain={c}
                key={`${c.name}${c.source}`}
                changeWeight={changeChainWeight(c.name, c.source)}
                removeChain={() => removeChain(c.name, c.source)}
                loadedChainList={loadedChainList}
                loading={loading && i === loadedChainList.length}
              />
            ))}

            <AddChain
              {...{
                chainVersion,
                selectedChains,
                setSelectedChains,
                setLoaded,
              }}
            />
          </div>
        </div>
        <div className="flex">
          <div className="flex flex-col items-center justify-around border-2 rounded-2xl border-neutral-500/50 bg-neutral-700/50 p-3 m-5 min-h-50 ">
            <h3 className="font-bold">Controls</h3>
            <div className="flex flex-row items-center m-2">
              <div className="h-12 flex flex-row items-center px-3 rounded-tl-md rounded-bl-md bg-neutral-950 border-2 border-neutral-950">
                <h3 className="font-medium">N-gram Length:</h3>
              </div>
              <select
                className="mr-1 h-12 items-center justify-center rounded-br-md rounded-tr-md bg-neutral-950/70 px-3 border-2 border-neutral-950 font-bold text-neutral-50 hover:bg-blue-950 cursor-pointer"
                value={ngramLength}
                onChange={(e) => setNgramLength(Number(e.target.value))}
              >
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <Button
              onClick={loaded ? resetChain : handleLoadChains}
              disabled={selectedChains.length === 0}
            >
              {loaded ? (
                "Reset Output"
              ) : (
                <div className="flex flex-row items-center">
                  <p>Load Chains</p>

                  <IconContext.Provider
                    value={{
                      size: "25",
                    }}
                  >
                    <MdOutlineArrowForward
                      className={`ml-2 ${selectedChains.length ? "text-green-700" : ""}`}
                    />
                  </IconContext.Provider>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="">
        <ProgressBar
          stepCount={selectedChains.length}
          currentStep={loadedChainList.length}
          active={loading}
        />
      </div>
    </>
  );
}

export default ChainControlPanel;
