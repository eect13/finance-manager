import { formatDate, titleCase } from "./format";
import {
  accountBalance,
  billBalance,
  customerOpenBalance,
  invoiceBalance,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
  trialBalance,
  vendorOpenBalance,
} from "./ledger";
import { normalizeBooks } from "./normalize";
import { cashRegisterLines, KIND_LABEL, openingForBanks, withOpening, withRunningBalance } from "./register";
import type { FinanceData } from "./types";

function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return "\uFEFF";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h] ?? "")).join(",")),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  downloadText(filename, toCsv(rows), "text/csv;charset=utf-8");
}

export function ledgerRows(data: FinanceData): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];
  const sorted = [...data.journals].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const entry of sorted) {
    for (const line of entry.lines) {
      const account = data.accounts.find((a) => a.id === line.accountId);
      rows.push({
        Date: formatDate(entry.date),
        Description: entry.description,
        Source: titleCase(entry.sourceType),
        Account: account ? `${account.code} ${account.name}` : line.accountId,
        Debit: line.debit / 100,
        Credit: line.credit / 100,
        Memo: line.memo,
      });
    }
  }
  return rows;
}

export function checkRegisterRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.checks]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .map((c) => {
      const bank = data.banks.find((b) => b.id === c.bankId);
      return {
        "Check #": c.checkNumber,
        Bank: bank?.nickname ?? "",
        Payee: c.payee,
        "Issue date": formatDate(c.issueDate),
        "Post date": formatDate(c.postDate),
        Amount: c.amount / 100,
        Status: titleCase(c.status),
        Memo: c.memo,
      };
    });
}

export function invoiceRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.invoices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((inv) => {
      const customer = data.customers.find((c) => c.id === inv.customerId);
      const total = invoiceTotal(data, inv.id);
      return {
        Number: inv.number,
        Customer: customer?.name ?? "",
        Date: formatDate(inv.date),
        Due: formatDate(inv.dueDate),
        Subtotal: invoiceSubtotal(inv.lines) / 100,
        Tax: invoiceTax(invoiceSubtotal(inv.lines), inv.taxRate, data.settings.taxEnabled) / 100,
        Total: total / 100,
        Balance: invoiceBalance(data, inv.id) / 100,
        Status: titleCase(inv.status),
      };
    });
}

export function customerRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.customers]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((c) => ({
      Name: c.name,
      Contact: c.contact,
      Email: c.email,
      Phone: c.phone,
      Address: c.address,
      Terms: c.terms,
      "Open balance": customerOpenBalance(data, c.id) / 100,
      Notes: c.notes,
    }));
}

export function vendorRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.vendors]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((v) => ({
      Name: v.name,
      Contact: v.contact,
      Email: v.email,
      Phone: v.phone,
      Address: v.address,
      Terms: v.terms,
      "Account #": v.accountNumber,
      "Open balance": vendorOpenBalance(data, v.id) / 100,
      Notes: v.notes,
    }));
}

export function receiptRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.receipts]
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
    .map((r) => {
      const bank = data.banks.find((b) => b.id === r.bankId);
      return {
        Number: r.number,
        Date: formatDate(r.date),
        Kind: r.kind === "cash-sale" ? "Cash Sale" : "On Account",
        Method: r.method === "echeck" ? "E-Check" : titleCase(r.method),
        "Check #": r.checkNumber || "",
        From: r.receivedFrom,
        Bank: bank?.nickname ?? "",
        Amount: r.amount / 100,
        Status: titleCase(r.status),
        Memo: r.memo,
      };
    });
}

export function billRows(data: FinanceData): Array<Record<string, string | number>> {
  return [...data.bills]
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
    .map((b) => {
      const vendor = data.vendors.find((v) => v.id === b.vendorId);
      return {
        Number: b.number,
        Vendor: vendor?.name ?? "",
        Date: formatDate(b.date),
        Due: formatDate(b.dueDate),
        Amount: b.amount / 100,
        Balance: billBalance(b) / 100,
        Status: titleCase(b.status),
        Reference: b.reference,
        Memo: b.memo,
      };
    });
}

export function bankRows(data: FinanceData): Array<Record<string, string | number>> {
  return data.banks.map((b) => ({
    Name: b.name,
    Nickname: b.nickname,
    "Account #": b.accountNumber,
    Opening: b.openingBalance / 100,
    "Book balance": accountBalance(data, b.accountId) / 100,
    Archived: b.archived ? "Yes" : "No",
  }));
}

export function trialBalanceRows(data: FinanceData): Array<Record<string, string | number>> {
  return trialBalance(data).map((row) => ({
    Code: row.account.code,
    Account: row.account.name,
    Type: titleCase(row.account.type),
    Debit: row.debit / 100,
    Credit: row.credit / 100,
  }));
}

export function cashRegisterRows(data: FinanceData, bankId?: string): Array<Record<string, string | number>> {
  const opening = openingForBanks(data, bankId);
  const lines = withRunningBalance(withOpening(cashRegisterLines(data, bankId), opening));
  return lines.map((line) => {
    const bank = data.banks.find((b) => b.id === line.bankId);
    return {
      Date: line.kind === "opening" ? "Opening" : formatDate(line.date),
      Type: KIND_LABEL[line.kind],
      Number: line.number,
      Payee: line.party,
      Memo: line.memo,
      Bank: bank?.nickname ?? "",
      Payment: line.payment / 100,
      Deposit: line.deposit / 100,
      Balance: line.balance / 100,
      Status: titleCase(line.status),
    };
  });
}

export const WORKSPACE_BACKUP_KIND = "finance-manager-backup";
export const COMPANY_FILE_KIND = "finance-manager-company";
export const COMPANY_FILE_VERSION = 15;

/** Flat tables in a company file. Parties do not nest transactions. Journal `lines` stay on the journal (two legs, one document). New ids are UUIDs. */
export const BOOKS_TABLES = [
  "settings",
  "banks",
  "accounts",
  "customers",
  "vendors",
  "employees",
  "invoices",
  "bills",
  "receipts",
  "checks",
  "journals",
  "budgetItems",
  "recurrences",
  "reconHistory",
  "closeHistory",
  "audit",
  "nextNumbers",
] as const;

function companyBooksObject(data: FinanceData) {
  return {
    settings: data.settings,
    banks: data.banks,
    accounts: data.accounts,
    customers: data.customers,
    vendors: data.vendors,
    employees: data.employees ?? [],
    invoices: data.invoices,
    bills: data.bills,
    receipts: data.receipts,
    checks: data.checks,
    journals: data.journals,
    budgetItems: data.budgetItems,
    recurrences: data.recurrences ?? [],
    reconHistory: data.reconHistory ?? [],
    closeHistory: data.closeHistory ?? [],
    audit: data.audit ?? [],
    nextNumbers: data.nextNumbers,
  };
}

export function backupPayload(data: FinanceData): string {
  return JSON.stringify(
    {
      kind: COMPANY_FILE_KIND,
      version: COMPANY_FILE_VERSION,
      savedAt: new Date().toISOString(),
      books: companyBooksObject(data),
    },
    null,
    2,
  );
}

export function workspaceBackupPayload(state: {
  companies: Record<string, FinanceData>;
  companyOrder: string[];
  activeCompanyId: string;
}): string {
  const companies: Record<string, ReturnType<typeof companyBooksObject>> = {};
  for (const [id, data] of Object.entries(state.companies)) {
    companies[id] = companyBooksObject(data);
  }
  return JSON.stringify(
    {
      kind: WORKSPACE_BACKUP_KIND,
      version: COMPANY_FILE_VERSION,
      companies,
      companyOrder: state.companyOrder,
      activeCompanyId: state.activeCompanyId,
    },
    null,
    2,
  );
}

export type BackupFile =
  | { type: "company"; data: FinanceData }
  | {
      type: "workspace";
      companies: Record<string, FinanceData>;
      companyOrder: string[];
      activeCompanyId: string;
    };

function isWorkspaceShape(raw: unknown): raw is {
  companies: Record<string, unknown>;
  companyOrder?: unknown;
  activeCompanyId?: unknown;
  kind?: unknown;
} {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if (!o.companies || typeof o.companies !== "object" || Array.isArray(o.companies)) return false;
  if (o.kind === WORKSPACE_BACKUP_KIND) return true;
  return !("settings" in o) && !("banks" in o);
}

export function parseBackupFile(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    if (o.kind === COMPANY_FILE_KIND && o.books) {
      return { type: "company", data: normalizeBooks(o.books) };
    }
  }
  if (isWorkspaceShape(parsed)) {
    const companies: Record<string, FinanceData> = {};
    for (const [id, books] of Object.entries(parsed.companies)) {
      companies[id] = normalizeBooks(books);
    }
    if (Object.keys(companies).length === 0) throw new Error("Backup has no companies.");
    const order = (
      Array.isArray(parsed.companyOrder) ? parsed.companyOrder.filter((id): id is string => typeof id === "string") : Object.keys(companies)
    ).filter((id) => companies[id]);
    for (const id of Object.keys(companies)) {
      if (!order.includes(id)) order.push(id);
    }
    const active =
      typeof parsed.activeCompanyId === "string" && companies[parsed.activeCompanyId]
        ? parsed.activeCompanyId
        : order[0];
    return { type: "workspace", companies, companyOrder: order, activeCompanyId: active };
  }
  return { type: "company", data: normalizeBooks(parsed) };
}

export function parseBackup(raw: string): FinanceData {
  const file = parseBackupFile(raw);
  if (file.type === "company") return file.data;
  return file.companies[file.activeCompanyId] ?? Object.values(file.companies)[0];
}

export function auditRows(data: FinanceData): Array<Record<string, string | number>> {
  return (data.audit ?? []).map((ev) => ({
    When: new Date(ev.at).toISOString(),
    Who: ev.who || "this browser",
    Action: ev.action,
    Detail: ev.detail,
    Old: ev.old ?? "",
    New: ev.new ?? "",
  }));
}

type FilePickerWindow = Window & {
  showSaveFilePicker?: (opts: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{ createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }>;
};

export async function saveCompanyFile(filename: string, content: string): Promise<"saved" | "downloaded"> {
  const w = window as FilePickerWindow;
  try {
    if (typeof w.showSaveFilePicker === "function") {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Company file", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return "saved";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
  }
  downloadText(filename, content, "application/json");
  return "downloaded";
}

