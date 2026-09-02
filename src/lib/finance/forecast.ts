import { addDaysIso, todayIso } from "./format";
import { billBalance, invoiceBalance, openPayables, pendingChecksTotal, totalCash } from "./ledger";
import type { FinanceData } from "./types";

export interface ForecastPoint {
  date: string;
  cash: number;
  inflows: number;
  outflows: number;
}

function bump(map: Map<string, number>, date: string, amount: number) {
  if (!amount) return;
  map.set(date, (map.get(date) ?? 0) + amount);
}

export function cashForecast(data: FinanceData, days = 90): ForecastPoint[] {
  const start = todayIso();
  const thisMonth = start.slice(0, 7);
  let cash = totalCash(data) + pendingChecksTotal(data);
  const points: ForecastPoint[] = [];
  const inByDate = new Map<string, number>();
  const outByDate = new Map<string, number>();

  for (const inv of data.invoices) {
    if (inv.status !== "sent" && inv.status !== "partial") continue;
    bump(inByDate, inv.dueDate, invoiceBalance(data, inv.id));
  }
  for (const chk of data.checks) {
    if (chk.status !== "pending") continue;
    bump(outByDate, chk.postDate || chk.issueDate, chk.amount);
  }
  for (const bill of data.bills ?? []) {
    if (bill.status !== "open" && bill.status !== "partial") continue;
    bump(outByDate, bill.dueDate, billBalance(bill));
  }

  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(start, i);
    let inflows = inByDate.get(date) ?? 0;
    let outflows = outByDate.get(date) ?? 0;

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
