import { wageBasesForBooks, type WageBasis } from "./payroll-posts";
import type { FinanceData } from "./types";

/**
 * UK PAYE + Class 1 NI estimate stub.
 * Illustrative 2026/27-style bands — not RTI / HMRC filing.
 */
export const UK_BOOKS_DISCLAIMER =
  "Estimate for books / accountant — not a substitute for HMRC PAYE / RTI or NI filing.";

export const UK_PERSONAL_ALLOWANCE = 1_257_000;
export const UK_BASIC_BAND = 3_770_000;
export const UK_HIGHER_LIMIT = 12_514_000;
export const UK_NI_PT = 1_257_000;
export const UK_NI_UEL = 5_027_000;
export const UK_NI_ST = 910_000;
export const UK_NI_EE_MAIN = 0.08;
export const UK_NI_EE_UPPER = 0.02;
export const UK_NI_ER = 0.138;

export type UkPayeParts = {
  annual: number;
  taxable: number;
  paye: number;
  niEe: number;
  niEr: number;
  eeTotal: number;
};

export function computeUkPaye(annualCents: number): UkPayeParts {
  const annual = Math.max(0, Math.round(annualCents));
  const taxable = Math.max(0, annual - UK_PERSONAL_ALLOWANCE);
  const basicCap = UK_BASIC_BAND;
  const higherCap = Math.max(0, UK_HIGHER_LIMIT - UK_PERSONAL_ALLOWANCE);
  let paye = 0;
  if (taxable > 0) {
    const basic = Math.min(taxable, basicCap);
    paye += Math.round(basic * 0.2);
    const higher = Math.min(Math.max(0, taxable - basicCap), Math.max(0, higherCap - basicCap));
    paye += Math.round(higher * 0.4);
    const addl = Math.max(0, taxable - higherCap);
    paye += Math.round(addl * 0.45);
  }
  const niMain = Math.max(0, Math.min(annual, UK_NI_UEL) - UK_NI_PT);
  const niUpper = Math.max(0, annual - UK_NI_UEL);
  const niEe = Math.round(niMain * UK_NI_EE_MAIN) + Math.round(niUpper * UK_NI_EE_UPPER);
  const niErBase = Math.max(0, annual - UK_NI_ST);
  const niEr = Math.round(niErBase * UK_NI_ER);
  return { annual, taxable, paye, niEe, niEr, eeTotal: paye + niEe };
}

export type UkPayeRow = WageBasis & UkPayeParts;

export function ukPayeRows(data: FinanceData, year: number, asOf?: string): UkPayeRow[] {
  return wageBasesForBooks(data, year, asOf).map((w) => ({ ...w, ...computeUkPaye(w.annualized) }));
}

export function ukPayeCsvRows(data: FinanceData, year: number, asOf?: string): Array<Record<string, string | number>> {
  return ukPayeRows(data, year, asOf).map((r) => ({
    Year: year,
    Employee: r.name,
    "YTD / basis wages": r.ytdGross / 100,
    "Annualized": r.annual / 100,
    "PAYE estimate": r.paye / 100,
    "NI employee": r.niEe / 100,
    "NI employer": r.niEr / 100,
    "EE PAYE + NI": r.eeTotal / 100,
    Basis: r.note,
    Note: UK_BOOKS_DISCLAIMER,
  }));
}
