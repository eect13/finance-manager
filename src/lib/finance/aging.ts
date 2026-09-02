import { differenceInCalendarDays, parseISO } from "date-fns";
import { billBalance, invoiceBalance } from "./ledger";
import { todayIso } from "./format";
import type { FinanceData } from "./types";

export type AgeBucket = "current" | "d1_30" | "d31_60" | "d61_90" | "d90";

export const AGE_LABEL: Record<AgeBucket, string> = {
  current: "Current",
  d1_30: "1–30",
  d31_60: "31–60",
  d61_90: "61–90",
  d90: "90+",
};

export const AGE_ORDER: AgeBucket[] = ["current", "d1_30", "d31_60", "d61_90", "d90"];

export function ageBucket(dueDate: string, asOf = todayIso()): AgeBucket {
  const days = differenceInCalendarDays(parseISO(asOf), parseISO(dueDate));
  if (days <= 0) return "current";
  if (days <= 30) return "d1_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  return "d90";
}

export interface AgingRow {
  id: string;
  party: string;
  number: string;
  date: string;
  dueDate: string;
  bucket: AgeBucket;
  amount: number;
}

export function arAging(data: FinanceData, asOf = todayIso()): AgingRow[] {
  const rows: AgingRow[] = [];
  for (const inv of data.invoices) {
    if (inv.status === "void") continue;
    if (inv.date > asOf) continue;
    const amount = invoiceBalance(data, inv.id, asOf);
    if (amount <= 0) continue;
    const customer = data.customers.find((c) => c.id === inv.customerId);
    rows.push({
      id: inv.id,
      party: customer?.name ?? "Customer",
      number: inv.number,
      date: inv.date,
      dueDate: inv.dueDate,
      bucket: ageBucket(inv.dueDate, asOf),
      amount,
    });
  }
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.number.localeCompare(b.number));
}

export function apAging(data: FinanceData, asOf = todayIso()): AgingRow[] {
  const rows: AgingRow[] = [];
  for (const bill of data.bills) {
    if (bill.status === "void") continue;
    if (bill.date > asOf) continue;
    const amount = billBalance(bill, asOf);
    if (amount <= 0) continue;
    const vendor = data.vendors.find((v) => v.id === bill.vendorId);
    rows.push({
      id: bill.id,
      party: vendor?.name ?? "Vendor",
      number: bill.number,
      date: bill.date,
      dueDate: bill.dueDate,
      bucket: ageBucket(bill.dueDate, asOf),
      amount,
    });
  }
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.number.localeCompare(b.number));
}

export function agingTotals(rows: AgingRow[]): Record<AgeBucket, number> {
  const out: Record<AgeBucket, number> = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90: 0 };
  for (const row of rows) out[row.bucket] += row.amount;
  return out;
}
