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

/** Month and day; year only when it is not this year. Register / phone tables. */
export function formatRegisterDate(iso: string, today = todayIso()): string {
  if (!iso) return "—";
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  if (iso.slice(0, 4) === today.slice(0, 4)) return format(date, "MMM d");
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

export function formatGeneratedAt(at = new Date()): string {
  return format(at, "MM/dd/yyyy 'at' HH:mm:ss");
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
  return format(date, "yyyy-MM-dd");
}

export function parseAmountToCents(raw: string | null | undefined): number {
  const cleaned = String(raw ?? "").replace(/,/g, "").trim();
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

export function isoToTyped(iso: string): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, "MM/dd/yyyy");
}

export function maskTypedDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function typedToIso(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && isValid(parseISO(trimmed))) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 6) {
    const yy = Number(digits.slice(4, 6));
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const iso = `${String(year).padStart(4, "0")}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
    return isValid(parseISO(iso)) ? iso : "";
  }
  if (digits.length !== 8) return "";
  const iso = `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  return isValid(parseISO(iso)) ? iso : "";
}
