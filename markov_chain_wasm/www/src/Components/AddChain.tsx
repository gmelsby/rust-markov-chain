import { useState, useEffect } from 'react';
import Button from './Button';
import { MdUploadFile } from 'react-icons/md';
import FileDragAndDrop from './FileDragAndDrop';

function AddChain({ chainVersion, selectedChains, setSelectedChains }:
  {
    chainVersion: string,
    selectedChains: { name: string, weight: number }[],
    setSelectedChains: React.Dispatch<React.SetStateAction<{ name: string, weight: number }[]>>
  }) {


  const [chainList, setChainList] = useState<string[]>([]);
  const [chainOption, setChainOption] = useState<string>("");
  const [creating, setCreating] = useState(false);

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

  if (creating) {
    return <FileDragAndDrop exit={() => setCreating(false)} />;
  }
  return (
    <div className="flex flex-col items-center justify-evenly border-2 border-neutral-500 border-dotted m-1.5 xl:m-2 p-2 rounded-2xl min-h-45 min-w-45">
      <h3 className='m-2 font-bold'>Add Chain</h3>
      {chainList.length !== selectedChains.length &&
        <div>
          <select
            className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer mr-2 mb-2'
            value={chainOption}
            onChange={e => setChainOption(e.target.value)}>
            <optgroup label="From File"></optgroup>
            <optgroup label="From Server">
              {chainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain} </option>)}
            </optgroup>
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
      <div className="m-2"><Button size="sm" onClick={() => setCreating(true)}>
        <span className="flex items-center">
          Create from .txt file <MdUploadFile className="ml-2" />
        </span></Button>
      </div>
    </div>
  );
}

export default AddChain;