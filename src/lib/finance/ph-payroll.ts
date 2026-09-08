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
