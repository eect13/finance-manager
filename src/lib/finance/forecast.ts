import { addDaysIso, todayIso } from "./format";
import { billBalance, invoiceBalance, openPayables, pendingChecksTotal, totalCash } from "./ledger";
import type { FinanceData } from "./types";

export interface ForecastPoint {
  date: string;
  cash: number;
  inflows: number;
  outflows: number;
}

export function cashForecast(data: FinanceData, days = 90): ForecastPoint[] {
  const start = todayIso();
  const thisMonth = start.slice(0, 7);
  let cash = totalCash(data) + pendingChecksTotal(data);
  const points: ForecastPoint[] = [];

  const openInvoices = data.invoices
    .filter((i) => i.status === "sent" || i.status === "partial")
    .map((i) => ({ date: i.dueDate, amount: invoiceBalance(data, i.id) }));

  const pendingChecks = data.checks
    .filter((c) => c.status === "pending")
    .map((c) => ({ date: c.postDate || c.issueDate, amount: c.amount }));

  const openBills = (data.bills ?? [])
    .filter((b) => b.status === "open" || b.status === "partial")
    .map((b) => ({ date: b.dueDate, amount: billBalance(b) }));

  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(start, i);
    let inflows = 0;
    let outflows = 0;

    for (const inv of openInvoices) {
      if (inv.date === date) inflows += inv.amount;
    }
    for (const chk of pendingChecks) {
      if (chk.date === date) outflows += chk.amount;
    }
    for (const bill of openBills) {
      if (bill.date === date) outflows += bill.amount;
    }

    const month = date.slice(0, 7);
    if (date.slice(8, 10) === "01" && month > thisMonth) {
      for (const item of data.budgetItems) {
        if (item.startMonth > month) continue;
        if (item.kind === "inflow") inflows += item.amount;
        else outflows += item.amount;
      }
    }

    cash += inflows - outflows;
    points.push({ date, cash, inflows, outflows });
  }

  return points;
}

export function projectedCash(data: FinanceData): number {
  const receivables = data.invoices
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce((s, i) => s + invoiceBalance(data, i.id), 0);
  return totalCash(data) + receivables - openPayables(data);
}
