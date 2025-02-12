import { WasmMarkovChain } from 'markov_chain_wasm';
import { useState, useEffect } from 'react';
import SelectedChainDisplay from './SelectedChainDisplay';
import Button from './Button';
import AddChain from './AddChain';

function ChainSelector({ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, chainVersion }:
  {
    setMarkovChain: React.Dispatch<React.SetStateAction<WasmMarkovChain | null>>,
    ngramLength: number,
    setNgramLength: React.Dispatch<React.SetStateAction<number>>,
    loaded: boolean,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    chainVersion: string,
  }) {
  const [selectedChains, setSelectedChains] = useState<{ name: string, weight: number, source: 'user' | 'server' }[]>([]);
  const [loadedChainList, setLoadedChainList] = useState<string[]>([]);


  // Reset loaded status upon change in markov chain specification
  useEffect(() => {
    setLoaded(false);
    setLoadedChainList([]);
  }, [selectedChains.length, ngramLength, setLoaded, setLoadedChainList]);


  const handleLoadChain = async () => {
    setLoaded(false);
    if (selectedChains.length > 0) {
      const newChain = new WasmMarkovChain(ngramLength);
      for (const chainObject of selectedChains) {
        console.log(JSON.stringify(chainObject));
        // Necessary to do each chain one at a time
        switch (chainObject.source) {
          case 'server':
            await newChain.load_chain_from_server(`/chains/${chainVersion}/${chainObject.name}/${ngramLength}`, chainObject.weight);
            break;
          case 'user':
            await newChain.load_chain_from_indexeddb(`chains/${chainVersion}`, ngramLength.toString(), chainObject.name, chainObject.weight);
        }
        setLoadedChainList(l => [...l, `${chainObject.name}-${chainObject.source}`]);
        console.log(`loaded chain ${chainObject.name}-${chainObject.source}`);
      }
      setMarkovChain(newChain);
      setLoaded(true);
    }
  };

  // Curried function that changes the weight of a selected chain
  const changeChainWeight = (name: string) => {
    return (newWeight: number) => {
      setSelectedChains(chains => chains.map(chain => chain.name === name ? { ...chain, weight: newWeight } : chain));
      setLoaded(false);
      setLoadedChainList([]);
    }
  };

  // Removes a chain with passed in name from selectedChains
  const removeChain = (name: string) => {
    console.log('removing')
    setSelectedChains(chains => chains.filter(c => c.name !== name));
  }

  return (
    <div>
      <div className="flex space-x-1.5 flex-wrap">
        {selectedChains.map(c =>
          <SelectedChainDisplay
            chain={c}
            key={`${c.name}${c.source}`}
            changeWeight={changeChainWeight(c.name)}
            removeChain={() => removeChain(c.name)}
            loadedChainList={loadedChainList} />
        )}

        <AddChain {...{ chainVersion, selectedChains, setSelectedChains }} />
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

        {selectedChains.length > 0 && <Button onClick={() => handleLoadChain()}>
          {loaded ? 'Reset Chain' : 'Click to Load'}
        </Button>}
      </div>
    </div>
  )

}

export default ChainSelector;
