import { WasmMarkovChain } from 'markov_chain_wasm';
import { useState, useEffect } from 'react';
import SelectedChainDisplay from './SelectedChainDisplay';
import Button from './Button';
import AddChain from './AddChain';
import ProgressBar from './ProgressBar';

function ChainSelector({ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, chainVersion, resetChain }:
  {
    setMarkovChain: React.Dispatch<React.SetStateAction<WasmMarkovChain | null>>,
    ngramLength: number,
    setNgramLength: React.Dispatch<React.SetStateAction<number>>,
    loaded: boolean,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    chainVersion: string,
    resetChain: () => void,
  }) {
  const [selectedChains, setSelectedChains] = useState<{ name: string, weight: number, source: 'user' | 'server' }[]>([]);
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
          case 'server':
            // Necessary to do each chain one at a time
            await newChain.load_chain_from_server(`/chains/${chainVersion}/${chainObject.name}/${ngramLength}`, chainObject.weight);
            break;
          case 'user':
            // Necessary to do each chain one at a time
            await newChain.load_chain_from_indexeddb(`chains/${chainVersion}`, ngramLength.toString(), chainObject.name, chainObject.weight);
        }
        setLoadedChainList(l => [...l, `${chainObject.name}-${chainObject.source}`]);
      }
      setMarkovChain(newChain);
      setLoaded(true);
      setLoading(false);
    }
  };

  // Curried function that changes the weight of a selected chain
  const changeChainWeight = (name: string, source: string) => {
    return (newWeight: number) => {
      setSelectedChains(chains => chains.map(chain => chain.name === name && chain.source === source ? { ...chain, weight: newWeight } : chain));
      setLoaded(false);
      setLoadedChainList([]);
    }
  };

  // Removes a chain with passed in name and source from selectedChains
  const removeChain = (name: string, source: string) => {
    setSelectedChains(chains => chains.filter(c => !(c.name === name && c.source === source)));
  }

  return (
    <div>
      <div className="flex space-x-1.5 flex-wrap">
        {selectedChains.map((c, i) =>
          <SelectedChainDisplay
            chain={c}
            key={`${c.name}${c.source}`}
            changeWeight={changeChainWeight(c.name, c.source)}
            removeChain={() => removeChain(c.name, c.source)}
            loadedChainList={loadedChainList}
            loading={loading && i === loadedChainList.length}
          />
        )}

        <AddChain {...{ chainVersion, selectedChains, setSelectedChains, setLoaded }} />
      </div>
      <div>
        <div className="flex">
          <h3>Ngram Length: </h3>
          <select
            className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer'
            value={ngramLength} onChange={e => setNgramLength(Number(e.target.value))}>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        {selectedChains.length > 0 && <Button onClick={loaded ? resetChain : handleLoadChains}>
          {loaded ? 'Reset Output' : 'Click to Load'}
        </Button>}
        {loading && <ProgressBar progress={Math.max(5, loadedChainList.length * 100 / selectedChains.length)} />}
      </div>
    </div>
  )

}

export default ChainSelector;
