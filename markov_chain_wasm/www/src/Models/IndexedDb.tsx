import { openDB } from 'idb';

const IDB_VERSION_NO = 1;

async function openAndUpgrade(chainVersion: string) {
  return await openDB(`chains/${chainVersion}`, IDB_VERSION_NO, {
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
}

export async function readIdbChains(chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);
  const transaction = db.transaction('3', 'readonly');
  const store = transaction.objectStore('3');
  const result = (await store.getAllKeys()).map(c => c.toString());
  db.close();
  return result;
}

export async function deleteIdbChain(chainName: string, chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);
  const transaction = db.transaction(['2', '3'], 'readwrite');
  transaction.objectStore('3').delete(chainName);
  transaction.objectStore('2').delete(chainName);
  await transaction.done
  db.close();
}

export async function deleteAllIdbChains(chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);
  const transaction = db.transaction(['2', '3'], 'readwrite');
  transaction.objectStore('3').clear();
  transaction.objectStore('2').clear();
  await transaction.done;
  db.close();
}