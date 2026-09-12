import { monthlyFromPeriod, periodShare } from "./ph-payroll";
import { postedEmployeePays, wageBasesForBooks } from "./payroll-posts";
import type { FinanceData, PayPeriod } from "./types";

/**
 * Singapore CPF employee/employer estimate stub.
 * Illustrative rates (age ≤55, ordinary wages) — not CPF Board filing.
 */
export const SG_BOOKS_DISCLAIMER =
  "Estimate for books / accountant — not a substitute for CPF Board filing.";

/** Ordinary wage ceiling per month (cents). 2026 stub. */
export const SG_OW_CEILING_MONTHLY = 800_000;
export const SG_EE_RATE = 0.2;
export const SG_ER_RATE = 0.17;

export type SgCpfParts = {
  ordinaryWage: number;
  ee: number;
  er: number;
  total: number;
};

export function computeSgCpf(monthlyOrdinaryCents: number): SgCpfParts {
  const ordinaryWage = Math.min(SG_OW_CEILING_MONTHLY, Math.max(0, Math.round(monthlyOrdinaryCents)));
  const ee = Math.round(ordinaryWage * SG_EE_RATE);
  const er = Math.round(ordinaryWage * SG_ER_RATE);
  return { ordinaryWage, ee, er, total: ee + er };
}

export function computeSgCpfForPeriod(grossCents: number, period: PayPeriod): SgCpfParts {
  const monthly = monthlyFromPeriod(grossCents, period);
  const monthlyParts = computeSgCpf(monthly);
  return {
    ordinaryWage: periodShare(monthlyParts.ordinaryWage, period),
    ee: periodShare(monthlyParts.ee, period),
    er: periodShare(monthlyParts.er, period),
    total: periodShare(monthlyParts.total, period),
  };
}

export type SgCpfRow = {
  employeeId: string;
  name: string;
  ytdGross: number;
  ordinaryWage: number;
  ee: number;
  er: number;
  total: number;
  source: string;
  note: string;
};

export function sgCpfRows(data: FinanceData, year: number, asOf?: string): SgCpfRow[] {
  const from = `${year}-01-01`;
  const to = asOf && asOf.startsWith(String(year)) ? asOf : `${year}-12-31`;
  const pays = postedEmployeePays(data, from, to);
  const empById = new Map((data.employees ?? []).map((e) => [e.id, e]));
  const fromPosts = new Map<string, SgCpfRow>();
  for (const pay of pays) {
    const emp = empById.get(pay.employeeId);
    const period = emp?.payPeriod ?? "monthly";
    const parts = computeSgCpfForPeriod(pay.gross, period);
    const cur = fromPosts.get(pay.employeeId) ?? {
      employeeId: pay.employeeId,
      name: pay.name,
      ytdGross: 0,
      ordinaryWage: 0,
      ee: 0,
      er: 0,
      total: 0,
      source: "posted",
      note: "From posted salary",
    };
    cur.ytdGross += pay.gross;
    cur.ordinaryWage += parts.ordinaryWage;
    cur.ee += parts.ee;
    cur.er += parts.er;
    cur.total += parts.total;
    fromPosts.set(pay.employeeId, cur);
  }
  const rows: SgCpfRow[] = [];
  for (const w of wageBasesForBooks(data, year, asOf)) {
    const posted = fromPosts.get(w.employeeId);
    if (posted) {
      rows.push(posted);
      continue;
    }
    const emp = empById.get(w.employeeId);
    if (!emp || emp.payType !== "salary" || emp.rate <= 0) {
      rows.push({
        employeeId: w.employeeId,
        name: w.name,
        ytdGross: 0,
        ordinaryWage: 0,
        ee: 0,
        er: 0,
        total: 0,
        source: "none",
        note: w.note,
      });
      continue;
    }
    const monthly = computeSgCpf(emp.rate);
    rows.push({
      employeeId: w.employeeId,
      name: w.name,
      ytdGross: w.ytdGross,
      ordinaryWage: monthly.ordinaryWage * w.monthsCounted,
      ee: monthly.ee * w.monthsCounted,
      er: monthly.er * w.monthsCounted,
      total: monthly.total * w.monthsCounted,
      source: "salary-rate",
      note: w.note,
    });
  }
  return rows;
}

export function sgCpfCsvRows(data: FinanceData, year: number, asOf?: string): Array<Record<string, string | number>> {
  return sgCpfRows(data, year, asOf).map((r) => ({
    Year: year,
    Employee: r.name,
    "YTD ordinary wages": r.ytdGross / 100,
    "OW (capped)": r.ordinaryWage / 100,
    "Employee CPF (20%)": r.ee / 100,
    "Employer CPF (17%)": r.er / 100,
    "Total CPF": r.total / 100,
    Basis: r.note,
    Note: SG_BOOKS_DISCLAIMER,
  }));
}
