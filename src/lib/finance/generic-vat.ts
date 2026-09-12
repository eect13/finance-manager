import { vatBalances } from "./ledger";
import type { FinanceData } from "./types";

/**
 * Country-agnostic VAT/GST workbook: rates + input/output + monthly journal buckets.
 * Not a substitute for a VAT/GST return.
 */
export const VAT_BOOKS_DISCLAIMER =
  "For books / accountant — not a substitute for a VAT/GST return or e-file.";

export type VatMonthRow = {
  period: string;
  output: number;
  input: number;
  net: number;
};

export type VatWorkbook = {
  taxEnabled: boolean;
  rate: number;
  currency: string;
  input: number;
  output: number;
  netPayable: number;
  months: VatMonthRow[];
};

export function vatMonthlyRows(data: FinanceData, asOf?: string): VatMonthRow[] {
  const inputId = data.accounts.find((a) => a.code === "1300")?.id;
  const outputId = data.accounts.find((a) => a.code === "2200")?.id;
  const by = new Map<string, { output: number; input: number }>();
  for (const j of data.journals) {
    if (asOf && j.date > asOf) continue;
    const period = (j.date || "").slice(0, 7);
    if (!period) continue;
    for (const line of j.lines) {
      if (outputId && line.accountId === outputId) {
        const cur = by.get(period) ?? { output: 0, input: 0 };
        cur.output += line.credit - line.debit;
        by.set(period, cur);
      }
      if (inputId && line.accountId === inputId) {
        const cur = by.get(period) ?? { output: 0, input: 0 };
        cur.input += line.debit - line.credit;
        by.set(period, cur);
      }
    }
  }
  return [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      output: v.output,
      input: v.input,
      net: v.output - v.input,
    }));
}

export function vatWorkbook(data: FinanceData, asOf?: string): VatWorkbook {
  const vat = vatBalances(data, asOf);
  return {
    taxEnabled: data.settings.taxEnabled === true,
    rate: Number(data.settings.defaultTaxRate) || 0,
    currency: data.settings.currency || "",
    input: vat.input,
    output: vat.output,
    netPayable: vat.netPayable,
    months: vatMonthlyRows(data, asOf),
  };
}

export function genericVatCsvRows(data: FinanceData, asOf?: string): Array<Record<string, string | number>> {
  const w = vatWorkbook(data, asOf);
  const rows: Array<Record<string, string | number>> = [
    {
      "As of": asOf || "",
      Section: "Rate",
      Item: "Default VAT/GST %",
      Amount: w.rate,
      Note: w.taxEnabled ? VAT_BOOKS_DISCLAIMER : `Sales tax is off. ${VAT_BOOKS_DISCLAIMER}`,
    },
    {
      "As of": asOf || "",
      Section: "Balances",
      Item: "Output VAT/GST (2200)",
      Amount: w.output / 100,
      Note: VAT_BOOKS_DISCLAIMER,
    },
    {
      "As of": asOf || "",
      Section: "Balances",
      Item: "Input VAT/GST (1300)",
      Amount: w.input / 100,
      Note: VAT_BOOKS_DISCLAIMER,
    },
    {
      "As of": asOf || "",
      Section: "Balances",
      Item: "Net VAT/GST payable",
      Amount: w.netPayable / 100,
      Note: VAT_BOOKS_DISCLAIMER,
    },
  ];
  for (const m of w.months) {
    rows.push({
      "As of": asOf || "",
      Section: "Month",
      Item: m.period,
      Amount: m.net / 100,
      Note: `Output ${m.output / 100} − input ${m.input / 100}. ${VAT_BOOKS_DISCLAIMER}`,
    });
  }
  return rows;
}

export function genericVatMonthlyCsvRows(data: FinanceData, asOf?: string): Array<Record<string, string | number>> {
  return vatMonthlyRows(data, asOf).map((m) => ({
    Period: m.period,
    "Output VAT/GST": m.output / 100,
    "Input VAT/GST": m.input / 100,
    Net: m.net / 100,
    Rate: data.settings.defaultTaxRate,
    Note: VAT_BOOKS_DISCLAIMER,
  }));
}
