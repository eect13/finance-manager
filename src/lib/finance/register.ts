import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { parseAmountToCents, todayIso } from "./format";
import type { FinanceData, ReceiptMethod } from "./types";

export type CashLineKind =
  | "opening"
  | "check"
  | "receipt"
  | "payment"
  | "bill-payment"
  | "deposit"
  | "expense"
  | "transfer";

export type CashDirection = "all" | "in" | "out";

export interface CashLine {
  id: string;
  kind: CashLineKind;
  sourceId: string;
  date: string;
  number: string;
  party: string;
  bankId: string;
  payment: number;
  deposit: number;
  status: string;
  memo: string;
  counts: boolean;
  reschedulable: boolean;
  reassignable: boolean;
  method?: ReceiptMethod;
}

export interface BalancedCashLine extends CashLine {
  balance: number;
}

export const KIND_LABEL: Record<CashLineKind, string> = {
  opening: "Opening",
  check: "Check",
  receipt: "Cash Sale",
  payment: "Receipt",
  "bill-payment": "Vendor Pay",
  deposit: "Deposit",
  expense: "Expense",
  transfer: "Transfer",
};

export function shiftIso(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function openingForBanks(data: FinanceData, bankId?: string): number {
  return data.banks
    .filter((b) => !b.archived && (!bankId || b.id === bankId))
    .reduce((sum, b) => sum + b.openingBalance, 0);
}

export type DatePreset = "month" | "year" | "all" | "custom";

export function datePresetRange(preset: "month" | "year", today = todayIso()): { from: string; to: string } {
  if (preset === "month") {
    const start = `${today.slice(0, 7)}-01`;
    return { from: start, to: format(endOfMonth(parseISO(start)), "yyyy-MM-dd") };
  }
  const y = today.slice(0, 4);
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export function cashBook(
  data: FinanceData,
  bankId?: string,
  range?: { dateFrom?: string; dateTo?: string },
): { opening: number; lines: CashLine[] } {
  const dateFrom = range?.dateFrom?.trim() ?? "";
  const dateTo = range?.dateTo?.trim() ?? "";
  const lines: CashLine[] = [];
  let opening = openingForBanks(data, bankId);

  function take(line: CashLine) {
    if (dateFrom && line.date && line.date < dateFrom) {
      if (line.counts) opening += line.deposit - line.payment;
      return;
    }
    if (dateTo && line.date && line.date > dateTo) return;
    lines.push(line);
  }

  for (const check of data.checks) {
    if (bankId && check.bankId !== bankId) continue;
    const voided = check.status === "voided" || check.status === "bounced";
    take({
      id: `check:${check.id}`,
      kind: "check",
      sourceId: check.id,
      date: check.issueDate,
      number: `#${check.checkNumber}`,
      party: check.payee,
      bankId: check.bankId,
      payment: voided ? 0 : check.amount,
      deposit: 0,
      status: check.status,
      memo: check.memo,
      counts: !voided,
      reschedulable: check.status === "pending" || check.status === "cleared",
      reassignable: !voided,
    });
  }

  for (const receipt of data.receipts) {
    if (bankId && receipt.bankId !== bankId) continue;
    const voided = receipt.status === "void";
    take({
      id: `receipt:${receipt.id}`,
      kind: receipt.kind === "payment" ? "payment" : "receipt",
      sourceId: receipt.id,
      date: receipt.date,
      number: receipt.checkNumber ? `Chk ${receipt.checkNumber}` : receipt.number,
      party: receipt.receivedFrom,
      bankId: receipt.bankId,
      payment: 0,
      deposit: voided ? 0 : receipt.amount,
      status: receipt.status,
      memo: receipt.memo,
      counts: !voided,
      reschedulable: receipt.status === "posted",
      reassignable: !voided,
      method: receipt.method,
    });
  }

  for (const bill of data.bills) {
    if (bill.status === "void") continue;
    const vendor = data.vendors.find((v) => v.id === bill.vendorId);
    for (const pay of bill.payments) {
      if (bankId && pay.bankId !== bankId) continue;
      take({
        id: `billpay:${pay.id}`,
        kind: "bill-payment",
        sourceId: pay.id,
        date: pay.date,
        number: bill.number,
        party: vendor?.name ?? bill.number,
        bankId: pay.bankId,
        payment: pay.amount,
        deposit: 0,
        status: bill.status,
        memo: bill.memo,
        counts: true,
        reschedulable: true,
        reassignable: true,
      });
    }
  }

  for (const journal of data.journals) {
    if (journal.sourceType !== "deposit" && journal.sourceType !== "expense" && journal.sourceType !== "transfer") {
      continue;
    }
    for (const line of journal.lines) {
      const account = data.accounts.find((a) => a.id === line.accountId);
      if (!account?.bankId) continue;
      if (bankId && account.bankId !== bankId) continue;
      const inbound = line.debit > 0;
      const amount = inbound ? line.debit : line.credit;
      take({
        id: `journal:${journal.id}:${account.bankId}`,
        kind: journal.sourceType,
        sourceId: journal.id,
        date: journal.date,
        number: "",
        party: journal.description,
        bankId: account.bankId,
        payment: inbound ? 0 : amount,
        deposit: inbound ? amount : 0,
        status: journal.sourceType === "transfer" ? "internal" : "posted",
        memo: line.memo,
        counts: true,
        reschedulable: false,
        reassignable: true,
      });
    }
  }

  lines.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { opening, lines };
}

export function cashRegisterLines(data: FinanceData, bankId?: string): CashLine[] {
  return cashBook(data, bankId).lines;
}

export function withOpening(
  lines: CashLine[],
  opening: number,
  asOf?: { date?: string; forward?: boolean },
): CashLine[] {
  if (opening === 0) return lines;
  const row: CashLine = {
    id: "opening",
    kind: "opening",
    sourceId: "",
    date: asOf?.date ?? "",
    number: "",
    party: asOf?.forward ? "Balance forward" : "Opening balance",
    bankId: "",
    payment: opening < 0 ? -opening : 0,
    deposit: opening > 0 ? opening : 0,
    status: "",
    memo: "",
    counts: true,
    reschedulable: false,
    reassignable: false,
  };
  return [row, ...lines];
}


export function withRunningBalance(lines: CashLine[]): BalancedCashLine[] {
  let balance = 0;
  return lines.map((line) => {
    if (line.counts) balance += line.deposit - line.payment;
    return { ...line, balance };
  });
}

export function filterDirection(lines: CashLine[], direction: CashDirection): CashLine[] {
  if (direction === "in") return lines.filter((l) => l.kind === "opening" || l.deposit > 0);
  if (direction === "out") return lines.filter((l) => l.kind === "opening" || l.payment > 0);
  return lines;
}

export function groupByDate(lines: CashLine[]): Array<{ date: string; lines: CashLine[] }> {
  const map = new Map<string, CashLine[]>();
  for (const line of lines) {
    if (line.kind === "opening") continue;
    const bucket = map.get(line.date) ?? [];
    bucket.push(line);
    map.set(line.date, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, group]) => ({ date, lines: group }));
}

export function boardDates(lines: CashLine[], extra: string[]): string[] {
  const today = todayIso();
  const set = new Set<string>(extra);
  for (const line of lines) {
    if (line.date) set.add(line.date);
  }
  for (let i = 0; i <= 3; i += 1) set.add(shiftIso(today, i));
  return [...set].sort();
}

export function rescheduleKind(kind: CashLineKind): "check" | "receipt" | "bill-payment" | null {
  if (kind === "check") return "check";
  if (kind === "receipt" || kind === "payment") return "receipt";
  if (kind === "bill-payment") return "bill-payment";
  return null;
}

export function totals(lines: CashLine[]): { inflow: number; outflow: number; net: number } {
  const inflow = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
  const outflow = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
  return { inflow, outflow, net: inflow - outflow };
}

export type CashTypeFilter = "all" | Exclude<CashLineKind, "opening">;

export const TYPE_FILTERS: Array<{ value: CashTypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  { value: "check", label: "Check" },
  { value: "payment", label: "Receipt" },
  { value: "receipt", label: "Cash Sale" },
  { value: "bill-payment", label: "Vendor Pay" },
  { value: "deposit", label: "Deposit" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

export function filterCashLines(
  lines: CashLine[],
  q: {
    name?: string;
    number?: string;
    type?: CashTypeFilter;
    dateFrom?: string;
    dateTo?: string;
    bankId?: string;
    amount?: string;
  },
): CashLine[] {
  const name = (q.name ?? "").trim().toLowerCase();
  const number = (q.number ?? "").trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
  const type = q.type && q.type !== "all" ? q.type : "";
  const dateFrom = q.dateFrom?.trim() ?? "";
  const dateTo = q.dateTo?.trim() ?? "";
  const bankId = q.bankId?.trim() ?? "";
  const amountQ = (q.amount ?? "").trim();
  const amountCents = amountQ ? parseAmountToCents(amountQ) : 0;
  return lines.filter((line) => {
    if (line.kind === "opening") return !name && !number && !type && !amountQ;
    if (type && line.kind !== type) return false;
    if (name) {
      const hay = `${line.party} ${line.memo} ${line.number}`.toLowerCase();
      const numHay = line.number.toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
      const numNeedle = name.replace(/^#/, "").replace(/\s+/g, "");
      if (!hay.includes(name) && !numHay.includes(numNeedle)) return false;
    }
    if (number) {
      const hay = line.number.toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
      if (!hay.includes(number)) return false;
    }
    if (dateFrom && line.date && line.date < dateFrom) return false;
    if (dateTo && line.date && line.date > dateTo) return false;
    if (bankId && line.bankId !== bankId) return false;
    if (amountQ) {
      const values = [line.payment, line.deposit].filter((v) => v > 0);
      const match = values.some(
        (v) =>
          v === amountCents ||
          v === Math.round(Number(amountQ.replace(/,/g, ""))) ||
          String(v / 100).includes(amountQ.replace(/,/g, "")),
      );
      if (!match) return false;
    }
    return true;
  });
}

export function deletableLines(lines: CashLine[]): CashLine[] {
  return lines.filter((line) => line.kind !== "opening" && Boolean(line.sourceId));
}

export function movableLines(lines: CashLine[]): CashLine[] {
  return lines.filter((line) => line.reassignable && Boolean(line.sourceId));
}

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  today: boolean;
  inflow: number;
  outflow: number;
  net: number;
  count: number;
  lines: CashLine[];
}

export function monthLabel(month: string): string {
  const date = parseISO(`${month}-01`);
  return format(date, "MMMM yyyy");
}

export function shiftMonth(month: string, delta: number): string {
  return format(addMonths(parseISO(`${month}-01`), delta), "yyyy-MM");
}

export function cashCalendar(lines: CashLine[], month: string): CalendarDay[] {
  const today = todayIso();
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });
  const byDate = new Map<string, CashLine[]>();
  for (const line of lines) {
    if (line.kind === "opening" || !line.date) continue;
    const bucket = byDate.get(line.date) ?? [];
    bucket.push(line);
    byDate.set(line.date, bucket);
  }
  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const group = byDate.get(date) ?? [];
    const inflow = group.reduce((s, l) => s + l.deposit, 0);
    const outflow = group.reduce((s, l) => s + l.payment, 0);
    return {
      date,
      inMonth: date.startsWith(month),
      today: date === today,
      inflow,
      outflow,
      net: inflow - outflow,
      count: group.length,
      lines: group,
    };
  });
}
