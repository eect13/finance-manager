import type { FinanceData, PayPeriod } from "./types";
import { accountBalance } from "./ledger";

/** 2026 PH statutory tables (SSS Circular 2024-006 / RA 11199, PhilHealth 5%, HDMF Circular 460, TRAIN Annex E). Not a filing engine. */

export const PH_PAYROLL_CODES = {
  sss: "2211",
  philhealth: "2212",
  pagibig: "2213",
  wht: "2214",
  other: "2210",
  employer: "5310",
} as const;

export type PhPayrollParts = {
  monthlyGross: number;
  sssEe: number;
  sssEr: number;
  sssEc: number;
  philEe: number;
  philEr: number;
  pagEe: number;
  pagEr: number;
  bir: number;
  extra: number;
  net: number;
  employerCost: number;
  employeeDeduct: number;
};

const ZERO: PhPayrollParts = {
  monthlyGross: 0,
  sssEe: 0,
  sssEr: 0,
  sssEc: 0,
  philEe: 0,
  philEr: 0,
  pagEe: 0,
  pagEr: 0,
  bir: 0,
  extra: 0,
  net: 0,
  employerCost: 0,
  employeeDeduct: 0,
};

export function periodShare(monthlyCents: number, period: PayPeriod): number {
  const m = Math.max(0, Math.round(monthlyCents));
  if (period === "weekly") return Math.round((m * 12) / 52);
  if (period === "biweekly") return Math.round((m * 12) / 26);
  if (period === "semimonthly") return Math.round(m / 2);
  return m;
}

export function monthlyFromPeriod(periodCents: number, period: PayPeriod): number {
  const p = Math.max(0, Math.round(periodCents));
  if (period === "weekly") return Math.round((p * 52) / 12);
  if (period === "biweekly") return Math.round((p * 26) / 12);
  if (period === "semimonthly") return p * 2;
  return p;
}

/** Salary paycheck for this period (hourly is 0 — hours are entered on the slip). */
export function periodPayAmount(rateCents: number, period: PayPeriod, payType: "salary" | "hourly"): number {
  if (payType === "hourly") return 0;
  return periodShare(rateCents, period);
}

/** SSS MSC in cents. Compensation maps to ₱500 brackets, floor ₱5,000, ceiling ₱35,000. */
export function sssMscCents(monthlyCents: number): number {
  const pesos = monthlyCents / 100;
  if (pesos < 5250) return 500_000;
  if (pesos >= 34750) return 3_500_000;
  return (Math.floor((pesos - 250) / 500) * 500 + 500) * 100;
}

function sssMonthly(monthlyCents: number): { ee: number; er: number; ec: number } {
  const msc = sssMscCents(monthlyCents);
  return {
    ee: Math.round(msc * 0.05),
    er: Math.round(msc * 0.1),
    ec: msc >= 1_500_000 ? 3_000 : 1_000,
  };
}

function philMonthly(monthlyCents: number): { ee: number; er: number } {
  const base = Math.min(10_000_000, Math.max(1_000_000, Math.round(monthlyCents)));
  const half = Math.round(base * 0.025);
  return { ee: half, er: half };
}

function pagMonthly(monthlyCents: number): { ee: number; er: number } {
  const m = Math.max(0, Math.round(monthlyCents));
  if (m <= 150_000) {
    return { ee: Math.round(m * 0.01), er: Math.round(m * 0.02) };
  }
  const base = Math.min(m, 1_000_000);
  const share = Math.round(base * 0.02);
  return { ee: share, er: share };
}

/** TRAIN monthly withholding on taxable compensation (cents). */
export function birMonthlyCents(taxableCents: number): number {
  const t = Math.max(0, Math.round(taxableCents));
  if (t <= 2_083_300) return 0;
  if (t <= 3_333_300) return Math.round((t - 2_083_300) * 0.15);
  if (t <= 6_666_700) return 187_500 + Math.round((t - 3_333_300) * 0.2);
  if (t <= 16_666_700) return 854_180 + Math.round((t - 6_666_700) * 0.25);
  if (t <= 66_666_700) return 3_354_180 + Math.round((t - 16_666_700) * 0.3);
  return 18_354_180 + Math.round((t - 66_666_700) * 0.35);
}

function share(monthly: number, period: PayPeriod): number {
  return periodShare(monthly, period);
}

export function computePhPayroll(input: {
  gross: number;
  period: PayPeriod;
  statutory: boolean;
  extra?: number;
}): PhPayrollParts {
  const gross = Math.max(0, Math.round(Number(input.gross) || 0));
  const extra = Math.max(0, Math.round(Number(input.extra) || 0));
  const period = input.period;
  if (!input.statutory) {
    const net = gross - extra;
    return { ...ZERO, extra, net, employeeDeduct: extra };
  }
  const monthlyGross = monthlyFromPeriod(gross, period);
  const sss = sssMonthly(monthlyGross);
  const phil = philMonthly(monthlyGross);
  const pag = pagMonthly(monthlyGross);
  const sssEe = share(sss.ee, period);
  const sssEr = share(sss.er, period);
  const sssEc = share(sss.ec, period);
  const philEe = share(phil.ee, period);
  const philEr = share(phil.er, period);
  const pagEe = share(pag.ee, period);
  const pagEr = share(pag.er, period);
  const monthlyTaxable = Math.max(0, monthlyGross - sss.ee - phil.ee - pag.ee);
  const bir = share(birMonthlyCents(monthlyTaxable), period);
  const employeeDeduct = sssEe + philEe + pagEe + bir + extra;
  const net = gross - employeeDeduct;
  return {
    monthlyGross,
    sssEe,
    sssEr,
    sssEc,
    philEe,
    philEr,
    pagEe,
    pagEr,
    bir,
    extra,
    net,
    employerCost: sssEr + sssEc + philEr + pagEr,
    employeeDeduct,
  };
}

export function payrollRemittance(data: FinanceData, asOf?: string) {
  const bal = (code: string) => {
    const acct = data.accounts.find((a) => a.code === code);
    return acct ? accountBalance(data, acct.id, asOf) : 0;
  };
  return {
    sss: bal(PH_PAYROLL_CODES.sss),
    philhealth: bal(PH_PAYROLL_CODES.philhealth),
    pagibig: bal(PH_PAYROLL_CODES.pagibig),
    wht: bal(PH_PAYROLL_CODES.wht),
    other: bal(PH_PAYROLL_CODES.other),
    employer: bal(PH_PAYROLL_CODES.employer),
  };
}

export function remittanceIsEmpty(
  p: ReturnType<typeof payrollRemittance>,
): boolean {
  return p.sss === 0 && p.philhealth === 0 && p.pagibig === 0 && p.wht === 0 && p.other === 0 && p.employer === 0;
}

export type RosterStatutoryRow = {
  employeeId: string;
  name: string;
  period: PayPeriod;
  periodGross: number;
  monthlyGross: number;
  statutory: boolean;
  parts: PhPayrollParts;
};

export type RosterStatutoryEstimate = {
  rows: RosterStatutoryRow[];
  monthly: PhPayrollParts;
  period: PhPayrollParts;
  skippedHourly: number;
};

function addParts(a: PhPayrollParts, b: PhPayrollParts): PhPayrollParts {
  return {
    monthlyGross: a.monthlyGross + b.monthlyGross,
    sssEe: a.sssEe + b.sssEe,
    sssEr: a.sssEr + b.sssEr,
    sssEc: a.sssEc + b.sssEc,
    philEe: a.philEe + b.philEe,
    philEr: a.philEr + b.philEr,
    pagEe: a.pagEe + b.pagEe,
    pagEr: a.pagEr + b.pagEr,
    bir: a.bir + b.bir,
    extra: a.extra + b.extra,
    net: a.net + b.net,
    employerCost: a.employerCost + b.employerCost,
    employeeDeduct: a.employeeDeduct + b.employeeDeduct,
  };
}

/** Period statutory worksheet from the active salaried roster. Hourly staff need posted slips. */
export function rosterStatutoryEstimate(data: FinanceData): RosterStatutoryEstimate {
  const rows: RosterStatutoryRow[] = [];
  let monthly = { ...ZERO };
  let periodTotal = { ...ZERO };
  let skippedHourly = 0;
  const staff = [...(data.employees ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  for (const emp of staff) {
    if (!emp.active) continue;
    if (emp.payType === "hourly") {
      skippedHourly += 1;
      continue;
    }
    if (!emp.rate) continue;
    const statutory = emp.statutory !== false;
    const period = emp.payPeriod ?? "monthly";
    const periodGross = periodPayAmount(emp.rate, period, "salary");
    const parts = computePhPayroll({ gross: periodGross, period, statutory });
    const monthlyParts = computePhPayroll({ gross: emp.rate, period: "monthly", statutory });
    rows.push({
      employeeId: emp.id,
      name: emp.name,
      period,
      periodGross,
      monthlyGross: emp.rate,
      statutory,
      parts,
    });
    periodTotal = addParts(periodTotal, parts);
    monthly = addParts(monthly, monthlyParts);
  }
  return { rows, monthly, period: periodTotal, skippedHourly };
}

export function rosterStatutoryCsvRows(est: RosterStatutoryEstimate): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = est.rows.map((r) => ({
    Employee: r.name,
    Period: r.period,
    "Period gross": r.periodGross / 100,
    "SSS EE": r.parts.sssEe / 100,
    "PhilHealth EE": r.parts.philEe / 100,
    "Pag-IBIG EE": r.parts.pagEe / 100,
    WHT: r.parts.bir / 100,
    Net: r.parts.net / 100,
    "Employer cost": r.parts.employerCost / 100,
  }));
  rows.push({
    Employee: "Total (this period)",
    Period: "" as const,
    "Period gross": est.period.monthlyGross ? est.rows.reduce((s, r) => s + r.periodGross, 0) / 100 : 0,
    "SSS EE": est.period.sssEe / 100,
    "PhilHealth EE": est.period.philEe / 100,
    "Pag-IBIG EE": est.period.pagEe / 100,
    WHT: est.period.bir / 100,
    Net: est.period.net / 100,
    "Employer cost": est.period.employerCost / 100,
  });
  return rows;
}

export function staffPayrollLumpCovers(data: FinanceData, date: string): boolean {
  const month = (date || "").slice(0, 7);
  if (!month) return false;
  return (data.checks ?? []).some((c) => {
    if (c.payee !== "Staff payroll" || c.employeeId) return false;
    if (c.status === "voided" || c.status === "bounced") return false;
    return (c.postDate || c.issueDate || "").slice(0, 7) === month;
  });
}

function paycheckInMonth(data: FinanceData, date: string, employeeId?: string): boolean {
  const month = (date || "").slice(0, 7);
  if (!month) return false;
  return (data.checks ?? []).some((c) => {
    if (!c.employeeId) return false;
    if (employeeId && c.employeeId !== employeeId) return false;
    if (c.status === "voided" || c.status === "bounced") return false;
    return (c.postDate || c.issueDate || "").slice(0, 7) === month;
  });
}

/** Active salaried people who would be paid again if Pay all ran on this date. */
export function salariedPayAlreadyPosted(data: FinanceData, date: string): boolean {
  const month = (date || "").slice(0, 7);
  if (!month) return false;
  const ids = new Set(
    (data.employees ?? [])
      .filter((e) => e.active && e.payType !== "hourly" && e.rate > 0)
      .map((e) => e.id),
  );
  if (ids.size === 0) return false;
  return (data.checks ?? []).some((c) => {
    if (!c.employeeId || !ids.has(c.employeeId)) return false;
    if (c.status === "voided" || c.status === "bounced") return false;
    return (c.postDate || c.issueDate || "").slice(0, 7) === month;
  });
}

export function employeePayAlreadyPosted(data: FinanceData, employeeId: string, date: string): boolean {
  return paycheckInMonth(data, date, employeeId);
}
