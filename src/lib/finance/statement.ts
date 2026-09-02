import { invoiceBalance } from "./ledger";
import { ageBucket, type AgeBucket } from "./aging";
import type { FinanceData } from "./types";

export interface StatementLine {
  id: string;
  date: string;
  dueDate: string;
  number: string;
  memo: string;
  amount: number;
  open: number;
  bucket: AgeBucket;
}

export interface CustomerStatement {
  customerId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  asOf: string;
  lines: StatementLine[];
  total: number;
  lastPayment: { date: string; amount: number; number: string } | null;
  notes: string;
}

export function customerStatement(data: FinanceData, customerId: string, asOf: string): CustomerStatement | null {
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return null;
  const lines: StatementLine[] = [];
  for (const inv of data.invoices) {
    if (inv.customerId !== customerId) continue;
    if (inv.status === "void") continue;
    if (inv.date > asOf) continue;
    const open = invoiceBalance(data, inv.id, asOf);
    if (open <= 0) continue;
    lines.push({
      id: inv.id,
      date: inv.date,
      dueDate: inv.dueDate,
      number: inv.number,
      memo: inv.notes,
      amount: inv.lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0),
      open,
      bucket: ageBucket(inv.dueDate, asOf),
    });
  }
  lines.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.number.localeCompare(b.number));
  const payments = data.receipts
    .filter((r) => r.customerId === customerId && r.status === "posted" && r.kind === "payment" && r.date <= asOf)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const last = payments[0];
  return {
    customerId,
    name: customer.name,
    address: customer.address,
    email: customer.email,
    phone: customer.phone,
    asOf,
    lines,
    total: lines.reduce((s, l) => s + l.open, 0),
    lastPayment: last ? { date: last.date, amount: last.amount, number: last.number } : null,
    notes: customer.notes,
  };
}
