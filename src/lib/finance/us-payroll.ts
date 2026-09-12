import { employeeWageBasis, wageBasesForBooks, type WageBasis } from "./payroll-posts";
import type { FinanceData } from "./types";

/**
 * Practical US FIT + FICA stub for books / accountant.
 * Illustrative 2026 placeholder rates — not Pub 15-T, not a substitute for IRS e-file / W-2 / 941.
 */
export const US_BOOKS_DISCLAIMER =
  "Estimate for books / accountant — not a substitute for IRS e-file, Form W-2, or Form 941.";

/** SSA 2026 Social Security wage base (cents). */
export const US_SS_WAGE_BASE = 18_450_000;
export const US_SS_RATE = 0.062;
export const US_MEDICARE_RATE = 0.0145;
export const US_ADDL_MEDICARE_RATE = 0.009;
export const US_ADDL_MEDICARE_THRESHOLD = 20_000_000;
/** Single-filer standard deduction stub (cents). Confirm current IRS amount. */
export const US_STD_DEDUCTION_SINGLE = 1_575_000;

/** Taxable-income caps (cents) and rates — 2025 single-style brackets used as a 2026 stub. */
const FIT_BRACKETS: Array<[cap: number, rate: number]> = [
  [1_192_500, 0.1],
  [4_847_500, 0.12],
  [10_335_000, 0.22],
  [19_730_000, 0.24],
  [25_052_500, 0.32],
  [62_635_000, 0.35],
  [Number.POSITIVE_INFINITY, 0.37],
];

export function taxOnBrackets(taxableCents: number, brackets: Array<[number, number]> = FIT_BRACKETS): number {
  let remaining = Math.max(0, Math.round(taxableCents));
  let last = 0;
  let tax = 0;
  for (const [cap, rate] of brackets) {
    const slice = Math.min(remaining, cap - last);
    if (slice > 0) {
      tax += Math.round(slice * rate);
      remaining -= slice;
    }
    last = cap;
    if (remaining <= 0) break;
  }
  return tax;
}

export type UsPayrollParts = {
  wages: number;
  ssWages: number;
  medicareWages: number;
  ssEe: number;
  ssEr: number;
  medicareEe: number;
  medicareEr: number;
  additionalMedicare: number;
  fit: number;
  eeTotal: number;
  erTotal: number;
};

export function computeUsPayroll(annualWagesCents: number): UsPayrollParts {
  const wages = Math.max(0, Math.round(annualWagesCents));
  const ssWages = Math.min(wages, US_SS_WAGE_BASE);
  const medicareWages = wages;
  const ssEe = Math.round(ssWages * US_SS_RATE);
  const ssEr = ssEe;
  const medicareEe = Math.round(medicareWages * US_MEDICARE_RATE);
  const medicareEr = medicareEe;
  const additionalMedicare =
    wages > US_ADDL_MEDICARE_THRESHOLD ? Math.round((wages - US_ADDL_MEDICARE_THRESHOLD) * US_ADDL_MEDICARE_RATE) : 0;
  const taxable = Math.max(0, wages - US_STD_DEDUCTION_SINGLE);
  const fit = taxOnBrackets(taxable);
  return {
    wages,
    ssWages,
    medicareWages,
    ssEe,
    ssEr,
    medicareEe,
    medicareEr,
    additionalMedicare,
    fit,
    eeTotal: fit + ssEe + medicareEe + additionalMedicare,
    erTotal: ssEr + medicareEr,
  };
}

export type UsW2Row = WageBasis & UsPayrollParts;

export function usW2Rows(data: FinanceData, year: number, asOf?: string): UsW2Row[] {
  return wageBasesForBooks(data, year, asOf).map((w) => {
    // W-2 style: apply annual tables to YTD wages (SS wage base is annual).
    const parts = computeUsPayroll(w.ytdGross);
    return { ...w, ...parts };
  });
}

export function usW2CsvRows(data: FinanceData, year: number, asOf?: string): Array<Record<string, string | number>> {
  return usW2Rows(data, year, asOf).map((r) => ({
    Year: year,
    Employee: r.name,
    "Hire date": r.hireDate,
    "Months counted": r.monthsCounted,
    "Wages (box 1)": r.wages / 100,
    "SS wages (box 3)": r.ssWages / 100,
    "SS tax (box 4)": r.ssEe / 100,
    "Medicare wages (box 5)": r.medicareWages / 100,
    "Medicare tax (box 6)": (r.medicareEe + r.additionalMedicare) / 100,
    "FIT estimate (box 2)": r.fit / 100,
    "EE FICA + FIT": r.eeTotal / 100,
    "ER FICA": r.erTotal / 100,
    Basis: r.note,
    Note: US_BOOKS_DISCLAIMER,
  }));
}

export function usWithholdingSummary(data: FinanceData, year: number, asOf?: string) {
  const rows = usW2Rows(data, year, asOf);
  const sum = (fn: (r: UsW2Row) => number) => rows.reduce((s, r) => s + fn(r), 0);
  return {
    employees: rows.length,
    wages: sum((r) => r.wages),
    fit: sum((r) => r.fit),
    ssEe: sum((r) => r.ssEe),
    medicareEe: sum((r) => r.medicareEe + r.additionalMedicare),
    eeTotal: sum((r) => r.eeTotal),
    erTotal: sum((r) => r.erTotal),
    rows,
  };
}

export function employeeWageBasisForUs(data: FinanceData, employeeId: string, year: number, asOf?: string) {
  const emp = (data.employees ?? []).find((e) => e.id === employeeId);
  return emp ? employeeWageBasis(data, emp, year, asOf) : null;
}
