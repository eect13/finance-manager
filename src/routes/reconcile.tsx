import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
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
import { PhoneFiltersSheet } from "@/components/phone-filters-sheet";
import { PhoneSwipe } from "@/components/phone-swipe";
import {
  RECONCILE_PHONE_LAYOUT_KEY,
  readPhoneLayout,
  writePhoneLayout,
  type PhoneLayout,
  usePhoneUi,
} from "@/lib/phone-layout";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { bookBalanceOn, daysOutstanding, explainedDifference, isReconAdj, lastReconForBank, namedFromCash, namedReconLines, reconBeginning, reconDifference, reconExplain, unclearedAge, unclearedLines } from "@/lib/finance/reconcile";
import { KIND_LABEL, type CashLine } from "@/lib/finance/register";
import { openProps } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reconcile")({ component: ReconcilePage });

const CHECK_COL = 40;
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
  const [fee, setFee] = useState("");
  const [interest, setInterest] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [printLast, setPrintLast] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-recon-cols-v2", reconDefaultCols());

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
  const sort = useEntrySort(uncleared, "date", getters, "asc");
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
    setTicked((prev) => {
      const next = new Set(prev);
      const key = lineKey(line);
      const should = on ?? !next.has(key);
      if (should) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleAll(on: boolean) {
    setTicked(on ? new Set(uncleared.map(lineKey)) : new Set());
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
        <PhoneFiltersSheet
          phone={phone}
          title="Filters"
          activeCount={typeFilter !== "all" ? 1 : 0}
          onClear={() => setTypeFilter("all")}
        >
          <ListFilters
            embedded={phone}
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
        </PhoneFiltersSheet>
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
            <span className="inline-flex items-center gap-2">
              <PhoneLayoutToggle
                value={phoneLayout}
                onChange={(next) => {
                  setPhoneLayout(next);
                  writePhoneLayout(RECONCILE_PHONE_LAYOUT_KEY, next);
                }}
              />
              <span className="text-xs text-muted-foreground">{sort.sorted.length} uncleared</span>
            </span>
          </div>
          {sort.sorted.length === 0 ? (
            <p className="phone-empty text-sm text-muted-foreground">
              Nothing uncleared on or before this date.
            </p>
          ) : (
            <ul className={cn("flex flex-col", phoneLayout === "list" ? "gap-1" : "gap-2")}>
              {sort.sorted.map((line) => {
                const on = ticked.has(lineKey(line));
                const days = daysOutstanding(line.date, statementDate);
                const openId =
                  line.kind === "bill-payment"
                    ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ?? line.sourceId)
                    : line.sourceId;
                if (phoneLayout === "list") {
                  return (
                    <li key={line.id}>
                      <PhoneSwipe
                        enabled={phone}
                        actions={[
                          {
                            label: on ? "Untick" : "Clear",
                            tone: on ? "default" : "success",
                            onAction: () => toggle(line, !on),
                          },
                        ]}
                      >
                      <div
                        className={cn(
                          "recon-phone-row flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 touch-manipulation",
                          on && "ring-1 ring-primary/40",
                        )}
                        {...openProps(openKindFor(line), openId, { click: true })}
                      >
                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <ShopTick checked={on} onChange={(next) => toggle(line, next)} label="Cleared" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="min-w-0 truncate text-[0.95em] font-medium">{line.party}</p>
                            <p className="shrink-0 text-[0.85em] text-muted-foreground tabular-nums">
                              {formatDate(line.date)}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2 text-[0.8em] text-muted-foreground">
                            <span className="min-w-0 truncate">
                              {KIND_LABEL[line.kind]}
                              {line.number ? ` · ${line.number}` : ""}
                              {days ? (
                                <span className={cn(days > 90 && " text-debit")}>{` · ${days}d`}</span>
                              ) : null}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-2 tabular-nums">
                              {line.payment ? (
                                <Money amount={line.payment} currency={data.settings.currency} className="text-debit" />
                              ) : line.deposit ? (
                                <Money amount={line.deposit} currency={data.settings.currency} className="text-credit" />
                              ) : (
                                <span>—</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      </PhoneSwipe>
                    </li>
                  );
                }
                return (
                  <li key={line.id}>
                    <PhoneSwipe
                      enabled={phone}
                      actions={[
                        {
                          label: on ? "Untick" : "Clear",
                          tone: on ? "default" : "success",
                          onAction: () => toggle(line, !on),
                        },
                      ]}
                    >
                    <div
                      className={cn(
                        "recon-phone-card flex items-start gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 touch-manipulation",
                        on && "ring-1 ring-primary/40",
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
                          <p className="phone-card-party min-w-0 truncate">{line.party}</p>
                          <p className="phone-card-date shrink-0 text-muted-foreground tabular-nums">{formatDate(line.date)}</p>
                        </div>
                        <p className="phone-card-meta mt-0.5 text-muted-foreground">
                          {KIND_LABEL[line.kind]}
                          {line.number ? ` · ${line.number}` : ""}
                          {days ? (
                            <span className={cn(" · ", days > 90 && "text-debit")}>{days}d outstanding</span>
                          ) : null}
                        </p>
                        <div className="phone-card-money mt-1.5 grid grid-cols-2 gap-2 tabular-nums">
                          <div>
                            <p className="phone-card-label text-muted-foreground">Payment</p>
                            {line.payment ? (
                              <Money amount={line.payment} currency={data.settings.currency} className="text-debit" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="phone-card-label text-muted-foreground">Deposit</p>
                            {line.deposit ? (
                              <Money amount={line.deposit} currency={data.settings.currency} className="text-credit" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    </PhoneSwipe>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
      <ListCard ref={gridRef} className="recon-table-card">
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
              sort.sorted.map((line) => {
                const on = ticked.has(lineKey(line));
                return (
                  <tr
                    key={line.id}
                    className="border-b border-border/70 last:border-0"
                    data-active={on ? "true" : undefined}
                    {...openProps(
                      openKindFor(line),
                      line.kind === "bill-payment"
                        ? (data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId))?.id ?? line.sourceId)
                        : line.sourceId,
                    )}
                  >
                    <td className="col-check no-print" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
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
              })
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
