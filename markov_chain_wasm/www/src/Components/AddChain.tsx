import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { MdAddCircle, MdUploadFile } from 'react-icons/md';
import FileDragAndDrop from './FileDragAndDrop';
import { openDB } from 'idb';
import { IconContext } from 'react-icons';

function AddChain({ chainVersion, selectedChains, setSelectedChains, setLoaded }:
  {
    chainVersion: string,
    selectedChains: { name: string, weight: number, source: 'user' | 'server' }[],
    setSelectedChains: React.Dispatch<React.SetStateAction<{ name: string, weight: number, source: 'user' | 'server' }[]>>
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>
  }) {


  const [serverChainList, setServerChainList] = useState<string[]>([]);
  const [localChainList, setLocalChainList] = useState<string[]>([]);
  const [chainOption, setChainOption] = useState<string>("");
  const [uiState, setUiState] = useState<"icon" | "select" | "create">("icon");

  // For handling onClick event
  const containerRef = useRef<HTMLDivElement>(null);

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

    if (uiState === 'select') {
      getChains();
    };
  }, [chainVersion, uiState]);


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

  // Sets up event listener for clicks to collapse container back to icon state
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setUiState('icon');
      }
    }
    if (uiState !== 'icon') {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      if (uiState !== 'icon') {
        window.removeEventListener('mousedown', handleClickOutside);
      }
    }
  }, [uiState])

  // Returns div to icon display when a chain is added or removed from selectedChains
  useEffect(() => {
    setUiState('icon');
  }, [selectedChains.length]);


  return (
    <div className="border-2 border-neutral-600 bg-neutral-800/50 border-solid rounded-2xl min-h-40 min-w-30 m-1.5 xl:m-2 flex flex-col"
      ref={containerRef}
    >
      {uiState === 'create'
        ?
        <FileDragAndDrop exit={() => setUiState('select')} {...{ chainVersion }} />
        :
        uiState == 'select'
          ?
          <div className="flex flex-col items-center justify-evenly p-2 flex-grow">
            <h3 className='m-2 font-bold'>Add Chain</h3>
            {serverChainList.length + localChainList.length !== selectedChains.length &&
              <div>
                <select
                  className='h-12 max-w-52 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50 hover:bg-blue-950 cursor-pointer mr-2 mb-2'
                  value={chainOption}
                  onChange={e => {
                    setChainOption(e.target.value);
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
            <div className="m-2"><Button size="sm" onClick={() => setUiState('create')}>
              <span className="flex items-center">
                <MdUploadFile className="mr-2" />Create new chain from .txt file
              </span></Button>
            </div>
          </div>
          :
          <div onClick={() => {
            setLoaded(false);
            setUiState('select');
          }}
            className='flex-grow flex flex-col items-center justify-around cursor-pointer'
          >
            <div></div>
            <IconContext.Provider value={{ size: '30' }}>
              <MdAddCircle />
            </IconContext.Provider>
            <h3 className='m-2 text-sm font-bold'>Add Chain</h3>
          </div>
      }
    </div >
  );
}

export default AddChain;