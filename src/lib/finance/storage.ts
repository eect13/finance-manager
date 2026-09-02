import type { PersistStorage, StateStorage, StorageValue } from "zustand/middleware";
import { writeLocalBackupsFromPersist } from "./local-backup";

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
        let result: unknown;
        req.onsuccess = () => {
          result = req.result;
        };
        req.onerror = () => {
          db.close();
          reject(req.error ?? new Error("IndexedDB request failed"));
        };
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
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

/** Persist the object; stringify + IDB write wait a beat so Post isn't blocked by an 800KB snapshot. */
export function createDebouncedPersistStorage<T>(kv: StateStorage, delay = 280): PersistStorage<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: StorageValue<T> } | null = null;

  function flush() {
    if (!pending) return;
    const { name, value } = pending;
    pending = null;
    const json = JSON.stringify(value);
    void Promise.resolve(kv.setItem(name, json)).then(() => {
      writeLocalBackupsFromPersist(value);
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem: async (name) => {
      const raw = await kv.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, delay);
    },
    removeItem: (name) => {
      pending = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      return kv.removeItem(name);
    },
  };
}