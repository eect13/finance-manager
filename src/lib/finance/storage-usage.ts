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

export async function browserStorage(): Promise<{ usage: number; quota: number }> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return { usage: estimate?.usage ?? 0, quota: estimate?.quota ?? 0 };
  } catch {
    return { usage: 0, quota: 0 };
  }
}
