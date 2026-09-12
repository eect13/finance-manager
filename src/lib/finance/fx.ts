import { invoiceTax, invoiceSubtotal } from "./ledger";
import type { FinanceData, FxRate } from "./types";

/**
 * Multi-currency helpers: rate table + convert + document CSV.
 * Invoices/bills stay in home currency (no per-doc FX field in this schema).
 * Not a full multi-book ledger; no automatic gain/loss journals.
 */
export const FX_BOOKS_DISCLAIMER =
  "Rate table and conversions for books — not a live FX feed or realized gain/loss posting.";

export type ConvertResult = {
  cents: number;
  rate: number;
  found: boolean;
};

function pickLatest(rates: FxRate[], asOf?: string): FxRate | undefined {
  const eligible = rates.filter((r) => !asOf || !r.asOf || r.asOf <= asOf);
  if (eligible.length === 0) return undefined;
  return [...eligible].sort((a, b) => (a.asOf || "").localeCompare(b.asOf || "") || a.id.localeCompare(b.id)).at(-1);
}

/** Convert cents from `from` into `to` using the latest rate on or before asOf. */
export function convertCents(
  cents: number,
  from: string,
  to: string,
  rates: FxRate[],
  asOf?: string,
): ConvertResult {
  const src = (from || "").toUpperCase();
  const dst = (to || "").toUpperCase();
  const amount = Math.round(Number(cents) || 0);
  if (!src || !dst || src === dst) return { cents: amount, rate: 1, found: true };
  const direct = pickLatest(
    rates.filter((r) => r.from.toUpperCase() === src && r.to.toUpperCase() === dst),
    asOf,
  );
  if (direct && direct.rate > 0) {
    return { cents: Math.round(amount * direct.rate), rate: direct.rate, found: true };
  }
  const inv = pickLatest(
    rates.filter((r) => r.from.toUpperCase() === dst && r.to.toUpperCase() === src),
    asOf,
  );
  if (inv && inv.rate > 0) {
    return { cents: Math.round(amount / inv.rate), rate: 1 / inv.rate, found: true };
  }
  return { cents: amount, rate: 1, found: false };
}

export function fxRateCsvRows(data: FinanceData): Array<Record<string, string | number>> {
  const rates = data.settings.fxRates ?? [];
  if (rates.length === 0) {
    return [
      {
        From: data.settings.currency || "",
        To: data.settings.secondaryCurrency || "",
        Rate: "",
        "As of": "",
        Note: `No rates yet. ${FX_BOOKS_DISCLAIMER}`,
      },
    ];
  }
  return rates.map((r) => ({
    From: r.from,
    To: r.to,
    Rate: r.rate,
    "As of": r.asOf,
    Note: FX_BOOKS_DISCLAIMER,
  }));
}

export type FxDocRow = {
  kind: string;
  number: string;
  date: string;
  party: string;
  homeCents: number;
  secondaryCents: number;
  rate: number;
  found: boolean;
};

export function fxDocumentRows(data: FinanceData, asOf?: string): FxDocRow[] {
  const home = (data.settings.currency || "").toUpperCase();
  const secondary = (data.settings.secondaryCurrency || "").toUpperCase();
  const rates = data.settings.fxRates ?? [];
  const cust = new Map((data.customers ?? []).map((c) => [c.id, c.name]));
  const vend = new Map((data.vendors ?? []).map((v) => [v.id, v.name]));
  const rows: FxDocRow[] = [];
  const push = (kind: string, number: string, date: string, party: string, homeCents: number) => {
    if (asOf && date && date > asOf) return;
    const conv = convertCents(homeCents, home, secondary, rates, asOf || date);
    rows.push({
      kind,
      number,
      date,
      party,
      homeCents,
      secondaryCents: conv.cents,
      rate: conv.rate,
      found: conv.found,
    });
  };
  for (const inv of data.invoices ?? []) {
    if (inv.status === "void") continue;
    const sub = invoiceSubtotal(inv.lines);
    push("Invoice", inv.number, inv.date, cust.get(inv.customerId) || "", sub + invoiceTax(sub, inv.taxRate, inv.taxRate > 0));
  }
  for (const bill of data.bills ?? []) {
    if (bill.status === "void") continue;
    push("Bill", bill.number, bill.date, vend.get(bill.vendorId) || "", bill.amount);
  }
  for (const rec of data.receipts ?? []) {
    if (rec.status === "void") continue;
    push("Receipt", rec.number, rec.date, rec.receivedFrom || cust.get(rec.customerId || "") || "", rec.amount);
  }
  for (const chk of data.checks ?? []) {
    if (chk.status === "voided" || chk.status === "bounced") continue;
    push("Check", chk.checkNumber, chk.postDate || chk.issueDate, chk.payee, chk.amount);
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
}

export function fxDocumentCsvRows(data: FinanceData, asOf?: string): Array<Record<string, string | number>> {
  const home = data.settings.currency || "HOME";
  const secondary = data.settings.secondaryCurrency || "SECONDARY";
  return fxDocumentRows(data, asOf).map((r) => ({
    Type: r.kind,
    No: r.number,
    Date: r.date,
    Party: r.party,
    [`${home} amount`]: r.homeCents / 100,
    [`${secondary} amount`]: r.secondaryCents / 100,
    Rate: r.found ? r.rate : "",
    Converted: r.found ? "yes" : "no rate",
    Note: FX_BOOKS_DISCLAIMER,
  }));
}
