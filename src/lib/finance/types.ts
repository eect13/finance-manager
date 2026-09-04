export type ReconStatus = "pending" | "cleared" | "reconciled";

export const RECON_STATUSES: ReconStatus[] = ["pending", "cleared", "reconciled"];

export function parseRecon(raw: unknown, fallback: ReconStatus = "pending"): ReconStatus {
  if (raw === "pending" || raw === "cleared" || raw === "reconciled") return raw;
  return fallback;
}

export function nextRecon(current: ReconStatus): ReconStatus {
  if (current === "pending") return "cleared";
  if (current === "cleared") return "reconciled";
  return "pending";
}

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type CheckStatus = "pending" | "cleared" | "voided" | "bounced";

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void";

export type BillStatus = "open" | "partial" | "paid" | "void";

export type ReceiptKind = "cash-sale" | "payment";

export type ReceiptMethod = "cash" | "check" | "card" | "echeck" | "other";

export type ReceiptStatus = "posted" | "void";

export type JournalSource =
  | "opening"
  | "check"
  | "invoice"
  | "payment"
  | "deposit"
  | "expense"
  | "transfer"
  | "reversal"
  | "manual"
  | "receipt"
  | "bill"
  | "bill-payment"
  | "close";

export type OpenKind = "invoice" | "bill" | "receipt" | "check" | "customer" | "vendor" | "bank" | "journal";

export interface OpenTarget {
  kind: OpenKind;
  id: string;
}

export const REGISTER_COLS = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "number", label: "No." },
  { id: "payee", label: "Payee" },
  { id: "memo", label: "Memo" },
  { id: "bank", label: "Bank" },
  { id: "payment", label: "Payment" },
  { id: "deposit", label: "Deposit" },
  { id: "balance", label: "Balance" },
  { id: "status", label: "Status" },
] as const;

export type RegisterColId = (typeof REGISTER_COLS)[number]["id"];

export type RegisterCols = Record<RegisterColId, boolean>;

export const DEFAULT_REGISTER_COLS: RegisterCols = {
  date: true,
  type: true,
  number: true,
  payee: true,
  memo: true,
  bank: true,
  payment: true,
  deposit: true,
  balance: true,
  status: true,
};

export const REGISTER_COL_CLASS: Record<RegisterColId, string> = {
  date: "col-date",
  type: "col-type",
  number: "col-num",
  payee: "col-payee",
  memo: "col-memo",
  bank: "col-bank",
  payment: "col-money col-payment",
  deposit: "col-money col-deposit",
  balance: "col-money col-balance",
  status: "col-status",
};

export function normalizeRegisterCols(raw: unknown): RegisterCols {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = { ...DEFAULT_REGISTER_COLS };
  for (const col of REGISTER_COLS) {
    const value = src[col.id];
    if (typeof value === "boolean") next[col.id] = value;
  }
  if (!REGISTER_COLS.some((col) => next[col.id])) return { ...DEFAULT_REGISTER_COLS };
  return next;
}

export function toggleRegisterCol(cols: RegisterCols, id: RegisterColId): RegisterCols {
  const next = { ...cols, [id]: !cols[id] };
  if (!REGISTER_COLS.some((col) => next[col.id])) return cols;
  return next;
}

export interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  fiscalYearStart: number;
  taxEnabled: boolean;
  defaultTaxRate: number;
  dragDropEnabled: boolean;
  registerFontSize: number;
  registerColumns: RegisterCols;
  /** ISO date. Dates on or before this cannot be posted or edited. Empty = open. */
  closedThrough: string;
}

export interface AuditEvent {
  id: string;
  at: number;
  who: string;
  action: string;
  detail: string;
  old: string;
  new: string;
}

export interface ReconLineRef {
  kind: string;
  sourceId: string;
}

export interface ReconNamedLine {
  date: string;
  party: string;
  number: string;
  amount: number;
  days: number;
  kind: string;
  sourceId: string;
}

export interface ReconStatement {
  id: string;
  bankId: string;
  statementDate: string;
  statementEnding: number;
  beginning: number;
  bookBalance: number;
  clearedIn: number;
  clearedOut: number;
  outstanding: number;
  depositsInTransit: number;
  explained: number;
  finishedAt: number;
  lines: ReconLineRef[];
  outstandingLines: ReconNamedLine[];
  ditLines: ReconNamedLine[];
  adjustmentLines: ReconNamedLine[];
  unclearedAging: { d30: number; d60: number; d90: number; late: number; lateCount: number };
}

export interface CloseSnapshot {
  through: string;
  closedAt: number;
  journalId: string;
  packetPrinted: boolean;
  banks: Array<{ bankId: string; nickname: string; balance: number; lastStatementDate: string }>;
  ar: number;
  ap: number;
  tbDebit: number;
  tbCredit: number;
  reopenedAt?: number;
  reopenReason?: string;
}

export interface Bank {
  id: string;
  name: string;
  nickname: string;
  accountNumber: string;
  openingBalance: number;
  accountId: string;
  archived: boolean;
  lastStatementDate?: string;
  lastStatementEnding?: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  bankId?: string;
  system: boolean;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  terms: string;
  notes: string;
  sortOrder: number;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  terms: string;
  notes: string;
  accountNumber: string;
  sortOrder: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  bankId: string;
  journalId: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  taxRate: number;
  status: InvoiceStatus;
  notes: string;
  payments: InvoicePayment[];
  journalId: string;
  createdAt?: number;
}

export interface BillPayment {
  id: string;
  date: string;
  amount: number;
  bankId: string;
  journalId: string;
  recon: ReconStatus;
}

export interface Bill {
  id: string;
  number: string;
  vendorId: string;
  date: string;
  dueDate: string;
  amount: number;
  accountId: string;
  status: BillStatus;
  memo: string;
  reference: string;
  payments: BillPayment[];
  journalId: string;
  sortOrder: number;
  createdAt?: number;
}

export interface CheckRecord {
  id: string;
  bankId: string;
  checkNumber: string;
  payee: string;
  issueDate: string;
  postDate: string;
  amount: number;
  status: CheckStatus;
  recon: ReconStatus;
  memo: string;
  accountId: string;
  journalId: string;
  vendorId?: string;
  reversalJournalId?: string;
  createdAt?: number;
}

export interface Receipt {
  id: string;
  number: string;
  date: string;
  kind: ReceiptKind;
  method: ReceiptMethod;
  checkNumber: string;
  customerId?: string;
  receivedFrom: string;
  bankId: string;
  lines: InvoiceLine[];
  invoiceId?: string;
  paymentId?: string;
  amount: number;
  taxRate: number;
  status: ReceiptStatus;
  memo: string;
  journalId: string;
  sortOrder: number;
  reversalJournalId?: string;
  recon: ReconStatus;
  createdAt?: number;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  memo: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  sourceType: JournalSource;
  sourceId?: string;
  recon: ReconStatus;
  lines: JournalLine[];
  createdAt?: number;
}

export interface RecurringItem {
  id: string;
  kind: "check" | "bill";
  name: string;
  vendorId: string;
  amount: number;
  bankId: string;
  accountId: string;
  memo: string;
  dayOfMonth: number;
  nextDate: string;
  active: boolean;
}

export interface BudgetItem {
  id: string;
  name: string;
  kind: "inflow" | "outflow";
  amount: number;
  cadence: "monthly";
  startMonth: string;
  accountId?: string;
}

export type PayType = "salary" | "hourly";

export interface Employee {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  payType: PayType;
  /** Cents: monthly salary or hourly rate */
  rate: number;
  bankId: string;
  hireDate: string;
  active: boolean;
  notes: string;
  sortOrder: number;
}

export const EMPTY_EMPLOYEE: Omit<Employee, "id"> = {
  name: "",
  title: "",
  email: "",
  phone: "",
  payType: "salary",
  rate: 0,
  bankId: "",
  hireDate: "",
  active: true,
  notes: "",
  sortOrder: 0,
};

export interface FinanceData {
  settings: Settings;
  banks: Bank[];
  accounts: Account[];
  customers: Customer[];
  vendors: Vendor[];
  employees: Employee[];
  invoices: Invoice[];
  bills: Bill[];
  receipts: Receipt[];
  checks: CheckRecord[];
  journals: JournalEntry[];
  budgetItems: BudgetItem[];
  recurrences: RecurringItem[];
  reconHistory: ReconStatement[];
  closeHistory: CloseSnapshot[];
  audit: AuditEvent[];
  nextNumbers: {
    invoice: number;
    check: Record<string, number>;
    receipt: number;
    bill: number;
  };
}

export const CURRENCIES: Array<{ code: string; label: string }> = [
  { code: "PHP", label: "Philippine peso" },
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "SGD", label: "Singapore dollar" },
  { code: "JPY", label: "Japanese yen" },
  { code: "GBP", label: "Pound sterling" },
  { code: "AUD", label: "Australian dollar" },
  { code: "CAD", label: "Canadian dollar" },
  { code: "HKD", label: "Hong Kong dollar" },
  { code: "CNY", label: "Chinese yuan" },
];

export const EMPTY_CUSTOMER: Omit<Customer, "id"> = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  terms: "Net 30",
  notes: "",
  sortOrder: 0,
};

export const EMPTY_VENDOR: Omit<Vendor, "id"> = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  terms: "Net 30",
  notes: "",
  accountNumber: "",
  sortOrder: 0,
};

export const DEFAULT_SETTINGS: Settings = {
  companyName: "Your Company",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  currency: "PHP",
  fiscalYearStart: 1,
  taxEnabled: false,
  defaultTaxRate: 12,
  dragDropEnabled: false,
  registerFontSize: 12,
  registerColumns: DEFAULT_REGISTER_COLS,
  closedThrough: "",
};
