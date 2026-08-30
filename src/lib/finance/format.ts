import { format, parseISO, isValid } from "date-fns";

export function formatMoney(amount: number, currency = "PHP"): string {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

export function formatCompact(amount: number, currency = "PHP"): string {
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return value.toFixed(0);
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, "MMM d, yyyy");
}

export function formatWeekday(iso: string): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (!isValid(date)) return "";
  return format(date, "EEEE");
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, "MMM d");
}

export function formatMonth(iso: string): string {
  const date = parseISO(`${iso}-01`);
  if (!isValid(date)) return iso;
  return format(date, "MMMM yyyy");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseAmountToCents(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function titleCase(value: string): string {
  return String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
