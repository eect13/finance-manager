import type { StateStorage } from "zustand/middleware";

const DB_NAME = "finance-manager";
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB failed"));
  });
}

function idbOp(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
      }),
  );
}

/** IndexedDB first so a year of books can fit; falls back to localStorage for older snapshots. */
export const booksStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const value = await idbOp("readonly", (store) => store.get(name));
      if (typeof value === "string") return value;
    } catch {
      /* use localStorage */
    }
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await idbOp("readwrite", (store) => store.put(value, name));
      try {
        localStorage.removeItem(name);
      } catch {
        /* quota leftover is fine */
      }
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    try {
      await idbOp("readwrite", (store) => store.delete(name));
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
