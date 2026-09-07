import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, memo, type Ref, type RefObject } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DateInput } from "@/components/date-input";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { listColClass, listColWidthStyle, listTableStyle} from "@/components/list-table";
import { useColVisible, visibleTableWidth, viewColumnExtra } from "@/components/column-chips";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { ReconPrint } from "@/components/period-print";
import { requestPrint } from "@/components/print-preview";
import { ShopTick } from "@/components/shop-tick";
import { ListViewMenu } from "@/components/list-view-menu";
import {
  RECONCILE_PHONE_LAYOUT_KEY,
  readPhoneLayout,
  writePhoneLayout,
  type PhoneLayout,
  isNarrowUi,
  isPhoneUi,
} from "@/lib/phone-layout";
import { SortHeader, ColResize } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { bookBalanceOn, daysOutstanding, explainedDifference, isReconAdj, lastReconForBank, namedFromCash, namedReconLines, reconBeginning, reconDifference, reconExplain, unclearedAge, unclearedLines } from "@/lib/finance/reconcile";
import { KIND_LABEL, type CashLine } from "@/lib/finance/register";
import { openProps, openTxn } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { getWorkspaceScrollElement, listScrollElement, listScrollMargin } from "@/lib/workspace-scroll";

export const Route = createFileRoute("/reconcile")({ component: ReconcilePage });

const CHECK_COL = 44;
const RECON_COLS = {
  date: 118,
  type: 120,
  payee: 220,
  days: 72,
  payment: 128,
  deposit: 128,
} as const;
const RECON_CHIPS = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "payee", label: "Payee" },
  { id: "days", label: "Days" },
  { id: "payment", label: "Payment" },
  { id: "deposit", label: "Deposit" },
] as const;
const RECON_VIS_IDS = RECON_CHIPS.map((c) => c.id);


function reconDefaultCols() {
  if (isPhoneUi()) {
    return { check: CHECK_COL, date: 96, type: 72, payee: 128, days: 44, payment: 86, deposit: 86 };
  }
  return { check: CHECK_COL, ...RECON_COLS };
}

function lineKey(line: CashLine) {
  return `${line.kind}:${line.sourceId}`;
}

function openKindFor(line: CashLine): "check" | "receipt" | "bill" | "journal" {
  if (line.kind === "check") return "check";
  if (line.kind === "receipt" || line.kind === "payment") return "receipt";
  if (line.kind === "bill-payment") return "bill";
  return "journal";
}

function openIdFor(line: CashLine, billByPayment: Map<string, string>) {
  if (line.kind === "bill-payment") return billByPayment.get(line.sourceId) ?? line.sourceId;
  return line.sourceId;
}

function ReconcilePage() {
  const data = useFinanceData();
  const finishRecon = useFinanceStore((s) => s.finishRecon);
  const undoLastRecon = useFinanceStore((s) => s.undoLastRecon);
  const postReconAdjustment = useFinanceStore((s) => s.postReconAdjustment);
  const live = data.banks.filter((b) => !b.archived);
  const [bankId, setBankId] = useState(live[0]?.id ?? "");
  const [statementDate, setStatementDate] = useState(todayIso());
  const [ending, setEnding] = useState("");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [phoneLayout, setPhoneLayout] = useState<PhoneLayout>(() =>
    readPhoneLayout(RECONCILE_PHONE_LAYOUT_KEY),
  );
  const fontSize = data.settings.registerFontSize ?? 12;
  const [fee, setFee] = useState("");
  const [interest, setInterest] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [printLast, setPrintLast] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-recon-cols-v2", reconDefaultCols(), { min: 36 });
  const vis = useColVisible("finance-manager-recon-vis", RECON_VIS_IDS);
  const colAligns = useColAligns(
    "finance-manager-recon-col-aligns",
    Object.keys(RECON_COLS) as Array<keyof typeof RECON_COLS>,
  );

  const bank = data.banks.find((b) => b.id === bankId) ?? live[0];
  const effectiveBankId = bank?.id ?? "";

  const beginning = useMemo(
    () => (effectiveBankId ? reconBeginning(data, effectiveBankId, statementDate) : 0),
    [data, effectiveBankId, statementDate],
  );
  const allUncleared = useMemo(
    () => (effectiveBankId ? unclearedLines(data, effectiveBankId, statementDate) : []),
    [data, effectiveBankId, statementDate],
  );
  const uncleared = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUncleared.filter((line) => {
      if (typeFilter === "in" && !line.deposit) return false;
      if (typeFilter === "out" && !line.payment) return false;
      if (!q) return true;
      return [line.party, line.number, KIND_LABEL[line.kind], line.memo].join(" ").toLowerCase().includes(q);
    });
  }, [allUncleared, query, typeFilter]);
  const getters = useMemo(
    () => ({
      date: (l: CashLine) => l.date,
      type: (l: CashLine) => KIND_LABEL[l.kind],
      payee: (l: CashLine) => l.party,
      days: (l: CashLine) => daysOutstanding(l.date, statementDate),
      payment: (l: CashLine) => l.payment,
      deposit: (l: CashLine) => l.deposit,
    }),
    [statementDate],
  );
  const sort = useEntrySort(uncleared, "date", getters, "asc", true);
  const billByPayment = useMemo(() => {
    const map = new Map<string, string>();
    for (const bill of data.bills) {
      for (const pay of bill.payments) map.set(pay.id, bill.id);
    }
    return map;
  }, [data.bills]);
  const selected = useMemo(
    () => allUncleared.filter((line) => ticked.has(lineKey(line))),
    [allUncleared, ticked],
  );
  const statementEnding = parseAmountToCents(ending);
  const difference = reconDifference(beginning, statementEnding, selected);
  const { clearedIn, clearedOut } = useMemo(() => {
    let inn = 0;
    let out = 0;
    for (const line of selected) {
      inn += line.deposit;
      out += line.payment;
    }
    return { clearedIn: inn, clearedOut: out };
  }, [selected]);
  const explain = useMemo(() => reconExplain(allUncleared, ticked, lineKey), [allUncleared, ticked]);
  const last = lastReconForBank(data, effectiveBankId);
  const book = useMemo(
    () => (effectiveBankId ? bookBalanceOn(data, effectiveBankId, statementDate) : 0),
    [data, effectiveBankId, statementDate],
  );
  const explained = explainedDifference(statementEnding, explain.inTransitTotal, explain.outstandingTotal, book);
  const ages = useMemo(() => unclearedAge(allUncleared, statementDate), [allUncleared, statementDate]);
  const canFinish = difference === 0 && explained === 0 && Boolean(ending);
  const allOn = uncleared.length > 0 && uncleared.every((l) => ticked.has(lineKey(l)));
  const someOn = !allOn && uncleared.some((l) => ticked.has(lineKey(l)));

  function toggle(line: CashLine, on?: boolean) {
    const key = lineKey(line);
    setTicked((prev) => {
      const next = new Set(prev);
      const should = on ?? !next.has(key);
      if (should) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((l) => l.id),
    onOpen: (id) => {
      const line = sort.sorted.find((l) => l.id === id);
      if (!line) return;
      openTxn(openKindFor(line), openIdFor(line, billByPayment));
    },
    onToggle: (id) => {
      const line = sort.sorted.find((l) => l.id === id);
      if (line) toggle(line, !ticked.has(lineKey(line)));
    },
  });


  /** Merge with existing ticks so a type/search filter does not wipe or orphan other ticks. */
  function toggleAll(on: boolean) {
    const keys = uncleared.map(lineKey);
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) {
        for (const k of keys) next.add(k);
      } else {
        for (const k of keys) next.delete(k);
      }
      return next;
    });
    if (keys.length === 0) return;
    if (on) toast.success(keys.length === 1 ? "1 ticked." : `${keys.length} ticked.`);
    else toast.success(keys.length === 1 ? "1 unticked." : `${keys.length} unticked.`);
  }

  function fit(id: "check" | keyof typeof RECON_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    const selector = id === "check" ? "td.col-check" : `td[data-col="${id}"]`;
    cols.setWidth(
      id,
      fitColumnWidth({
        table,
        selector,
        header: label,
        min: id === "check" ? 36 : 56,
        max: id === "check" ? 88 : 420,
      }),
    );
  }

  function finish() {
    try {
      finishRecon({
        bankId: effectiveBankId,
        statementDate,
        statementEnding,
        lines: selected.map((l) => ({ kind: l.kind, sourceId: l.sourceId })),
      });
      setTicked(new Set());
      toast.success("Statement finished. That rec is a document — print Last statement.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish.");
    }
  }

  function postAdj(kind: "fee" | "interest") {
    const raw = kind === "fee" ? fee : interest;
    try {
      const journalId = postReconAdjustment({
        bankId: effectiveBankId,
        date: statementDate,
        amount: parseAmountToCents(raw),
        kind,
      });
      if (journalId) setTicked((prev) => new Set(prev).add(`${kind === "fee" ? "expense" : "deposit"}:${journalId}`));
      if (kind === "fee") setFee("");
      else setInterest("");
      toast.success(kind === "fee" ? "Service charge posted and ticked." : "Interest posted and ticked.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    }
  }

  return (
    <AppShell
      title="Reconcile"
      description="Beginning is the last finished ending, not a re-sum of ticks. Outstanding and in-transit prove the book. Finish only when both differences are zero. Last statement is the document."
      wide
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              setPrintLast(false);
              requestPrint();
            }}
          >
            <Printer />
            Working rec
          </Button>
          <Button
            variant="outline"
            disabled={!last}
            onClick={() => {
              setPrintLast(true);
              requestPrint();
            }}
          >
            <Printer />
            Last statement
          </Button>
          <Button asChild variant="outline">
            <Link to="/close">Close</Link>
          </Button>
        </>
      }
    >
      <ReconPrint
        bankName={bank?.nickname ?? "Bank"}
        statementDate={printLast && last ? last.statementDate : statementDate}
        beginning={printLast && last ? last.beginning : beginning}
        ending={printLast && last ? last.statementEnding : statementEnding}
        bookBalance={printLast && last ? last.bookBalance : book}
        clearedIn={printLast && last ? last.clearedIn : clearedIn}
        clearedOut={printLast && last ? last.clearedOut : clearedOut}
        difference={printLast && last ? 0 : difference}
        explained={printLast && last ? last.explained : explained}
        outstanding={printLast ? [] : explain.outstanding}
        inTransit={printLast ? [] : explain.inTransit}
        ticked={printLast ? [] : selected}
        outstandingNamed={printLast && last ? last.outstandingLines : namedReconLines(explain.outstanding, statementDate, "payment")}
        ditNamed={printLast && last ? last.ditLines : namedReconLines(explain.inTransit, statementDate, "deposit")}
        adjustmentNamed={printLast && last ? last.adjustmentLines : namedFromCash(selected.filter(isReconAdj), statementDate)}
        aging={printLast && last ? last.unclearedAging : ages}
        currency={data.settings.currency}
        finished={printLast && Boolean(last)}
      />
      <div className="register-bank-tabs no-print mb-3 min-w-0" role="tablist" aria-label="Bank">
        {live.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={effectiveBankId === b.id}
            className={cn(effectiveBankId === b.id && "is-on")}
            onClick={() => {
              setBankId(b.id);
              setTicked(new Set());
            }}
          >
            {b.nickname}
          </button>
        ))}
      </div>

      <div className="field-grid-3 mb-4">
        <Field label="Statement date">
          <DateInput value={statementDate} onChange={setStatementDate} />
        </Field>
        <Field label={`Statement ending (${data.settings.currency})`}>
          <Input
            value={ending}
            onChange={(e) => setEnding(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>
        <div className="flex flex-col justify-end gap-1 text-sm">
          {last ? (
            <p className="text-muted-foreground">
              Beginning is last statement {formatDate(last.statementDate)} ending.
            </p>
          ) : (
            <p className="text-muted-foreground">Beginning is this bank’s opening balance. No statement finished yet.</p>
          )}
        </div>
      </div>

      <div className="proof-board mb-4">
        <section>
          <h3>Statement</h3>
          <dl>
            <div>
              <dt>Beginning</dt>
              <dd>
                <Money amount={beginning} currency={data.settings.currency} />
              </dd>
            </div>
            <div>
              <dt>Cleared in</dt>
              <dd>
                <Money amount={clearedIn} currency={data.settings.currency} />
              </dd>
            </div>
            <div>
              <dt>Cleared out</dt>
              <dd>
                <Money amount={clearedOut} currency={data.settings.currency} />
              </dd>
            </div>
            <div data-proof={difference === 0 ? "ok" : "diff"}>
              <dt>Cleared difference</dt>
              <dd className={cn(difference === 0 ? "text-credit" : "text-debit")}>
                <Money amount={difference} currency={data.settings.currency} signed />
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Book</h3>
          <dl>
            <div>
              <dt>Book</dt>
              <dd>
                <Money amount={book} currency={data.settings.currency} />
              </dd>
            </div>
            <div>
              <dt>Outstanding</dt>
              <dd>
                <Money amount={explain.outstandingTotal} currency={data.settings.currency} />
              </dd>
            </div>
            <div>
              <dt>In transit</dt>
              <dd>
                <Money amount={explain.inTransitTotal} currency={data.settings.currency} />
              </dd>
            </div>
            <div data-proof={explained === 0 ? "ok" : "diff"}>
              <dt>Explained difference</dt>
              <dd className={cn(explained === 0 ? "text-credit" : "text-debit")}>
                <Money amount={explained} currency={data.settings.currency} signed />
              </dd>
            </div>
          </dl>
        </section>
      </div>
      {ages.lateCount > 0 ? (
        <p className="mb-2 text-sm text-debit">
          {ages.lateCount} uncleared {ages.lateCount === 1 ? "item is" : "items are"} 90+ days old.
        </p>
      ) : null}
      <div className="recon-aging is-sticky mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "1–30", amount: ages.d30 },
          { label: "31–60", amount: ages.d60 },
          { label: "61–90", amount: ages.d90 },
          { label: "90+", amount: ages.late, hot: true },
        ].map((b) => (
          <div
            key={b.label}
            className={cn(
              "rounded-xl border border-border bg-muted/40 px-3 py-2",
              b.hot && ages.lateCount > 0 && "border-debit/40",
            )}
          >
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{b.label}</p>
            <Money
              amount={b.amount}
              currency={data.settings.currency}
              className={cn("mt-0.5 block text-sm font-medium", b.hot && ages.late > 0 && "text-debit")}
            />
          </div>
        ))}
      </div>

      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search payee or type"
        label="Search uncleared"
      >
        <ListFilters
          selects={[
            {
              label: "Direction",
              value: typeFilter,
              options: [
                { value: "all", label: "All" },
                { value: "in", label: "Deposits" },
                { value: "out", label: "Payments" },
              ],
              onChange: (v) => setTypeFilter(v as typeof typeFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={[
            { value: "date:desc", label: "Date · newest" },
            { value: "date:asc", label: "Date · oldest" },
            { value: "payee:asc", label: "Payee A–Z" },
            { value: "days:desc", label: "Oldest first" },
          ]}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => setTypeFilter("all")}
        />
        <ListViewMenu
          layout={phoneLayout}
          onLayout={(next) => {
            setPhoneLayout(next);
            writePhoneLayout(RECONCILE_PHONE_LAYOUT_KEY, next);
          }}
          hiddenCount={vis.hiddenCount}
          extra={viewColumnExtra(RECON_CHIPS, vis)}
          onFitAll={() => {
            (Object.keys(RECON_COLS) as Array<keyof typeof RECON_COLS>).forEach((id) => {
              if (vis.on[id] === false) return;
              fit(id, RECON_CHIPS.find((c) => c.id === id)?.label ?? id);
            });
          }}
        />
      </ListToolbar>

      <ReconcileLines
        lines={sort.sorted}
        ticked={ticked}
        statementDate={statementDate}
        currency={data.settings.currency}
        fontSize={fontSize}
        phoneLayout={phoneLayout}
        billByPayment={billByPayment}
        allOn={allOn}
        someOn={someOn}
        sort={sort}
        colAligns={colAligns}
        cols={cols}
        pointer={pointer}
        gridRef={gridRef}
        onToggle={toggle}
        toggleAll={toggleAll}
        fit={fit}
        vis={vis}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Service charge">
            <Input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </Field>
          <Button variant="outline" onClick={() => postAdj("fee")}>
            Post fee
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Interest earned">
            <Input value={interest} onChange={(e) => setInterest(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </Field>
          <Button variant="outline" onClick={() => postAdj("interest")}>
            Post interest
          </Button>
        </div>
      </div>

      <div className={cn("mt-4 flex flex-wrap items-center gap-2 recon-finish-bar", isPhoneUi() && "phone-safe-bar")}>
        <Button onClick={finish} disabled={!canFinish} className="phone-press">
          Finish statement
        </Button>
        <Button variant="outline" onClick={() => setUndoing(true)} disabled={!last}>
          Undo last
        </Button>
        <p className="text-sm text-muted-foreground">
          {selected.length} ticked · cleared and explained must both be 0
          {last ? ` · last finished ${formatDate(last.statementDate)}` : ""}
        </p>
      </div>
      <ConfirmDelete
        open={undoing}
        title="Undo last statement?"
        body="Ticked lines go back to pending. The finished rec is removed. Closed periods stay locked — reopen the month first."
        confirmLabel="Undo"
        requirePhrase="UNDO"
        onClose={() => setUndoing(false)}
        onConfirm={() => {
          try {
            undoLastRecon(effectiveBankId);
            setTicked(new Set());
            toast.success("Last statement undone.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not undo.");
          }
          setUndoing(false);
        }}
      />
    </AppShell>
  );
}

type ReconColId = "check" | keyof typeof RECON_COLS;

function ReconcileLines({
  lines,
  ticked,
  statementDate,
  currency,
  fontSize,
  phoneLayout,
  billByPayment,
  allOn,
  someOn,
  sort,
  colAligns,
  cols,
  pointer,
  gridRef,
  onToggle,
  toggleAll,
  fit,
  vis,
}: {
  lines: CashLine[];
  ticked: Set<string>;
  statementDate: string;
  currency: string;
  fontSize: number;
  phoneLayout: PhoneLayout;
  billByPayment: Map<string, string>;
  allOn: boolean;
  someOn: boolean;
  sort: { key: string; dir: "asc" | "desc"; toggle: (column: string) => void };
  colAligns: { aligns: Record<keyof typeof RECON_COLS, "left" | "center" | "right">; setAlign: (id: keyof typeof RECON_COLS, a: "left" | "center" | "right") => void };
  cols: {
    tableRef: (node: HTMLTableElement | null) => void;
    tableWidth: number;
    widths: Record<ReconColId, number>;
    setWidth: (id: ReconColId, n: number) => void;
  };
  pointer: {
    activeId: string | null;
    setActiveId: (id: string) => void;
    bindContainer: <T extends HTMLElement>(outer?: Ref<T> | null) => (node: T | null) => void;
  };
  gridRef: RefObject<HTMLDivElement | null>;
  onToggle: (line: CashLine, on?: boolean) => void;
  toggleAll: (on: boolean) => void;
  fit: (id: ReconColId, label: string) => void;
  vis: ReturnType<typeof useColVisible>;
}) {
  const narrow = isNarrowUi();
  const cardMode = phoneLayout === "grid";
  const rowSize = cardMode ? (narrow ? 168 : 148) : narrow ? 52 : 44;
  const listRef = useRef<HTMLElement | null>(null);
  function bindList(node: HTMLElement | null) {
    listRef.current = node;
  }
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const keyRef = useRef<(i: number) => string | number>((i) => lines[i]?.id ?? i);
  keyRef.current = (i) => lines[i]?.id ?? i;
  const sizeRef = useRef(rowSize);
  sizeRef.current = rowSize;
  useLayoutEffect(() => {
    const node = listRef.current;
    const el = listScrollElement(node);
    setScrollEl((prev) => (prev === el ? prev : el));
    const margin = listScrollMargin(node, el);
    setScrollMargin((prev) => (Math.abs(prev - margin) < 1 ? prev : margin));
  });
  const virt = useVirtualizer({
    count: lines.length,
    getScrollElement: () => scrollEl ?? listScrollElement(listRef.current) ?? getWorkspaceScrollElement(),
    estimateSize: () => sizeRef.current,
    overscan: cardMode ? 8 : 12,
    getItemKey: (index) => keyRef.current(index),
    gap: cardMode ? 8 : 0,
    scrollMargin,
  });
  useEffect(() => {
    virt.measure();
    // Layout / type / count / scroller / margin only — virt identity would remeasure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneLayout, cardMode, fontSize, lines.length, scrollEl, scrollMargin, rowSize]);
  const vItems = virt.getVirtualItems();
  const first = vItems[0];
  const last = vItems[vItems.length - 1];
  const padTop = first ? Math.max(0, first.start - scrollMargin) : 0;
  const padBottom = last ? Math.max(0, virt.getTotalSize() - last.end + scrollMargin) : 0;

  if (cardMode || narrow) {
    return (
      <div
        className={cn("recon-phone-list", phoneLayout === "list" && "is-list")}
        data-layout={phoneLayout}
        style={{ ["--register-font" as string]: `${fontSize}px` }}
      >
        <div className="mb-2 flex items-center justify-between gap-2 no-print">
          <span className="inline-flex items-center gap-1">
            <ShopTick checked={allOn} indeterminate={someOn} onChange={toggleAll} label="Select all" />
            <span className="text-xs text-muted-foreground">Tick cleared</span>
          </span>
          <span className="text-xs text-muted-foreground">{lines.length} uncleared</span>
        </div>
        {lines.length === 0 ? (
          <p className="phone-empty text-sm text-muted-foreground">
            Nothing uncleared on or before this date.
          </p>
        ) : phoneLayout === "list" ? (
          <div ref={bindList} className="list-card register-phone-table min-w-0">
            <div
              ref={pointer.bindContainer(gridRef)}
              tabIndex={0}
              className="list-grid min-w-0 outline-none"
              {...vis.hideAttrs}
            >
            <table style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="w-10 px-2 py-2 no-print whitespace-nowrap" aria-label="Cleared" />
                  <SortHeader
                    compact
                    label="Date"
                    column="date"
                    sortKey={sort.key}
                    dir={sort.dir}
                    onToggle={sort.toggle}
                    align={colAligns.aligns.date ?? "center"}
                    onAlign={(a) => colAligns.setAlign("date", a)}
                    className="whitespace-nowrap px-2"
                  />
                  <SortHeader
                    compact
                    label="Payee"
                    column="payee"
                    sortKey={sort.key}
                    dir={sort.dir}
                    onToggle={sort.toggle}
                    align={colAligns.aligns.payee ?? "center"}
                    onAlign={(a) => colAligns.setAlign("payee", a)}
                    className="min-w-[10rem] whitespace-nowrap px-2"
                    fill
                  />
                  <SortHeader
                    compact
                    label="Amount"
                    column="payment"
                    sortable={false}
                    sortKey={sort.key}
                    dir={sort.dir}
                    onToggle={sort.toggle}
                    align={colAligns.aligns.payment ?? "center"}
                    onAlign={(a) => colAligns.setAlign("payment", a)}
                    className="whitespace-nowrap px-2"
                  />
                  <SortHeader
                    compact
                    label="Days"
                    column="days"
                    sortKey={sort.key}
                    dir={sort.dir}
                    onToggle={sort.toggle}
                    align={colAligns.aligns.days ?? "center"}
                    onAlign={(a) => colAligns.setAlign("days", a)}
                    className="whitespace-nowrap px-2"
                  />
                </tr>
              </thead>
              <tbody>
                {padTop > 0 ? (
                  <tr aria-hidden className="register-virt-pad">
                    <td colSpan={5} style={{ height: padTop, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {vItems.map((item) => {
                  const line = lines[item.index];
                  if (!line) return null;
                  return (
                    <ReconPhoneListRow
                      key={line.id}
                      index={item.index}
                      line={line}
                      on={ticked.has(lineKey(line))}
                      days={daysOutstanding(line.date, statementDate)}
                      currency={currency}
                      openId={openIdFor(line, billByPayment)}
                      dateAlign={colAligns.aligns.date ?? "center"}
                      payeeAlign={colAligns.aligns.payee ?? "center"}
                      amountAlign={colAligns.aligns.payment ?? "center"}
                      daysAlign={colAligns.aligns.days ?? "center"}
                      measureRef={virt.measureElement}
                      onToggle={onToggle}
                    />
                  );
                })}
                {padBottom > 0 ? (
                  <tr aria-hidden className="register-virt-pad">
                    <td colSpan={5} style={{ height: padBottom, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <ul ref={bindList} className="flex flex-col">
            {padTop > 0 ? (
              <li
                aria-hidden
                className="register-virt-pad"
                style={{
                  height: padTop,
                  margin: 0,
                  padding: 0,
                  border: 0,
                  overflow: "hidden",
                  listStyle: "none",
                }}
              />
            ) : null}
            {vItems.map((item) => {
              const line = lines[item.index];
              if (!line) return null;
              return (
                <ReconPhoneCard
                  key={line.id}
                  index={item.index}
                  line={line}
                  on={ticked.has(lineKey(line))}
                  days={daysOutstanding(line.date, statementDate)}
                  currency={currency}
                  openId={openIdFor(line, billByPayment)}
                  measureRef={virt.measureElement}
                  onToggle={onToggle}
                />
              );
            })}
            {padBottom > 0 ? (
              <li
                aria-hidden
                className="register-virt-pad"
                style={{
                  height: padBottom,
                  margin: 0,
                  padding: 0,
                  border: 0,
                  overflow: "hidden",
                  listStyle: "none",
                }}
              />
            ) : null}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div ref={bindList} className="list-card recon-table-card">
      <div
        ref={pointer.bindContainer(gridRef)}
        tabIndex={0}
        className="list-grid min-w-0 outline-none"
        {...vis.hideAttrs}
      >
      <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
        <colgroup>
          <col className="col-check no-print" style={{ width: cols.widths.check, minWidth: cols.widths.check }} />
          {(Object.keys(RECON_COLS) as Array<keyof typeof RECON_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="col-check no-print relative" style={{ width: cols.widths.check, minWidth: cols.widths.check }}>
              <span className="register-check-cell">
                <ShopTick
                  checked={allOn}
                  indeterminate={someOn}
                  onChange={toggleAll}
                  label="Select all"
                />
              </span>
              <ColResize
                width={cols.widths.check}
                onWidth={(n) => cols.setWidth("check", n)}
                onFit={() => fit("check", " ")}
              />
            </th>
            <SortHeader
              label="Date"
              column="date"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.date}
              onWidth={(n) => cols.setWidth("date", n)}
              onFit={() => fit("date", "Date")}
              align={colAligns.aligns.date ?? "center"}
              onAlign={(a) => colAligns.setAlign("date", a)}
            />
            <SortHeader
              label="Type"
              column="type"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.type}
              onWidth={(n) => cols.setWidth("type", n)}
              onFit={() => fit("type", "Type")}
              align={colAligns.aligns.type ?? "center"}
              onAlign={(a) => colAligns.setAlign("type", a)}
            />
            <SortHeader
              label="Payee"
              column="payee"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.payee}
              onWidth={(n) => cols.setWidth("payee", n)}
              onFit={() => fit("payee", "Payee")}
              align={colAligns.aligns.payee ?? "center"}
              onAlign={(a) => colAligns.setAlign("payee", a)}
              fill
            />
            <SortHeader
              label="Days"
              column="days"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.days}
              onWidth={(n) => cols.setWidth("days", n)}
              onFit={() => fit("days", "Days")}
              align={colAligns.aligns.days ?? "center"}
              onAlign={(a) => colAligns.setAlign("days", a)}
            />
            <SortHeader
              label="Payment"
              column="payment"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.payment}
              onWidth={(n) => cols.setWidth("payment", n)}
              onFit={() => fit("payment", "Payment")}
              align={colAligns.aligns.payment ?? "center"}
              onAlign={(a) => colAligns.setAlign("payment", a)}
            />
            <SortHeader
              label="Deposit"
              column="deposit"
              sortKey={sort.key}
              dir={sort.dir}
              onToggle={sort.toggle}
              width={cols.widths.deposit}
              onWidth={(n) => cols.setWidth("deposit", n)}
              onFit={() => fit("deposit", "Deposit")}
              align={colAligns.aligns.deposit ?? "center"}
              onAlign={(a) => colAligns.setAlign("deposit", a)}
            />
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                Nothing uncleared on or before this date.
              </td>
            </tr>
          ) : (
            <>
              {padTop > 0 ? (
                <tr aria-hidden className="register-virt-pad">
                  <td colSpan={7} style={{ height: padTop, padding: 0, border: 0 }} />
                </tr>
              ) : null}
              {vItems.map((item) => {
                const line = lines[item.index];
                if (!line) return null;
                return (
                  <ReconDeskRow
                    key={line.id}
                    index={item.index}
                    line={line}
                    on={ticked.has(lineKey(line))}
                    days={daysOutstanding(line.date, statementDate)}
                    currency={currency}
                    openId={openIdFor(line, billByPayment)}
                    active={pointer.activeId === line.id}
                    dateAlign={colAligns.aligns.date ?? "center"}
                    typeAlign={colAligns.aligns.type ?? "center"}
                    payeeAlign={colAligns.aligns.payee ?? "center"}
                    daysAlign={colAligns.aligns.days ?? "center"}
                    paymentAlign={colAligns.aligns.payment ?? "center"}
                    depositAlign={colAligns.aligns.deposit ?? "center"}
                    measureRef={virt.measureElement}
                    onActivate={pointer.setActiveId}
                    onToggle={onToggle}
                  />
                );
              })}
              {padBottom > 0 ? (
                <tr aria-hidden className="register-virt-pad">
                  <td colSpan={7} style={{ height: padBottom, padding: 0, border: 0 }} />
                </tr>
              ) : null}
            </>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const ReconDeskRow = memo(function ReconDeskRow({
  index,
  line,
  on,
  days,
  currency,
  openId,
  active,
  dateAlign,
  typeAlign,
  payeeAlign,
  daysAlign,
  paymentAlign,
  depositAlign,
  measureRef,
  onActivate,
  onToggle,
}: {
  index: number;
  line: CashLine;
  on: boolean;
  days: number;
  currency: string;
  openId: string;
  active: boolean;
  dateAlign: "left" | "center" | "right";
  typeAlign: "left" | "center" | "right";
  payeeAlign: "left" | "center" | "right";
  daysAlign: "left" | "center" | "right";
  paymentAlign: "left" | "center" | "right";
  depositAlign: "left" | "center" | "right";
  measureRef: (el: HTMLElement | null) => void;
  onActivate: (id: string) => void;
  onToggle: (line: CashLine, on?: boolean) => void;
}) {
  return (
    <tr
      ref={measureRef}
      data-index={index}
      className="border-b border-border/70 last:border-0"
      data-selected={on ? "true" : undefined}
      data-focused={active ? "true" : undefined}
      data-row-id={line.id}
      aria-current={active ? "true" : undefined}
      onClick={() => onActivate(line.id)}
      {...openProps(openKindFor(line), openId)}
    >
      <td
        className="col-check no-print"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <span className="register-check-cell">
          <ShopTick checked={on} onChange={(next) => onToggle(line, next)} label="Cleared" />
        </span>
      </td>
      <td className={cn("px-4 py-3 whitespace-nowrap", alignClass(dateAlign))} data-col="date" data-align={dateAlign}>{formatDate(line.date)}</td>
      <td className={cn("px-4 py-3", alignClass(typeAlign))} data-col="type" data-align={typeAlign}>{KIND_LABEL[line.kind]}</td>
      <td className={cn("px-4 py-3", alignClass(payeeAlign))} data-col="payee" data-align={payeeAlign}>{line.party}</td>
      <td className={cn("px-4 py-3", alignClass(daysAlign), days > 90 && "text-debit")} data-col="days" data-align={daysAlign}>{days || ""}</td>
      <td className={cn("px-4 py-3", alignClass(paymentAlign))} data-col="payment" data-align={paymentAlign}>
        {line.payment ? <Money amount={line.payment} currency={currency} /> : ""}
      </td>
      <td className={cn("px-4 py-3", alignClass(depositAlign))} data-col="deposit" data-align={depositAlign}>
        {line.deposit ? <Money amount={line.deposit} currency={currency} /> : ""}
      </td>
    </tr>
  );
});

const ReconPhoneListRow = memo(function ReconPhoneListRow({
  index,
  line,
  on,
  days,
  currency,
  openId,
  dateAlign,
  payeeAlign,
  amountAlign,
  daysAlign,
  measureRef,
  onToggle,
}: {
  index: number;
  line: CashLine;
  on: boolean;
  days: number;
  currency: string;
  openId: string;
  dateAlign: "left" | "center" | "right";
  payeeAlign: "left" | "center" | "right";
  amountAlign: "left" | "center" | "right";
  daysAlign: "left" | "center" | "right";
  measureRef: (el: HTMLElement | null) => void;
  onToggle: (line: CashLine, on?: boolean) => void;
}) {
  return (
    <tr
      ref={measureRef}
      data-index={index}
      data-selected={on ? "true" : undefined}
      className="border-b border-border/70 last:border-0 touch-manipulation"
      {...openProps(openKindFor(line), openId, { click: true })}
    >
      <td
        className="px-2 py-2.5 no-print"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ShopTick checked={on} onChange={(next) => onToggle(line, next)} label="Cleared" />
      </td>
      <td className={cn("whitespace-nowrap px-2 py-2.5 text-muted-foreground tabular-nums", alignClass(dateAlign))} data-col="date" data-align={dateAlign}>
        {formatDate(line.date)}
      </td>
      <td className={cn("min-w-[10rem] whitespace-normal px-2 py-3", alignClass(payeeAlign))} data-col="payee" data-align={payeeAlign}>
        <p className="font-medium break-words">{line.party}</p>
        <p className="mt-0.5 break-words text-muted-foreground">
          {KIND_LABEL[line.kind]}
          {line.number ? ` · ${line.number}` : ""}
          {line.memo?.trim() ? ` · ${line.memo}` : ""}
        </p>
      </td>
      <td className={cn("whitespace-nowrap px-2 py-2.5 tabular-nums", alignClass(amountAlign))} data-col="payment" data-align={amountAlign}>
        {line.payment ? (
          <Money amount={line.payment} currency={currency} className="text-debit" />
        ) : line.deposit ? (
          <Money amount={line.deposit} currency={currency} className="text-credit" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td
        className={cn("whitespace-nowrap px-2 py-2.5 tabular-nums", alignClass(daysAlign), days > 90 && "text-debit")}
        data-col="days"
        data-align={daysAlign}
      >
        {days ? `${days}d` : "—"}
      </td>
    </tr>
  );
});

const ReconPhoneCard = memo(function ReconPhoneCard({
  index,
  line,
  on,
  days,
  currency,
  openId,
  measureRef,
  onToggle,
}: {
  index: number;
  line: CashLine;
  on: boolean;
  days: number;
  currency: string;
  openId: string;
  measureRef: (el: HTMLElement | null) => void;
  onToggle: (line: CashLine, on?: boolean) => void;
}) {
  return (
    <li ref={measureRef} data-index={index}>
      <div
        data-selected={on ? "true" : undefined}
        className="recon-phone-card flex items-start gap-2 rounded-2xl border border-border/40 bg-card px-3 py-3 touch-manipulation shadow-none"
        {...openProps(openKindFor(line), openId, { click: true })}
      >
        <div
          className="shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ShopTick checked={on} onChange={(next) => onToggle(line, next)} label="Cleared" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="phone-card-party min-w-0 break-words font-medium">{line.party}</p>
            <p className="phone-card-date shrink-0 text-muted-foreground tabular-nums">
              {formatDate(line.date)}
            </p>
          </div>
          <p className="phone-card-meta mt-0.5 text-muted-foreground">
            {KIND_LABEL[line.kind]}
            {line.number ? ` · ${line.number}` : ""}
            {days ? (
              <span className={cn(" · ", days > 90 && "text-debit")}>{days}d outstanding</span>
            ) : null}
          </p>
          <div className="phone-card-memo mt-1">
            <p className="phone-card-label text-muted-foreground">Memo</p>
            <p className="break-words text-muted-foreground/90">
              {line.memo?.trim() ? line.memo : "—"}
            </p>
          </div>
          <div className="phone-card-money mt-1.5 grid grid-cols-2 gap-2 tabular-nums">
            <div>
              <p className="phone-card-label text-muted-foreground">Payment</p>
              {line.payment ? (
                <Money amount={line.payment} currency={currency} className="text-debit" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="text-right">
              <p className="phone-card-label text-muted-foreground">Deposit</p>
              {line.deposit ? (
                <Money amount={line.deposit} currency={currency} className="text-credit" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
});

