import { useState, useEffect } from 'react';
import Button from './Button';

function AddChain({ chainList, selectedChains, setSelectedChains }:
  {
    chainList: string[],
    selectedChains: { name: string, weight: number }[],
    setSelectedChains: React.Dispatch<React.SetStateAction<{ name: string, weight: number }[]>>
  }) {


  const [chainOption, setChainOption] = useState<string>("");
  // Sets the chainOption to the first possible choice
  useEffect(() => {
    if (chainList.length) {
      const possibleChains = chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c));
      if (possibleChains.length) {
        setChainOption(possibleChains[0]);
      }
    }
  }, [chainList, chainList.length, selectedChains, selectedChains.length]);

  return (
    <div className="flex flex-col items-center justify-evenly border-2 border-neutral-500 m-1.5 xl:m-2 p-2 rounded-2xl min-h-30 min-w-30">
      {chainList.length !== selectedChains.length &&
        <div>
          <select
            className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer'
            value={chainOption}
            onChange={e => setChainOption(e.target.value)}>
            {chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain} </option>)}
          </select >
          <Button onClick={() => {
            if (chainOption.length) {
              setSelectedChains(chains => [...chains, { name: chainOption, weight: 1 }]);
            }
          }}>
            +
          </Button>
        </div>
      }
    </div>
  );
}

export default AddChain;