import { DEFAULT_SETTINGS, normalizeRegisterCols } from "./types";
import { parseMethod } from "./methods";
import type { Account, Bank, Bill, Customer, FinanceData, Receipt, Vendor } from "./types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeBooks(raw: unknown): FinanceData {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<FinanceData> & Record<string, unknown>;
  const merged = { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) };
  const font = Number(merged.registerFontSize);
  const settings = {
    ...merged,
    registerFontSize: Number.isFinite(font) ? Math.min(18, Math.max(10, Math.round(font))) : 12,
    registerColumns: normalizeRegisterCols(merged.registerColumns),
  };
  const customers = asArray<Customer>(p.customers).map((c, i) => ({
    ...c,
    sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : i,
  }));
  const vendors = asArray<Vendor>(p.vendors).map((v, i) => ({
    ...v,
    accountNumber: v.accountNumber ?? "",
    sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : i,
  }));
  const bills = asArray<Bill>(p.bills).map((b, i) => ({
    ...b,
    payments: Array.isArray(b.payments) ? b.payments : [],
    reference: b.reference ?? "",
    memo: b.memo ?? "",
    sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : i,
  }));
  const receipts = asArray<Receipt>(p.receipts).map((r, i) => ({
    ...r,
    lines: Array.isArray(r.lines) ? r.lines : [],
    receivedFrom: r.receivedFrom ?? "",
    memo: r.memo ?? "",
    method: parseMethod(r.method),
    checkNumber: r.checkNumber ?? "",
    sortOrder: typeof r.sortOrder === "number" ? r.sortOrder : i,
  }));
  const nextNumbers = p.nextNumbers ?? { invoice: 1, check: {}, receipt: 1, bill: 1 };
  const banks = ensureSafekeeping(asArray<Bank>(p.banks), asArray<Account>(p.accounts));
  return {
    settings,
    banks: banks.banks,
    accounts: banks.accounts,
    customers,
    vendors,
    invoices: asArray(p.invoices),
    bills,
    receipts,
    checks: asArray(p.checks),
    journals: asArray(p.journals),
    budgetItems: asArray(p.budgetItems),
    nextNumbers: {
      invoice: nextNumbers.invoice ?? 1,
      check: {
        ...nextNumbers.check,
        "bank-safe": nextNumbers.check?.["bank-safe"] ?? 1,
      },
      receipt: nextNumbers.receipt ?? 1,
      bill: nextNumbers.bill ?? 1,
    },
  };
}

const SAFE_BANK: Bank = {
  id: "bank-safe",
  name: "Undeposited funds",
  nickname: "Safekeeping",
  accountNumber: "On hand",
  openingBalance: 0,
  accountId: "acct-1030",
  archived: false,
};

const SAFE_ACCOUNT: Account = {
  id: "acct-1030",
  code: "1030",
  name: "Cash — Safekeeping",
  type: "asset",
  bankId: "bank-safe",
  system: true,
};

function ensureSafekeeping(banks: Bank[], accounts: Account[]): { banks: Bank[]; accounts: Account[] } {
  if (banks.some((b) => b.id === SAFE_BANK.id || /safekeeping/i.test(b.nickname))) {
    return { banks, accounts };
  }
  return {
    banks: [...banks, SAFE_BANK],
    accounts: accounts.some((a) => a.id === SAFE_ACCOUNT.id) ? accounts : [...accounts, SAFE_ACCOUNT],
  };
}
