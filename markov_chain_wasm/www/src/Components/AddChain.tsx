import { useState, useEffect } from 'react';
import Button from './Button';
import { MdUploadFile } from 'react-icons/md';
import FileDragAndDrop from './FileDragAndDrop';
import { openDB } from 'idb';

function AddChain({ chainVersion, selectedChains, setSelectedChains }:
  {
    chainVersion: string,
    selectedChains: { name: string, weight: number }[],
    setSelectedChains: React.Dispatch<React.SetStateAction<{ name: string, weight: number }[]>>
  }) {


  const [serverChainList, setServerChainList] = useState<string[]>([]);
  const [localChainList, setLocalChainList] = useState<string[]>([]);
  const [chainOption, setChainOption] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Fetch list of chains from server
  useEffect(() => {
    const fetchChains = async () => {
      const chainResponse = await fetch(`chains/${chainVersion}/`);
      const chainObjects = await chainResponse.json();
      setServerChainList(chainObjects.map((o: { name: string }) => o.name));
    }

    fetchChains();
  }, [chainVersion]);

  // Fetch list of chains from indexedDb
  useEffect(() => {
    const getChains = async () => {
      const db = await openDB(`chains/${chainVersion}`, 1, {
        upgrade(db) {
          // Handle creating object stores if they don't exist
          if (!db.objectStoreNames.contains('2')) {
            db.createObjectStore('2');
          }
          if (!db.objectStoreNames.contains('3')) {
            db.createObjectStore('3');
          }
        }
      });
      const transaction = db.transaction('3', 'readonly');
      const store = transaction.objectStore('3');
      const chains = await store.getAllKeys();
      setLocalChainList(chains.map(c => c.toString()));
    }

    getChains();
  })


  // Sets the chainOption to the first possible choice
  useEffect(() => {
    if (serverChainList.length) {
      const possibleChains = serverChainList.filter(c => !selectedChains.map(ch => ch.name).includes(c));
      if (possibleChains.length) {
        setChainOption(possibleChains[0]);
      }
    }
  }, [serverChainList, serverChainList.length, selectedChains, selectedChains.length]);

  if (creating) {
    return <FileDragAndDrop exit={() => setCreating(false)} {...{ chainVersion }} />;
  }
  return (
    <div className="flex flex-col items-center justify-evenly border-2 border-neutral-500 border-dotted m-1.5 xl:m-2 p-2 rounded-2xl min-h-45 min-w-45">
      <h3 className='m-2 font-bold'>Add Chain</h3>
      {serverChainList.length !== selectedChains.length &&
        <div>
          <select
            className='h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer mr-2 mb-2'
            value={chainOption}
            onChange={e => setChainOption(e.target.value)}>
            <optgroup label="User-Generated">
              {localChainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain} (user)</option>)}
            </optgroup>
            <optgroup label="From Server">
              {serverChainList.filter(c => !selectedChains.map(ch => ch.name).includes(c)).map(chain => <option key={chain}>{chain}</option>)}
            </optgroup>
          </select >
          <Button onClick={() => {
            if (chainOption.length) {
              // Case where chain is user-generated
              if (chainOption.endsWith(' (user)')) {
                setSelectedChains(chains => [...chains, { name: chainOption.slice(0, -7), weight: 1 }]);
              }
              // Case where chain is on server
              else {
                setSelectedChains(chains => [...chains, { name: chainOption, weight: 1 }]);
              }
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
    </div >
  );
}

export default AddChain;