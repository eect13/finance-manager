import type { FinanceData } from "./types";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function jsonSize(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

export function countEntries(data: FinanceData): {
  invoices: number;
  bills: number;
  receipts: number;
  checks: number;
  journals: number;
  customers: number;
  vendors: number;
  total: number;
} {
  const invoices = data.invoices.length;
  const bills = data.bills.length;
  const receipts = data.receipts.length;
  const checks = data.checks.length;
  const journals = data.journals.length;
  return {
    invoices,
    bills,
    receipts,
    checks,
    journals,
    customers: data.customers.length,
    vendors: data.vendors.length,
    total: invoices + bills + receipts + checks + journals,
  };
}

export async function browserStorage(): Promise<{
  usage: number;
  quota: number;
  persisted: boolean | null;
  engine: "indexeddb" | "localstorage" | "unknown";
}> {
  let usage = 0;
  let quota = 0;
  try {
    const estimate = await navigator.storage?.estimate?.();
    usage = estimate?.usage ?? 0;
    quota = estimate?.quota ?? 0;
  } catch {
    /* ignore */
  }
  let persisted: boolean | null = null;
  try {
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  } catch {
    persisted = null;
  }
  let engine: "indexeddb" | "localstorage" | "unknown" = "unknown";
  try {
    if (typeof indexedDB !== "undefined") {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("finance-manager", 1);
        req.onsuccess = () => {
          req.result.close();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
      engine = "indexeddb";
    }
  } catch {
    engine = "localstorage";
  }
  return { usage, quota, persisted, engine };
}

/** Ask the browser not to evict the books when disk is tight. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
