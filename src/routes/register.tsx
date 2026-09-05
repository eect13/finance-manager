import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Printer, SlidersHorizontal } from "lucide-react";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ColumnChips } from "@/components/column-chips";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle, setCashDragImage } from "@/components/drag-handle";
import { usePhoneMoveDrag } from "@/components/use-phone-move-drag";
import { PhoneLayoutToggle } from "@/components/phone-layout-toggle";
import { PhoneSwipe } from "@/components/phone-swipe";
import {
  REGISTER_PHONE_LAYOUT_KEY,
  readPhoneLayout,
  writePhoneLayout,
  type PhoneLayout,
  usePhoneUi,
} from "@/lib/phone-layout";
import { CsvButton } from "@/components/export-menu";
import { ListFilters } from "@/components/list-filters";
import { Money } from "@/components/money";
import { RegisterPrint, requestPrint } from "@/components/print-preview";
import { RegisterPost } from "@/components/register-post";
import { RegisterSwap } from "@/components/register-swap";
import { ShopTick } from "@/components/shop-tick";
import { ColResize, SortHeader } from "@/components/sort-header";
import { CheckBadge, ReceiptBadge, ReconBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cashRegisterRows } from "@/lib/finance/export";
import { fitColumnWidth, widthsMatch } from "@/lib/finance/fit-column";
import { formatDate, formatRegisterDate, formatShortDate } from "@/lib/finance/format";
import { openCashLine, stopOpen } from "@/lib/finance/open-record";
import {
  boardDates,
  cashBook,
  datePresetRange,
  deletableLines,
  filterCashLines,
  filterDirection,
  isTransferMate,
  KIND_LABEL,
  movableLines,
  openingForBanks,
  rescheduleKind,
  totals,
  transferDragCaption,
  TYPE_FILTERS,
  withOpening,
  withRunningBalance,
  type BalancedCashLine,
  type CashDirection,
  type CashLine,
  type CashTypeFilter,
  type DatePreset,
} from "@/lib/finance/register";
import { useEntrySort, type SortDir } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import {
  DEFAULT_REGISTER_COLS,
  REGISTER_COL_CLASS,
  REGISTER_COLS,
  toggleRegisterCol,
  type RegisterColId,
  type RegisterCols,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const UI_KEY = "finance-manager-register-ui";
const FIT_MARK = "finance-manager-colfit";
const FIT_VERSION = "content-1";
const MONTH_RANGE = datePresetRange("month");
const CHECK_COL = 40;
const COL_MIN = 56;
const COL_MAX = 420;
const DEFAULT_COL_WIDTHS = {
  check: CHECK_COL,
  date: 112,
  type: 100,
  number: 88,
  payee: 200,
  memo: 148,
  bank: 128,
  payment: 120,
  deposit: 120,
  balance: 128,
  status: 108,
};
/** Narrower defaults for phone so Register fits more useful columns before scrolling. */
const MOBILE_COL_WIDTHS: typeof DEFAULT_COL_WIDTHS = {
  check: 40,
  date: 56,
  type: 70,
  number: 64,
  payee: 140,
  memo: 88,
  bank: 80,
  payment: 88,
  deposit: 88,
  balance: 96,
  status: 64,
};

/** Phone: Date + Payee + money. Hide type/number/memo/bank/status until View. */
type ColWidths = typeof DEFAULT_COL_WIDTHS;

function isPhoneUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))").matches;
}

function defaultColWidths(): ColWidths {
  return isPhoneUi() ? { ...MOBILE_COL_WIDTHS } : { ...DEFAULT_COL_WIDTHS };
}

function clampCol(n: number, min = COL_MIN, max = COL_MAX) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseColWidths(raw: unknown): ColWidths {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = defaultColWidths();
  for (const key of Object.keys(next) as Array<keyof ColWidths>) {
    const value = src[key];
    if (typeof value === "number" && Number.isFinite(value) && key !== "check") next[key] = clampCol(value);
  }
  return next;
}

const SORT_OPTIONS = [
  { value: "date:asc", label: "Date · oldest" },
  { value: "date:desc", label: "Date · newest" },
  { value: "type:asc", label: "Type" },
  { value: "number:asc", label: "Number" },
  { value: "payee:asc", label: "Payee A–Z" },
  { value: "payee:desc", label: "Payee Z–A" },
  { value: "memo:asc", label: "Memo" },
  { value: "bank:asc", label: "Bank" },
  { value: "payment:desc", label: "Payment" },
  { value: "deposit:desc", label: "Deposit" },
];

const COL_LABELS: Record<RegisterColId, string> = {
  date: "Date",
  type: "Type",
  number: "No.",
  payee: "Payee",
  memo: "Memo",
  bank: "Bank",
  payment: "Payment",
  deposit: "Deposit",
  balance: "Balance",
  status: "Status",
};

function RegisterPage() {
  const data = useFinanceData();
  const rescheduleCashLine = useFinanceStore((s) => s.rescheduleCashLine);
  const removeCashLines = useFinanceStore((s) => s.removeCashLines);
  const reassignCashBank = useFinanceStore((s) => s.reassignCashBank);
  const setCashRecon = useFinanceStore((s) => s.setCashRecon);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const patch = useFinanceStore((s) => s.patch);
  const [bankFilter, setBankFilter] = useState("all");
  const [direction, setDirection] = useState<CashDirection>("all");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<CashTypeFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [dateFrom, setDateFrom] = useState(MONTH_RANGE.from);
  const [dateTo, setDateTo] = useState(MONTH_RANGE.to);
  const [uiReady, setUiReady] = useState(false);
  const [dragOn, setDragOn] = useState(false);
  const [phoneLayout, setPhoneLayout] = useState<PhoneLayout>(() =>
    readPhoneLayout(REGISTER_PHONE_LAYOUT_KEY, "grid"),
  );
  const phone = usePhoneUi();
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [overRow, setOverRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<"all" | "selected" | null>(null);
  const [editLine, setEditLine] = useState<CashLine | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<ColWidths>(defaultColWidths);

  const [needFit, setNeedFit] = useState(false);
  const fontSize = data.settings.registerFontSize ?? 12;
  const cols = data.settings.registerColumns ?? DEFAULT_REGISTER_COLS;
  const dataRef = useRef(data);
  dataRef.current = data;
  const banksRef = useRef(data.banks);
  banksRef.current = data.banks;

  useLayoutEffect(() => {
    let forceContent = false;
    try {
      forceContent = localStorage.getItem(FIT_MARK) !== FIT_VERSION;
      if (forceContent) localStorage.setItem(FIT_MARK, FIT_VERSION);
    } catch {
      forceContent = true;
    }
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        if (typeof saved.bankFilter === "string") setBankFilter(saved.bankFilter);
        if (saved.colWidths && !forceContent && !isPhoneUi()) {
          const parsed = parseColWidths(saved.colWidths);
          setColWidths(parsed);
          setNeedFit(widthsMatch({ ...parsed, check: DEFAULT_COL_WIDTHS.check }, DEFAULT_COL_WIDTHS));
        } else if (isPhoneUi()) {
          setColWidths(defaultColWidths());
          setNeedFit(false);
        } else setNeedFit(true);
        if (saved.datePreset === "month" || saved.datePreset === "year" || saved.datePreset === "all") {
          const range = datePresetRange(saved.datePreset);
          setDatePreset(saved.datePreset);
          setDateFrom(range.from);
          setDateTo(range.to);
        } else if (saved.datePreset === "custom") {
          setDatePreset("custom");
          setDateFrom(typeof saved.dateFrom === "string" ? saved.dateFrom : "");
          setDateTo(typeof saved.dateTo === "string" ? saved.dateTo : "");
        }
      } else setNeedFit(true);
    } catch {
      setNeedFit(true);
    }
    setUiReady(true);
  }, []);

  useEffect(() => {
    if (!uiReady) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(UI_KEY, JSON.stringify({ bankFilter, datePreset, dateFrom, dateTo, colWidths }));
      } catch {
        /* quota */
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [uiReady, bankFilter, datePreset, dateFrom, dateTo, colWidths]);

  function applyPreset(preset: DatePreset) {
    setDatePreset(preset);
    if (preset === "month" || preset === "year" || preset === "all") {
      const range = datePresetRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  function setRegisterCols(mutate: (current: RegisterCols) => RegisterCols) {
    patch((d) => ({
      ...d,
      settings: {
        ...d.settings,
        registerColumns: mutate(d.settings.registerColumns ?? DEFAULT_REGISTER_COLS),
      },
    }), "change register columns");
  }

  const bankId = bankFilter === "all" ? undefined : bankFilter;
  const book = useMemo(() => cashBook(data, bankId, { dateFrom, dateTo }), [data, bankId, dateFrom, dateTo]);
  const opening = book.opening;
  const raw = book.lines;
  const filtered = useMemo(
    () => filterCashLines(raw, { name: nameFilter, type: typeFilter }),
    [raw, nameFilter, typeFilter],
  );
  const searching = Boolean(nameFilter.trim() || typeFilter !== "all");
  const bankOpen = useMemo(() => openingForBanks(data, bankId), [data, bankId]);
  const asOf = useMemo(
    () =>
      dateFrom
        ? { date: dateFrom, forward: opening !== bankOpen, closedThrough: book.freezeThrough || undefined }
        : undefined,
    [dateFrom, opening, bankOpen, book.freezeThrough],
  );
  // Balance from full window; In/Out only filters which rows show.
  const windowed = useMemo(() => withOpening(raw, opening, asOf), [raw, opening, asOf]);
  const windowBalanced = useMemo(() => withRunningBalance(windowed), [windowed]);
  const tableSource = useMemo((): BalancedCashLine[] => {
    const base = searching ? filtered : withOpening(filtered, opening, asOf);
    const balMap = new Map(windowBalanced.map((l) => [l.id, l.balance]));
    const withBal: BalancedCashLine[] = base.map((l) => ({ ...l, balance: balMap.get(l.id) ?? 0 }));
    return filterDirection(withBal, direction) as BalancedCashLine[];
  }, [searching, filtered, opening, asOf, windowBalanced, direction]);
  const balanced = tableSource;
  const stats = useMemo(() => totals(raw), [raw]);
  const ending = windowBalanced.at(-1)?.balance ?? opening;
  const dates = useMemo(() => boardDates(filtered, extraDates), [filtered, extraDates]);
  const deletable = useMemo(() => deletableLines(balanced), [balanced]);
  const movable = useMemo(() => movableLines(balanced), [balanced]);
  const keepIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of movable) ids.add(line.id);
    for (const line of deletable) ids.add(line.id);
    return ids;
  }, [movable, deletable]);
  const keepIdsRef = useRef(keepIds);
  keepIdsRef.current = keepIds;
  const selectedIds = useMemo(() => selected.filter((id) => keepIds.has(id)), [selected, keepIds]);
  const selectedOn = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allOn = keepIds.size > 0 && [...keepIds].every((id) => selectedOn.has(id));
  const someOn = selectedIds.length > 0 && !allOn;
  const openingRow = useMemo(() => balanced.find((l) => l.kind === "opening"), [balanced]);
  const dataRows = useMemo(() => balanced.filter((l) => l.kind !== "opening"), [balanced]);
  const getters = useMemo(
    () => ({
      date: (l: BalancedCashLine) => l.date,
      type: (l: BalancedCashLine) => KIND_LABEL[l.kind],
      number: (l: BalancedCashLine) => l.number,
      payee: (l: BalancedCashLine) => l.party,
      memo: (l: BalancedCashLine) => l.memo,
      bank: (l: BalancedCashLine) => data.banks.find((b) => b.id === l.bankId)?.nickname ?? "",
      payment: (l: BalancedCashLine) => l.payment,
      deposit: (l: BalancedCashLine) => l.deposit,
    }),
    [data.banks],
  );
  const sort = useEntrySort(dataRows, "date", getters, "asc", true);
  const display = useMemo(
    () => (openingRow && !searching ? [openingRow, ...sort.sorted] : sort.sorted),
    [openingRow, searching, sort.sorted],
  );
  const liveBanks = data.banks.filter((b) => !b.archived);
  const bankLabel = bankFilter === "all" ? "All banks" : (data.banks.find((b) => b.id === bankFilter)?.nickname ?? "");
  const scrollToRow = useRef<(index: number) => void>(() => {});
  const displayRef = useRef(display);
  displayRef.current = display;
  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;
  const draggingLine = useMemo(
    () => (dragging ? (display.find((l) => l.id === dragging) ?? filtered.find((l) => l.id === dragging) ?? null) : null),
    [dragging, display, filtered],
  );
  const draggingSourceId = draggingLine?.kind === "transfer" ? draggingLine.sourceId : null;

  useEffect(() => {
    if (activeId && display.some((l) => l.id === activeId)) return;
    const first = display.find((l) => l.kind !== "opening");
    setActiveId(first?.id ?? null);
  }, [display, activeId]);

  useEffect(() => {
    if (bankFilter === "all") return;
    if (!data.banks.some((b) => !b.archived && b.id === bankFilter)) setBankFilter("all");
  }, [bankFilter, data.banks]);

  const moveLine = useCallback(
    (line: CashLine, date: string) => {
      const kind = rescheduleKind(line.kind);
      if (!kind || !line.reschedulable) {
        toast.error("This line can't change date (reconciled or locked).");
        return;
      }
      if (line.date === date) {
        toast.message(`Already on ${formatDate(date)}.`);
        return;
      }
      try {
        rescheduleCashLine({ kind, sourceId: line.sourceId, date });
        if (line.kind === "transfer") toast.success(`Transfer moved to ${formatDate(date)} — both banks.`);
        else toast.success(`${line.number || KIND_LABEL[line.kind]} moved to ${formatDate(date)}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not move.");
      }
    },
    [rescheduleCashLine],
  );

  const swapBank = useCallback(
    (line: CashLine, nextBankId: string) => {
      if (!line.reassignable || line.bankId === nextBankId) return;
      const dest = banksRef.current.find((b) => b.id === nextBankId);
      try {
        reassignCashBank({ kind: line.kind, sourceId: line.sourceId, bankId: nextBankId, fromBankId: line.bankId });
        toast.success(`${line.party} moved to ${dest?.nickname ?? "bank"}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not swap bank.");
      }
    },
    [reassignCashBank],
  );

  const parseDrag = useCallback(
    (e: DragEvent) => {
      try {
        const rawId = e.dataTransfer.getData("text/plain");
        return filtered.find((l) => l.id === rawId) ?? null;
      } catch {
        return null;
      }
    },
    [filtered],
  );

  const toggleOne = useCallback((id: string) => {
    if (!keepIdsRef.current.has(id)) {
      toast.error("On a finished statement. Undo that rec to change this line.");
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  function toggleAll(on: boolean) {
    setSelected(on ? [...keepIds] : []);
  }

  const handleOpen = useCallback((line: CashLine) => {
    if (line.kind === "opening") return;
    if (line.kind === "bill-payment" || line.kind === "payment") {
      openCashLine(line, dataRef.current);
      return;
    }
    setEditLine(line);
  }, []);

  const onFitted = useCallback((next: ColWidths) => {
    setColWidths(next);
    setNeedFit(false);
  }, []);

  const cycleRecon = useCallback(
    (line: CashLine) => {
      if (line.kind === "opening" || line.status === "voided" || line.status === "bounced" || line.status === "void") return;
      if (line.recon === "reconciled") {
        toast.error("On a finished statement. Undo that rec to change it.");
        return;
      }
      const next = line.recon === "cleared" ? "pending" : "cleared";
      try {
        setCashRecon({ kind: line.kind, sourceId: line.sourceId, recon: next });
        toast.success(next === "cleared" ? "Cleared." : "Pending.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update status.");
      }
    },
    [setCashRecon],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        editLine ||
        target?.closest(
          "input, textarea, select, [contenteditable='true'], [role='listbox'], [role='dialog'], [data-radix-select-content], [data-radix-popper-content-wrapper]",
        )
      )
        return;
      const rows = display.filter((l) => l.kind !== "opening");
      if (rows.length === 0) return;
      const idx = Math.max(0, rows.findIndex((l) => l.id === activeId));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = rows[Math.min(rows.length - 1, idx + 1)];
        if (!next) return;
        setActiveId(next.id);
        const i = display.findIndex((l) => l.id === next.id);
        if (i >= 0) scrollToRow.current(i);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = rows[Math.max(0, idx - 1)];
        if (!next) return;
        setActiveId(next.id);
        const i = display.findIndex((l) => l.id === next.id);
        if (i >= 0) scrollToRow.current(i);
        return;
      }
      const row = rows[idx];
      if (!row) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleOpen(row);
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        toggleOne(row.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editLine, display, activeId, handleOpen, toggleOne]);

  const resolveLine = useCallback((id: string) => {
    return displayRef.current.find((l) => l.id === id) ?? filteredRef.current.find((l) => l.id === id) ?? null;
  }, []);

  const phoneMove = usePhoneMoveDrag({
    enabled: Boolean(phone && dragOn),
    onDragId: setDragging,
    onOverDate: setOverDate,
    onOverRow: setOverRow,
    onDrop: (lineId, date) => {
      const line = resolveLine(lineId);
      if (line) moveLine(line, date);
    },
    captionFor: (id) => {
      const line = resolveLine(id);
      return line ? transferDragCaption(line) : "Move";
    },
    onTapWithoutDrag: () => toast.message("Drag onto a date chip or another row."),
  });

  const clearPhoneMove = phoneMove.clear;
  const handleDragStart = useCallback((id: string) => setDragging(id), []);
  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setOverDate(null);
    setOverRow(null);
    clearPhoneMove();
  }, [clearPhoneMove]);
  const handleDropRow = useCallback(
    (target: CashLine, e: DragEvent) => {
      const line = parseDrag(e);
      setOverRow(null);
      setDragging(null);
      if (line && target.kind !== "opening") moveLine(line, target.date);
    },
    [parseDrag, moveLine],
  );

  function targets(ids: string[]) {
    return deletable.filter((l) => ids.includes(l.id)).map((l) => ({ kind: l.kind, sourceId: l.sourceId }));
  }

  function runDelete(mode: "all" | "selected") {
    const ids = mode === "all" ? deletable.map((l) => l.id) : selectedIds;
    if (ids.length === 0) return;
    try {
      removeCashLines(targets(ids));
      toast.success(ids.length === 1 ? "Entry deleted." : `${ids.length} entries deleted.`);
      setSelected([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setConfirm(null);
    }
  }

  const deleteCount = confirm === "all" ? deletable.length : selectedIds.length;
  const requireDeletePhrase = confirm === "all" || deleteCount > 1;

  return (
    <AppShell
      title="Bank register"
      description="Inflows and outflows across every bank. Park receipts in safekeeping, then move them when they land."
      align="center"
      compact
      wide
      actions={
        <>
          <CsvButton filename="bank-register.csv" rows={cashRegisterRows(data, bankId)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/reconcile">Reconcile</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/checks">Issue check</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/receipts">Receive</Link>
          </Button>
          <RegisterPost defaultBankId={bankId} edit={editLine} onClearEdit={() => setEditLine(null)} />
        </>
      }
    >
      {phoneMove.ghost}
      {data.settings.closedThrough ? (
        <p className="no-print mb-3 text-center text-xs text-muted-foreground">
          Closed through {formatDate(data.settings.closedThrough)}. Posting on or before that date is blocked.
        </p>
      ) : null}

      <div className="register-chrome no-print mb-3">
      <section className="register-summary flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-xs">
        <span>
          In <Money amount={stats.inflow} currency={data.settings.currency} className="text-credit font-medium" />
        </span>
        <span>
          Out <Money amount={stats.outflow} currency={data.settings.currency} className="text-debit font-medium" />
        </span>
        <span>
          Last balance <Money amount={ending} currency={data.settings.currency} className="font-medium" />
        </span>
        {dateFrom || dateTo ? (
          <span className="text-muted-foreground">
            {dateFrom ? formatShortDate(dateFrom) : "…"} – {dateTo ? formatShortDate(dateTo) : "…"}
          </span>
        ) : null}
      </section>

      <div className="register-sticky-chrome">
      <div className="register-toolbar">
        <Input
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Payee, number, memo"
          aria-label="Search register"
          className="register-toolbar-search h-11 min-h-11"
        />
        <div className="register-toolbar-actions">
          <RegisterFilters
            typeFilter={typeFilter}
            direction={direction}
            datePreset={datePreset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            sortValue={`${sort.key}:${sort.dir}`}
            onType={setTypeFilter}
            onDirection={setDirection}
            onPreset={applyPreset}
            onDateFrom={(v) => {
              setDatePreset("custom");
              setDateFrom(v);
            }}
            onDateTo={(v) => {
              setDatePreset("custom");
              setDateTo(v);
            }}
            onSort={(v) => {
              const [key, dir] = v.split(":");
              sort.set(key ?? "date", dir === "desc" ? "desc" : "asc");
            }}
            onClear={() => {
              setTypeFilter("all");
              setDirection("all");
              applyPreset("month");
            }}
          />
          <ViewOptions
            fontSize={fontSize}
            dragOn={dragOn}
            phoneLayout={phoneLayout}
            cols={cols}
            hiddenCount={REGISTER_COLS.filter((col) => !cols[col.id]).length}
            onFontSize={(n) => updateSettings({ registerFontSize: n })}
            onDragOn={(on) => {
              setDragOn(on);
              if (!on) {
                setDragging(null);
                setOverDate(null);
                setOverRow(null);
                phoneMove.clear();
              }
            }}
            onPhoneLayout={(next) => {
              setPhoneLayout(next);
              writePhoneLayout(REGISTER_PHONE_LAYOUT_KEY, next);
            }}
            onToggleCol={(id) => setRegisterCols((current) => toggleRegisterCol(current, id))}
            onShowAllCols={() => setRegisterCols(() => ({ ...DEFAULT_REGISTER_COLS }))}
          />
        </div>
      </div>

      <p className="mb-2 text-center text-xs text-muted-foreground no-print register-count-hint">
        {dataRows.length} {dataRows.length === 1 ? "entry" : "entries"}
        {searching ? " match" : ""}
        {selectedIds.length ? ` · ${selectedIds.length} selected` : ""}
        <span className="hidden sm:inline">
          {selectedIds.length ? "" : " · tick to delete or reassign bank — finished statements stay locked"}
        </span>
      </p>

      <div className="register-bank-tabs no-print mb-3 min-w-0" role="tablist" aria-label="Bank">
        <button
          type="button"
          role="tab"
          aria-selected={bankFilter === "all"}
          className={cn(bankFilter === "all" && "is-on")}
          onClick={() => setBankFilter("all")}
        >
          All banks
        </button>
        {liveBanks.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={bankFilter === b.id}
            className={cn(bankFilter === b.id && "is-on")}
            onClick={() => setBankFilter(b.id)}
          >
            {b.nickname}
          </button>
        ))}
      </div>
      {dragOn ? (
        <DateChips
          dates={dates}
          overDate={overDate}
          onOverDate={setOverDate}
          draggingId={dragging}
          onChipClick={() => {
            if (phoneMove.consumeChipClickGuard()) return;
            toast.message("Drag a grip onto a date chip or another row.");
          }}
          onDropDate={(date, e) => {
            const line = parseDrag(e) ?? (dragging ? filtered.find((l) => l.id === dragging) : null) ?? null;
            setOverDate(null);
            setDragging(null);
            if (line) moveLine(line, date);
          }}
          onAddDate={(date) => setExtraDates((prev) => (prev.includes(date) ? prev : [...prev, date]))}
        />
      ) : null}
      </div>
      </div>

      <div style={{ ["--register-font" as string]: `${fontSize}px` }}>
        {display.length === 0 ? (
          <div className="phone-empty no-print mb-3">
            <p className="text-sm font-medium">No register lines in this view</p>
            <p className="mt-1 text-xs text-muted-foreground">Widen the date range, clear filters, or post a check.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link to="/checks">Issue check</Link>
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyPreset("all")}>
                Show all dates
              </Button>
            </div>
          </div>
        ) : null}
        <RegisterTable
          lines={display}
          currency={data.settings.currency}
          banks={data.banks}
          cols={cols}
          colWidths={colWidths}
          needFit={needFit}
          lastBalance={display.at(-1)?.balance ?? ending}
          selected={selectedOn}
          hasSelectable={keepIds.size > 0}
          allOn={allOn}
          someOn={someOn}
          dragOn={dragOn}
          phoneLayout={phoneLayout}
          onPhoneLayout={(next) => {
            setPhoneLayout(next);
            writePhoneLayout(REGISTER_PHONE_LAYOUT_KEY, next);
          }}
          dragging={dragging}
          draggingSourceId={draggingSourceId}
          overRow={overRow}
          sortKey={sort.key}
          sortDir={sort.dir}
          activeId={activeId}
          scrollToRow={scrollToRow}
          onSort={sort.toggle}
          onColWidth={(id, next) =>
            setColWidths((prev) => ({
              ...prev,
              [id]: clampCol(next, id === "check" ? 36 : COL_MIN),
            }))
          }
          onFitted={onFitted}
          onToggle={toggleOne}
          onToggleAll={toggleAll}
          onOpen={handleOpen}
          onActivate={setActiveId}
          onCycleRecon={cycleRecon}
          onAskDelete={(id) => {
            setSelected([id]);
            setConfirm("selected");
          }}
          onSwap={swapBank}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onOverRow={setOverRow}
          onDropRow={handleDropRow}
          onPhoneMoveGrip={phoneMove.onGripPointerDown}
        />
      </div>

      {selectedIds.length > 0 ? (
        <div className={cn("register-select-bar no-print mt-3", phone && "phone-safe-bar")}>
          <div className="register-select-bar-inner mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2">
            <span className="text-sm font-medium tabular-nums shrink-0">{selectedIds.length} selected</span>
            <RegisterSwap
              banks={data.banks}
              lines={filtered}
              selectedIds={selectedIds}
              preferFromId={bankId}
              onSelectIds={setSelected}
              onMoved={() => setSelected([])}
              compact
            />
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button size="sm" variant="destructive" className="shrink-0" onClick={() => setConfirm("selected")}>
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      <RegisterPrint
        companyName={data.settings.companyName}
        companyAddress={data.settings.companyAddress}
        companyPhone={data.settings.companyPhone}
        companyEmail={data.settings.companyEmail}
        bankLabel={bankLabel}
        lines={display}
        banks={data.banks}
        currency={data.settings.currency}
        fontSize={fontSize}
        cols={cols}
      />

      <ConfirmDelete
        open={confirm !== null}
        title={confirm === "all" ? "Delete all visible entries?" : "Delete selected entries?"}
        body={
          confirm === "all"
            ? `Permanently removes ${deletable.length} ${deletable.length === 1 ? "line" : "lines"} from the books. Opening balance stays.`
            : `Permanently removes ${selectedIds.length} ${selectedIds.length === 1 ? "line" : "lines"} from the books.`
        }
        confirmLabel="Delete"
        requirePhrase={requireDeletePhrase ? "DELETE" : undefined}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) runDelete(confirm);
        }}
      />
    </AppShell>
  );
}

function RegisterFilters({
  typeFilter,
  direction,
  datePreset,
  dateFrom,
  dateTo,
  sortValue,
  onType,
  onDirection,
  onPreset,
  onDateFrom,
  onDateTo,
  onSort,
  onClear,
}: {
  typeFilter: CashTypeFilter;
  direction: CashDirection;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  sortValue: string;
  onType: (v: CashTypeFilter) => void;
  onDirection: (v: CashDirection) => void;
  onPreset: (preset: DatePreset) => void;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onSort: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <ListFilters
      datePreset={datePreset}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onPreset={onPreset}
      onDateFrom={onDateFrom}
      onDateTo={onDateTo}
      defaultPreset="month"
      selects={[
        { label: "Type", value: typeFilter, options: TYPE_FILTERS, onChange: (v) => onType(v as CashTypeFilter) },
        {
          label: "Direction",
          value: direction,
          options: [
            { value: "all", label: "In and out" },
            { value: "in", label: "Incoming only" },
            { value: "out", label: "Outgoing only" },
          ],
          onChange: (v) => onDirection(v as CashDirection),
        },
      ]}
      sortValue={sortValue}
      sortOptions={SORT_OPTIONS}
      onSort={onSort}
      onClear={onClear}
    />
  );
}

function ViewOptions({
  fontSize,
  dragOn,
  phoneLayout,
  cols,
  hiddenCount,
  onFontSize,
  onDragOn,
  onPhoneLayout,
  onToggleCol,
  onShowAllCols,
}: {
  fontSize: number;
  dragOn: boolean;
  phoneLayout: PhoneLayout;
  cols: RegisterCols;
  hiddenCount: number;
  onFontSize: (n: number) => void;
  onDragOn: (on: boolean) => void;
  onPhoneLayout: (next: PhoneLayout) => void;
  onToggleCol: (id: RegisterColId) => void;
  onShowAllCols: () => void;
}) {
  const phone = isPhoneUi();
  const [open, setOpen] = useState(false);

  const body = (
    <>
      {phone ? (
        <div className="mb-3 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <div className="min-w-0">
            <Label htmlFor="drag-dates" className="text-sm">
              Move dates
            </Label>
            <p className="text-[0.7rem] text-muted-foreground">Drag a grip onto a date or row</p>
          </div>
          <Switch id="drag-dates" checked={dragOn} onCheckedChange={onDragOn} />
        </div>
      ) : (
        <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
          <div className="min-w-0">
            <Label htmlFor="drag-dates-desk" className="text-sm">
              Move dates
            </Label>
            <p className="text-[0.7rem] text-muted-foreground">Drag a grip onto a date chip</p>
          </div>
          <Switch id="drag-dates-desk" checked={dragOn} onCheckedChange={onDragOn} />
        </div>
      )}
      {phone ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Layout</span>
          <PhoneLayoutToggle value={phoneLayout} onChange={onPhoneLayout} />
        </div>
      ) : null}
      <ColumnChips cols={cols} onToggle={onToggleCol} onShowAll={onShowAllCols} />
      <label className="mt-3 mb-3 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Resize type {fontSize}px</span>
        <input
          type="range"
          min={10}
          max={18}
          step={1}
          value={fontSize}
          aria-label="Register font size"
          className="w-full accent-primary"
          onChange={(e) => onFontSize(Number(e.target.value))}
        />
      </label>
    </>
  );

  if (phone) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11 justify-start phone-press"
          aria-label="View options"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal />
          View
          {hiddenCount ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.65rem] font-medium">
              {hiddenCount}
            </span>
          ) : null}
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="gap-0 px-4"
            onPointerDownOutside={(event) => {
              const el = event.target as HTMLElement | null;
              if (el?.closest("[data-radix-select-content]")) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              const el = event.target as HTMLElement | null;
              if (el?.closest("[data-radix-select-content]")) event.preventDefault();
            }}
            onFocusOutside={(event) => {
              const el = event.target as HTMLElement | null;
              if (el?.closest("[data-radix-select-content]")) event.preventDefault();
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-base font-semibold">View</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
            <div className="max-h-[min(75dvh,36rem)] overflow-y-auto pb-2">{body}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-11 min-h-11 justify-start" aria-label="View options">
          <SlidersHorizontal />
          View
          {hiddenCount ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.65rem] font-medium">
              {hiddenCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {body}
      </PopoverContent>
    </Popover>
  );
}

function DateChips({
  dates,
  overDate,
  onOverDate,
  onDropDate,
  onChipClick,
  draggingId,
  onAddDate,
}: {
  dates: string[];
  overDate: string | null;
  onOverDate: (date: string | null) => void;
  onDropDate: (date: string, e: DragEvent) => void;
  onChipClick?: () => void;
  draggingId?: string | null;
  onAddDate: (date: string) => void;
}) {
  return (
    <div
      className="register-date-chips no-print mb-2 flex min-w-0 items-center gap-1 overflow-x-auto pb-1"
      data-armed={draggingId ? "true" : undefined}
    >
      {dates.map((date) => (
        <button
          key={date}
          type="button"
          data-move-date={date}
          onClick={() => {
            onChipClick?.();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            onOverDate(date);
          }}
          onDragLeave={() => onOverDate(null)}
          onDrop={(e) => {
            e.preventDefault();
            onDropDate(date, e);
          }}
          data-drop={overDate === date ? "true" : undefined}
          className={cn(
            "inline-flex h-8 shrink-0 items-center rounded-full bg-card px-3 text-xs elevation",
            draggingId && "ring-1 ring-primary/50",
          )}
        >
          {formatShortDate(date)}
        </button>
      ))}
      <label className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-muted px-3 text-xs">
        <span className="text-muted-foreground">Add date</span>
        <Input
          type="date"
          className="h-7 w-32 border-0 bg-transparent px-1 shadow-none"
          onChange={(e) => {
            if (e.target.value) onAddDate(e.target.value);
          }}
        />
      </label>
    </div>
  );
}

type BankLite = { id: string; nickname: string; archived?: boolean };

function RegisterTable({
  lines,
  currency,
  banks,
  cols,
  colWidths,
  needFit,
  lastBalance,
  selected,
  hasSelectable,
  allOn,
  someOn,
  dragOn,
  phoneLayout,
  onPhoneLayout,
  dragging,
  draggingSourceId,
  overRow,
  sortKey,
  sortDir,
  activeId,
  scrollToRow,
  onSort,
  onColWidth,
  onFitted,
  onToggle,
  onToggleAll,
  onOpen,
  onActivate,
  onCycleRecon,
  onAskDelete,
  onSwap,
  onDragStart,
  onDragEnd,
  onOverRow,
  onDropRow,
  onPhoneMoveGrip,
}: {
  lines: BalancedCashLine[];
  currency: string;
  banks: BankLite[];
  cols: RegisterCols;
  colWidths: ColWidths;
  needFit: boolean;
  lastBalance: number;
  selected: Set<string>;
  hasSelectable: boolean;
  allOn: boolean;
  someOn: boolean;
  dragOn: boolean;
  phoneLayout: PhoneLayout;
  onPhoneLayout: (next: PhoneLayout) => void;
  dragging: string | null;
  draggingSourceId: string | null;
  overRow: string | null;
  sortKey: string;
  sortDir: SortDir;
  activeId: string | null;
  scrollToRow: MutableRefObject<(index: number) => void>;
  onSort: (column: string) => void;
  onColWidth: (id: keyof ColWidths, next: number) => void;
  onFitted: (next: ColWidths) => void;
  onToggle: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  onOpen: (line: CashLine) => void;
  onActivate: (id: string) => void;
  onCycleRecon: (line: CashLine) => void;
  onAskDelete: (id: string) => void;
  onSwap: (line: CashLine, bankId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOverRow: (id: string | null) => void;
  onDropRow: (line: CashLine, e: DragEvent) => void;
  onPhoneMoveGrip: (lineId: string, e: ReactPointerEvent) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => document.querySelector("[data-workspace-scroll]"),
    estimateSize: () => 44,
    overscan: 12,
    getItemKey: (index) => lines[index]?.id ?? index,
  });
  scrollToRow.current = (index) => {
    virtualizer.scrollToIndex(index, { align: "auto" });
  };
  const { outTotal, inTotal } = useMemo(() => {
    let out = 0;
    let inn = 0;
    for (const line of lines) {
      if (line.kind === "opening") continue;
      out += line.payment;
      inn += line.deposit;
    }
    return { outTotal: out, inTotal: inn };
  }, [lines]);

  useEffect(() => {
    if (!needFit) return;
    let cancelled = false;
    let attempts = 0;
    function tryFit() {
      if (cancelled) return;
      const tableEl = wrapRef.current?.querySelector("table");
      if (!tableEl || !tableEl.querySelector("td.col-date, td.col-payee")) {
        if (attempts++ < 48) requestAnimationFrame(tryFit);
        return;
      }
      const next = { ...colWidths };
      for (const col of REGISTER_COLS) {
        if (!cols[col.id]) continue;
        const cls = REGISTER_COL_CLASS[col.id].split(" ")[0];
        next[col.id] = fitColumnWidth({
          table: tableEl,
          selector: `td.${cls}`,
          header: COL_LABELS[col.id],
          min: COL_MIN,
          max: COL_MAX,
        });
      }
      onFitted(next);
    }
    tryFit();
    return () => {
      cancelled = true;
    };
    // Fit once when the window first paints cells.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needFit, lines.length]);

  if (lines.length === 0) {
    return (
      <div className="phone-empty text-sm text-muted-foreground">
        No activity matches these filters.
      </div>
    );
  }

  const vItems = virtualizer.getVirtualItems();
  const first = vItems[0];
  const last = vItems[vItems.length - 1];
  const padTop = first ? first.start : 0;
  const padBottom = last ? Math.max(0, virtualizer.getTotalSize() - last.end) : 0;
  const hidden = REGISTER_COLS.filter((col) => !cols[col.id]);
  const tableWidth =
    colWidths.check + REGISTER_COLS.reduce((sum, col) => sum + (cols[col.id] ? colWidths[col.id] : 0), 0);
  const firstLabel = REGISTER_COLS.find(
    (col) => cols[col.id] && col.id !== "payment" && col.id !== "deposit" && col.id !== "balance",
  )?.id;
  const lastVisible = [...REGISTER_COLS].reverse().find((col) => cols[col.id])?.id;
  function widthOf(id: RegisterColId) {
    return colWidths[id];
  }
  function setWidth(id: RegisterColId) {
    return (next: number) => onColWidth(id, next);
  }
  function resizeProps(id: RegisterColId) {
    if (id === lastVisible) return {};
    return { width: widthOf(id), onWidth: setWidth(id), onFit: fitWidth(id, COL_LABELS[id]) };
  }
  function fitWidth(id: RegisterColId, label: string) {
    return () => {
      const tableEl = wrapRef.current?.querySelector("table");
      if (!tableEl) return;
      const cls = REGISTER_COL_CLASS[id].split(" ")[0];
      onColWidth(
        id,
        fitColumnWidth({
          table: tableEl,
          selector: `td.${cls}`,
          header: label,
          min: COL_MIN,
          max: COL_MAX,
        }),
      );
    };
  }

  // Phone: Grid + List both honor View column chips (incl. Status) and --register-font.
  if (isPhoneUi()) {
    const listMode = phoneLayout === "list";
    const visibleCols = REGISTER_COLS.filter((col) => cols[col.id]);
    const phoneListMinWidth =
      colWidths.check +
      (dragOn ? 36 : 0) +
      visibleCols.reduce((sum, col) => sum + colWidths[col.id], 0);
    const toolbar = (
      <div className="register-phone-toolbar no-print mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1">
          <ShopTick
            checked={allOn}
            indeterminate={someOn}
            locked={!hasSelectable}
            onChange={(on) => {
              if (!hasSelectable) {
                toast.error("On a finished statement. Undo that rec to change this line.");
                return;
              }
              onToggleAll(on);
            }}
            label="Select all"
          />
          <span className="text-xs text-muted-foreground">Select</span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Bal <Money amount={lastBalance} currency={currency} className="inline font-medium text-foreground" />
        </span>
      </div>
    );
    const moveHint = dragOn ? (
      <p className="phone-card-meta mb-2 text-muted-foreground no-print">
        Move on: drag a grip onto a date chip above or onto another row.
      </p>
    ) : null;

    function phoneCell(line: BalancedCashLine, id: RegisterColId) {
      const isOpening = line.kind === "opening";
      const bank = banks.find((b) => b.id === line.bankId);
      switch (id) {
        case "date":
          return isOpening && !line.date ? "Opening" : formatRegisterDate(line.date);
        case "type":
          return KIND_LABEL[line.kind];
        case "number":
          return line.number || "—";
        case "payee":
          return line.party || (isOpening ? "Opening balance" : "—");
        case "memo":
          return line.memo?.trim() ? line.memo : "—";
        case "bank":
          return bank?.nickname || "—";
        case "payment":
          return line.payment ? (
            <Money amount={line.payment} currency={currency} className="text-debit" />
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        case "deposit":
          return line.deposit ? (
            <Money amount={line.deposit} currency={currency} className="text-credit" />
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        case "balance":
          return <Money amount={line.balance} currency={currency} className="font-medium" />;
        case "status":
          return isOpening ? <span className="text-muted-foreground">—</span> : <LineStatus line={line} />;
        default:
          return null;
      }
    }

    if (listMode) {
      return (
        <div className="register-phone-list is-list" data-layout="list">
          {toolbar}
          {moveHint}
          <div className="list-card list-grid register-phone-table min-w-0">
            <table style={{ width: "max-content", minWidth: phoneListMinWidth }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="w-10 px-2 py-2.5 no-print whitespace-nowrap" aria-label="Select" />
                  {dragOn ? <th className="w-9 px-1 py-2.5 no-print whitespace-nowrap" aria-label="Move" /> : null}
                  {visibleCols.map((col) => (
                    <th
                      key={col.id}
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5 font-medium",
                        (col.id === "payment" || col.id === "deposit" || col.id === "balance") && "text-right",
                        col.id === "status" && "text-center",
                        col.id !== "payment" && col.id !== "deposit" && col.id !== "balance" && col.id !== "status" && "text-left",
                      )}
                    >
                      {COL_LABELS[col.id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const isOpening = line.kind === "opening";
                  const locked = line.recon === "reconciled";
                  const isOn = selected.has(line.id);
                  const canDrag = dragOn && line.reschedulable;
                  const isDragging = dragging === line.id || isTransferMate(line, draggingSourceId);
                  return (
                    <tr
                      key={line.id}
                      data-move-row={dragOn && !isOpening ? line.id : undefined}
                      data-move-row-date={dragOn && !isOpening ? line.date : undefined}
                      data-dragging={isDragging ? "true" : undefined}
                      className={cn(
                        "border-b border-border/70 last:border-0 touch-manipulation",
                        isOn && "bg-primary/5",
                        activeId === line.id && "bg-accent/30",
                        isDragging && "ring-1 ring-inset ring-primary opacity-60",
                        overRow === line.id && dragOn && "bg-accent/50",
                      )}
                      onClick={() => {
                        if (isOpening) return;
                        if (dragOn && dragging) return;
                        onActivate(line.id);
                        onOpen(line);
                      }}
                    >
                      <td
                        className="px-2 py-3 no-print"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {isOpening ? (
                          <span className="inline-block size-8" />
                        ) : (
                          <ShopTick
                            checked={isOn}
                            locked={locked}
                            onChange={() => onToggle(line.id)}
                            label={`Select ${line.party}`}
                          />
                        )}
                      </td>
                      {dragOn ? (
                        <td
                          className="px-1 py-3 no-print"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {canDrag ? (
                            <button
                              type="button"
                              className={cn(
                                "register-phone-grip inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground",
                                isDragging && "border-primary bg-primary/10 text-foreground",
                              )}
                              aria-label="Drag to another date"
                              aria-pressed={isDragging}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                onPhoneMoveGrip(line.id, e);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DragHandle enabled className="pointer-events-none" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="register-phone-grip inline-flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground/50"
                              aria-label="Date locked — can't move"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                toast.error("Reconciled or locked lines can't change date.");
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.error("Reconciled or locked lines can't change date.");
                              }}
                            >
                              <DragHandle enabled className="pointer-events-none opacity-50" />
                            </button>
                          )}
                        </td>
                      ) : null}
                      {visibleCols.map((col) => {
                        const money = col.id === "payment" || col.id === "deposit" || col.id === "balance";
                        const status = col.id === "status";
                        return (
                          <td
                            key={col.id}
                            className={cn(
                              "px-2 py-3 align-middle whitespace-nowrap",
                              money && "text-right tabular-nums",
                              status && "text-center",
                              (col.id === "date" || col.id === "number" || col.id === "type") && "tabular-nums",
                              (col.id === "payee" || col.id === "memo" || col.id === "bank") &&
                                "min-w-[10rem] whitespace-normal break-words",
                              col.id === "date" && "text-muted-foreground",
                            )}
                          >
                            {col.id === "payee" ? (
                              <p className="font-medium break-words">{phoneCell(line, col.id)}</p>
                            ) : (
                              phoneCell(line, col.id)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="register-phone-list" data-layout="grid">
        {toolbar}
        {moveHint}
        <ul className="flex flex-col gap-2">
          {lines.map((line) => {
            const isOpening = line.kind === "opening";
            const locked = line.recon === "reconciled";
            const isOn = selected.has(line.id);
            const bank = banks.find((b) => b.id === line.bankId);
            const canDrag = dragOn && line.reschedulable;
            const isDragging = dragging === line.id || isTransferMate(line, draggingSourceId);
            return (
              <li key={line.id}>
                <PhoneSwipe
                  enabled={!isOpening && !dragOn}
                  actions={[
                    ...(!isOpening && !dragOn
                      ? [
                          {
                            label: line.recon === "cleared" ? "Pending" : "Clear",
                            tone: "success" as const,
                            onAction: () => onCycleRecon(line),
                          },
                          ...(locked
                            ? []
                            : [
                                {
                                  label: "Delete",
                                  tone: "danger" as const,
                                  onAction: () => onAskDelete(line.id),
                                },
                              ]),
                        ]
                      : []),
                  ]}
                >
                  <div
                    role="button"
                    tabIndex={isOpening ? undefined : 0}
                    data-move-row={dragOn && !isOpening ? line.id : undefined}
                    data-move-row-date={dragOn && !isOpening ? line.date : undefined}
                    data-dragging={isDragging ? "true" : undefined}
                    className={cn(
                      "register-phone-card rounded-2xl border border-border/40 bg-card px-3 py-3 touch-manipulation shadow-none",
                      isOn && "ring-1 ring-primary/40",
                      activeId === line.id && "bg-accent/30",
                      isDragging && "ring-2 ring-primary opacity-60",
                      overRow === line.id && dragOn && "bg-accent/50",
                    )}
                    onClick={() => {
                      if (isOpening) return;
                      if (dragOn && dragging) return;
                      onActivate(line.id);
                      onOpen(line);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isOpening) {
                        onActivate(line.id);
                        onOpen(line);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="flex shrink-0 flex-col items-center gap-1 pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {isOpening ? (
                          <span className="inline-block size-10" />
                        ) : (
                          <ShopTick
                            checked={isOn}
                            locked={locked}
                            onChange={() => onToggle(line.id)}
                            label={`Select ${line.party}`}
                          />
                        )}
                        {dragOn && !isOpening ? (
                          canDrag ? (
                            <button
                              type="button"
                              className={cn(
                                "register-phone-grip inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground",
                                isDragging && "border-primary bg-primary/10 text-foreground",
                              )}
                              aria-label="Drag to another date"
                              aria-pressed={isDragging}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                onPhoneMoveGrip(line.id, e);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DragHandle enabled className="pointer-events-none" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="register-phone-grip inline-flex size-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/50"
                              aria-label="Date locked — can't move"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                toast.error("Reconciled or locked lines can't change date.");
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.error("Reconciled or locked lines can't change date.");
                              }}
                            >
                              <DragHandle enabled className="pointer-events-none opacity-50" />
                            </button>
                          )
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          {cols.payee ? (
                            <p className="phone-card-party min-w-0 break-words font-medium">
                              {line.party || (isOpening ? "Opening balance" : "—")}
                            </p>
                          ) : (
                            <span />
                          )}
                          {cols.date ? (
                            <p className="phone-card-date shrink-0 text-muted-foreground tabular-nums">
                              {isOpening && !line.date ? "Opening" : formatRegisterDate(line.date)}
                            </p>
                          ) : null}
                        </div>
                        {(cols.type || cols.number || cols.bank) ? (
                          <p className="phone-card-meta mt-1 break-words text-muted-foreground">
                            {cols.type ? <span>{KIND_LABEL[line.kind]}</span> : null}
                            {cols.number && line.number ? (
                              <span>
                                {cols.type ? " · " : ""}
                                {line.number}
                              </span>
                            ) : null}
                            {cols.bank && bank ? (
                              <span>
                                {cols.type || (cols.number && line.number) ? " · " : ""}
                                {bank.nickname}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                        {cols.memo ? (
                          <div className="phone-card-memo mt-1.5">
                            <p className="phone-card-label text-muted-foreground">Memo</p>
                            <p className="break-words text-muted-foreground/90">
                              {line.memo?.trim() ? line.memo : "—"}
                            </p>
                          </div>
                        ) : null}
                        {(cols.payment || cols.deposit || cols.balance) ? (
                          <div
                            className={cn(
                              "phone-card-money mt-2 grid gap-2 tabular-nums",
                              [cols.payment, cols.deposit, cols.balance].filter(Boolean).length === 1
                                ? "grid-cols-1"
                                : [cols.payment, cols.deposit, cols.balance].filter(Boolean).length === 2
                                  ? "grid-cols-2"
                                  : "grid-cols-3",
                            )}
                          >
                            {cols.payment ? (
                              <div>
                                <p className="phone-card-label text-muted-foreground">Out</p>
                                {line.payment ? (
                                  <Money amount={line.payment} currency={currency} className="text-debit" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            ) : null}
                            {cols.deposit ? (
                              <div>
                                <p className="phone-card-label text-muted-foreground">In</p>
                                {line.deposit ? (
                                  <Money amount={line.deposit} currency={currency} className="text-credit" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            ) : null}
                            {cols.balance ? (
                              <div className="text-right">
                                <p className="phone-card-label text-muted-foreground">Bal</p>
                                <Money amount={line.balance} currency={currency} className="font-medium" />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {!isOpening && (cols.status || line.reassignable) ? (
                          <div
                            className="mt-2 flex flex-wrap items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            {cols.status ? (
                              <button
                                type="button"
                                className="phone-card-chip inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1"
                                onClick={() => onCycleRecon(line)}
                                aria-label={
                                  line.recon === "reconciled"
                                    ? "Reconciled"
                                    : line.recon === "cleared"
                                      ? "Cleared"
                                      : "Pending"
                                }
                              >
                                <LineStatus line={line} />
                              </button>
                            ) : null}
                            {line.reassignable ? (
                              <Select value={line.bankId} onValueChange={(v) => onSwap(line, v)}>
                                <SelectTrigger
                                  className="h-8 min-h-8 w-auto max-w-[9rem] border-border bg-transparent phone-card-chip px-2 shadow-none"
                                  aria-label={`Bank for ${line.party}`}
                                >
                                  <SelectValue placeholder="Bank" />
                                </SelectTrigger>
                                <SelectContent>
                                  {banks
                                    .filter((b) => !b.archived)
                                    .map((b) => (
                                      <SelectItem key={b.id} value={b.id}>
                                        {b.nickname}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </PhoneSwipe>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }



  return (
    <div className="register-card list-card">
      <div
        ref={wrapRef}
        className={cn("list-grid register-matrix min-w-0", hidden.map((col) => `hide-${col.id}`))}
        {...Object.fromEntries(hidden.map((col) => [`data-hide-${col.id}`, "true"]))}
      >
        <table style={{ width: "100%", minWidth: tableWidth }}>
          <colgroup>
            <col className="col-check no-print" style={{ width: colWidths.check }} />
            {REGISTER_COLS.map((col) => (
              <col
                key={col.id}
                className={cn(
                  REGISTER_COL_CLASS[col.id],
                  (col.id === "payee" || col.id === "memo" || (col.id === lastVisible && !cols.payee && !cols.memo)) &&
                    "col-flex",
                )}
                style={{ width: !cols[col.id] ? 0 : colWidths[col.id] }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="col-check no-print relative"
                onClick={stopOpen}
                onDoubleClick={stopOpen}
                onPointerDown={stopOpen}
                onMouseDown={stopOpen}
              >
                <span className="register-check-cell">
                  <ShopTick
                    checked={allOn}
                    indeterminate={someOn}
                    locked={!hasSelectable}
                    onChange={(on) => {
                      if (!hasSelectable) {
                        toast.error("On a finished statement. Undo that rec to change this line.");
                        return;
                      }
                      onToggleAll(on);
                    }}
                    label="Select all"
                  />
                </span>
              </th>
              <SortHeader
                label="Date"
                column="date"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-date", lastVisible === "date" && "col-fill")}
                {...resizeProps("date")}
              />
              <SortHeader
                label="Type"
                column="type"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-type", lastVisible === "type" && "col-fill")}
                {...resizeProps("type")}
              />
              <SortHeader
                label="No."
                column="number"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-num", lastVisible === "number" && "col-fill")}
                {...resizeProps("number")}
              />
              <SortHeader
                label="Payee"
                column="payee"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-payee", lastVisible === "payee" && "col-fill")}
                {...resizeProps("payee")}
              />
              <SortHeader
                label="Memo"
                column="memo"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-memo", lastVisible === "memo" && "col-fill")}
                {...resizeProps("memo")}
              />
              <SortHeader
                label="Bank"
                column="bank"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                className={cn("col-bank", lastVisible === "bank" && "col-fill")}
                {...resizeProps("bank")}
              />
              <SortHeader
                label="Payment"
                column="payment"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                align="right"
                className={cn("col-money col-payment", lastVisible === "payment" && "col-fill")}
                {...resizeProps("payment")}
              />
              <SortHeader
                label="Deposit"
                column="deposit"
                sortKey={sortKey}
                dir={sortDir}
                onToggle={onSort}
                align="right"
                className={cn("col-money col-deposit", lastVisible === "deposit" && "col-fill")}
                {...resizeProps("deposit")}
              />
              <th
                className={cn(
                  "col-money col-balance relative px-4 py-3 text-center font-medium text-muted-foreground",
                  lastVisible === "balance" && "col-fill",
                )}
                data-col="balance"
                data-align="right"
              >
                Balance
                {lastVisible === "balance" ? null : (
                  <ColResize width={colWidths.balance} onWidth={setWidth("balance")} onFit={fitWidth("balance", "Balance")} />
                )}
              </th>
              <th
                className={cn(
                  "col-status relative px-4 py-3 text-center font-medium text-muted-foreground",
                  lastVisible === "status" && "col-fill",
                )}
                data-col="status"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {padTop > 0 ? (
              <tr aria-hidden>
                <td colSpan={11} style={{ height: padTop, padding: 0, border: 0 }} />
              </tr>
            ) : null}
            {vItems.map((item) => {
              const line = lines[item.index];
              if (!line) return null;
              return (
                <RegisterRow
                  key={line.id}
                  index={item.index}
                  line={line}
                  currency={currency}
                  banks={banks}
                  isOn={selected.has(line.id)}
                  isActive={activeId === line.id}
                  dragOn={dragOn}
                  dragging={dragging === line.id || isTransferMate(line, draggingSourceId)}
                  over={overRow === line.id}
                  measureRef={virtualizer.measureElement}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onActivate={onActivate}
                  onCycleRecon={onCycleRecon}
                  onSwap={onSwap}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onOverRow={onOverRow}
                  onDropRow={onDropRow}
                />
              );
            })}
            {padBottom > 0 ? (
              <tr aria-hidden>
                <td colSpan={11} style={{ height: padBottom, padding: 0, border: 0 }} />
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr>
              <td className="col-check no-print" />
              {REGISTER_COLS.map((col) => {
                if (!cols[col.id]) return <td key={col.id} className={REGISTER_COL_CLASS[col.id]} />;
                if (col.id === firstLabel)
                  return (
                    <td key={col.id} className={`${REGISTER_COL_CLASS[col.id]} font-medium`}>
                      Totals
                    </td>
                  );
                if (col.id === "payment")
                  return (
                    <td key={col.id} className="col-money col-payment">
                      <Money amount={outTotal} currency={currency} className="text-debit" />
                    </td>
                  );
                if (col.id === "deposit")
                  return (
                    <td key={col.id} className="col-money col-deposit">
                      <Money amount={inTotal} currency={currency} className="text-credit" />
                    </td>
                  );
                if (col.id === "balance")
                  return (
                    <td key={col.id} className="col-money col-balance">
                      <Money amount={lastBalance} currency={currency} />
                    </td>
                  );
                return <td key={col.id} className={REGISTER_COL_CLASS[col.id]} />;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function sameLine(a: BalancedCashLine, b: BalancedCashLine) {
  return (
    a.id === b.id &&
    a.date === b.date &&
    a.kind === b.kind &&
    a.number === b.number &&
    a.party === b.party &&
    a.memo === b.memo &&
    a.bankId === b.bankId &&
    a.payment === b.payment &&
    a.deposit === b.deposit &&
    a.balance === b.balance &&
    a.status === b.status &&
    a.recon === b.recon &&
    a.method === b.method &&
    a.reassignable === b.reassignable &&
    a.reschedulable === b.reschedulable
  );
}

function sameBanks(a: BankLite[], b: BankLite[]) {
  return a.length === b.length && a.every((bank, i) => bank.id === b[i]?.id && bank.nickname === b[i]?.nickname);
}

const RegisterRow = memo(
  function RegisterRow({
    index,
    line,
    currency,
    banks,
    isOn,
    isActive,
    dragOn,
    dragging,
    over,
    measureRef,
    onToggle,
    onOpen,
    onActivate,
    onCycleRecon,
    onSwap,
    onDragStart,
    onDragEnd,
    onOverRow,
    onDropRow,
  }: {
    index: number;
    line: BalancedCashLine;
    currency: string;
    banks: BankLite[];
    isOn: boolean;
    isActive: boolean;
    dragOn: boolean;
    dragging: boolean;
    over: boolean;
    measureRef: (node: Element | null) => void;
    onToggle: (id: string) => void;
    onOpen: (line: CashLine) => void;
    onActivate: (id: string) => void;
    onCycleRecon: (line: CashLine) => void;
    onSwap: (line: CashLine, bankId: string) => void;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    onOverRow: (id: string | null) => void;
    onDropRow: (line: CashLine, e: DragEvent) => void;
  }) {
    const bank = banks.find((b) => b.id === line.bankId);
    const isOpening = line.kind === "opening";
    const canDrag = dragOn && line.reschedulable;
    const locked = line.recon === "reconciled";
    return (
      <tr
        ref={measureRef}
        data-index={index}
        draggable={canDrag}
        data-open={isOpening ? undefined : "true"}
        data-selected={isOn ? "true" : undefined}
        data-active={isActive ? "true" : undefined}
        data-dragging={dragging ? "true" : undefined}
        data-drop={over ? "true" : undefined}
        tabIndex={isOpening ? undefined : 0}
        title={isOpening ? undefined : "Double-tap or double-click to open"}
        onClick={() => {
          if (!isOpening) onActivate(line.id);
        }}
        onDoubleClick={() => onOpen(line)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget === e.target) onOpen(line);
        }}
        onDragStart={(e) => {
          if (!canDrag) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData("text/plain", line.id);
          e.dataTransfer.effectAllowed = "move";
          setCashDragImage(e, transferDragCaption(line));
          onDragStart(line.id);
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => {
          if (!dragOn || isOpening) return;
          e.preventDefault();
          onOverRow(line.id);
        }}
        onDragLeave={() => onOverRow(null)}
        onDrop={(e) => {
          if (!dragOn || isOpening) return;
          e.preventDefault();
          onDropRow(line, e);
        }}
      >
        <td className="col-check no-print" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
          {isOpening ? null : (
            <span className="register-check-cell">
              <ShopTick
                checked={isOn}
                locked={locked}
                onChange={() => onToggle(line.id)}
                label={`Select ${line.party}`}
              />
            </span>
          )}
        </td>
        <td className="col-date">
          <span className="inline-flex items-center gap-1">
            {canDrag ? <DragHandle enabled className="no-print" /> : null}
            {isOpening && !line.date ? "Opening" : formatRegisterDate(line.date)}
          </span>
        </td>
        <td className="col-type">{KIND_LABEL[line.kind]}</td>
        <td className="col-num">{line.number || "—"}</td>
        <td className="col-payee">
          <span className="font-medium">{line.party}</span>
        </td>
        <td className="col-memo">{line.memo}</td>
        <td className="col-bank" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
          {isOpening || !line.reassignable ? (
            <span>{bank?.nickname ?? "—"}</span>
          ) : (
            <>
              <span className="print-only">{bank?.nickname ?? "—"}</span>
              <Select value={line.bankId} onValueChange={(v) => onSwap(line, v)}>
                <SelectTrigger
                  className="register-bank-select no-print h-auto min-h-0 w-auto border-0 bg-transparent px-1 text-[length:1em] shadow-none"
                  aria-label={`Bank for ${line.party}`}
                >
                  <SelectValue placeholder="Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks
                    .filter((b) => !b.archived)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nickname}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </>
          )}
        </td>
        <td className="col-money col-payment">
          {line.payment ? <Money amount={line.payment} currency={currency} className="text-debit" /> : null}
        </td>
        <td className="col-money col-deposit">
          {line.deposit ? <Money amount={line.deposit} currency={currency} className="text-credit" /> : null}
        </td>
        <td className="col-money col-balance">
          <Money amount={line.balance} currency={currency} />
        </td>
        <td
          className="col-status"
          onClick={(e) => {
            e.stopPropagation();
            onCycleRecon(line);
          }}
          onDoubleClick={stopOpen}
        >
          <LineStatus line={line} />
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.index === next.index &&
    prev.isOn === next.isOn &&
    prev.isActive === next.isActive &&
    prev.dragOn === next.dragOn &&
    prev.dragging === next.dragging &&
    prev.over === next.over &&
    prev.currency === next.currency &&
    prev.onToggle === next.onToggle &&
    prev.onOpen === next.onOpen &&
    prev.onActivate === next.onActivate &&
    prev.onCycleRecon === next.onCycleRecon &&
    prev.onSwap === next.onSwap &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onOverRow === next.onOverRow &&
    prev.onDropRow === next.onDropRow &&
    prev.measureRef === next.measureRef &&
    sameBanks(prev.banks, next.banks) &&
    sameLine(prev.line, next.line),
);

function LineStatus({ line }: { line: BalancedCashLine }) {
  if (line.kind === "opening") return null;
  if (line.kind === "check" && (line.status === "voided" || line.status === "bounced")) {
    return <CheckBadge status={line.status} />;
  }
  if ((line.kind === "receipt" || line.kind === "payment") && line.status === "void") {
    return <ReceiptBadge status="void" />;
  }
  if (line.recon) return <ReconBadge recon={line.recon} />;
  return null;
}
