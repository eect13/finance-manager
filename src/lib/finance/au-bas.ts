import { vatBalances } from "./ledger";
import { accountBalanceByCode, wageBasesForBooks, type WageBasis } from "./payroll-posts";
import type { FinanceData } from "./types";

/**
 * Australia PAYG withholding + BAS-style GST remittance stub.
 * Illustrative 2025–26 resident rates — not ATO BAS / STP.
 */
export const AU_BOOKS_DISCLAIMER =
  "Estimate for books / accountant — not a substitute for ATO BAS, STP, or PAYG filing.";

const AU_BRACKETS: Array<[cap: number, rate: number]> = [
  [1_820_000, 0],
  [4_500_000, 0.16],
  [13_500_000, 0.3],
  [19_000_000, 0.37],
  [Number.POSITIVE_INFINITY, 0.45],
];
export const AU_MEDICARE_LEVY = 0.02;

export type AuPaygParts = {
  annual: number;
  payg: number;
  medicare: number;
  totalWithheld: number;
};

export function computeAuPayg(annualCents: number): AuPaygParts {
  const annual = Math.max(0, Math.round(annualCents));
  let remaining = annual;
  let last = 0;
  let payg = 0;
  for (const [cap, rate] of AU_BRACKETS) {
    const slice = Math.min(remaining, cap - last);
    if (slice > 0) {
      payg += Math.round(slice * rate);
      remaining -= slice;
    }
    last = cap;
    if (remaining <= 0) break;
  }
  const medicare = Math.round(annual * AU_MEDICARE_LEVY);
  return { annual, payg, medicare, totalWithheld: payg + medicare };
}

export type AuPaygRow = WageBasis & AuPaygParts;

export function auPaygRows(data: FinanceData, year: number, asOf?: string): AuPaygRow[] {
  return wageBasesForBooks(data, year, asOf).map((w) => ({ ...w, ...computeAuPayg(w.annualized) }));
}

export type AuBasSummary = {
  gstOnSales: number;
  gstOnPurchases: number;
  netGst: number;
  paygEstimate: number;
  postedWithholdings: number;
  remittance: number;
  employees: AuPaygRow[];
};

export function auBasSummary(data: FinanceData, year: number, asOf?: string): AuBasSummary {
  const vat = vatBalances(data, asOf);
  const employees = auPaygRows(data, year, asOf);
  const paygEstimate = employees.reduce((s, r) => s + r.totalWithheld, 0);
  const postedWithholdings = accountBalanceByCode(data, "2210", asOf);
  return {
    gstOnSales: vat.output,
    gstOnPurchases: vat.input,
    netGst: vat.netPayable,
    paygEstimate,
    postedWithholdings,
    remittance: vat.netPayable + paygEstimate,
    employees,
  };
}

export function auBasCsvRows(data: FinanceData, year: number, asOf?: string): Array<Record<string, string | number>> {
  const s = auBasSummary(data, year, asOf);
  const rows: Array<Record<string, string | number>> = [
    {
      Year: year,
      Section: "BAS",
      Item: "GST on sales (1A / output 2200)",
      Amount: s.gstOnSales / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
    {
      Year: year,
      Section: "BAS",
      Item: "GST on purchases (1B / input 1300)",
      Amount: s.gstOnPurchases / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
    {
      Year: year,
      Section: "BAS",
      Item: "Net GST",
      Amount: s.netGst / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
    {
      Year: year,
      Section: "BAS",
      Item: "PAYG withheld estimate (W1-style)",
      Amount: s.paygEstimate / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
    {
      Year: year,
      Section: "BAS",
      Item: "Posted other withholdings (2210)",
      Amount: s.postedWithholdings / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
    {
      Year: year,
      Section: "BAS",
      Item: "Suggested remittance (net GST + PAYG estimate)",
      Amount: s.remittance / 100,
      Note: AU_BOOKS_DISCLAIMER,
    },
  ];
  for (const e of s.employees) {
    rows.push({
      Year: year,
      Section: "PAYG",
      Item: e.name,
      Amount: e.totalWithheld / 100,
      Note: `${e.note} — ${AU_BOOKS_DISCLAIMER}`,
    });
  }
  return rows;
}

export function auPaygCsvRows(data: FinanceData, year: number, asOf?: string): Array<Record<string, string | number>> {
  return auPaygRows(data, year, asOf).map((r) => ({
    Year: year,
    Employee: r.name,
    "YTD / basis wages": r.ytdGross / 100,
    Annualized: r.annual / 100,
    "PAYG estimate": r.payg / 100,
    "Medicare levy 2%": r.medicare / 100,
    "Total withheld estimate": r.totalWithheld / 100,
    Basis: r.note,
    Note: AU_BOOKS_DISCLAIMER,
  }));
}
