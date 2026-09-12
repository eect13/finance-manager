import { accountBalance } from "./ledger";
import { monthsWorkedInYear, paycheckStatutoryParts } from "./ph-bir";
import type { Employee, FinanceData, JournalEntry } from "./types";

export type PostedPay = {
  employeeId: string;
  name: string;
  date: string;
  period: string;
  checkNumber: string;
  gross: number;
  net: number;
  extra: number;
};

function accountIdsByCode(data: FinanceData): Map<string, string> {
  const map = new Map<string, string>();
  for (const a of data.accounts) {
    if (a.code && !map.has(a.code)) map.set(a.code, a.id);
  }
  return map;
}

export function postedEmployeePays(data: FinanceData, from: string, to: string): PostedPay[] {
  const codes = accountIdsByCode(data);
  const journalsById = new Map<string, JournalEntry>(data.journals.map((j) => [j.id, j]));
  const empById = new Map((data.employees ?? []).map((e) => [e.id, e]));
  const rows: PostedPay[] = [];
  const checks = [...(data.checks ?? [])]
    .filter((c) => c.employeeId)
    .filter((c) => {
      const date = c.postDate || c.issueDate;
      return date && date >= from && date <= to && c.status !== "voided" && c.status !== "bounced";
    })
    .sort((a, b) => (a.postDate || a.issueDate).localeCompare(b.postDate || b.issueDate) || a.id.localeCompare(b.id));
  for (const check of checks) {
    const emp = check.employeeId ? empById.get(check.employeeId) : undefined;
    const parts = paycheckStatutoryParts(data, check, { codes, journalsById });
    const date = check.postDate || check.issueDate;
    rows.push({
      employeeId: check.employeeId || "",
      name: emp?.name ?? check.payee,
      date,
      period: date.slice(0, 7),
      checkNumber: check.checkNumber,
      gross: parts.gross || check.amount,
      net: check.amount,
      extra: parts.other,
    });
  }
  return rows;
}

export function employeeYtdGross(data: FinanceData, employeeId: string, from: string, to: string): number {
  let total = 0;
  for (const row of postedEmployeePays(data, from, to)) {
    if (row.employeeId === employeeId) total += row.gross;
  }
  return total;
}

export type WageBasis = {
  employeeId: string;
  name: string;
  hireDate: string;
  ytdGross: number;
  annualized: number;
  monthsCounted: number;
  source: "posted" | "salary-rate" | "none";
  note: string;
};

/** YTD posted gross, else salaried monthly rate × months in year (hourly needs posts). */
export function employeeWageBasis(data: FinanceData, employee: Employee, year: number, asOf?: string): WageBasis {
  const from = `${year}-01-01`;
  const to = asOf && asOf.startsWith(String(year)) ? asOf : `${year}-12-31`;
  const monthsCounted = monthsWorkedInYear(employee.hireDate || from, year, to);
  const ytdGross = employeeYtdGross(data, employee.id, from, to);
  if (ytdGross > 0) {
    const annualized = monthsCounted > 0 ? Math.round((ytdGross * 12) / monthsCounted) : ytdGross;
    return {
      employeeId: employee.id,
      name: employee.name,
      hireDate: employee.hireDate || "",
      ytdGross,
      annualized,
      monthsCounted,
      source: "posted",
      note: "Posted paycheck gross",
    };
  }
  if (employee.payType === "salary" && employee.rate > 0 && monthsCounted > 0) {
    const ytd = employee.rate * monthsCounted;
    return {
      employeeId: employee.id,
      name: employee.name,
      hireDate: employee.hireDate || "",
      ytdGross: ytd,
      annualized: employee.rate * 12,
      monthsCounted,
      source: "salary-rate",
      note: `${monthsCounted}/12 × monthly rate`,
    };
  }
  return {
    employeeId: employee.id,
    name: employee.name,
    hireDate: employee.hireDate || "",
    ytdGross: 0,
    annualized: 0,
    monthsCounted,
    source: "none",
    note: employee.payType === "hourly" ? "Hourly — post paychecks first" : "No rate / not yet hired",
  };
}

export function wageBasesForBooks(data: FinanceData, year: number, asOf?: string): WageBasis[] {
  const from = `${year}-01-01`;
  const to = asOf && asOf.startsWith(String(year)) ? asOf : `${year}-12-31`;
  return [...(data.employees ?? [])]
    .filter((e) => e.active || employeeYtdGross(data, e.id, from, to) > 0)
    .map((e) => employeeWageBasis(data, e, year, asOf))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function accountBalanceByCode(data: FinanceData, code: string, asOf?: string): number {
  const acct = data.accounts.find((a) => a.code === code);
  return acct ? accountBalance(data, acct.id, asOf) : 0;
}
