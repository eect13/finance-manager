import { format, parseISO, isValid } from "date-fns";

/** Live prefs synced from FinanceData.settings (default: grouping on, 2 decimals). */
export type MoneyFormatPrefs = {
  useThousandSeparators: boolean;
  decimalPlaces: number;
};

const moneyFormatPrefs: MoneyFormatPrefs = {
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

/** Live date display format from Options → Display (typed dates stay MM/DD/YYYY). */
export type DateFormatId = "MDY" | "DMY" | "LONG";

const DATE_PATTERNS: Record<DateFormatId, string> = {
  MDY: "MM/dd/yyyy",
  DMY: "dd/MM/yyyy",
  LONG: "MMM d, yyyy",
};

let dateFormatPref: DateFormatId = "MDY";

export function parseDateFormat(raw: unknown): DateFormatId {
  return raw === "DMY" || raw === "LONG" ? raw : "MDY";
}

export function setDateFormatPref(id: DateFormatId): void {
  dateFormatPref = parseDateFormat(id);
}

export function getDateFormatPref(): DateFormatId {
  return dateFormatPref;
}

export const DATE_FORMAT_OPTIONS: { id: DateFormatId; label: string; sample: string }[] = [
  { id: "MDY", label: "MM/DD/YYYY", sample: "09/30/2026" },
  { id: "DMY", label: "DD/MM/YYYY", sample: "30/09/2026" },
  { id: "LONG", label: "Mon D, YYYY", sample: "Sep 30, 2026" },
];

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

/** Display dates using Options → Display (default MM/DD/YYYY, e.g. 09/30/2026). */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return format(date, DATE_PATTERNS[dateFormatPref]);
}

/** Register / phone / party tables — same numeric date as the rest of the books. */
export function formatRegisterDate(iso: string, _today = todayIso()): string {
  return formatDate(iso);
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
  return format(at, `${DATE_PATTERNS[dateFormatPref]} 'at' HH:mm:ss`);
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
  let cleaned = String(raw ?? "").trim();
  if (!cleaned) return 0;
  cleaned = cleaned.replace(/[\s\u00a0]/g, "");
  cleaned = cleaned.replace(/[₱$€£¥]/g, "");
  let neg = false;
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    neg = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.endsWith("-")) {
    neg = true;
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.startsWith("-")) {
    neg = true;
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  cleaned = cleaned.replace(/,/g, "");
  if (!cleaned) return 0;
  const match = /^(\d+)(?:\.(\d{0,4})\d*)?$/.exec(cleaned);
  if (!match) {
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) * (neg ? -1 : 1);
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
  return format(date, dateFormatPref === "DMY" ? "dd/MM/yyyy" : "MM/dd/yyyy");
}

/** Compact typing like QuickBooks: 09131992, 091392, 91392, 0913. */
export function maskTypedDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return slashDateDigits(digits, dateFormatPref === "DMY");
}

function slashDateDigits(digits: string, dmy: boolean): string {
  if (!digits) return "";
  const first = Number(digits[0]);
  const wideFirst = first <= 1 || (dmy && first <= 3);
  if (wideFirst) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length === 1) return digits;
  if (digits.length <= 3) return `${digits[0]}/${digits.slice(1)}`;
  return `${digits[0]}/${digits.slice(1, 3)}/${digits.slice(3)}`;
}

function expandYear(yy: number, today: string): number {
  const nowY = Number(today.slice(0, 4)) || new Date().getFullYear();
  const as20 = 2000 + yy;
  const as19 = 1900 + yy;
  if (as20 <= nowY + 1 && as20 >= nowY - 80) return as20;
  return as19;
}

function isoFromParts(year: number, month: number, day: number): string {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = parseISO(iso);
  if (!isValid(date)) return "";
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return "";
  return iso;
}

export function typedToIso(raw: string, today = todayIso()): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && isValid(parseISO(trimmed))) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  const dmy = dateFormatPref === "DMY";
  const nowY = Number(today.slice(0, 4));
  const nowM = Number(today.slice(5, 7));

  const fromMdy = (a: number, b: number, year: number) =>
    dmy ? isoFromParts(year, b, a) : isoFromParts(year, a, b);

  if (digits.length === 3) {
    return fromMdy(Number(digits[0]), Number(digits.slice(1)), nowY);
  }
  if (digits.length === 4) {
    const twoTwo = fromMdy(Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), nowY);
    if (twoTwo) return twoTwo;
    return fromMdy(Number(digits[0]), Number(digits.slice(1)), nowY);
  }
  if (digits.length === 5) {
    return fromMdy(Number(digits[0]), Number(digits.slice(1, 3)), expandYear(Number(digits.slice(3)), today));
  }
  if (digits.length === 6) {
    const compact = fromMdy(Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), expandYear(Number(digits.slice(4)), today));
    if (compact) return compact;
    return fromMdy(Number(digits[0]), Number(digits.slice(1, 3)), expandYear(Number(digits.slice(3)), today));
  }
  if (digits.length === 7) {
    return fromMdy(Number(digits[0]), Number(digits.slice(1, 3)), Number(digits.slice(3)));
  }
  if (digits.length === 8) {
    return fromMdy(Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), Number(digits.slice(4)));
  }
  if (digits.length === 1 || digits.length === 2) {
    const day = Number(digits);
    return isoFromParts(nowY, nowM, day);
  }
  return "";
}
