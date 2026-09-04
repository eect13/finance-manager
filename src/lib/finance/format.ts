import { format, parseISO, isValid } from "date-fns";

/** Live prefs synced from FinanceData.settings (default: grouping on, 2 decimals). */
export type MoneyFormatPrefs = {
  useThousandSeparators: boolean;
  decimalPlaces: number;
};

let moneyFormatPrefs: MoneyFormatPrefs = {
  useThousandSeparators: true,
  decimalPlaces: 2,
};

export function clampDecimalPlaces(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 2;
  return Math.min(4, Math.max(0, Math.round(v)));
}

export function setMoneyFormatPrefs(prefs: Partial<MoneyFormatPrefs>): void {
  if (typeof prefs.useThousandSeparators === "boolean") {
    moneyFormatPrefs.useThousandSeparators = prefs.useThousandSeparators;
  }
  if (prefs.decimalPlaces !== undefined) {
    moneyFormatPrefs.decimalPlaces = clampDecimalPlaces(prefs.decimalPlaces);
  }
}

export function getMoneyFormatPrefs(): MoneyFormatPrefs {
  return { ...moneyFormatPrefs };
}

export type MoneyFormatOpts = Partial<MoneyFormatPrefs>;

function resolvePrefs(opts?: MoneyFormatOpts): MoneyFormatPrefs {
  return {
    useThousandSeparators:
      typeof opts?.useThousandSeparators === "boolean"
        ? opts.useThousandSeparators
        : moneyFormatPrefs.useThousandSeparators,
    decimalPlaces:
      opts?.decimalPlaces !== undefined
        ? clampDecimalPlaces(opts.decimalPlaces)
        : moneyFormatPrefs.decimalPlaces,
  };
}

function formatPlain(value: number, prefs: MoneyFormatPrefs): string {
  try {
    return new Intl.NumberFormat("en-PH", {
      useGrouping: prefs.useThousandSeparators,
      minimumFractionDigits: prefs.decimalPlaces,
      maximumFractionDigits: prefs.decimalPlaces,
    }).format(value);
  } catch {
    const fixed = value.toFixed(prefs.decimalPlaces);
    if (!prefs.useThousandSeparators) return fixed;
    const [whole, frac] = fixed.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return frac !== undefined ? `${grouped}.${frac}` : grouped;
  }
}

export function formatMoney(amount: number, currency = "PHP", opts?: MoneyFormatOpts): string {
  const prefs = resolvePrefs(opts);
  const value = amount / 100;
  const code = (currency ?? "").trim();
  if (!code) return formatPlain(value, prefs);
  const digits = code === "JPY" && opts?.decimalPlaces === undefined && moneyFormatPrefs.decimalPlaces === 2
    ? 0
    : prefs.decimalPlaces;
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: code,
      useGrouping: prefs.useThousandSeparators,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${formatPlain(value, { ...prefs, decimalPlaces: digits })} ${code}`;
  }
}

export function formatCompact(amount: number, currency = "PHP", opts?: MoneyFormatOpts): string {
  const prefs = resolvePrefs(opts);
  const value = amount / 100;
  const code = (currency ?? "").trim();
  if (!code) {
    try {
      return new Intl.NumberFormat("en-PH", {
        notation: "compact",
        useGrouping: prefs.useThousandSeparators,
        maximumFractionDigits: 1,
      }).format(value);
    } catch {
      return formatPlain(value, { ...prefs, decimalPlaces: 0 });
    }
  }
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: code,
      notation: "compact",
      useGrouping: prefs.useThousandSeparators,
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatPlain(value, { ...prefs, decimalPlaces: 0 });
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
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseAmountToCents(raw: string | null | undefined): number {
  const cleaned = String(raw ?? "").replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const neg = cleaned.startsWith("-");
  const body = neg ? cleaned.slice(1) : cleaned;
  const match = /^(\d+)(?:\.(\d{0,2})\d*)?$/.exec(body);
  if (!match) {
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }
  const whole = Number(match[1]);
  const frac = (match[2] ?? "").padEnd(2, "0").slice(0, 2);
  const cents = whole * 100 + Number(frac || "0");
  return neg ? -cents : cents;
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
