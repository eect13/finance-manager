import { titleCase, todayIso } from "./format";
import { billBalance, invoiceBalance, invoiceTotal } from "./ledger";
import type { FinanceData, OpenKind, ReceiptKind, ReceiptMethod } from "./types";

export type PartyTxnKind = Extract<OpenKind, "invoice" | "receipt" | "bill" | "check">;
export type CustomerTxnFilter = "all" | "invoice" | "payment" | "cash-sale";
export type VendorTxnFilter = "all" | "bill" | "check";

export interface PartyTxn {
  id: string;
  openKind: PartyTxnKind;
  date: string;
  type: string;
  number: string;
  memo: string;
  amount: number;
  open: number;
  /** Running AR/AP after this row, computed oldest → newest. */
  balance: number;
  invoiceStatus?: FinanceData["invoices"][number]["status"];
  billStatus?: FinanceData["bills"][number]["status"];
  checkStatus?: FinanceData["checks"][number]["status"];
  receiptStatus?: FinanceData["receipts"][number]["status"];
  receiptKind?: ReceiptKind;
  receiptMethod?: ReceiptMethod;
  overdue?: boolean;
}

type Ranked = PartyTxn & { signed: number; rank: number };

function withRunningBalance(rows: Ranked[]): PartyTxn[] {
  const chrono = [...rows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.rank - b.rank || a.number.localeCompare(b.number) || a.id.localeCompare(b.id),
  );
  let running = 0;
  const stamped = chrono.map((row) => {
    running += row.signed;
    const { signed: _signed, rank: _rank, ...rest } = row;
    return { ...rest, balance: running };
  });
  return [...stamped].sort(
    (a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number) || b.id.localeCompare(a.id),
  );
}

export function customerHistory(data: FinanceData, customerId: string): PartyTxn[] {
  const today = todayIso();
  const rows: Ranked[] = [];
  for (const invoice of data.invoices) {
    if (invoice.customerId !== customerId) continue;
    const total = invoiceTotal(data, invoice.id);
    const open = invoiceBalance(data, invoice.id);
    const voided = invoice.status === "void";
    rows.push({
      id: invoice.id,
      openKind: "invoice",
      date: invoice.date,
      type: "Invoice",
      number: invoice.number,
      memo: invoice.notes,
      amount: total,
      open,
      balance: 0,
      signed: voided ? 0 : total,
      rank: 0,
      invoiceStatus: invoice.status,
      overdue: open > 0 && invoice.dueDate < today && invoice.status !== "void" && invoice.status !== "paid",
    });
  }
  for (const receipt of data.receipts) {
    if (receipt.customerId !== customerId) continue;
    const cash = receipt.kind === "cash-sale";
    const voided = receipt.status === "void";
    rows.push({
      id: receipt.id,
      openKind: "receipt",
      date: receipt.date,
      type: cash ? "Cash Sale" : "Payment",
      number: receipt.number,
      memo: receipt.memo,
      amount: receipt.amount,
      open: 0,
      balance: 0,
      signed: voided || cash ? 0 : -receipt.amount,
      rank: cash ? 1 : 2,
      receiptStatus: receipt.status,
      receiptKind: receipt.kind,
      receiptMethod: receipt.method,
    });
  }
  return withRunningBalance(rows);
}

export function vendorHistory(data: FinanceData, vendorId: string): PartyTxn[] {
  const today = todayIso();
  const rows: Ranked[] = [];
  for (const bill of data.bills) {
    if (bill.vendorId !== vendorId) continue;
    const open = billBalance(bill);
    const voided = bill.status === "void";
    rows.push({
      id: bill.id,
      openKind: "bill",
      date: bill.date,
      type: "Bill",
      number: bill.number,
      memo: bill.memo,
      amount: bill.amount,
      open,
      balance: 0,
      signed: voided ? 0 : bill.amount,
      rank: 0,
      billStatus: bill.status,
      overdue: open > 0 && bill.dueDate < today && bill.status !== "void" && bill.status !== "paid",
    });
  }
  for (const check of data.checks) {
    if (check.vendorId !== vendorId) continue;
    const dead = check.status === "voided" || check.status === "bounced";
    rows.push({
      id: check.id,
      openKind: "check",
      date: check.issueDate,
      type: "Check",
      number: `#${check.checkNumber}`,
      memo: check.memo,
      amount: check.amount,
      open: 0,
      balance: 0,
      signed: dead ? 0 : -check.amount,
      rank: 1,
      checkStatus: check.status,
    });
  }
  return withRunningBalance(rows);
}

export function filterCustomerHistory(rows: PartyTxn[], filter: CustomerTxnFilter): PartyTxn[] {
  if (filter === "all") return rows;
  if (filter === "invoice") return rows.filter((r) => r.openKind === "invoice");
  if (filter === "cash-sale") return rows.filter((r) => r.receiptKind === "cash-sale");
  return rows.filter((r) => r.openKind === "receipt" && r.receiptKind !== "cash-sale");
}

export function filterVendorHistory(rows: PartyTxn[], filter: VendorTxnFilter): PartyTxn[] {
  if (filter === "all") return rows;
  if (filter === "bill") return rows.filter((r) => r.openKind === "bill");
  return rows.filter((r) => r.openKind === "check");
}

export function partyHistoryRows(txns: PartyTxn[]): Array<Record<string, string | number>> {
  return txns.map((row) => ({
    Date: row.date,
    Type: row.type,
    Number: row.number,
    Memo: row.memo,
    Amount: row.amount / 100,
    Open: row.open / 100,
    Balance: row.balance / 100,
    Status: titleCase(row.invoiceStatus ?? row.billStatus ?? row.checkStatus ?? row.receiptStatus ?? ""),
  }));
}
