import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DateInput } from "@/components/date-input";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { ReconPrint } from "@/components/period-print";
import { requestPrint } from "@/components/print-preview";
import { ShopTick } from "@/components/shop-tick";
import { PhoneLayoutToggle } from "@/components/phone-layout-toggle";
import {
  RECONCILE_PHONE_LAYOUT_KEY,
  readPhoneLayout,
  writePhoneLayout,
  type PhoneLayout,
  usePhoneUi,
} from "@/lib/phone-layout";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns } from "@/components/use-col-aligns";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { bookBalanceOn, daysOutstanding, explainedDifference, isReconAdj, lastReconForBank, namedFromCash, namedReconLines, reconBeginning, reconDifference, reconExplain, unclearedAge, unclearedLines } from "@/lib/finance/reconcile";
import { KIND_LABEL, type CashLine } from "@/lib/finance/register";
import { openProps, openTxn } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { getWorkspaceScrollElement } from "@/lib/workspace-scroll";

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


function reconDefaultCols() {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))").matches) {
    return { date: 64, type: 72, payee: 128, days: 44, payment: 86, deposit: 86 };
  }
  return { ...RECON_COLS };
}

function isPhoneUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))").matches;
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

function ReconcilePage() {
  const data = useFinanceData();
  const finishRecon = useFinanceStore((s) => s.finishRecon);
  const undoLastRecon = useFinanceStore((s) => s.undoLastRecon);
  const postReconAdjustment = useFinanceStore((s) => s.postReconAdjustment);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const live = data.banks.filter((b) => !b.archived);
  const [bankId, setBankId] = useState(live[0]?.id ?? "");
  const [statementDate, setStatementDate] = useState(todayIso());
  const [ending, setEnding] = useState("");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [phoneLayout, setPhoneLayout] = useState<PhoneLayout>(() =>
    readPhoneLayout(RECONCILE_PHONE_LAYOUT_KEY, "grid"),
  );
  const phone = usePhoneUi();
  const [viewOpen, setViewOpen] = useState(false);
  const fontSize = data.settings.registerFontSize ?? 12;
  const [fee, setFee] = useState("");
  const [interest, setInterest] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [printLast, setPrintLast] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-recon-cols-v2", reconDefaultCols());
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
  const phoneGrid = isPhoneUi() && phoneLayout === "grid";
  const phoneVirt = useVirtualizer({
    count: sort.sorted.length,
    getScrollElement: () => getWorkspaceScrollElement(),
    estimateSize: () => (phoneGrid ? 148 : 56),
    overscan: phoneGrid ? 8 : 12,
    getItemKey: (index) => sort.sorted[index]?.id ?? index,
    gap: phoneGrid ? 8 : 0,
  });
  // Desk table rows scroll inside ListCard (max-height). Phone keeps workspace scroll.
  const deskVirt = useVirtualizer({
    count: sort.sorted.length,
    getScrollElement: () => gridRef.current,
    estimateSize: () => 48,
    overscan: 16,
    getItemKey: (index) => sort.sorted[index]?.id ?? index,
  });
  useEffect(() => {
    phoneVirt.measure();
    deskVirt.measure();
    // Remeasure when layout or type size changes variable card / row heights.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneLayout, fontSize, sort.sorted.length]);
  const phoneVItems = phoneVirt.getVirtualItems();
  const phoneFirst = phoneVItems[0];
  const phoneLast = phoneVItems[phoneVItems.length - 1];
  const phonePadTop = phoneFirst ? phoneFirst.start : 0;
  const phonePadBottom = phoneLast ? Math.max(0, phoneVirt.getTotalSize() - phoneLast.end) : 0;
  const deskVItems = deskVirt.getVirtualItems();
  const deskFirst = deskVItems[0];
  const deskLast = deskVItems[deskVItems.length - 1];
  const deskPadTop = deskFirst ? deskFirst.start : 0;
  const deskPadBottom = deskLast ? Math.max(0, deskVirt.getTotalSize() - deskLast.end) : 0;
  const selected = allUncleared.filter((line) => ticked.has(lineKey(line)));
  const statementEnding = parseAmountToCents(ending);
  const difference = reconDifference(beginning, statementEnding, selected);
  const clearedIn = selected.reduce((s, l) => s + l.deposit, 0);
  const clearedOut = selected.reduce((s, l) => s + l.payment, 0);
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
      const kind = openKindFor(line);
      const targetId =
        line.kind === "bill-payment"
          ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ?? line.sourceId)
          : line.sourceId;
      openTxn(kind, targetId);
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

  function fit(id: keyof typeof RECON_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
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
        {phone ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-11 justify-start phone-press"
            aria-label="View options"
            onClick={() => setViewOpen(true)}
          >
            <SlidersHorizontal />
            View
          </Button>
        ) : null}
      </ListToolbar>

      {isPhoneUi() ? (
        <div
          className={cn("recon-phone-list", phoneLayout === "list" && "is-list")}
          data-layout={phoneLayout}
          style={{ ["--register-font" as string]: `${data.settings.registerFontSize ?? 12}px` }}
        >
          <div className="mb-2 flex items-center justify-between gap-2 no-print">
            <span className="inline-flex items-center gap-1">
              <ShopTick checked={allOn} indeterminate={someOn} onChange={toggleAll} label="Select all" />
              <span className="text-xs text-muted-foreground">Tick cleared</span>
            </span>
            <span className="text-xs text-muted-foreground">{sort.sorted.length} uncleared</span>
          </div>
          <Sheet open={viewOpen} onOpenChange={setViewOpen}>
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
                <Button type="button" size="sm" variant="ghost" onClick={() => setViewOpen(false)}>
                  Done
                </Button>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Layout</span>
                <PhoneLayoutToggle
                  value={phoneLayout}
                  onChange={(next) => {
                    setPhoneLayout(next);
                    writePhoneLayout(RECONCILE_PHONE_LAYOUT_KEY, next);
                  }}
                />
              </div>
              <label className="mb-2 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Resize type {fontSize}px</span>
                <input
                  type="range"
                  min={10}
                  max={18}
                  step={1}
                  value={fontSize}
                  aria-label="Reconcile font size"
                  className="w-full accent-primary"
                  onChange={(e) => updateSettings({ registerFontSize: Number(e.target.value) })}
                />
              </label>
              <p className="text-xs text-muted-foreground">Same type size as Register cards.</p>
            </SheetContent>
          </Sheet>
          {sort.sorted.length === 0 ? (
            <p className="phone-empty text-sm text-muted-foreground">
              Nothing uncleared on or before this date.
            </p>
          ) : phoneLayout === "list" ? (
            <div className="list-card list-grid register-phone-table min-w-0">
              <table style={{ width: "max-content", minWidth: "100%" }}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="w-10 px-2 py-2 no-print whitespace-nowrap" aria-label="Cleared" />
                    <th className="px-2 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="min-w-[10rem] px-2 py-2 text-left font-medium whitespace-nowrap">Payee</th>
                    <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Amount</th>
                    <th className="px-2 py-2 text-right font-medium whitespace-nowrap">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {phonePadTop > 0 ? (
                    <tr aria-hidden>
                      <td colSpan={5} style={{ height: phonePadTop, padding: 0, border: 0 }} />
                    </tr>
                  ) : null}
                  {phoneVItems.map((item) => {
                    const line = sort.sorted[item.index];
                    if (!line) return null;
                    const on = ticked.has(lineKey(line));
                    const days = daysOutstanding(line.date, statementDate);
                    const openId =
                      line.kind === "bill-payment"
                        ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ??
                          line.sourceId)
                        : line.sourceId;
                    return (
                      <tr
                        key={line.id}
                        ref={phoneVirt.measureElement}
                        data-index={item.index}
                        className={cn(
                          "border-b border-border/70 last:border-0 touch-manipulation",
                          on && "bg-primary/15",
                        )}
                        {...openProps(openKindFor(line), openId, { click: true })}
                      >
                        <td
                          className="px-2 py-2.5 no-print"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <ShopTick checked={on} onChange={(next) => toggle(line, next)} label="Cleared" />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-muted-foreground tabular-nums">
                          {formatDate(line.date)}
                        </td>
                        <td className="min-w-[10rem] whitespace-normal px-2 py-3">
                          <p className="font-medium break-words">{line.party}</p>
                          <p className="mt-0.5 break-words text-muted-foreground">
                            {KIND_LABEL[line.kind]}
                            {line.number ? ` · ${line.number}` : ""}
                            {line.memo?.trim() ? ` · ${line.memo}` : ""}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">
                          {line.payment ? (
                            <Money amount={line.payment} currency={data.settings.currency} className="text-debit" />
                          ) : line.deposit ? (
                            <Money amount={line.deposit} currency={data.settings.currency} className="text-credit" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-2 py-2.5 text-right tabular-nums",
                            days > 90 && "text-debit",
                          )}
                        >
                          {days ? `${days}d` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {phonePadBottom > 0 ? (
                    <tr aria-hidden>
                      <td colSpan={5} style={{ height: phonePadBottom, padding: 0, border: 0 }} />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="flex flex-col">
              {phonePadTop > 0 ? (
                <li
                  aria-hidden
                  style={{
                    height: phonePadTop,
                    margin: 0,
                    padding: 0,
                    border: 0,
                    overflow: "hidden",
                    listStyle: "none",
                  }}
                />
              ) : null}
              {phoneVItems.map((item) => {
                const line = sort.sorted[item.index];
                if (!line) return null;
                const on = ticked.has(lineKey(line));
                const days = daysOutstanding(line.date, statementDate);
                const openId =
                  line.kind === "bill-payment"
                    ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ??
                      line.sourceId)
                    : line.sourceId;
                return (
                  <li key={line.id} ref={phoneVirt.measureElement} data-index={item.index}>
                      <div
                        className={cn(
                          "recon-phone-card flex items-start gap-2 rounded-2xl border border-border/40 bg-card px-3 py-3 touch-manipulation shadow-none",
                          on && "border-primary bg-primary/15 ring-1 ring-primary",
                        )}
                        {...openProps(openKindFor(line), openId, { click: true })}
                      >
                        <div
                          className="shrink-0 pt-0.5"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <ShopTick checked={on} onChange={(next) => toggle(line, next)} label="Cleared" />
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
                                <Money
                                  amount={line.payment}
                                  currency={data.settings.currency}
                                  className="text-debit"
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="phone-card-label text-muted-foreground">Deposit</p>
                              {line.deposit ? (
                                <Money
                                  amount={line.deposit}
                                  currency={data.settings.currency}
                                  className="text-credit"
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                  </li>
                );
              })}
              {phonePadBottom > 0 ? (
                <li
                  aria-hidden
                  style={{
                    height: phonePadBottom,
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
      ) : (
      <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="recon-table-card outline-none">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            <col className="col-check no-print" style={{ width: CHECK_COL }} />
            {(Object.keys(RECON_COLS) as Array<keyof typeof RECON_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="col-check no-print relative">
                <span className="register-check-cell">
                  <ShopTick
                    checked={allOn}
                    indeterminate={someOn}
                    onChange={toggleAll}
                    label="Select all"
                  />
                </span>
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
              
                align={colAligns.aligns.date ?? "left"}
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
              />
              <SortHeader
                label="Days"
                column="days"
                sortKey={sort.key}
                dir={sort.dir}
                onToggle={sort.toggle}
                align="right"
                width={cols.widths.days}
                onWidth={(n) => cols.setWidth("days", n)}
                onFit={() => fit("days", "Days")}
              />
              <SortHeader
                label="Payment"
                column="payment"
                sortKey={sort.key}
                dir={sort.dir}
                onToggle={sort.toggle}
                align="right"
                width={cols.widths.payment}
                onWidth={(n) => cols.setWidth("payment", n)}
                onFit={() => fit("payment", "Payment")}
              />
              <SortHeader
                label="Deposit"
                column="deposit"
                sortKey={sort.key}
                dir={sort.dir}
                onToggle={sort.toggle}
                align="right"
                width={cols.widths.deposit}
                onWidth={(n) => cols.setWidth("deposit", n)}
                onFit={() => fit("deposit", "Deposit")}
              />
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing uncleared on or before this date.
                </td>
              </tr>
            ) : (
              <>
                {deskPadTop > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={7} style={{ height: deskPadTop, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {deskVItems.map((item) => {
                  const line = sort.sorted[item.index];
                  if (!line) return null;
                  const on = ticked.has(lineKey(line));
                  return (
                    <tr
                      key={line.id}
                      ref={deskVirt.measureElement}
                      data-index={item.index}
                      className={cn(
                        "border-b border-border/70 last:border-0",
                        on && "bg-primary/15",
                      )}
                      data-active={on ? "true" : undefined}
                      data-selected={on ? "true" : undefined}
                      data-focused={pointer.activeId === line.id ? "true" : undefined}
                      data-row-id={line.id}
                      aria-current={pointer.activeId === line.id ? "true" : undefined}
                      onClick={(e) => {
                        pointer.setActiveId(line.id);
                      }}
                      {...openProps(
                        openKindFor(line),
                        line.kind === "bill-payment"
                          ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ?? line.sourceId)
                          : line.sourceId,
                      )}
                    >
                      <td
                        className="col-check no-print"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <span className="register-check-cell">
                          <ShopTick checked={on} onChange={(next) => toggle(line, next)} label="Cleared" />
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" data-col="date">{formatDate(line.date)}</td>
                      <td className="px-4 py-3" data-col="type">{KIND_LABEL[line.kind]}</td>
                      <td className="px-4 py-3" data-col="payee">{line.party}</td>
                      <td className={cn("px-4 py-3 text-right", daysOutstanding(line.date, statementDate) > 90 && "text-debit")} data-col="days">{daysOutstanding(line.date, statementDate) || ""}</td>
                      <td className="px-4 py-3 text-right" data-col="payment">
                        {line.payment ? <Money amount={line.payment} currency={data.settings.currency} /> : ""}
                      </td>
                      <td className="px-4 py-3 text-right" data-col="deposit">
                        {line.deposit ? <Money amount={line.deposit} currency={data.settings.currency} /> : ""}
                      </td>
                    </tr>
                  );
                })}
                {deskPadBottom > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={7} style={{ height: deskPadBottom, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </ListCard>
      )}

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

      <div className={cn("mt-4 flex flex-wrap items-center gap-2 recon-finish-bar", phone && "phone-safe-bar")}>
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
