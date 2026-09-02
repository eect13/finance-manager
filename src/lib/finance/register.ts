import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { parseAmountToCents, todayIso } from "./format";
import type { FinanceData, ReceiptMethod, ReconStatus } from "./types";

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
  recon: ReconStatus;
  counts: boolean;
  reschedulable: boolean;
  reassignable: boolean;
  method?: ReceiptMethod;
  createdAt?: number;
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

/** Same date + bank + amount (+ payee when given). Duplicates stay legal — caller should warn, not block. */
export function findDuplicateCashLine(
  data: FinanceData,
  input: {
    date: string;
    bankId: string;
    amount: number;
    party?: string;
    kind?: CashLineKind;
    excludeSourceId?: string;
  },
): CashLine | undefined {
  if (!input.date || !input.bankId || input.amount <= 0) return undefined;
  const { lines } = cashBook(data, input.bankId, { dateFrom: input.date, dateTo: input.date });
  const party = input.party?.trim().toLowerCase() ?? "";
  return lines.find((line) => {
    if (line.kind === "opening") return false;
    if (input.excludeSourceId && line.sourceId === input.excludeSourceId) return false;
    if (input.kind && line.kind !== input.kind) return false;
    const amt = line.payment || line.deposit;
    if (amt !== input.amount) return false;
    if (party && line.party.trim().toLowerCase() !== party) return false;
    return true;
  });
}

export function shiftIso(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function openingForBanks(data: FinanceData, bankId?: string): number {
  return data.banks
    .filter((b) => !b.archived && (!bankId || b.id === bankId))
    .reduce((sum, b) => sum + b.openingBalance, 0);
}

export type DatePreset = "month" | "year" | "all" | "custom";

export function datePresetRange(preset: "month" | "year" | "all", today = todayIso()): { from: string; to: string } {
  if (preset === "month") {
    const start = `${today.slice(0, 7)}-01`;
    return { from: start, to: format(endOfMonth(parseISO(start)), "yyyy-MM-dd") };
  }
  if (preset === "year") {
    const y = today.slice(0, 4);
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  const y = Number(today.slice(0, 4)) - 1;
  return { from: `${y}-01-01`, to: "" };
}

export function cashBook(
  data: FinanceData,
  bankId?: string,
  range?: { dateFrom?: string; dateTo?: string },
): { opening: number; lines: CashLine[]; freezeThrough: string; closeJournalId: string } {
  const dateFrom = range?.dateFrom?.trim() ?? "";
  const dateTo = range?.dateTo?.trim() ?? "";
  const lines: CashLine[] = [];
  let opening = openingForBanks(data, bankId);
  let freezeThrough = "";
  let closeJournalId = "";
  if (dateFrom) {
    const snaps = (data.closeHistory ?? [])
      .filter((s) => !s.reopenedAt && s.through && s.through < dateFrom)
      .sort((a, b) => a.through.localeCompare(b.through));
    const snap = snaps.at(-1);
    if (snap) {
      if (bankId) {
        const row = snap.banks.find((b) => b.bankId === bankId);
        if (row) {
          opening = row.balance;
          freezeThrough = snap.through;
          closeJournalId = snap.journalId;
        }
      } else {
        opening = snap.banks.reduce((sum, b) => sum + b.balance, 0);
        freezeThrough = snap.through;
        closeJournalId = snap.journalId;
      }
    }
  }

  const accountBank = new Map<string, string>();
  for (const account of data.accounts) {
    if (account.bankId) accountBank.set(account.id, account.bankId);
  }
  const vendorName = new Map(data.vendors.map((v) => [v.id, v.name]));
  const journalCreated = new Map(data.journals.map((j) => [j.id, j.createdAt ?? 0]));

  function accept(date: string, counts: boolean, signed: number, make: () => CashLine) {
    if (freezeThrough && date && date <= freezeThrough) return;
    if (dateFrom && date && date < dateFrom) {
      if (counts) opening += signed;
      return;
    }
    if (dateTo && date && date > dateTo) return;
    lines.push(make());
  }

  for (const check of data.checks) {
    if (bankId && check.bankId !== bankId) continue;
    const voided = check.status === "voided" || check.status === "bounced";
    const payment = voided ? 0 : check.amount;
    accept(check.issueDate, !voided, -payment, () => ({
      id: `check:${check.id}`,
      kind: "check",
      sourceId: check.id,
      date: check.issueDate,
      number: `#${check.checkNumber}`,
      party: check.payee,
      bankId: check.bankId,
      payment,
      deposit: 0,
      status: check.status,
      memo: check.memo,
      recon: check.status === "voided" || check.status === "bounced" ? "pending" : (check.recon ?? "pending"),
      counts: !voided,
      reschedulable: (check.status === "pending" || check.status === "cleared") && check.recon !== "reconciled",
      reassignable: !voided && check.recon !== "reconciled",
      createdAt: check.createdAt ?? 0,
    }));
  }

  for (const receipt of data.receipts) {
    if (bankId && receipt.bankId !== bankId) continue;
    const voided = receipt.status === "void";
    const deposit = voided ? 0 : receipt.amount;
    accept(receipt.date, !voided, deposit, () => ({
      id: `receipt:${receipt.id}`,
      kind: receipt.kind === "payment" ? "payment" : "receipt",
      sourceId: receipt.id,
      date: receipt.date,
      number: receipt.checkNumber ? `Chk ${receipt.checkNumber}` : receipt.number,
      party: receipt.receivedFrom,
      bankId: receipt.bankId,
      payment: 0,
      deposit,
      status: receipt.status,
      memo: receipt.memo,
      recon: receipt.status === "void" ? "pending" : (receipt.recon ?? "pending"),
      counts: !voided,
      reschedulable: receipt.status === "posted" && receipt.recon !== "reconciled",
      reassignable: !voided && receipt.recon !== "reconciled",
      method: receipt.method,
      createdAt: receipt.createdAt ?? 0,
    }));
  }

  for (const bill of data.bills) {
    if (bill.status === "void") continue;
    const party = vendorName.get(bill.vendorId) ?? bill.number;
    for (const pay of bill.payments) {
      if (bankId && pay.bankId !== bankId) continue;
      accept(pay.date, true, -pay.amount, () => ({
        id: `billpay:${pay.id}`,
        kind: "bill-payment",
        sourceId: pay.id,
        date: pay.date,
        number: bill.number,
        party,
        bankId: pay.bankId,
        payment: pay.amount,
        deposit: 0,
        status: bill.status,
        memo: bill.memo,
        recon: pay.recon ?? "pending",
        counts: true,
        reschedulable: (pay.recon ?? "pending") !== "reconciled",
        reassignable: (pay.recon ?? "pending") !== "reconciled",
        createdAt: journalCreated.get(pay.journalId) ?? 0,
      }));
    }
  }

  for (const journal of data.journals) {
    if (journal.sourceType !== "deposit" && journal.sourceType !== "expense" && journal.sourceType !== "transfer") {
      continue;
    }
    for (const line of journal.lines) {
      const lineBankId = accountBank.get(line.accountId);
      if (!lineBankId) continue;
      if (bankId && lineBankId !== bankId) continue;
      const inbound = line.debit > 0;
      const amount = inbound ? line.debit : line.credit;
      const locked = journal.recon === "reconciled";
      accept(journal.date, true, inbound ? amount : -amount, () => ({
        id: `journal:${journal.id}:${lineBankId}`,
        kind: journal.sourceType as CashLineKind,
        sourceId: journal.id,
        date: journal.date,
        number: "",
        party: journal.description,
        bankId: lineBankId,
        payment: inbound ? 0 : amount,
        deposit: inbound ? amount : 0,
        status: journal.sourceType === "transfer" ? "internal" : "posted",
        memo: line.memo,
        recon: journal.recon ?? "pending",
        counts: true,
        reschedulable: !locked,
        reassignable: !locked,
        createdAt: journal.createdAt ?? 0,
      }));
    }
  }

  lines.sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.id.localeCompare(b.id));
  return { opening, lines, freezeThrough, closeJournalId };
}

export function cashRegisterLines(data: FinanceData, bankId?: string): CashLine[] {
  return cashBook(data, bankId).lines;
}

export function withOpening(
  lines: CashLine[],
  opening: number,
  asOf?: { date?: string; forward?: boolean; closedThrough?: string },
): CashLine[] {
  if (opening === 0 && !asOf?.closedThrough) return lines;
  const closed = asOf?.closedThrough?.trim() ?? "";
  const row: CashLine = {
    id: "opening",
    kind: "opening",
    sourceId: "",
    date: closed || asOf?.date || "",
    number: "",
    party: closed
      ? `Closed through ${format(parseISO(closed), "MMM d, yyyy")}`
      : asOf?.forward
        ? "Balance forward"
        : "Opening balance",
    bankId: "",
    payment: opening < 0 ? -opening : 0,
    deposit: opening > 0 ? opening : 0,
    status: "",
    memo: closed ? "Posted close" : "",
    recon: "pending",
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

export function rescheduleKind(kind: CashLineKind): "check" | "receipt" | "bill-payment" | "journal" | null {
  if (kind === "check") return "check";
  if (kind === "receipt" || kind === "payment") return "receipt";
  if (kind === "bill-payment") return "bill-payment";
  if (kind === "transfer" || kind === "deposit" || kind === "expense") return "journal";
  return null;
}

export function isTransferMate(line: CashLine, sourceId: string | null | undefined): boolean {
  return line.kind === "transfer" && Boolean(sourceId) && line.sourceId === sourceId;
}

export function transferDragCaption(line: CashLine): string {
  return line.kind === "transfer" ? "Transfer · both banks" : line.party || KIND_LABEL[line.kind];
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
  return lines.filter((line) => line.kind !== "opening" && Boolean(line.sourceId) && line.recon !== "reconciled");
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

export function calendarGridRange(month: string): { from: string; to: string } {
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const from = startOfWeek(monthStart, { weekStartsOn: 0 });
  const to = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });
  return { from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") };
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
