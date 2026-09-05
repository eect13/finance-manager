import { DEFAULT_SETTINGS, normalizeRegisterCols, parseRecon } from "./types";
import { parseMethod } from "./methods";
import { ensureRegisterOrder } from "./register";
import type { Employee, PayType,  Account, AuditEvent, Bank, Bill, CheckRecord, CloseSnapshot, Customer, FinanceData, Invoice, JournalEntry, Receipt, ReconStatement, Vendor } from "./types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function normalizeBooks(raw: unknown): FinanceData {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<FinanceData> & Record<string, unknown>;
  const merged = { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) };
  const font = Number(merged.registerFontSize);
  const decimals = Number(merged.decimalPlaces);
  const settings = {
    ...merged,
    registerFontSize: Number.isFinite(font) ? Math.min(18, Math.max(10, Math.round(font))) : 12,
    registerColumns: normalizeRegisterCols(merged.registerColumns),
    closedThrough: typeof merged.closedThrough === "string" ? merged.closedThrough : "",
    useThousandSeparators: merged.useThousandSeparators !== false,
    decimalPlaces: Number.isFinite(decimals) ? Math.min(4, Math.max(0, Math.round(decimals))) : 2,
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
  const invoices = asArray<Invoice>(p.invoices).map((inv, i) => ({
    ...inv,
    createdAt: typeof inv.createdAt === "number" ? inv.createdAt : i,
  }));
  const bills = asArray<Bill>(p.bills).map((b, i) => ({
    ...b,
    payments: Array.isArray(b.payments)
      ? b.payments.map((pay) => ({ ...pay, recon: parseRecon(pay.recon) }))
      : [],
    reference: b.reference ?? "",
    memo: b.memo ?? "",
    sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : i,
    createdAt: typeof b.createdAt === "number" ? b.createdAt : i,
  }));
  const receipts = asArray<Receipt>(p.receipts).map((r, i) => {
    let recon = parseRecon(r.recon);
    // Voided receipts never clear the bank — heal legacy void+cleared stubs.
    if (r.status === "void" && recon !== "reconciled") recon = "pending";
    return {
      ...r,
      lines: Array.isArray(r.lines) ? r.lines : [],
      receivedFrom: r.receivedFrom ?? "",
      memo: r.memo ?? "",
      method: parseMethod(r.method),
      checkNumber: r.checkNumber ?? "",
      sortOrder: typeof r.sortOrder === "number" ? r.sortOrder : i,
      recon,
      createdAt: typeof r.createdAt === "number" ? r.createdAt : i,
    };
  });
  const checks = asArray<CheckRecord>(p.checks).map((c, i) => {
    let recon = parseRecon(c.recon, c.status === "cleared" ? "cleared" : "pending");
    // Heal legacy Clear-from-Checks that wrote status without recon.
    if (recon !== "reconciled") {
      if (c.status === "cleared") recon = "cleared";
      else if (c.status === "pending") recon = "pending";
    }
    return {
      ...c,
      recon,
      createdAt: typeof c.createdAt === "number" ? c.createdAt : i,
    };
  });
  const journals = asArray<JournalEntry>(p.journals).map((j, i) => ({
    ...j,
    recon: parseRecon(j.recon),
    createdAt: typeof j.createdAt === "number" ? j.createdAt : i,
  }));
  const nextNumbers = p.nextNumbers ?? { invoice: 1, check: {}, receipt: 1, bill: 1 };
  const employees = asArray<Employee>((p as any).employees).map((e, i) => ({
    ...e,
    title: e.title ?? "",
    email: e.email ?? "",
    phone: e.phone ?? "",
    payType: (e.payType === "hourly" ? "hourly" : "salary") as PayType,
    rate: typeof e.rate === "number" ? e.rate : 0,
    bankId: e.bankId ?? "",
    hireDate: e.hireDate ?? "",
    active: e.active !== false,
    notes: e.notes ?? "",
    sortOrder: typeof e.sortOrder === "number" ? e.sortOrder : i,
  }));
  const banks = ensureSafekeeping(asArray<Bank>(p.banks), asArray<Account>(p.accounts));
  const accounts = ensureOutputVat(banks.accounts);
  const registerOrderRaw =
    p.registerOrder && typeof p.registerOrder === "object" && !Array.isArray(p.registerOrder)
      ? (p.registerOrder as Record<string, unknown>)
      : {};
  const registerOrderSeed: Record<string, number> = {};
  for (const [k, v] of Object.entries(registerOrderRaw)) {
    if (typeof v === "number" && Number.isFinite(v)) registerOrderSeed[k] = v;
  }

  const base: FinanceData = {
    settings,
    banks: banks.banks,
    accounts,
    customers,
    vendors,
    employees,
    invoices,
    bills,
    receipts,
    checks,
    journals,
    budgetItems: asArray(p.budgetItems),
    recurrences: asArray(p.recurrences),
    reconHistory: asArray<ReconStatement>(p.reconHistory).map((r) => ({
      ...r,
      bookBalance: typeof r.bookBalance === "number" ? r.bookBalance : 0,
      explained: typeof r.explained === "number" ? r.explained : 0,
      outstandingLines: Array.isArray(r.outstandingLines) ? r.outstandingLines : [],
      ditLines: Array.isArray(r.ditLines) ? r.ditLines : [],
      adjustmentLines: Array.isArray(r.adjustmentLines) ? r.adjustmentLines : [],
      unclearedAging: r.unclearedAging ?? { d30: 0, d60: 0, d90: 0, late: 0, lateCount: 0 },
    })),
    closeHistory: asArray<CloseSnapshot>(p.closeHistory).map((s) => ({
      ...s,
      journalId: typeof s.journalId === "string" ? s.journalId : "",
      packetPrinted: Boolean(s.packetPrinted),
    })),
    audit: asArray<AuditEvent>(p.audit).map((ev) => ({
      ...ev,
      who: ev.who && ev.who.trim() ? ev.who : "this browser",
      old: typeof ev.old === "string" ? ev.old : "",
      new: typeof ev.new === "string" ? ev.new : "",
    })),
    registerOrder: registerOrderSeed,
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
  return { ...base, registerOrder: ensureRegisterOrder(base) };
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


function ensureOutputVat(accounts: Account[]): Account[] {
  if (accounts.some((a) => a.code === "2200")) return accounts;
  return [
    ...accounts,
    { id: "acct-2200", code: "2200", name: "Output VAT Payable", type: "liability", system: true },
  ];
}
