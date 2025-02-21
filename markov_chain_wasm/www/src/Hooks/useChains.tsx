import { useEffect, useState } from 'react';
import { readIdbChains } from '../Models/IndexedDb';

function useChains(
  source: 'user' | 'server',
  chainVersion: string,
  lastUpdate?: number, // Causes the request to fire again when lastUpdate moves forward
) {
  const [chains, setChains] = useState<string[]>([]);

  useEffect(() => {
    // For fetching chains from server
    const fetchChainsFromServer = async () => {
      const chainResponse = await fetch(`chains/${chainVersion}/`);
      const chainObjects = await chainResponse.json();
      setChains(chainObjects.map((o: { name: string }) => o.name));
    }

    // For getting chains from IndexedDB
    const fetchChainsFromIdb = async () => {
      const chains = await readIdbChains(chainVersion);
      setChains(chains);
    }

    if (source === 'server') {
      fetchChainsFromServer();
    };

    if (source === 'user') {
      fetchChainsFromIdb();
    }

  }, [source, chainVersion, lastUpdate])
  return chains;
}

export default useChains;