import { useSyncExternalStore } from "react";
import { saveCompanyFile } from "./export";

const NAME_KEY = "finance-manager-backup-folder";
const DB_NAME = "finance-manager-backup-folder";
const STORE = "kv";
const HANDLE_KEY = "directory-handle";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

type BackupDirHandle = {
  readonly name: string;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  }>;
  queryPermission?: (d?: { mode?: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
  requestPermission?: (d?: { mode?: "read" | "readwrite" }) => Promise<"granted" | "denied" | "prompt">;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite"; id?: string }) => Promise<BackupDirHandle>;
};

/** Chromium / Tauri WebView2. Hidden on Android WebView and Safari. */
export function canPickBackupFolder(): boolean {
  return typeof window !== "undefined" && typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

function readName(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(NAME_KEY);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

function writeName(name: string | null) {
  try {
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* private mode */
  }
  emit();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Backup folder store failed"));
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
          reject(req.error ?? new Error("Backup folder request failed"));
        };
        tx.oncomplete = () => {
          db.close();
          resolve(result as T);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Backup folder transaction failed"));
        };
      }),
  );
}

async function storeHandle(handle: BackupDirHandle): Promise<void> {
  await idbOp("readwrite", (store) => store.put(handle, HANDLE_KEY));
}

async function loadHandle(): Promise<BackupDirHandle | null> {
  try {
    const handle = await idbOp<BackupDirHandle | undefined>("readonly", (store) => store.get(HANDLE_KEY));
    return handle ?? null;
  } catch {
    return null;
  }
}

async function ensureWritePermission(handle: BackupDirHandle): Promise<boolean> {
  try {
    const q = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "granted";
    if (q === "granted") return true;
    const r = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
    return r === "granted";
  } catch {
    return false;
  }
}

/** Folder picker. Throws AbortError if the user cancels. */
export async function chooseBackupFolder(): Promise<string> {
  const w = window as DirectoryPickerWindow;
  if (typeof w.showDirectoryPicker !== "function") {
    throw new Error("Folder picker is not available on this device.");
  }
  const handle = await w.showDirectoryPicker({ mode: "readwrite", id: "finance-manager-backup" });
  const ok = await ensureWritePermission(handle);
  if (!ok) throw new Error("Need permission to save company files in that folder.");
  await storeHandle(handle);
  writeName(handle.name);
  return handle.name;
}

export type SaveCompanyFileHow =
  | "folder"
  | "saved"
  | "downloaded"
  | "fallback-saved"
  | "fallback-downloaded";

/**
 * Write JSON into the chosen backup folder when a live directory handle is
 * available; otherwise the existing save-picker / download path.
 * When a backup folder is set but the write fails, returns fallback-* so the
 * UI can say it fell back instead of a silent saved/downloaded toast.
 */
export async function saveCompanyFilePreferFolder(
  filename: string,
  content: string,
): Promise<SaveCompanyFileHow> {
  const handle = await loadHandle();
  const folderSet = Boolean(readName() || handle);
  if (handle && (await ensureWritePermission(handle))) {
    try {
      const file = await handle.getFileHandle(filename, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
      if (handle.name && readName() !== handle.name) writeName(handle.name);
      return "folder";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
    }
  }
  const how = await saveCompanyFile(filename, content);
  if (folderSet) {
    return how === "saved" ? "fallback-saved" : "fallback-downloaded";
  }
  return how;
}

export function getBackupFolderName(): string | null {
  return readName();
}

export function subscribeBackupFolder(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useBackupFolderName() {
  return useSyncExternalStore(subscribeBackupFolder, getBackupFolderName, () => null);
}

/** Fill the displayed name from a persisted handle if localStorage is empty. */
export async function hydrateBackupFolder(): Promise<void> {
  const handle = await loadHandle();
  if (handle?.name && readName() !== handle.name) writeName(handle.name);
}
