import { openDB } from 'idb';
import { useEffect, useState } from 'react';

function useChains(
  source: 'user' | 'server',
  chainVersion: string,
  update?: boolean // Causes the request to only fire when value switches from false/undefined to true
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
      setChains(chains.map(c => c.toString()));
    }

    if (source === 'server') {
      fetchChainsFromServer();
    };

    // Only trigger if update's value switches from false to true
    if (source === 'user' && update) {
      fetchChainsFromIdb();
    }

  }, [source, chainVersion, update])
  return chains;
}

export default useChains;