import { useContext, useEffect, useState } from 'react';
import ChainContext from '../Context/ChainContext';
import useChains from '../Hooks/useChains';
import Button from './Button';
import { deleteAllIdbChains, deleteIdbChain } from '../Models/IndexedDb';

function DeleteChains() {
  const [chainOption, setChainOption] = useState("")
  const { chainVersion, lastUpdated, setLastUpdated } = useContext(ChainContext);
  const localChainList = useChains('user', chainVersion, lastUpdated);

  useEffect(() => {
    setChainOption(localChainList[0]);
  },
    [localChainList, localChainList.length]);

  return (
    <div className='flex flex-col items-center'>
      <h3 className='font-semibold my-3'>Delete chains from local storage</h3>
      <div className='my-3'>
        <select
          disabled={localChainList.length === 0}
          className={`h-12 min-w-40 max-w-40 sm:max-w-50 items-center justify-center 
            rounded-md px-2 font-medium text-neutral-50 
          ${localChainList.length === 0 ? 'bg-neutral-950/50 cursor-not-allowed' : 'hover:bg-blue-950 cursor-pointer bg-neutral-950 '}
          mr-2 my-2`}
          value={chainOption}
          onChange={(e) => {
            setChainOption(e.target.value);
          }}
        >
          {localChainList
            .map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
        </select>
        <Button
          disabled={localChainList.length === 0}
          onClick={async () => {
            if (chainOption.length) {
              await deleteIdbChain(chainOption, chainVersion);
              setLastUpdated(Date.now());
            }
          }}
          use="remove"
        >
          Remove
        </Button>
      </div>
      <div className='my-3'>
        <Button use="remove"
          disabled={localChainList.length === 0}
          size="sm" onClick={async () => {
            await deleteAllIdbChains(chainVersion);
            setLastUpdated(Date.now());
          }}>
          {localChainList.length === 0 ? 'No chains found in local storage' : 'Remove all chains from local storage'}
        </Button>
      </div>
    </div >
  );
}

export default DeleteChains;