import { normalizeBooks } from "./normalize";
import type { FinanceData } from "./types";

const DB_NAME = "finance-manager-local-backup";
const STORE = "companies";

export type LocalCopy = {
  id: string;
  savedAt: string;
  data: FinanceData;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Local backup store failed"));
  });
}

function idbOp<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        let result: T | undefined;
        req.onsuccess = () => {
          result = req.result as T;
        };
        req.onerror = () => {
          db.close();
          reject(req.error ?? new Error("Local backup request failed"));
        };
        tx.oncomplete = () => {
          db.close();
          resolve(result as T);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Local backup transaction failed"));
        };
      }),
  );
}

function asCopy(raw: unknown): LocalCopy | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.savedAt !== "string") return null;
  try {
    return { id: o.id, savedAt: o.savedAt, data: normalizeBooks(o.data) };
  } catch {
    return null;
  }
}

/** One timestamped snapshot per company. Survives Remove company / Remove sample. */
export async function writeLocalBackup(id: string, data: FinanceData): Promise<void> {
  if (!id || !data?.settings) return;
  const row: LocalCopy = { id, savedAt: new Date().toISOString(), data };
  await idbOp("readwrite", (store) => store.put(row));
}

export async function writeLocalBackups(companies: Record<string, FinanceData>): Promise<void> {
  const entries = Object.entries(companies).filter(([, data]) => data?.settings);
  if (entries.length === 0) return;
  const savedAt = new Date().toISOString();
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        for (const [id, data] of entries) {
          store.put({ id, savedAt, data } satisfies LocalCopy);
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Local backup write failed"));
        };
      }),
  );
}

export async function readLocalBackup(id: string): Promise<LocalCopy | null> {
  try {
    return asCopy(await idbOp<unknown>("readonly", (store) => store.get(id)));
  } catch {
    return null;
  }
}

export async function listLocalBackups(): Promise<LocalCopy[]> {
  try {
    const rows = await idbOp<unknown[]>("readonly", (store) => store.getAll());
    return (rows ?? []).map(asCopy).filter((row): row is LocalCopy => Boolean(row));
  } catch {
    return [];
  }
}

/** After a successful persist, snapshot every company that is still in the file. */
export function writeLocalBackupsFromPersist(value: unknown): void {
  if (!value || typeof value !== "object") return;
  const state = (value as { state?: { companies?: Record<string, FinanceData> } }).state;
  const companies = state?.companies;
  if (!companies || typeof companies !== "object") return;
  void writeLocalBackups(companies);
}
