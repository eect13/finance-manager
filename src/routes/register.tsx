import { createFileRoute, Link } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Filter, Printer, SlidersHorizontal } from "lucide-react";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle } from "@/components/drag-handle";
import { CsvButton } from "@/components/export-menu";
import { Money } from "@/components/money";
import { RegisterPrintPreview } from "@/components/print-preview";
import { RegisterPost } from "@/components/register-post";
import { RegisterSwap } from "@/components/register-swap";
import { ColumnChips } from "@/components/column-chips";
import { ShopTick } from "@/components/shop-tick";
import { SortHeader } from "@/components/sort-header";
import { CheckBadge, ReceiptBadge, StatusLabel } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cashRegisterRows } from "@/lib/finance/export";
import { formatDate, formatShortDate, todayIso } from "@/lib/finance/format";
import { openCashLine, stopOpen } from "@/lib/finance/open-record";
import {
  boardDates,
  cashBook,
  datePresetRange,
  deletableLines,
  filterCashLines,
  filterDirection,
  KIND_LABEL,
  movableLines,
  openingForBanks,
  rescheduleKind,
  totals,
  TYPE_FILTERS,
  withOpening,
  withRunningBalance,
  type BalancedCashLine,
  type CashDirection,
  type CashLine,
  type CashTypeFilter,
  type DatePreset,
} from "@/lib/finance/register";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import {
  DEFAULT_REGISTER_COLS,
  REGISTER_COL_CLASS,
  REGISTER_COLS,
  toggleRegisterCol,
  type RegisterCols,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const UI_KEY = "finance-manager-register-ui";
const YEAR_RANGE = datePresetRange("year");

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

function RegisterPage() {
  const data = useFinanceData();
  const rescheduleCashLine = useFinanceStore((s) => s.rescheduleCashLine);
  const removeCashLines = useFinanceStore((s) => s.removeCashLines);
  const reassignCashBank = useFinanceStore((s) => s.reassignCashBank);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const patch = useFinanceStore((s) => s.patch);
  const [bankFilter, setBankFilter] = useState("all");
  const [direction, setDirection] = useState<CashDirection>("all");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<CashTypeFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("year");
  const [dateFrom, setDateFrom] = useState(YEAR_RANGE.from);
  const [dateTo, setDateTo] = useState(YEAR_RANGE.to);
  const [uiReady, setUiReady] = useState(false);
  const [dragOn, setDragOn] = useState(false);
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [overRow, setOverRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<"selected" | "all" | null>(null);
  const [allowDelete, setAllowDelete] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const fontSize = data.settings.registerFontSize ?? 12;
  const cols = data.settings.registerColumns ?? DEFAULT_REGISTER_COLS;
  const dataRef = useRef(data);
  dataRef.current = data;
  const banksRef = useRef(data.banks);
  banksRef.current = data.banks;

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          bankFilter?: string;
          datePreset?: DatePreset;
          dateFrom?: string;
          dateTo?: string;
        };
        if (saved.bankFilter) setBankFilter(saved.bankFilter);
        if (saved.datePreset === "month" || saved.datePreset === "year") {
          const range = datePresetRange(saved.datePreset);
          setDatePreset(saved.datePreset);
          setDateFrom(range.from);
          setDateTo(range.to);
        } else if (saved.datePreset === "all") {
          setDatePreset("all");
          setDateFrom("");
          setDateTo("");
        } else if (saved.datePreset === "custom") {
          setDatePreset("custom");
          setDateFrom(saved.dateFrom ?? "");
          setDateTo(saved.dateTo ?? "");
        }
      }
    } catch {
      /* private mode */
    }
    setUiReady(true);
  }, []);

  useEffect(() => {
    if (!uiReady) return;
    try {
      localStorage.setItem(
        UI_KEY,
        JSON.stringify({ bankFilter, datePreset, dateFrom, dateTo }),
      );
    } catch {
      /* private mode */
    }
  }, [uiReady, bankFilter, datePreset, dateFrom, dateTo]);

  function applyPreset(preset: DatePreset) {
    setDatePreset(preset);
    if (preset === "month" || preset === "year") {
      const range = datePresetRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
      return;
    }
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    }
  }

  function setRegisterCols(mutate: (current: RegisterCols) => RegisterCols) {
    patch((d) => ({
      ...d,
      settings: {
        ...d.settings,
        registerColumns: mutate(d.settings.registerColumns ?? DEFAULT_REGISTER_COLS),
      },
    }));
  }

  const bankId = bankFilter === "all" ? undefined : bankFilter;
  const book = useMemo(
    () => cashBook(data, bankId, { dateFrom, dateTo }),
    [data, bankId, dateFrom, dateTo],
  );
  const opening = book.opening;
  const raw = book.lines;
  const directed = useMemo(() => filterDirection(raw, direction), [raw, direction]);
  const filtered = useMemo(
    () =>
      filterCashLines(directed, {
        name: nameFilter,
        type: typeFilter,
      }),
    [directed, nameFilter, typeFilter],
  );
  const searching = Boolean(nameFilter.trim() || typeFilter !== "all");
  const bankOpen = useMemo(() => openingForBanks(data, bankId), [data, bankId]);
  const asOf = useMemo(
    () => (dateFrom ? { date: dateFrom, forward: opening !== bankOpen } : undefined),
    [dateFrom, opening, bankOpen],
  );
  const tableSource = useMemo(
    () => (searching ? filtered : withOpening(filtered, opening, asOf)),
    [searching, filtered, opening, asOf],
  );
  const windowed = useMemo(() => withOpening(raw, opening, asOf), [raw, opening, asOf]);
  const windowBalanced = useMemo(() => withRunningBalance(windowed), [windowed]);
  const balanced = useMemo(() => withRunningBalance(tableSource), [tableSource]);
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
  const selectedIds = useMemo(() => selected.filter((id) => keepIds.has(id)), [selected, keepIds]);
  const selectedOn = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allOn = movable.length > 0 && movable.every((l) => selectedOn.has(l.id));
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
  const sort = useEntrySort(dataRows, "date", getters, "asc");
  const display = useMemo(
    () => (openingRow && !searching ? [openingRow, ...sort.sorted] : sort.sorted),
    [openingRow, searching, sort.sorted],
  );
  const liveBanks = data.banks.filter((b) => !b.archived);
  const bankLabel = bankFilter === "all" ? "All banks" : (data.banks.find((b) => b.id === bankFilter)?.nickname ?? "");

  useEffect(() => {
    if (bankFilter === "all") return;
    if (!data.banks.some((b) => !b.archived && b.id === bankFilter)) setBankFilter("all");
  }, [bankFilter, data.banks]);

  const moveLine = useCallback(
    (line: CashLine, date: string) => {
      const kind = rescheduleKind(line.kind);
      if (!kind || !line.reschedulable) return;
      if (line.date === date) return;
      try {
        rescheduleCashLine({ kind, sourceId: line.sourceId, date });
        toast.success(`${line.number || KIND_LABEL[line.kind]} moved to ${formatDate(date)}.`);
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
        reassignCashBank({
          kind: line.kind,
          sourceId: line.sourceId,
          bankId: nextBankId,
          fromBankId: line.bankId,
        });
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
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  function toggleAll(on: boolean) {
    setSelected(on ? movable.map((l) => l.id) : []);
  }

  const handleOpen = useCallback((line: CashLine) => {
    openCashLine(line, dataRef.current);
  }, []);

  const handleDragStart = useCallback((id: string) => setDragging(id), []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setOverDate(null);
    setOverRow(null);
  }, []);

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

  function runDelete(mode: "selected" | "all") {
    const ids = mode === "all" ? deletable.map((l) => l.id) : selectedIds;
    if (ids.length === 0) return;
    try {
      removeCashLines(targets(ids));
      toast.success(ids.length === 1 ? "Entry deleted." : `${ids.length} entries deleted.`);
      setSelected([]);
      setAllowDelete(false);
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
          <Button variant="outline" onClick={() => setPrintOpen(true)}>
            <Printer />
            Print
          </Button>
          <Button asChild variant="ghost">
            <Link to="/checks">Issue check</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/receipts">Receive</Link>
          </Button>
        </>
      }
    >
      <div className="register-print-head print-only">
        <p>{data.settings.companyName}</p>
        <h1>Bank Register</h1>
        <p>
          {bankLabel}
          {" · "}
          {formatDate(todayIso())}
        </p>
      </div>

      <section className="register-summary no-print mb-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-2xl bg-card px-3 py-2 text-center text-xs elevation">
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

      <div className="register-view no-print mb-2">
        <div className="register-toolbar">
          <Input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Payee, number, memo"
            aria-label="Search register"
            className="register-toolbar-search h-9 min-h-9"
          />
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
              sort.set(key, dir === "desc" ? "desc" : "asc");
            }}
            onClear={() => {
              setTypeFilter("all");
              setDirection("all");
              applyPreset("year");
            }}
          />
          <ViewOptions
            fontSize={fontSize}
            allowDelete={allowDelete}
            dragOn={dragOn}
            cols={cols}
            hiddenCount={REGISTER_COLS.filter((col) => !cols[col.id]).length}
            onFontSize={(n) => updateSettings({ registerFontSize: n })}
            onAllowDelete={setAllowDelete}
            onDragOn={setDragOn}
            onToggleCol={(id) => setRegisterCols((current) => toggleRegisterCol(current, id))}
            onShowAllCols={() => setRegisterCols(() => ({ ...DEFAULT_REGISTER_COLS }))}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {movable.length} {movable.length === 1 ? "entry" : "entries"}
          {searching ? " match these filters" : ""}
          {selectedIds.length ? ` · ${selectedIds.length} selected` : " · tick a line to move banks"}
          {allowDelete ? " · delete unlocked" : ""}
        </p>
      </div>

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

      <section className="no-print mb-3" aria-label="Post">
        <RegisterPost defaultBankId={bankId} />
      </section>

      {dragOn ? (
        <DateChips
          dates={dates}
          overDate={overDate}
          onOverDate={setOverDate}
          onDropDate={(date, e) => {
            const line = parseDrag(e);
            setOverDate(null);
            setDragging(null);
            if (line) moveLine(line, date);
          }}
          onAddDate={(date) => setExtraDates((prev) => (prev.includes(date) ? prev : [...prev, date]))}
        />
      ) : null}

      <div style={{ ["--register-font" as string]: `${fontSize}px` }}>
        <RegisterTable
          lines={display}
          currency={data.settings.currency}
          banks={data.banks}
          cols={cols}
          lastBalance={display.at(-1)?.balance ?? ending}
          selected={selectedOn}
          allOn={allOn}
          someOn={someOn}
          dragOn={dragOn}
          dragging={dragging}
          overRow={overRow}
          sortKey={sort.key}
          sortDir={sort.dir}
          onSort={sort.toggle}
          onToggle={toggleOne}
          onToggleAll={toggleAll}
          onOpen={handleOpen}
          onSwap={swapBank}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onOverRow={setOverRow}
          onDropRow={handleDropRow}
        />
      </div>

      {selectedIds.length > 0 ? (
        <div className="register-select-bar no-print mt-3">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
            <RegisterSwap
              banks={data.banks}
              lines={filtered}
              selectedIds={selectedIds}
              preferFromId={bankId}
              onSelectIds={setSelected}
              onMoved={() => setSelected([])}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
              {allowDelete ? (
                <Button size="sm" variant="destructive" onClick={() => setConfirm("selected")}>
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <RegisterPrintPreview
        open={printOpen}
        onClose={() => setPrintOpen(false)}
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
        onColsChange={(next) => setRegisterCols(() => next)}
        onToggleCol={(id) => setRegisterCols((current) => toggleRegisterCol(current, id))}
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
        onConfirm={() => confirm && runDelete(confirm)}
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
  onPreset: (v: DatePreset) => void;
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onSort: (v: string) => void;
  onClear: () => void;
}) {
  const active = [typeFilter !== "all", direction !== "all", datePreset !== "year"].filter(Boolean).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-h-9 justify-start" aria-label="Filters">
          <Filter />
          Filters
          {active ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
              {active}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        onPointerDownOutside={(e) => {
          const el = e.target as HTMLElement | null;
          if (el?.closest("[data-radix-select-content]")) e.preventDefault();
        }}
      >
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Filters</p>
        <div className="grid gap-2">
          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Date range">
            <Button
              type="button"
              size="sm"
              variant={datePreset === "month" ? "default" : "outline"}
              aria-label="This month"
              aria-pressed={datePreset === "month"}
              onClick={() => onPreset("month")}
            >
              Month
            </Button>
            <Button
              type="button"
              size="sm"
              variant={datePreset === "year" ? "default" : "outline"}
              aria-label="This year"
              aria-pressed={datePreset === "year"}
              onClick={() => onPreset("year")}
            >
              Year
            </Button>
            <Button
              type="button"
              size="sm"
              variant={datePreset === "all" ? "default" : "outline"}
              aria-label="All dates"
              aria-pressed={datePreset === "all"}
              onClick={() => onPreset("all")}
            >
              All dates
            </Button>
          </div>
          <Select value={typeFilter} onValueChange={(v) => onType(v as CashTypeFilter)}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Filter by type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={direction} onValueChange={(v) => onDirection(v as CashDirection)}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">In and out</SelectItem>
              <SelectItem value="in">Incoming only</SelectItem>
              <SelectItem value="out">Outgoing only</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} aria-label="From date" className="h-9 min-h-9" />
            <Input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} aria-label="To date" className="h-9 min-h-9" />
          </div>
          <Select value={sortValue} onValueChange={onSort}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Sort register">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  Sort · {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {active ? (
            <button type="button" className="text-left text-xs font-medium text-muted-foreground" onClick={onClear}>
              Back to this year
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ViewOptions({
  fontSize,
  allowDelete,
  dragOn,
  cols,
  hiddenCount,
  onFontSize,
  onAllowDelete,
  onDragOn,
  onToggleCol,
  onShowAllCols,
}: {
  fontSize: number;
  allowDelete: boolean;
  dragOn: boolean;
  cols: RegisterCols;
  hiddenCount: number;
  onFontSize: (n: number) => void;
  onAllowDelete: (on: boolean) => void;
  onDragOn: (on: boolean) => void;
  onToggleCol: (id: (typeof REGISTER_COLS)[number]["id"]) => void;
  onShowAllCols: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-h-9 justify-start" aria-label="View options">
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
        <ColumnChips cols={cols} onToggle={onToggleCol} onShowAll={onShowAllCols} />
        <label className="mt-3 mb-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type size {fontSize}px</span>
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
        <div className="flex min-h-10 items-center justify-between gap-3">
          <Label htmlFor="allow-delete" className="text-sm">
            Allow delete
          </Label>
          <Switch id="allow-delete" checked={allowDelete} onCheckedChange={onAllowDelete} />
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3">
          <Label htmlFor="drag-dates" className="text-sm">
            Drag rows
          </Label>
          <Switch id="drag-dates" checked={dragOn} onCheckedChange={onDragOn} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DateChips({
  dates,
  overDate,
  onOverDate,
  onDropDate,
  onAddDate,
}: {
  dates: string[];
  overDate: string | null;
  onOverDate: (date: string | null) => void;
  onDropDate: (date: string, e: DragEvent) => void;
  onAddDate: (date: string) => void;
}) {
  return (
    <div className="no-print mb-2 flex min-w-0 items-center gap-1 overflow-x-auto pb-1">
      {dates.map((date) => (
        <button
          key={date}
          type="button"
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
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-card px-3 text-xs elevation"
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

function RegisterTable({
  lines,
  currency,
  banks,
  cols,
  lastBalance,
  selected,
  allOn,
  someOn,
  dragOn,
  dragging,
  overRow,
  sortKey,
  sortDir,
  onSort,
  onToggle,
  onToggleAll,
  onOpen,
  onSwap,
  onDragStart,
  onDragEnd,
  onOverRow,
  onDropRow,
}: {
  lines: BalancedCashLine[];
  currency: string;
  banks: { id: string; nickname: string; archived?: boolean }[];
  cols: RegisterCols;
  lastBalance: number;
  selected: Set<string>;
  allOn: boolean;
  someOn: boolean;
  dragOn: boolean;
  dragging: string | null;
  overRow: string | null;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (column: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: (on: boolean) => void;
  onOpen: (line: CashLine) => void;
  onSwap: (line: CashLine, bankId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOverRow: (id: string | null) => void;
  onDropRow: (line: CashLine, e: DragEvent) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    function measure() {
      const node = wrapRef.current;
      if (!node) return;
      const next = Math.round(node.getBoundingClientRect().top + window.scrollY);
      setMargin((m) => (m === next ? m : next));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const virtualizer = useWindowVirtualizer({
    count: lines.length,
    estimateSize: () => 44,
    overscan: 12,
    scrollMargin: margin,
    getItemKey: (index) => lines[index]?.id ?? index,
  });
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

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground elevation">
        No activity matches these filters.
      </div>
    );
  }

  const vItems = virtualizer.getVirtualItems();
  const first = vItems[0];
  const last = vItems[vItems.length - 1];
  const padTop = first ? Math.max(0, first.start - margin) : 0;
  const padBottom = last ? Math.max(0, virtualizer.getTotalSize() - last.end) : 0;
  const firstLabel = REGISTER_COLS.find(
    (col) => cols[col.id] && col.id !== "payment" && col.id !== "deposit" && col.id !== "balance",
  )?.id;
  const hidden = REGISTER_COLS.filter((col) => !cols[col.id]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "register-matrix min-w-0 overflow-x-auto rounded-2xl bg-card elevation",
        hidden.map((col) => `hide-${col.id}`),
      )}
      {...Object.fromEntries(hidden.map((col) => [`data-hide-${col.id}`, "true"]))}
    >
      <table>
        <thead>
          <tr>
            <th className="col-check no-print">
              <ShopTick checked={allOn} indeterminate={someOn} onChange={onToggleAll} label="Select all" />
            </th>
            <SortHeader compact label="Date" column="date" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-date" />
            <SortHeader compact label="Type" column="type" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-type" />
            <SortHeader compact label="No." column="number" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-num" />
            <SortHeader compact label="Payee" column="payee" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-payee" />
            <SortHeader compact label="Memo" column="memo" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-memo" />
            <SortHeader compact label="Bank" column="bank" sortKey={sortKey} dir={sortDir} onToggle={onSort} className="col-bank" />
            <SortHeader
              compact
              label="Payment"
              column="payment"
              sortKey={sortKey}
              dir={sortDir}
              onToggle={onSort}
              align="right"
              className="col-money col-payment"
            />
            <SortHeader
              compact
              label="Deposit"
              column="deposit"
              sortKey={sortKey}
              dir={sortDir}
              onToggle={onSort}
              align="right"
              className="col-money col-deposit"
            />
            <th className="col-money col-balance py-2 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Balance
            </th>
            <th className="col-status py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</th>
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
                dragOn={dragOn}
                dragging={dragging === line.id}
                over={overRow === line.id}
                measureRef={virtualizer.measureElement}
                onToggle={onToggle}
                onOpen={onOpen}
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
              if (!cols[col.id]) {
                return <td key={col.id} className={REGISTER_COL_CLASS[col.id]} />;
              }
              if (col.id === firstLabel) {
                return (
                  <td key={col.id} className={`${REGISTER_COL_CLASS[col.id]} font-medium`}>
                    Totals
                  </td>
                );
              }
              if (col.id === "payment") {
                return (
                  <td key={col.id} className="col-money col-payment">
                    <Money amount={outTotal} currency={currency} className="text-debit" />
                  </td>
                );
              }
              if (col.id === "deposit") {
                return (
                  <td key={col.id} className="col-money col-deposit">
                    <Money amount={inTotal} currency={currency} className="text-credit" />
                  </td>
                );
              }
              if (col.id === "balance") {
                return (
                  <td key={col.id} className="col-money col-balance">
                    <Money amount={lastBalance} currency={currency} />
                  </td>
                );
              }
              return <td key={col.id} className={REGISTER_COL_CLASS[col.id]} />;
            })}
          </tr>
        </tfoot>
      </table>
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
    a.method === b.method &&
    a.reassignable === b.reassignable &&
    a.reschedulable === b.reschedulable
  );
}

function sameBanks(
  a: { id: string; nickname: string; archived?: boolean }[],
  b: { id: string; nickname: string; archived?: boolean }[],
) {
  return a.length === b.length && a.every((bank, i) => bank.id === b[i]?.id && bank.nickname === b[i]?.nickname);
}

const RegisterRow = memo(function RegisterRow({
  index,
  line,
  currency,
  banks,
  isOn,
  dragOn,
  dragging,
  over,
  measureRef,
  onToggle,
  onOpen,
  onSwap,
  onDragStart,
  onDragEnd,
  onOverRow,
  onDropRow,
}: {
  index: number;
  line: BalancedCashLine;
  currency: string;
  banks: { id: string; nickname: string; archived?: boolean }[];
  isOn: boolean;
  dragOn: boolean;
  dragging: boolean;
  over: boolean;
  measureRef: (node: Element | null) => void;
  onToggle: (id: string) => void;
  onOpen: (line: CashLine) => void;
  onSwap: (line: CashLine, bankId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOverRow: (id: string | null) => void;
  onDropRow: (line: CashLine, e: DragEvent) => void;
}) {
  const bank = banks.find((b) => b.id === line.bankId);
  const isOpening = line.kind === "opening";
  const canDrag = dragOn && line.reschedulable;
  return (
    <tr
      ref={measureRef}
      data-index={index}
      draggable={canDrag}
      data-open={isOpening ? undefined : "true"}
      data-selected={isOn ? "true" : undefined}
      data-dragging={dragging ? "true" : undefined}
      data-drop={over ? "true" : undefined}
      tabIndex={isOpening ? undefined : 0}
      title={isOpening ? undefined : "Double-click to open"}
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
      <td className="col-check no-print">
        {isOpening ? null : (
          <ShopTick checked={isOn} onChange={() => onToggle(line.id)} label={`Select ${line.party}`} />
        )}
      </td>
      <td className="col-date">
        <span className="inline-flex items-center gap-1">
          {canDrag ? <DragHandle enabled className="no-print" /> : null}
          {isOpening && !line.date ? "Opening" : formatDate(line.date)}
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
      <td className="col-status">
        <LineStatus line={line} />
      </td>
    </tr>
  );
}, (prev, next) => {
  return (
    prev.index === next.index &&
    prev.isOn === next.isOn &&
    prev.dragOn === next.dragOn &&
    prev.dragging === next.dragging &&
    prev.over === next.over &&
    prev.currency === next.currency &&
    prev.onToggle === next.onToggle &&
    prev.onOpen === next.onOpen &&
    prev.onSwap === next.onSwap &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onOverRow === next.onOverRow &&
    prev.onDropRow === next.onDropRow &&
    prev.measureRef === next.measureRef &&
    sameBanks(prev.banks, next.banks) &&
    sameLine(prev.line, next.line)
  );
});

function LineStatus({ line }: { line: CashLine }) {
  if (line.kind === "check") {
    return <CheckBadge status={line.status as "pending" | "cleared" | "voided" | "bounced"} />;
  }
  if (line.kind === "receipt" || line.kind === "payment") {
    return (
      <ReceiptBadge
        status={line.status as "posted" | "void"}
        kind={line.kind === "receipt" ? "cash-sale" : "payment"}
        method={line.method}
      />
    );
  }
  if (line.kind === "transfer") return <Badge variant="internal">Internal</Badge>;
  if (!line.status) return null;
  return <StatusLabel status={line.status} />;
}
