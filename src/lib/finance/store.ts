import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addBank,
  addCustomer,
  addDeposit,
  addExpense,
  addVendor,
  applyCustomerPayments,
  createBill,
  createCashSale,
  createInvoice,
  issueCheck,
  payBill,
  recordInvoicePayment,
  removeBank,
  removeBill,
  removeBudget,
  removeCashLines,
  removeCheck,
  removeCustomer,
  removeInvoice,
  removeReceipt,
  removeVendor,
  reorderBills,
  reorderCustomers,
  reorderReceipts,
  reorderVendors,
  rescheduleCashLine,
  setCheckStatus,
  transferBanks,
  updateBank,
  updateBillRecord,
  updateCheck,
  updateCustomer,
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
import { createSeed, emptyBooks, SAMPLE_COMPANY_ID } from "./seed";
import { booksStorage, createDebouncedPersistStorage } from "./storage";
import { requestPersistentStorage } from "./storage-usage";
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
    nextNumbers: next.nextNumbers,
  };
}

const UNDO_MAX = 40;

function snapshot(data: FinanceData): FinanceData {
  return structuredClone(sliceData(data));
}

function clearHistory(): Pick<FinanceState, "undoStack" | "redoStack"> {
  return { undoStack: [], redoStack: [] };
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
    const wrapped = wrapLegacy(persisted);
    if (wrapped.companies[SAMPLE_COMPANY_ID]) wrapped.companies[SAMPLE_COMPANY_ID] = createSeed();
    return wrapped;
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
  if (version < 14 && companies[SAMPLE_COMPANY_ID]) {
    companies[SAMPLE_COMPANY_ID] = createSeed();
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
  patch: (fn: DataFn) => void;
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
  removeCashLines: (lines: Parameters<typeof removeCashLines>[1]) => void;
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
  undoStack: FinanceData[];
  redoStack: FinanceData[];
  undo: () => boolean;
  redo: () => boolean;
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
      const apply = (fn: DataFn) => {
        const s = get();
        const id = s.activeCompanyId;
        const current = s.companies[id] ?? emptyBooks();
        const next = sliceData(fn(current));
        set({
          companies: { ...s.companies, [id]: next },
          undoStack: [...(s.undoStack ?? []), snapshot(current)].slice(-UNDO_MAX),
          redoStack: [],
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
        patch: apply,
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
        addBank: (input) => apply((d) => addBank(d, input)),
        updateBank: (id, patch) => apply((d) => updateBank(d, id, patch)),
        removeBank: (id) => apply((d) => removeBank(d, id)),
        addCustomer: (input) => apply((d) => addCustomer(d, input)),
        updateCustomer: (id, patch) => apply((d) => updateCustomer(d, id, patch)),
        removeCustomer: (id) => apply((d) => removeCustomer(d, id)),
        reorderCustomers: (ids) => apply((d) => reorderCustomers(d, ids)),
        addVendor: (input) => apply((d) => addVendor(d, input)),
        updateVendor: (id, patch) => apply((d) => updateVendor(d, id, patch)),
        removeVendor: (id) => apply((d) => removeVendor(d, id)),
        reorderVendors: (ids) => apply((d) => reorderVendors(d, ids)),
        issueCheck: (input) => apply((d) => issueCheck(d, input)),
        setCheckStatus: (id, status) => apply((d) => setCheckStatus(d, id, status)),
        removeCheck: (id) => apply((d) => removeCheck(d, id)),
        rescheduleCashLine: (input) => apply((d) => rescheduleCashLine(d, input)),
        createInvoice: (input) => apply((d) => createInvoice(d, input)),
        recordInvoicePayment: (input) => apply((d) => recordInvoicePayment(d, input)),
        applyCustomerPayments: (input) => apply((d) => applyCustomerPayments(d, input)),
        voidInvoice: (id) => apply((d) => voidInvoice(d, id)),
        removeInvoice: (id) => apply((d) => removeInvoice(d, id)),
        createCashSale: (input) => apply((d) => createCashSale(d, input)),
        voidReceipt: (id) => apply((d) => voidReceipt(d, id)),
        removeReceipt: (id) => apply((d) => removeReceipt(d, id)),
        reorderReceipts: (ids) => apply((d) => reorderReceipts(d, ids)),
        createBill: (input) => apply((d) => createBill(d, input)),
        payBill: (input) => apply((d) => payBill(d, input)),
        voidBill: (id) => apply((d) => voidBill(d, id)),
        removeBill: (id) => apply((d) => removeBill(d, id)),
        reorderBills: (ids) => apply((d) => reorderBills(d, ids)),
        removeCashLines: (lines) => apply((d) => removeCashLines(d, lines)),
        addDeposit: (input) => apply((d) => addDeposit(d, input)),
        addExpense: (input) => apply((d) => addExpense(d, input)),
        transferBanks: (input) => apply((d) => transferBanks(d, input)),
        upsertBudget: (item) => apply((d) => upsertBudget(d, item)),
        removeBudget: (id) => apply((d) => removeBudget(d, id)),
        updateSettings: (patch) => apply((d) => updateSettings(d, patch)),
        updateCheck: (id, patch) => apply((d) => updateCheck(d, id, patch)),
        updateReceipt: (id, patch) => apply((d) => updateReceipt(d, id, patch)),
        updateBillRecord: (id, patch) => apply((d) => updateBillRecord(d, id, patch)),
        updateJournalEntry: (id, patch) => apply((d) => updateJournalEntry(d, id, patch)),
        updateInvoiceRecord: (id, patch) => apply((d) => updateInvoiceRecord(d, id, patch)),
        reassignCashBank: (input) => apply((d) => reassignCashBank(d, input)),
        reassignCashBanks: (lines, bankId) => apply((d) => reassignCashBanks(d, lines, bankId)),
        setCashRecon: (input) => apply((d) => setCashRecon(d, input)),
        purgeClosedThrough: (throughDate) => {
          const s = get();
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const result = purgeClosedThrough(current, throughDate);
          set({
            companies: { ...s.companies, [id]: sliceData(result.data) },
            undoStack: [...(s.undoStack ?? []), snapshot(current)].slice(-UNDO_MAX),
            redoStack: [],
          });
          return result.removed;
        },
        closeBooks: (throughDate, packetPrinted) => apply((d) => closeBooks(d, throughDate, packetPrinted)),
        reopenBooks: (reason) => apply((d) => reopenBooks(d, reason)),
        finishRecon: (input) => apply((d) => finishRecon(d, input)),
        undoLastRecon: (bankId) => apply((d) => undoLastRecon(d, bankId)),
        postReconAdjustment: (input) => {
          let journalId = "";
          apply((d) => {
            const result = postReconAdjustment(d, input);
            journalId = result.journalId;
            return result.data;
          });
          return journalId;
        },
        mergeCustomers: (keepId, dropId) => apply((d) => mergeCustomers(d, keepId, dropId)),
        mergeVendors: (keepId, dropId) => apply((d) => mergeVendors(d, keepId, dropId)),
        upsertRecurring: (item) => apply((d) => upsertRecurring(d, item)),
        removeRecurring: (id) => apply((d) => removeRecurring(d, id)),
        postRecurring: (id) => apply((d) => postRecurring(d, id)),
        postDueRecurring: (through) => {
          const s = get();
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          const result = postDueRecurring(current, through);
          set({
            companies: { ...s.companies, [id]: sliceData(result.data) },
            undoStack: [...(s.undoStack ?? []), snapshot(current)].slice(-UNDO_MAX),
            redoStack: [],
          });
          return result.posted;
        },
        openRecord: null,
        openTxn: (kind, id) => set({ openRecord: { kind, id } }),
        closeTxn: () => set({ openRecord: null }),
        undo: () => {
          const s = get();
          const stack = s.undoStack ?? [];
          const prev = stack.at(-1);
          if (!prev) return false;
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          set({
            companies: { ...s.companies, [id]: sliceData(prev) },
            undoStack: stack.slice(0, -1),
            redoStack: [...(s.redoStack ?? []), snapshot(current)].slice(-UNDO_MAX),
            openRecord: null,
          });
          return true;
        },
        redo: () => {
          const s = get();
          const stack = s.redoStack ?? [];
          const next = stack.at(-1);
          if (!next) return false;
          const id = s.activeCompanyId;
          const current = s.companies[id] ?? emptyBooks();
          set({
            companies: { ...s.companies, [id]: sliceData(next) },
            redoStack: stack.slice(0, -1),
            undoStack: [...(s.undoStack ?? []), snapshot(current)].slice(-UNDO_MAX),
            openRecord: null,
          });
          return true;
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

export function useFinanceData(): FinanceData {
  return useFinanceStore((s) => s.companies[s.activeCompanyId] ?? EMPTY_BOOKS);
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
        void requestPersistentStorage();
      });
  }
  return boot;
}

if (typeof window !== "undefined") {
  void bootBooks();
}
