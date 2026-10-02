import { makeJournal } from "./ledger";
import type { Bill, CheckRecord, FinanceData, Invoice, JournalEntry, Receipt, ReconStatement } from "./types";

export const YEAR_ARCHIVE_KIND = "finance-manager-year";

export interface YearArchive {
  kind: typeof YEAR_ARCHIVE_KIND;
  version: 1;
  through: string;
  savedAt: string;
  companyName: string;
  invoices: Invoice[];
  bills: Bill[];
  receipts: Receipt[];
  checks: CheckRecord[];
  journals: JournalEntry[];
  reconHistory: ReconStatement[];
}

export interface PackedYear {
  data: FinanceData;
  archive: YearArchive;
  removed: number;
  beforeBytes: number;
  afterBytes: number;
}

function utf8Size(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function netsOf(journals: JournalEntry[]): Map<string, number> {
  const nets = new Map<string, number>();
  for (const journal of journals) {
    for (const line of journal.lines) {
      const next = (nets.get(line.accountId) ?? 0) + line.debit - line.credit;
      if (next === 0) nets.delete(line.accountId);
      else nets.set(line.accountId, next);
    }
  }
  return nets;
}

function sameNets(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [id, net] of a) if (b.get(id) !== net) return false;
  return true;
}

function journalNets(journal: JournalEntry): Map<string, number> {
  return netsOf([journal]);
}

/**
 * Move a closed year out of the hot file. Open documents, budgets, and the roster stay.
 * One condensed journal keeps every account balance. Restore puts the year back.
 */
export function archiveClosedYear(data: FinanceData, throughDate: string): PackedYear {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(throughDate)) throw new Error("Pick a valid date.");
  const closed = (data.settings.closedThrough ?? "").trim();
  if (!closed || closed < throughDate) {
    throw new Error("Close the books through that date first. Packing only takes a closed year out of the file.");
  }

  const dropInvoices = new Set(
    data.invoices
      .filter((i) => (i.status === "paid" || i.status === "void") && i.date <= throughDate)
      .map((i) => i.id),
  );
  const dropReceipts = new Set(
    data.receipts
      .filter((r) => {
        if (r.invoiceId && dropInvoices.has(r.invoiceId)) return true;
        if (r.kind === "cash-sale" && r.date <= throughDate) return true;
        if (r.kind === "payment" && r.status === "void" && r.date <= throughDate) return true;
        return false;
      })
      .map((r) => r.id),
  );
  const dropBills = new Set(
    data.bills
      .filter((b) => (b.status === "paid" || b.status === "void") && b.date <= throughDate)
      .map((b) => b.id),
  );
  const dropChecks = new Set(
    data.checks
      .filter((c) => c.status !== "pending" && c.issueDate <= throughDate)
      .map((c) => c.id),
  );

  const keepJournalIds = new Set<string>();
  const note = (id?: string) => {
    if (id) keepJournalIds.add(id);
  };
  for (const invoice of data.invoices) {
    if (dropInvoices.has(invoice.id)) continue;
    note(invoice.journalId);
    for (const pay of invoice.payments) note(pay.journalId);
  }
  for (const receipt of data.receipts) {
    if (dropReceipts.has(receipt.id)) continue;
    note(receipt.journalId);
    note(receipt.reversalJournalId);
  }
  for (const bill of data.bills) {
    if (dropBills.has(bill.id)) continue;
    note(bill.journalId);
    for (const pay of bill.payments) note(pay.journalId);
  }
  for (const check of data.checks) {
    if (dropChecks.has(check.id)) continue;
    note(check.journalId);
    note(check.reversalJournalId);
  }

  const dropJournalIds = new Set<string>();
  for (const journal of data.journals) {
    if (journal.sourceType === "condensed") continue;
    if (journal.date > throughDate) continue;
    if (keepJournalIds.has(journal.id)) continue;
    dropJournalIds.add(journal.id);
  }
  for (const journal of data.journals) {
    if (journal.sourceType === "reversal" && journal.sourceId && dropJournalIds.has(journal.sourceId)) {
      if (!keepJournalIds.has(journal.id)) dropJournalIds.add(journal.id);
    }
  }

  const droppedJournals = data.journals.filter((j) => dropJournalIds.has(j.id));
  const removed = dropInvoices.size + dropReceipts.size + dropBills.size + dropChecks.size + droppedJournals.length;
  if (removed === 0) throw new Error("Nothing closed on or before that date.");

  const beforeBytes = utf8Size(data);
  const archive: YearArchive = {
    kind: YEAR_ARCHIVE_KIND,
    version: 1,
    through: throughDate,
    savedAt: new Date().toISOString(),
    companyName: data.settings.companyName ?? "",
    invoices: data.invoices.filter((i) => dropInvoices.has(i.id)),
    bills: data.bills.filter((b) => dropBills.has(b.id)),
    receipts: data.receipts.filter((r) => dropReceipts.has(r.id)),
    checks: data.checks.filter((c) => dropChecks.has(c.id)),
    journals: droppedJournals,
    reconHistory: (data.reconHistory ?? []).filter((r) => (r.statementDate || "") <= throughDate),
  };

  let journals = data.journals.filter((j) => !dropJournalIds.has(j.id));
  const nets = netsOf(droppedJournals);
  if (nets.size > 0) {
    const lines = [...nets.entries()].map(([accountId, net]) =>
      net > 0 ? { accountId, debit: net, credit: 0 } : { accountId, debit: 0, credit: -net },
    );
    journals = [
      makeJournal({
        date: throughDate,
        description: `Condensed books through ${throughDate}`,
        sourceType: "condensed",
        sourceId: throughDate,
        lines,
      }),
      ...journals,
    ];
  }

  const next: FinanceData = {
    ...data,
    invoices: data.invoices.filter((i) => !dropInvoices.has(i.id)),
    receipts: data.receipts.filter((r) => !dropReceipts.has(r.id)),
    bills: data.bills.filter((b) => !dropBills.has(b.id)),
    checks: data.checks.filter((c) => !dropChecks.has(c.id)),
    journals,
    reconHistory: (data.reconHistory ?? []).filter((r) => (r.statementDate || "") > throughDate),
  };
  return { data: next, archive, removed, beforeBytes, afterBytes: utf8Size(next) };
}

export function yearArchivePayload(archive: YearArchive): string {
  return JSON.stringify(archive, null, 2);
}

export function yearArchiveFilename(archive: YearArchive): string {
  const slug = (archive.companyName || "company")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "company"}-through-${archive.through}.json`;
}

export function parseYearArchive(raw: string): YearArchive {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("That is not a packed year file.");
  const o = parsed as Record<string, unknown>;
  if (o.kind !== YEAR_ARCHIVE_KIND) throw new Error("That is not a packed year file.");
  if (typeof o.through !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.through)) {
    throw new Error("Packed year file has no through date.");
  }
  const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
  return {
    kind: YEAR_ARCHIVE_KIND,
    version: 1,
    through: o.through,
    savedAt: typeof o.savedAt === "string" ? o.savedAt : "",
    companyName: typeof o.companyName === "string" ? o.companyName : "",
    invoices: list(o.invoices),
    bills: list(o.bills),
    receipts: list(o.receipts),
    checks: list(o.checks),
    journals: list(o.journals),
    reconHistory: list(o.reconHistory),
  };
}

/** Put a packed year back. Removes the one-line summary so balances are not doubled. */
export function restoreClosedYear(data: FinanceData, archive: YearArchive): FinanceData {
  if (archive.kind !== YEAR_ARCHIVE_KIND) throw new Error("That is not a packed year file.");
  if (archive.companyName && data.settings.companyName && archive.companyName !== data.settings.companyName) {
    throw new Error("That year file is for a different company.");
  }
  const already = new Set(data.journals.map((j) => j.id));
  if (archive.journals.some((j) => already.has(j.id))) {
    throw new Error("This year is already in the open file.");
  }
  const condensed = data.journals.find((j) => j.sourceType === "condensed" && j.sourceId === archive.through);
  const archivedNets = netsOf(archive.journals);
  if (archivedNets.size === 0) {
    if (condensed) throw new Error("This year file does not match the summary in the open file.");
  } else if (!condensed || !sameNets(archivedNets, journalNets(condensed))) {
    throw new Error(
      condensed
        ? "This year file does not match the summary in the open file."
        : "No packed summary for that date is in this file.",
    );
  }
  const haveInvoice = new Set(data.invoices.map((i) => i.id));
  const haveBill = new Set(data.bills.map((b) => b.id));
  const haveReceipt = new Set(data.receipts.map((r) => r.id));
  const haveCheck = new Set(data.checks.map((c) => c.id));
  const haveRecon = new Set((data.reconHistory ?? []).map((r) => r.id));
  return {
    ...data,
    invoices: [...data.invoices, ...archive.invoices.filter((i) => !haveInvoice.has(i.id))],
    bills: [...data.bills, ...archive.bills.filter((b) => !haveBill.has(b.id))],
    receipts: [...data.receipts, ...archive.receipts.filter((r) => !haveReceipt.has(r.id))],
    checks: [...data.checks, ...archive.checks.filter((c) => !haveCheck.has(c.id))],
    journals: [
      ...data.journals.filter((j) => j.id !== condensed?.id),
      ...archive.journals,
    ],
    reconHistory: [...(data.reconHistory ?? []), ...archive.reconHistory.filter((r) => !haveRecon.has(r.id))],
  };
}
