import { openDB } from "idb";

const IDB_VERSION_NO = 1;
const STORE_NAMES = ["2", "3"] as const;

async function openAndUpgrade(chainVersion: string) {
  return await openDB(`chains/${chainVersion}`, IDB_VERSION_NO, {
    upgrade(db) {
      // Handle creating object stores if they don't exist
      STORE_NAMES.forEach((n) => {
        if (!db.objectStoreNames.contains(n)) {
          db.createObjectStore(n);
        }
      });
    },
  });
}

export async function readIdbChains(chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);
  const transaction = db.transaction("3", "readonly");
  const store = transaction.objectStore("3");
  const result = (await store.getAllKeys()).map((c) => c.toString());
  db.close();
  return result;
}

export async function deleteIdbChain(chainName: string, chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);
  const transaction = db.transaction(STORE_NAMES, "readwrite");
  await Promise.all(
    STORE_NAMES.map((n) => transaction.objectStore(n).delete(chainName)),
  );
  db.close();
}

export async function deleteAllIdbChains(chainVersion: string) {
  const db = await openAndUpgrade(chainVersion);

  const transaction = db.transaction(STORE_NAMES, "readwrite");
  await Promise.all(STORE_NAMES.map((n) => transaction.objectStore(n).clear()));
  db.close();
}
