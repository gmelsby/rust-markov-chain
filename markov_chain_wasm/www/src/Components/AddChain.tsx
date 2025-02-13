import { useState, useEffect } from 'react';
import Button from './Button';
import { MdUploadFile } from 'react-icons/md';
import FileDragAndDrop from './FileDragAndDrop';
import { openDB } from 'idb';

function AddChain({ chainVersion, selectedChains, setSelectedChains }:
  {
    chainVersion: string,
    selectedChains: { name: string, weight: number, source: 'user' | 'server' }[],
    setSelectedChains: React.Dispatch<React.SetStateAction<{ name: string, weight: number, source: 'user' | 'server' }[]>>
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

    if (!creating) {
      getChains();
    };
  }, [chainVersion, creating]);


  // Sets the chainOption to the first possible choice
  useEffect(() => {
    if (localChainList.length || serverChainList.length) {
      const possibleLocalChains = localChainList.filter(c => !selectedChains.filter(ch => ch.source === 'user').map(ch => ch.name).includes(c));
      if (possibleLocalChains.length) {
        setChainOption(`${possibleLocalChains[0]} (user)`);
        return;
      }
      const possibleServerChains = serverChainList.filter(c => !selectedChains.filter(ch => ch.source === 'server').map(ch => ch.name).includes(c));
      if (possibleServerChains.length) {
        setChainOption(possibleServerChains[0]);
      }
    }
  }, [localChainList, localChainList.length, serverChainList, serverChainList.length, selectedChains, selectedChains.length]);

  return (
    <div className="border-2 border-neutral-600 bg-neutral-800/50 border-solid rounded-2xl min-h-40 min-w-30 m-1.5 xl:m-2 flex flex-col">
      {creating ?
        <FileDragAndDrop exit={() => setCreating(false)} {...{ chainVersion }} />
        :
        <div className="flex flex-col items-center justify-evenly p-2 flex-grow">
          <h3 className='m-2 font-bold'>Add Chain</h3>
          {serverChainList.length + localChainList.length !== selectedChains.length &&
            <div>
              <select
                className='h-12 max-w-52 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer mr-2 mb-2'
                value={chainOption}
                onChange={e => {
                  setChainOption(e.target.value);
                  console.log(e.target.value);
                }}>
                <optgroup label="User-Generated">
                  {localChainList.filter(c => !selectedChains.filter(ch => ch.source === "user").map(ch => ch.name).includes(c)).map(chain => <option key={`${chain}user`} value={`${chain} (user)`}>{chain}</option>)}
                </optgroup>
                <optgroup label="From Server">
                  {serverChainList.filter(c => !selectedChains.filter(ch => ch.source === "server").map(ch => ch.name).includes(c)).map(chain => <option key={`${chain}server`}>{chain}</option>)}
                </optgroup>
              </select >
              <Button onClick={() => {
                if (chainOption.length) {
                  console.log(chainOption);
                  // Case where chain is user-generated
                  if (chainOption.endsWith(' (user)')) {
                    setSelectedChains(chains => [...chains, { name: chainOption.slice(0, -7), weight: 1, source: 'user' }]);
                  }
                  // Case where chain is on server
                  else {
                    setSelectedChains(chains => [...chains, { name: chainOption, weight: 1, source: 'server' }]);
                  }
                }
              }}>
                +
              </Button>
            </div>
          }
          <div className="m-2"><Button size="sm" onClick={() => setCreating(true)}>
            <span className="flex items-center">
              <MdUploadFile className="mr-2" />Create new chain from .txt file
            </span></Button>
          </div>
        </div>}
    </div >
  );
}

export default AddChain;