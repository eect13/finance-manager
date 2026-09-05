import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addBank,
  addCustomer,
  addEmployee,
  addDeposit,
  addExpense,
  addVendor,
  applyCustomerPayments,
  createBill,
  createCashSale,
  createInvoice,
  issueCheck,
  payBill,
  payEmployee,
  recordInvoicePayment,
  removeBank,
  removeBill,
  removeBudget,
  removeCashLines,
  removeCheck,
  removeCustomer,
  removeEmployee,
  removeInvoice,
  removeReceipt,
  removeVendor,
  reorderBills,
  reorderCustomers,
  reorderReceipts,
  reorderVendors,
  arrangeCashLine,
  rescheduleCashLine,
  setCheckStatus,
  transferBanks,
  updateBank,
  updateBillRecord,
  updateCheck,
  updateCustomer,
  updateEmployee,
  updateInvoiceRecord,
  updateJournalEntry,
  updateReceipt,
  updateSettings,
  updateVendor,
  upsertBudget,
  voidBill,
  voidInvoice,
  voidReceipt,
  reassignCashBank,
  reassignCashBanks,
  setCashRecon,
  purgeClosedThrough,
  closeBooks,
  reopenBooks,
  finishRecon,
  undoLastRecon,
  postReconAdjustment,
  mergeCustomers,
  mergeVendors,
  upsertRecurring,
  removeRecurring,
  postRecurring,
  postDueRecurring,
} from "./actions";
import { parseBackupFile } from "./export";
import { newId } from "./ids";
import { listLocalBackups, readLocalBackup, writeLocalBackups } from "./local-backup";
import { normalizeBooks } from "./normalize";
import { setMoneyFormatPrefs } from "./format";
import { createSeed, emptyBooks, SAMPLE_COMPANY_ID } from "./seed";
import { booksStorage, createDebouncedPersistStorage } from "./storage";
import { watchPersistentStorage } from "./storage-usage";
import type {
  Bank,
  Bill,
  BudgetItem,
  CheckStatus,
  Customer,
  FinanceData,
  InvoiceLine,
  OpenKind,
  OpenTarget,
  Receipt,
  RecurringItem,
  Settings,
  Vendor,
} from "./types";

type DataFn = (data: FinanceData) => FinanceData;

function sliceData(next: FinanceData): FinanceData {
  return {
    settings: next.settings,
    banks: next.banks,
    accounts: next.accounts,
    customers: next.customers,
    vendors: next.vendors,
    employees: next.employees ?? [],
    invoices: next.invoices,
    bills: next.bills,
    receipts: next.receipts,
    checks: next.checks,
    journals: next.journals,
    budgetItems: next.budgetItems,
    recurrences: next.recurrences,
    reconHistory: next.reconHistory ?? [],
    closeHistory: next.closeHistory ?? [],
    audit: next.audit ?? [],
    registerOrder: next.registerOrder ?? {},
    nextNumbers: next.nextNumbers,
  };
}

/** In-memory undo/redo depth — generous; each entry is a full company snapshot. */
export const UNDO_MAX = 100;

/** Snapshot + short human label for undo/redo toasts (e.g. "delete invoice INV-1042"). */
export type UndoEntry = { data: FinanceData; label: string };

type UndoLabel = string | ((before: FinanceData, after: FinanceData) => string);

function snapshot(data: FinanceData): FinanceData {
  return structuredClone(sliceData(data));
}

function resolveUndoLabel(label: UndoLabel, before: FinanceData, after: FinanceData): string {
  const raw = typeof label === "function" ? label(before, after) : label;
  return (raw || "edit").trim() || "edit";
}

function clearHistory(): Pick<FinanceState, "undoStack" | "redoStack"> {
  return { undoStack: [], redoStack: [] };
}

function pushUndo(
  s: Pick<FinanceState, "undoStack">,
  current: FinanceData,
  label: string,
): Pick<FinanceState, "undoStack" | "redoStack"> {
  return {
    undoStack: [...(s.undoStack ?? []), { data: snapshot(current), label }].slice(-UNDO_MAX),
    redoStack: [],
  };
}

function packSeed(): Pick<FinanceState, "companies" | "companyOrder" | "activeCompanyId"> {
  return {
    companies: { [SAMPLE_COMPANY_ID]: createSeed() },
    companyOrder: [SAMPLE_COMPANY_ID],
    activeCompanyId: SAMPLE_COMPANY_ID,
  };
}

function isLegacyBooks(raw: unknown): boolean {
  return !!raw && typeof raw === "object" && "settings" in raw && "banks" in raw && !("companies" in raw);
}

function wrapLegacy(raw: unknown): Pick<FinanceState, "companies" | "companyOrder" | "activeCompanyId"> {
  const books = normalizeBooks(raw);
  const id = books.settings.companyName === "Pacific Harbor Trading" ? SAMPLE_COMPANY_ID : newId();
  return { companies: { [id]: books }, companyOrder: [id], activeCompanyId: id };
}

function migrateBooks(persisted: unknown, version: number): Pick<FinanceState, "companies" | "companyOrder" | "activeCompanyId"> {
  if (version < 5 || isLegacyBooks(persisted)) {
    // Migrate in place — do not wipe real edits to the sample company.
    return wrapLegacy(persisted);
  }
  const p = (persisted ?? {}) as {
    companies?: Record<string, unknown>;
    companyOrder?: string[];
    activeCompanyId?: string;
  };
  const companies: Record<string, FinanceData> = {};
  for (const [id, books] of Object.entries(p.companies ?? {})) {
    companies[id] = normalizeBooks(books);
  }
  if (Object.keys(companies).length === 0) return packSeed();
  const order = (p.companyOrder ?? Object.keys(companies)).filter((id) => companies[id]);
  for (const id of Object.keys(companies)) {
    if (!order.includes(id)) order.push(id);
  }
  const active = p.activeCompanyId && companies[p.activeCompanyId] ? p.activeCompanyId : order[0];
  return { companies, companyOrder: order, activeCompanyId: active };
}

export interface FinanceState {
  companies: Record<string, FinanceData>;
  companyOrder: string[];
  activeCompanyId: string;
  hydrated: boolean;
  hydrate: () => void;
  ensureBooks: () => void;
  patch: (fn: DataFn, label?: string) => void;
  resetDemo: () => void;
  startFresh: () => void;
  importBackup: (raw: string) => "company" | "workspace";
  restoreLocalCopy: () => Promise<{ name: string; savedAt: string; revived: boolean }>;
  addCompany: (name: string) => string;
  switchCompany: (id: string) => void;
  removeCompany: (id: string) => void;
  addBank: (input: Parameters<typeof addBank>[1]) => void;
  updateBank: (id: string, patch: Partial<Pick<Bank, "name" | "nickname" | "accountNumber" | "archived">>) => void;
  removeBank: (id: string) => void;
  addCustomer: (input: Omit<Customer, "id"> & { id?: string }) => void;
  updateCustomer: (id: string, patch: Partial<Omit<Customer, "id">>) => void;
  removeCustomer: (id: string) => void;
  reorderCustomers: (ids: string[]) => void;
  addVendor: (input: Omit<Vendor, "id"> & { id?: string }) => void;
  updateVendor: (id: string, patch: Partial<Omit<Vendor, "id">>) => void;
  removeVendor: (id: string) => void;
  reorderVendors: (ids: string[]) => void;
  issueCheck: (input: Parameters<typeof issueCheck>[1]) => void;
  setCheckStatus: (id: string, status: CheckStatus) => void;
  removeCheck: (id: string) => void;
  rescheduleCashLine: (input: Parameters<typeof rescheduleCashLine>[1]) => void;
  arrangeCashLine: (input: Parameters<typeof arrangeCashLine>[1]) => { dateChanged: boolean; orderChanged: boolean };
  createInvoice: (input: {
    customerId: string;
    date: string;
    dueDate: string;
    lines: Array<Omit<InvoiceLine, "id">>;
    notes: string;
    taxRate?: number;
  }) => void;
  recordInvoicePayment: (input: Parameters<typeof recordInvoicePayment>[1]) => void;
  applyCustomerPayments: (input: Parameters<typeof applyCustomerPayments>[1]) => void;
  voidInvoice: (id: string) => void;
  removeInvoice: (id: string) => void;
  createCashSale: (input: Parameters<typeof createCashSale>[1]) => void;
  voidReceipt: (id: string) => void;
  removeReceipt: (id: string) => void;
  reorderReceipts: (ids: string[]) => void;
  createBill: (input: Parameters<typeof createBill>[1]) => void;
  payBill: (input: Parameters<typeof payBill>[1]) => void;
  voidBill: (id: string) => void;
  removeBill: (id: string) => void;
  reorderBills: (ids: string[]) => void;
  removeCashLines: (lines: Parameters<typeof removeCashLines>[1]) => { deleted: number; failed: number };
  addDeposit: (input: Parameters<typeof addDeposit>[1]) => void;
  addExpense: (input: Parameters<typeof addExpense>[1]) => void;
  transferBanks: (input: Parameters<typeof transferBanks>[1]) => void;
  upsertBudget: (item: Omit<BudgetItem, "id"> & { id?: string }) => void;
  removeBudget: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateCheck: (id: string, patch: Parameters<typeof updateCheck>[2]) => void;
  updateReceipt: (id: string, patch: Parameters<typeof updateReceipt>[2]) => void;
  updateBillRecord: (id: string, patch: Parameters<typeof updateBillRecord>[2]) => void;
  updateJournalEntry: (id: string, patch: Parameters<typeof updateJournalEntry>[2]) => void;
  updateInvoiceRecord: (id: string, patch: Parameters<typeof updateInvoiceRecord>[2]) => void;
  reassignCashBank: (input: Parameters<typeof reassignCashBank>[1]) => void;
  reassignCashBanks: (lines: Parameters<typeof reassignCashBanks>[1], bankId: string) => void;
  setCashRecon: (input: Parameters<typeof setCashRecon>[1]) => void;
  addEmployee: (input: Parameters<typeof addEmployee>[1]) => void;
  updateEmployee: (id: string, patch: Parameters<typeof updateEmployee>[2]) => void;
  removeEmployee: (id: string) => void;
  payEmployee: (input: Parameters<typeof payEmployee>[1]) => void;
  purgeClosedThrough: (throughDate: string) => number;
  closeBooks: (throughDate: string, packetPrinted?: boolean) => void;
  reopenBooks: (reason?: string) => void;
  finishRecon: (input: Parameters<typeof finishRecon>[1]) => void;
  undoLastRecon: (bankId: string) => void;
  postReconAdjustment: (input: Parameters<typeof postReconAdjustment>[1]) => string;
  mergeCustomers: (keepId: string, dropId: string) => void;
  mergeVendors: (keepId: string, dropId: string) => void;
  upsertRecurring: (item: Omit<RecurringItem, "id"> & { id?: string }) => void;
  removeRecurring: (id: string) => void;
  postRecurring: (id: string) => void;
  postDueRecurring: (through: string) => Array<{ name: string; date: string }>;
  openRecord: OpenTarget | null;
  openTxn: (kind: OpenKind, id: string) => void;
  closeTxn: () => void;
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  undo: () => string | null;
  redo: () => string | null;
}

const packed: Pick<FinanceState, "companies" | "companyOrder" | "activeCompanyId"> = {
  companies: {},
  companyOrder: [],
  activeCompanyId: SAMPLE_COMPANY_ID,
};

/** Stable empty snapshot so selectors never allocate a new books object on every read. */
const EMPTY_BOOKS: FinanceData = emptyBooks();

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => {
      // Functional set: read current books inside the updater so undo/other-tab
      // cannot slip between get() and set() (no stale overwrite / half-write).
      const apply = (fn: DataFn, label: UndoLabel = "edit") => {
        set((s) => {
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const next = sliceData(fn(current));
          return {
            companies: { ...s.companies, [id]: next },
            ...pushUndo(s, current, resolveUndoLabel(label, current, next)),
          };
        });
      };
      return {
        ...packed,
        hydrated: false,
        undoStack: [],
        redoStack: [],
        hydrate: () => set({ hydrated: true }),
        ensureBooks: () => {
          const s = get();
          if (Object.keys(s.companies).length === 0) {
            set({ ...packSeed(), openRecord: null });
            return;
          }
          if (!s.companies[s.activeCompanyId]) {
            const id = s.companyOrder.find((x) => s.companies[x]) ?? Object.keys(s.companies)[0];
            if (id) set({ activeCompanyId: id });
          }
        },
        patch: (fn, label) => apply(fn, label ?? "edit"),
        resetDemo: () => {
          const s = get();
          const companies = { ...s.companies };
          const order = s.companyOrder.filter((id) => {
            if (id === SAMPLE_COMPANY_ID) return true;
            const books = companies[id];
            const unused =
              !!books &&
              books.settings.companyName === "Your Company" &&
              books.banks.length === 0 &&
              books.journals.length === 0;
            if (unused) {
              delete companies[id];
              return false;
            }
            return Boolean(books);
          });
          set({
            companies: { ...companies, [SAMPLE_COMPANY_ID]: createSeed() },
            companyOrder: order.includes(SAMPLE_COMPANY_ID) ? order : [...order, SAMPLE_COMPANY_ID],
            activeCompanyId: SAMPLE_COMPANY_ID,
            hydrated: true,
            openRecord: null,
            ...clearHistory(),
          });
        },
        startFresh: () => {
          const s = get();
          const name = s.companies[s.activeCompanyId]?.settings.companyName ?? "Your Company";
          const books = emptyBooks();
          books.settings.companyName = name;
          set({
            companies: { ...s.companies, [s.activeCompanyId]: books },
            hydrated: true,
            openRecord: null,
            ...clearHistory(),
          });
        },
        importBackup: (raw) => {
          const file = parseBackupFile(raw);
          if (file.type === "workspace") {
            set({
              companies: file.companies,
              companyOrder: file.companyOrder,
              activeCompanyId: file.activeCompanyId,
              hydrated: true,
              openRecord: null,
              ...clearHistory(),
            });
            return "workspace";
          }
          const s = get();
          set({
            companies: { ...s.companies, [s.activeCompanyId]: file.data },
            hydrated: true,
            openRecord: null,
            ...clearHistory(),
          });
          return "company";
        },
        restoreLocalCopy: async () => {
          const s = get();
          const mine = await readLocalBackup(s.activeCompanyId);
          if (mine) {
            set({
              companies: { ...s.companies, [s.activeCompanyId]: sliceData(mine.data) },
              hydrated: true,
              openRecord: null,
              ...clearHistory(),
            });
            return { name: mine.data.settings.companyName, savedAt: mine.savedAt, revived: false };
          }
          const newest = (await listLocalBackups()).sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
          if (!newest) throw new Error("No local copy in this browser yet.");
          const companies = { ...s.companies, [newest.id]: sliceData(newest.data) };
          const order = s.companyOrder.includes(newest.id) ? s.companyOrder : [...s.companyOrder, newest.id];
          set({
            companies,
            companyOrder: order,
            activeCompanyId: newest.id,
            hydrated: true,
            openRecord: null,
            ...clearHistory(),
          });
          return { name: newest.data.settings.companyName, savedAt: newest.savedAt, revived: true };
        },
        addCompany: (name) => {
          const id = newId();
          const books = emptyBooks();
          const trimmed = name.trim() || "Untitled company";
          books.settings.companyName = trimmed;
          const s = get();
          set({
            companies: { ...s.companies, [id]: books },
            companyOrder: [...s.companyOrder, id],
            activeCompanyId: id,
            openRecord: null,
            ...clearHistory(),
          });
          return id;
        },
        switchCompany: (id) => {
          const s = get();
          if (!s.companies[id] || id === s.activeCompanyId) return;
          set({ activeCompanyId: id, openRecord: null, ...clearHistory() });
        },
        removeCompany: (id) => {
          const s = get();
          if (!s.companies[id]) return;
          const { [id]: _dropped, ...rest } = s.companies;
          let companies = rest;
          let order = s.companyOrder.filter((x) => x !== id);
          let active = s.activeCompanyId === id ? order[0] : s.activeCompanyId;
          if (order.length === 0) {
            const blankId = newId();
            const books = emptyBooks();
            companies = { [blankId]: books };
            order = [blankId];
            active = blankId;
          }
          set({ companies, companyOrder: order, activeCompanyId: active, openRecord: null, ...clearHistory() });
        },
        addBank: (input) =>
          apply((d) => addBank(d, input), `add bank ${input.nickname || input.name || ""}`.trim()),
        updateBank: (id, patch) =>
          apply((d) => updateBank(d, id, patch), (before) => {
            const b = before.banks.find((x) => x.id === id);
            return `edit bank ${b?.nickname || b?.name || ""}`.trim();
          }),
        removeBank: (id) =>
          apply((d) => removeBank(d, id), (before) => {
            const b = before.banks.find((x) => x.id === id);
            return `delete bank ${b?.nickname || b?.name || ""}`.trim();
          }),
        addCustomer: (input) => apply((d) => addCustomer(d, input), `add customer ${input.name || ""}`.trim()),
        addEmployee: (input) => apply((d) => addEmployee(d, input), `add employee ${input.name || ""}`.trim()),
        updateEmployee: (id, patch) =>
          apply((d) => updateEmployee(d, id, patch), (before) => {
            const e = (before.employees ?? []).find((x) => x.id === id);
            return `edit employee ${e?.name || ""}`.trim();
          }),
        removeEmployee: (id) =>
          apply((d) => removeEmployee(d, id), (before) => {
            const e = (before.employees ?? []).find((x) => x.id === id);
            return `delete employee ${e?.name || ""}`.trim();
          }),
        payEmployee: (input) =>
          apply((d) => payEmployee(d, input), (before) => {
            const e = (before.employees ?? []).find((x) => x.id === input.employeeId);
            return `post paycheck ${e?.name || ""}`.trim();
          }),
        updateCustomer: (id, patch) =>
          apply((d) => updateCustomer(d, id, patch), (before) => {
            const c = before.customers.find((x) => x.id === id);
            return `edit customer ${c?.name || ""}`.trim();
          }),
        removeCustomer: (id) =>
          apply((d) => removeCustomer(d, id), (before) => {
            const c = before.customers.find((x) => x.id === id);
            return `delete customer ${c?.name || ""}`.trim();
          }),
        reorderCustomers: (ids) => apply((d) => reorderCustomers(d, ids), "reorder customers"),
        addVendor: (input) => apply((d) => addVendor(d, input), `add vendor ${input.name || ""}`.trim()),
        updateVendor: (id, patch) =>
          apply((d) => updateVendor(d, id, patch), (before) => {
            const v = before.vendors.find((x) => x.id === id);
            return `edit vendor ${v?.name || ""}`.trim();
          }),
        removeVendor: (id) =>
          apply((d) => removeVendor(d, id), (before) => {
            const v = before.vendors.find((x) => x.id === id);
            return `delete vendor ${v?.name || ""}`.trim();
          }),
        reorderVendors: (ids) => apply((d) => reorderVendors(d, ids), "reorder vendors"),
        issueCheck: (input) =>
          apply((d) => issueCheck(d, input), (_b, after) => {
            const created = after.checks.find((c) => !_b.checks.some((x) => x.id === c.id));
            const num = created?.checkNumber || input.checkNumber;
            return num ? `post check #${num}` : "post check";
          }),
        setCheckStatus: (id, status) =>
          apply((d) => setCheckStatus(d, id, status), (before) => {
            const c = before.checks.find((x) => x.id === id);
            return c?.checkNumber ? `${status} check #${c.checkNumber}` : `${status} check`;
          }),
        removeCheck: (id) =>
          apply((d) => removeCheck(d, id), (before) => {
            const c = before.checks.find((x) => x.id === id);
            return c?.checkNumber ? `delete check #${c.checkNumber}` : "delete check";
          }),
        rescheduleCashLine: (input) => apply((d) => rescheduleCashLine(d, input), "reschedule register line"),
        arrangeCashLine: (input) => {
          let meta = { dateChanged: false, orderChanged: false };
          apply((d) => {
            const result = arrangeCashLine(d, input);
            meta = { dateChanged: result.dateChanged, orderChanged: result.orderChanged };
            return result.data;
          }, "arrange register line");
          return meta;
        },
        createInvoice: (input) =>
          apply((d) => createInvoice(d, input), (_b, after) => {
            const created = after.invoices.find((i) => !_b.invoices.some((x) => x.id === i.id));
            return created ? `post invoice ${created.number}` : "post invoice";
          }),
        recordInvoicePayment: (input) =>
          apply((d) => recordInvoicePayment(d, input), (before) => {
            const inv = before.invoices.find((x) => x.id === input.invoiceId);
            return inv ? `receive payment ${inv.number}` : "receive invoice payment";
          }),
        applyCustomerPayments: (input) => apply((d) => applyCustomerPayments(d, input), "apply customer payments"),
        voidInvoice: (id) =>
          apply((d) => voidInvoice(d, id), (before) => {
            const inv = before.invoices.find((x) => x.id === id);
            return inv ? `void invoice ${inv.number}` : "void invoice";
          }),
        removeInvoice: (id) =>
          apply((d) => removeInvoice(d, id), (before) => {
            const inv = before.invoices.find((x) => x.id === id);
            return inv ? `delete invoice ${inv.number}` : "delete invoice";
          }),
        createCashSale: (input) =>
          apply((d) => createCashSale(d, input), (_b, after) => {
            const created = after.receipts.find((r) => !_b.receipts.some((x) => x.id === r.id));
            return created ? `post cash sale ${created.number}` : "post cash sale";
          }),
        voidReceipt: (id) =>
          apply((d) => voidReceipt(d, id), (before) => {
            const r = before.receipts.find((x) => x.id === id);
            return r ? `void receipt ${r.number}` : "void receipt";
          }),
        removeReceipt: (id) =>
          apply((d) => removeReceipt(d, id), (before) => {
            const r = before.receipts.find((x) => x.id === id);
            return r ? `delete receipt ${r.number}` : "delete receipt";
          }),
        reorderReceipts: (ids) => apply((d) => reorderReceipts(d, ids), "reorder receipts"),
        createBill: (input) =>
          apply((d) => createBill(d, input), (_b, after) => {
            const created = after.bills.find((b) => !_b.bills.some((x) => x.id === b.id));
            return created ? `post bill ${created.number}` : "post bill";
          }),
        payBill: (input) =>
          apply((d) => payBill(d, input), (before) => {
            const bill = before.bills.find((x) => x.id === input.billId);
            return bill ? `pay bill ${bill.number}` : "pay bill";
          }),
        voidBill: (id) =>
          apply((d) => voidBill(d, id), (before) => {
            const bill = before.bills.find((x) => x.id === id);
            return bill ? `void bill ${bill.number}` : "void bill";
          }),
        removeBill: (id) =>
          apply((d) => removeBill(d, id), (before) => {
            const bill = before.bills.find((x) => x.id === id);
            return bill ? `delete bill ${bill.number}` : "delete bill";
          }),
        reorderBills: (ids) => apply((d) => reorderBills(d, ids), "reorder bills"),
        removeCashLines: (lines) => {
          // Single set updater: preflight + chain see one fresh snapshot.
          // Throw → updater aborts with no write (never half-delete).
          let deleted = 0;
          let failed = 0;
          let err: unknown = null;
          set((s) => {
            const id = s.activeCompanyId;
            const current = s.companies[id] ?? emptyBooks();
            try {
              const result = removeCashLines(current, lines);
              deleted = result.deleted;
              failed = result.failed;
              return {
                companies: { ...s.companies, [id]: sliceData(result.data) },
                ...pushUndo(
                  s,
                  current,
                  lines.length === 1 ? "delete register line" : `delete ${lines.length} register lines`,
                ),
              };
            } catch (e) {
              err = e;
              return s;
            }
          });
          if (err) throw err;
          return { deleted, failed };
        },
        addDeposit: (input) => apply((d) => addDeposit(d, input), "post deposit"),
        addExpense: (input) => apply((d) => addExpense(d, input), "post expense"),
        transferBanks: (input) => apply((d) => transferBanks(d, input), "transfer between banks"),
        upsertBudget: (item) =>
          apply((d) => upsertBudget(d, item), item.id ? `edit budget ${item.name || ""}`.trim() : `add budget ${item.name || ""}`.trim()),
        removeBudget: (id) =>
          apply((d) => removeBudget(d, id), (before) => {
            const b = before.budgetItems.find((x) => x.id === id);
            return `delete budget ${b?.name || ""}`.trim();
          }),
        updateSettings: (patch) => apply((d) => updateSettings(d, patch), "update options"),
        updateCheck: (id, patch) =>
          apply((d) => updateCheck(d, id, patch), (before) => {
            const c = before.checks.find((x) => x.id === id);
            return c?.checkNumber ? `edit check #${c.checkNumber}` : "edit check";
          }),
        updateReceipt: (id, patch) =>
          apply((d) => updateReceipt(d, id, patch), (before) => {
            const r = before.receipts.find((x) => x.id === id);
            return r ? `edit receipt ${r.number}` : "edit receipt";
          }),
        updateBillRecord: (id, patch) =>
          apply((d) => updateBillRecord(d, id, patch), (before) => {
            const bill = before.bills.find((x) => x.id === id);
            return bill ? `edit bill ${bill.number}` : "edit bill";
          }),
        updateJournalEntry: (id, patch) => apply((d) => updateJournalEntry(d, id, patch), "edit journal entry"),
        updateInvoiceRecord: (id, patch) =>
          apply((d) => updateInvoiceRecord(d, id, patch), (before) => {
            const inv = before.invoices.find((x) => x.id === id);
            return inv ? `edit invoice ${inv.number}` : "edit invoice";
          }),
        reassignCashBank: (input) => apply((d) => reassignCashBank(d, input), "move register line to bank"),
        reassignCashBanks: (lines, bankId) =>
          apply(
            (d) => reassignCashBanks(d, lines, bankId),
            lines.length === 1 ? "move register line to bank" : `move ${lines.length} lines to bank`,
          ),
        setCashRecon: (input) => apply((d) => setCashRecon(d, input), "toggle cleared"),
        purgeClosedThrough: (throughDate) => {
          const s = get();
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const result = purgeClosedThrough(current, throughDate);
          set({
            companies: { ...s.companies, [id]: sliceData(result.data) },
            ...pushUndo(s, current, `purge closed through ${throughDate}`),
          });
          return result.removed;
        },
        closeBooks: (throughDate, packetPrinted) =>
          apply((d) => closeBooks(d, throughDate, packetPrinted), `close books through ${throughDate}`),
        reopenBooks: (reason) => apply((d) => reopenBooks(d, reason), "reopen books"),
        finishRecon: (input) =>
          apply((d) => finishRecon(d, input), `finish recon ${input.statementDate}`),
        undoLastRecon: (bankId) =>
          apply((d) => undoLastRecon(d, bankId), (before) => {
            const b = before.banks.find((x) => x.id === bankId);
            return `undo recon ${b?.nickname || b?.name || ""}`.trim();
          }),
        postReconAdjustment: (input) => {
          let journalId = "";
          apply((d) => {
            const result = postReconAdjustment(d, input);
            journalId = result.journalId;
            return result.data;
          }, "post recon adjustment");
          return journalId;
        },
        mergeCustomers: (keepId, dropId) =>
          apply((d) => mergeCustomers(d, keepId, dropId), (before) => {
            const keep = before.customers.find((x) => x.id === keepId)?.name;
            const drop = before.customers.find((x) => x.id === dropId)?.name;
            return `merge customers ${drop || "?"} → ${keep || "?"}`.trim();
          }),
        mergeVendors: (keepId, dropId) =>
          apply((d) => mergeVendors(d, keepId, dropId), (before) => {
            const keep = before.vendors.find((x) => x.id === keepId)?.name;
            const drop = before.vendors.find((x) => x.id === dropId)?.name;
            return `merge vendors ${drop || "?"} → ${keep || "?"}`.trim();
          }),
        upsertRecurring: (item) =>
          apply(
            (d) => upsertRecurring(d, item),
            item.id ? `edit recurring ${item.name || ""}`.trim() : `add recurring ${item.name || ""}`.trim(),
          ),
        removeRecurring: (id) =>
          apply((d) => removeRecurring(d, id), (before) => {
            const r = before.recurrences.find((x) => x.id === id);
            return `delete recurring ${r?.name || ""}`.trim();
          }),
        postRecurring: (id) =>
          apply((d) => postRecurring(d, id), (before) => {
            const r = before.recurrences.find((x) => x.id === id);
            return `post recurring ${r?.name || ""}`.trim();
          }),
        postDueRecurring: (through) => {
          const s = get();
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const result = postDueRecurring(current, through);
          const n = result.posted.length;
          set({
            companies: { ...s.companies, [id]: sliceData(result.data) },
            ...pushUndo(
              s,
              current,
              n === 0 ? "post due recurring" : `post ${n} recurring ${n === 1 ? "item" : "items"}`,
            ),
          });
          return result.posted;
        },
        openRecord: null,
        openTxn: (kind, id) => set({ openRecord: { kind, id } }),
        closeTxn: () => set({ openRecord: null }),
        undo: () => {
          const s = get();
          const stack = s.undoStack ?? [];
          const entry = stack.at(-1);
          if (!entry) return null;
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          // Tolerate pre-label in-memory snapshots (HMR) shaped as bare FinanceData.
          const raw = entry as UndoEntry | FinanceData;
          const prev = "data" in raw && raw.data && "settings" in raw.data ? raw.data : (raw as FinanceData);
          const label = "label" in raw && typeof raw.label === "string" && raw.label ? raw.label : "edit";
          set({
            companies: { ...s.companies, [id]: sliceData(prev) },
            undoStack: stack.slice(0, -1),
            redoStack: [...(s.redoStack ?? []), { data: snapshot(current), label }].slice(-UNDO_MAX),
            openRecord: null,
          });
          return label;
        },
        redo: () => {
          const s = get();
          const stack = s.redoStack ?? [];
          const entry = stack.at(-1);
          if (!entry) return null;
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const raw = entry as UndoEntry | FinanceData;
          const next = "data" in raw && raw.data && "settings" in raw.data ? raw.data : (raw as FinanceData);
          const label = "label" in raw && typeof raw.label === "string" && raw.label ? raw.label : "edit";
          set({
            companies: { ...s.companies, [id]: sliceData(next) },
            redoStack: stack.slice(0, -1),
            undoStack: [...(s.undoStack ?? []), { data: snapshot(current), label }].slice(-UNDO_MAX),
            openRecord: null,
          });
          return label;
        },
      };
    },
    {
      name: "finance-manager-v1",
      version: 14,
      storage: createDebouncedPersistStorage(booksStorage),
      skipHydration: true,
      migrate: (persisted, version) => migrateBooks(persisted, version),
      partialize: (state) => ({
        companies: state.companies,
        companyOrder: state.companyOrder,
        activeCompanyId: state.activeCompanyId,
      }),
    },
  ),
);

function syncMoneyFormatFromData(data: FinanceData) {
  setMoneyFormatPrefs({
    useThousandSeparators: data.settings.useThousandSeparators !== false,
    decimalPlaces: data.settings.decimalPlaces ?? 2,
  });
}

export function useFinanceData(): FinanceData {
  return useFinanceStore((s) => {
    const data = s.companies[s.activeCompanyId] ?? EMPTY_BOOKS;
    syncMoneyFormatFromData(data);
    return data;
  });
}

if (typeof window !== "undefined") {
  useFinanceStore.subscribe((s) => {
    const data = s.companies[s.activeCompanyId];
    if (data) syncMoneyFormatFromData(data);
  });
}

let boot: Promise<void> | null = null;

/** Rehydrate IndexedDB once, then seed Pacific Harbor if this browser has no file yet. */
export function bootBooks(): Promise<void> {
  if (!boot) {
    boot = Promise.resolve(useFinanceStore.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        useFinanceStore.getState().ensureBooks();
        useFinanceStore.getState().hydrate();
        const s = useFinanceStore.getState();
        if (Object.keys(s.companies).length > 0) void writeLocalBackups(s.companies);
        watchPersistentStorage();
      });
  }
  return boot;
}

if (typeof window !== "undefined") {
  void bootBooks();
}
