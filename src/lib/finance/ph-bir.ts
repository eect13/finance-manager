import { vatBalances } from "./ledger";
import { PH_PAYROLL_CODES } from "./ph-payroll";
import type { Employee, FinanceData, JournalEntry } from "./types";

/**
 * Practical PH payroll / VAT helpers for the books and accountant.
 * Not a substitute for BIR eFiling, eBIRForms, or full TRAIN year-end annualization.
 */

export const BIR_BOOKS_DISCLAIMER =
  "For books / accountant — not a substitute for BIR eFiling.";

export type ThirteenthMonthRow = {
  employeeId: string;
  name: string;
  hireDate: string;
  year: number;
  monthsCounted: number;
  /** Basic salary used for the estimate (monthly rate for salary; 0 for hourly without posts). */
  monthlyBasic: number;
  /** Gross basic posted on paychecks in the calendar year (cents), when available. */
  postedGross: number;
  /** Estimated 13th-month pay in cents. */
  estimate: number;
  source: "posted" | "pro-rata-rate" | "none";
  note: string;
};

function yearBounds(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || "").trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/**
 * Inclusive calendar months from start through end within the year.
 * Hire on any day of a month counts that month (common small-business pro-rata).
 */
export function monthsWorkedInYear(hireDate: string, year: number, asOf?: string): number {
  const { from, to } = yearBounds(year);
  const endIso = !asOf || asOf > to ? to : asOf < from ? from : asOf;
  const hire = parseIso(hireDate && hireDate >= from ? hireDate : from);
  const end = parseIso(endIso);
  if (!hire || !end) return 0;
  if (end.y < year || hire.y > year) return 0;
  const startMonth = hire.y === year ? hire.m : 1;
  const endMonth = end.y === year ? end.m : 12;
  if (endMonth < startMonth) return 0;
  return endMonth - startMonth + 1;
}

function accountIdByCode(data: FinanceData, code: string): string | undefined {
  return data.accounts.find((a) => a.code === code)?.id;
}

function paycheckJournal(data: FinanceData, checkId: string, journalId: string): JournalEntry | undefined {
  return data.journals.find((j) => j.id === journalId && j.sourceType === "check" && j.sourceId === checkId);
}

/** Gross basic + statutory line credits on one posted employee paycheck. */
export function paycheckStatutoryParts(data: FinanceData, check: { id: string; journalId: string; employeeId?: string }) {
  const journal = paycheckJournal(data, check.id, check.journalId);
  const zero = { gross: 0, sssEeEr: 0, phil: 0, pag: 0, wht: 0, other: 0, employer: 0 };
  if (!journal) return zero;
  const id = (code: string) => accountIdByCode(data, code);
  const payrollId = id("5300");
  const sssId = id(PH_PAYROLL_CODES.sss);
  const philId = id(PH_PAYROLL_CODES.philhealth);
  const pagId = id(PH_PAYROLL_CODES.pagibig);
  const whtId = id(PH_PAYROLL_CODES.wht);
  const otherId = id(PH_PAYROLL_CODES.other);
  const erId = id(PH_PAYROLL_CODES.employer);
  let gross = 0;
  let sssEeEr = 0;
  let phil = 0;
  let pag = 0;
  let wht = 0;
  let other = 0;
  let employer = 0;
  for (const line of journal.lines) {
    if (payrollId && line.accountId === payrollId) gross += line.debit;
    if (sssId && line.accountId === sssId) sssEeEr += line.credit;
    if (philId && line.accountId === philId) phil += line.credit;
    if (pagId && line.accountId === pagId) pag += line.credit;
    if (whtId && line.accountId === whtId) wht += line.credit;
    if (otherId && line.accountId === otherId) other += line.credit;
    if (erId && line.accountId === erId) employer += line.debit;
  }
  return { gross, sssEeEr, phil, pag, wht, other, employer };
}

function postedGrossInYear(data: FinanceData, employeeId: string, year: number): number {
  const { from, to } = yearBounds(year);
  let total = 0;
  for (const check of data.checks ?? []) {
    if (check.employeeId !== employeeId) continue;
    const date = check.postDate || check.issueDate;
    if (!date || date < from || date > to) continue;
    if (check.status === "voided" || check.status === "bounced") continue;
    total += paycheckStatutoryParts(data, check).gross;
  }
  return total;
}

/**
 * Estimate 13th-month pay (PD 851 style) for one employee.
 *
 * Assumptions (shown in UI):
 * - Basic salary only (this app’s paycheck gross on 5300). Not OT, allowances, or bonuses.
 * - Prefer posted paycheck gross in the calendar year ÷ 12.
 * - Else for salaried staff: monthly rate × months worked in year ÷ 12.
 * - Months worked: inclusive from hire (or Jan 1) through as-of (or Dec 31); any day in a month counts.
 * - Hourly without posted slips: no estimate.
 * - Does not apply the ₱90,000 fringe benefit exclusion or year-end annualization.
 */
export function estimate13thMonth(
  data: FinanceData,
  employee: Employee,
  year: number,
  asOf?: string,
): ThirteenthMonthRow {
  const monthsCounted = monthsWorkedInYear(employee.hireDate || `${year}-01-01`, year, asOf);
  const postedGross = postedGrossInYear(data, employee.id, year);
  if (postedGross > 0) {
    const estimate = Math.round(postedGross / 12);
    return {
      employeeId: employee.id,
      name: employee.name,
      hireDate: employee.hireDate || "",
      year,
      monthsCounted,
      monthlyBasic: employee.payType === "salary" ? employee.rate : 0,
      postedGross,
      estimate,
      source: "posted",
      note: "Posted paycheck gross ÷ 12",
    };
  }
  if (employee.payType === "salary" && employee.rate > 0 && monthsCounted > 0) {
    const estimate = Math.round((employee.rate * monthsCounted) / 12);
    return {
      employeeId: employee.id,
      name: employee.name,
      hireDate: employee.hireDate || "",
      year,
      monthsCounted,
      monthlyBasic: employee.rate,
      postedGross: 0,
      estimate,
      source: "pro-rata-rate",
      note: `${monthsCounted}/12 × monthly rate`,
    };
  }
  return {
    employeeId: employee.id,
    name: employee.name,
    hireDate: employee.hireDate || "",
    year,
    monthsCounted,
    monthlyBasic: employee.payType === "salary" ? employee.rate : 0,
    postedGross: 0,
    estimate: 0,
    source: "none",
    note: employee.payType === "hourly" ? "Hourly — post paychecks first" : "No rate / not yet hired",
  };
}

export function thirteenthMonthEstimates(
  data: FinanceData,
  year: number,
  asOf?: string,
): ThirteenthMonthRow[] {
  return [...(data.employees ?? [])]
    .filter((e) => e.active || postedGrossInYear(data, e.id, year) > 0)
    .map((e) => estimate13thMonth(data, e, year, asOf))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function thirteenthMonthCsvRows(
  data: FinanceData,
  year: number,
  asOf?: string,
): Array<Record<string, string | number>> {
  return thirteenthMonthEstimates(data, year, asOf).map((r) => ({
    Year: r.year,
    Employee: r.name,
    "Hire date": r.hireDate,
    "Months counted": r.monthsCounted,
    "Monthly basic": r.monthlyBasic / 100,
    "Posted gross YTD": r.postedGross / 100,
    "13th month estimate": r.estimate / 100,
    Basis: r.note,
    Note: BIR_BOOKS_DISCLAIMER,
  }));
}

/** 1601-C style remittance lines from posted employee withholdings (not eBIRForms XML). */
export function withholding1601cRows(
  data: FinanceData,
  from: string,
  to: string,
): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];
  const checks = [...(data.checks ?? [])]
    .filter((c) => c.employeeId)
    .filter((c) => {
      const date = c.postDate || c.issueDate;
      return date && date >= from && date <= to && c.status !== "voided" && c.status !== "bounced";
    })
    .sort((a, b) => (a.postDate || a.issueDate).localeCompare(b.postDate || b.issueDate) || a.id.localeCompare(b.id));

  for (const check of checks) {
    const emp = (data.employees ?? []).find((e) => e.id === check.employeeId);
    const parts = paycheckStatutoryParts(data, check);
    const date = check.postDate || check.issueDate;
    const period = date.slice(0, 7);
    rows.push({
      Period: period,
      Date: date,
      Employee: emp?.name ?? check.payee,
      "Check #": check.checkNumber,
      "Gross pay": parts.gross / 100,
      "WHT (2214)": parts.wht / 100,
      "SSS payable (2211)": parts.sssEeEr / 100,
      "PhilHealth (2212)": parts.phil / 100,
      "Pag-IBIG (2213)": parts.pag / 100,
      "Other (2210)": parts.other / 100,
      "Employer cost (5310)": parts.employer / 100,
      "Net check": check.amount / 100,
      Note: BIR_BOOKS_DISCLAIMER,
    });
  }
  return rows;
}

/** Monthly WHT totals for a compact remittance summary. */
export function withholding1601cMonthlySummary(
  data: FinanceData,
  from: string,
  to: string,
): Array<Record<string, string | number>> {
  const byPeriod = new Map<string, { gross: number; wht: number; count: number }>();
  for (const row of withholding1601cRows(data, from, to)) {
    const period = String(row.Period);
    const cur = byPeriod.get(period) ?? { gross: 0, wht: 0, count: 0 };
    cur.gross += Number(row["Gross pay"]) || 0;
    cur.wht += Number(row["WHT (2214)"]) || 0;
    cur.count += 1;
    byPeriod.set(period, cur);
  }
  return [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      Period: period,
      "Paychecks": v.count,
      "Gross pay": Math.round(v.gross * 100) / 100,
      "WHT (2214)": Math.round(v.wht * 100) / 100,
      Note: BIR_BOOKS_DISCLAIMER,
    }));
}

export function vatSummaryRows(
  data: FinanceData,
  asOf?: string,
): Array<Record<string, string | number>> {
  const vat = vatBalances(data, asOf);
  return [
    {
      "As of": asOf || "",
      Account: "Output VAT Payable (2200)",
      Balance: vat.output / 100,
      Note: BIR_BOOKS_DISCLAIMER,
    },
    {
      "As of": asOf || "",
      Account: "Input VAT Receivable (1300)",
      Balance: vat.input / 100,
      Note: BIR_BOOKS_DISCLAIMER,
    },
    {
      "As of": asOf || "",
      Account: "Net VAT payable",
      Balance: vat.netPayable / 100,
      Note: BIR_BOOKS_DISCLAIMER,
    },
  ];
}
