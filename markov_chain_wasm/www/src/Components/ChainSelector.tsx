import { WasmMarkovChain } from 'markov_chain_wasm';
import { useState, useEffect } from 'react';
import SelectedChainDisplay from './SelectedChainDisplay';
import Button from './Button';

function ChainSelector({ setMarkovChain, ngramLength, setNgramLength, loaded, setLoaded, chainVersion }:
  {
    setMarkovChain: React.Dispatch<React.SetStateAction<WasmMarkovChain | null>>,
    ngramLength: number,
    setNgramLength: React.Dispatch<React.SetStateAction<number>>,
    loaded: boolean,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    chainVersion: string,
  }) {
  const [chainList, setChainList] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<{ name: string, weight: number }[]>([]);
  const [loadedChainList, setLoadedChainList] = useState<string[]>([]);
  const [chainOption, setChainOption] = useState<string>("");

  // Fetch list of possible chains
  useEffect(() => {
    const fetchChains = async () => {
      const chainResponse = await fetch(`chains/${chainVersion}/`);
      const chainObjects = await chainResponse.json();
      setChainList(chainObjects.map((o: { name: string }) => o.name));
    }

    fetchChains();
  }, [chainVersion]);

  // Sets the chainOption to the first possible choice
  useEffect(() => {
    if (chainList.length) {
      const possibleChains = chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c));
      if (possibleChains.length) {
        setChainOption(possibleChains[0]);
      }
    }
  }, [chainList, chainList.length, selectedChains, selectedChains.length]);

  // Reset loaded status upon change in markov chain specification
  useEffect(() => {
    setLoaded(false);
    setLoadedChainList([]);
  }, [selectedChains.length, ngramLength, setLoaded, setLoadedChainList])


  const handleLoadChain = async () => {
    setLoaded(false);
    if (selectedChains.length > 0) {
      const newChain = new WasmMarkovChain(ngramLength);
      for (const chainObject of selectedChains) {
        console.log(selectedChains);
        await newChain.load_chain(`/chains/${chainVersion}/${chainObject.name}/${ngramLength}`, chainObject.weight);
        setLoadedChainList(l => [...l, chainObject.name]);
        console.log(`loaded chain ${chainObject.name}`);
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
      <div>{selectedChains.map(c =>
        <SelectedChainDisplay
          chain={c}
          key={c.name}
          changeWeight={changeChainWeight(c.name)}
          removeChain={() => removeChain(c.name)}
          loadedChainList={loadedChainList} />
      )}</div>

      {selectedChains.length !== chainList.length && <div>
        <Button onClick={() => {
          if (chainOption.length) {
            setSelectedChains(chains => [...chains, { name: chainOption, weight: 1 }]);
          }
        }}>
          +
        </Button>
        <select
          className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer'
          value={chainOption}
          onChange={e => setChainOption(e.target.value)}>
          {chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain} </option>)}
        </select >

      </div>}
      <select
        className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer'
        value={ngramLength} onChange={e => setNgramLength(Number(e.target.value))}>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>

      {selectedChains.length > 0 && <Button onClick={() => handleLoadChain()}>
        {loaded ? 'Reset Chain' : 'Click to Load'}
      </Button>}

    </div >
  )

}

export default ChainSelector;
