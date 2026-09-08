import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DateInput } from "@/components/date-input";
import { CardGrid, DocCards } from "@/components/doc-cards";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ReportsPrint } from "@/components/period-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { SortHeader } from "@/components/sort-header";
import { listColClass, listColWidthStyle, listTableStyle } from "@/components/list-table";
import { useColWidths } from "@/components/use-col-widths";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { useColVisible, visibleTableWidth, viewColumnExtra } from "@/components/column-chips";
import { ListViewMenu } from "@/components/list-view-menu";
import { useListView } from "@/components/view-toggle";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useListVirtualizer, VirtPad } from "@/components/use-list-virtualizer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGE_LABEL, AGE_ORDER, agingTotals, apAging, arAging, type AgingRow } from "@/lib/finance/aging";
import { trialBalanceRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, todayIso } from "@/lib/finance/format";
import { incomeStatement, trialBalance, vatBalances } from "@/lib/finance/ledger";
import { payrollRemittance } from "@/lib/finance/ph-payroll";
import type { Account } from "@/lib/finance/types";
import { openProps, openTxn } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const AGE_CHIPS = [
  { id: "party", label: "Party" },
  { id: "number", label: "No." },
  { id: "due", label: "Due" },
  { id: "age", label: "Age" },
  { id: "amount", label: "Open" },
] as const;
const AGE_VIS_IDS = AGE_CHIPS.map((c) => c.id);
const TB_CHIPS = [
  { id: "account", label: "Account" },
  { id: "debit", label: "Debit" },
  { id: "credit", label: "Credit" },
] as const;
const TB_VIS_IDS = TB_CHIPS.map((c) => c.id);
const PL_CHIPS = [
  { id: "account", label: "Account" },
  { id: "amount", label: "Amount" },
] as const;
const PL_VIS_IDS = PL_CHIPS.map((c) => c.id);

function ReportsPage() {
  const data = useFinanceData();
  const settings = data.settings;
  const [asOf, setAsOf] = useState(todayIso());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("aging");
  const ageVis = useColVisible("finance-manager-aging-vis", AGE_VIS_IDS);
  const tbVis = useColVisible("finance-manager-tb-vis", TB_VIS_IDS);
  const plVis = useColVisible("finance-manager-pl-vis", PL_VIS_IDS);
  const [ageView, setAgeView] = useListView("reports-aging");
  const [tbView, setTbView] = useListView("reports-tb");
  const [plView, setPlView] = useListView("reports-pl");
  const ageFitAr = useRef<(() => void) | null>(null);
  const ageFitAp = useRef<(() => void) | null>(null);
  const tbFit = useRef<(() => void) | null>(null);
  const plFit = useRef<(() => void) | null>(null);
  const tb = useMemo(() => trialBalance(data, asOf), [data, asOf]);
  const pl = useMemo(() => incomeStatement(data, asOf), [data, asOf]);
  const debit = tb.reduce((s, r) => s + r.debit, 0);
  const credit = tb.reduce((s, r) => s + r.credit, 0);
  const ar = useMemo(() => arAging(data, asOf), [data, asOf]);
  const ap = useMemo(() => apAging(data, asOf), [data, asOf]);
  const q = query.trim().toLowerCase();
  const arVisible = useMemo(
    () => (q ? ar.filter((r) => [r.party, r.number].join(" ").toLowerCase().includes(q)) : ar),
    [ar, q],
  );
  const apVisible = useMemo(
    () => (q ? ap.filter((r) => [r.party, r.number].join(" ").toLowerCase().includes(q)) : ap),
    [ap, q],
  );
  const tbVisible = useMemo(
    () => (q ? tb.filter((r) => `${r.account.code} ${r.account.name}`.toLowerCase().includes(q)) : tb),
    [tb, q],
  );
  const plVisible = useMemo(
    () => (q ? pl.byAccount.filter((r) => `${r.account.code} ${r.account.name}`.toLowerCase().includes(q)) : pl.byAccount),
    [pl.byAccount, q],
  );

  return (
    <AppShell
      title="Reports"
      description="Trial balance, profit and loss, VAT, payroll remittance, and 30/60/90 aging as of a date."
      wide
      actions={
        <>
          <CsvButton filename="trial-balance.csv" rows={trialBalanceRows(data)} visible={tbVis.on} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
        </>
      }
    >
      <div className="mb-4 max-w-xs">
        <p className="mb-1 text-xs text-muted-foreground">As of</p>
        <DateInput value={asOf} onChange={setAsOf} />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="tb">Trial balance</TabsTrigger>
          <TabsTrigger value="pl">Profit and loss</TabsTrigger>
          <TabsTrigger value="vat">VAT</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>
        <TabsContent value="aging">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search party or number" label="Search aging">
            <ListViewMenu
              layout={ageView}
              onLayout={setAgeView}
              hiddenCount={ageView === "list" ? ageVis.hiddenCount : undefined}
              extra={ageView === "list" ? viewColumnExtra(AGE_CHIPS, ageVis) : undefined}
              onFitAll={ageView === "list" ? () => { ageFitAr.current?.(); ageFitAp.current?.(); } : undefined}
            />
          </ListToolbar>
          <div className="reports-aging">
            <AgingTable title="Receivables" kind="invoice" rows={arVisible} currency={settings.currency} vis={ageVis} layout={ageView} registerFit={(fn) => { ageFitAr.current = fn; }} />
            <AgingTable title="Payables" kind="bill" rows={apVisible} currency={settings.currency} vis={ageVis} layout={ageView} registerFit={(fn) => { ageFitAp.current = fn; }} />
          </div>
        </TabsContent>
        <TabsContent value="tb">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search account" label="Search trial balance">
            <ListViewMenu
              layout={tbView}
              onLayout={setTbView}
              hiddenCount={tbView === "list" ? tbVis.hiddenCount : undefined}
              extra={tbView === "list" ? viewColumnExtra(TB_CHIPS, tbVis) : undefined}
              onFitAll={tbView === "list" ? () => { tbFit.current?.(); } : undefined}
            />
          </ListToolbar>
          <p className="mb-3 text-sm text-muted-foreground">
            Debits <Money amount={debit} currency={settings.currency} /> · Credits{" "}
            <Money amount={credit} currency={settings.currency} />
            {debit !== credit ? " — out of balance." : ""}
          </p>
          <TrialTable rows={tbVisible} currency={settings.currency} vis={tbVis} layout={tbView} registerFit={(fn) => { tbFit.current = fn; }} />
        </TabsContent>
        <TabsContent value="pl">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search account" label="Search profit and loss">
            <ListViewMenu
              layout={plView}
              onLayout={setPlView}
              hiddenCount={plView === "list" ? plVis.hiddenCount : undefined}
              extra={plView === "list" ? viewColumnExtra(PL_CHIPS, plVis) : undefined}
              onFitAll={plView === "list" ? () => { plFit.current?.(); } : undefined}
            />
          </ListToolbar>
          <PlTable rows={plVisible} net={pl.net} currency={settings.currency} vis={plVis} layout={plView} registerFit={(fn) => { plFit.current = fn; }} />
        </TabsContent>
        <TabsContent value="vat">
          <VatPanel asOf={asOf} currency={settings.currency} />
        </TabsContent>
        <TabsContent value="payroll">
          <PayrollPanel asOf={asOf} currency={settings.currency} />
        </TabsContent>
      </Tabs>
      <ReportsPrint asOf={asOf} tab={tab === "tb" || tab === "pl" || tab === "vat" || tab === "payroll" ? tab : "aging"} />
    </AppShell>
  );
}

function AgingTable({
  title,
  kind,
  rows,
  currency,
  vis,
  layout,
  registerFit,
}: {
  title: string;
  kind: "invoice" | "bill";
  rows: AgingRow[];
  currency: string;
  vis: ReturnType<typeof useColVisible>;
  layout: "list" | "grid";
  registerFit?: (fitAll: () => void) => void;
}) {
  const totals = agingTotals(rows);
  const grand = rows.reduce((s, r) => s + r.amount, 0);
  const getters = useMemo(
    () => ({
      party: (r: AgingRow) => r.party,
      number: (r: AgingRow) => r.number,
      due: (r: AgingRow) => r.dueDate,
      age: (r: AgingRow) => r.bucket,
      amount: (r: AgingRow) => r.amount,
    }),
    [],
  );
  const sort = useEntrySort(rows, "due", getters, "asc");
  const AGE_COLS = {
    party: 220,
    number: 128,
    due: 118,
    age: 72,
    amount: 176,
  } as const;
  const AGE_FIT_LABELS: Record<keyof typeof AGE_COLS, string> = {
    party: "Party",
    number: "No.",
    due: "Due",
    age: "Age",
    amount: "Open",
  };
  const cols = useColWidths(`finance-manager-aging-${kind}-cols`, AGE_COLS);
  const colAligns = useColAligns(`finance-manager-aging-${kind}-col-aligns`, Object.keys(AGE_COLS) as Array<keyof typeof AGE_COLS>);
  const gridRef = useRef<HTMLDivElement>(null);
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((r) => r.id),
    onOpen: (id) => openTxn(kind, id),
  });
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.id ?? index, 48, layout === "list");
  function fit(id: keyof typeof AGE_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  function fitAll() {
    (Object.keys(AGE_COLS) as Array<keyof typeof AGE_COLS>).forEach((id) => {
      if (vis.on[id] === false) return;
      fit(id, AGE_FIT_LABELS[id]);
    });
  }
  registerFit?.(fitAll);
  const heading = (
    <>
      <h2 className="font-display mb-2 text-lg font-medium">{title}</h2>
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {AGE_ORDER.map((bucket) => (
          <span key={bucket}>
            {AGE_LABEL[bucket]} <Money amount={totals[bucket]} currency={currency} />
          </span>
        ))}
      </p>
    </>
  );
  const ageGridRows = useMemo(
    () =>
      sort.sorted.map((row) => ({
        id: row.id,
        title: row.party,
        meta: [row.number, formatDate(row.dueDate), AGE_LABEL[row.bucket]].filter(Boolean).join(" · "),
        amount: row.amount,
        currency,
        onOpen: () => openTxn(kind, row.id),
      })),
    [sort.sorted, currency, kind],
  );
  if (layout === "grid") {
    return (
      <section>
        {heading}
        <div className="space-y-3">
          <DocCards empty="Nothing open." rows={ageGridRows} />
          {rows.length > 0 ? (
            <div className="item-card flex items-center justify-between gap-3">
              <span className="item-card-title font-medium">Total</span>
              <Money amount={grand} currency={currency} className="item-card-amount font-medium tabular-nums" />
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section>
      {heading}
      <div
        ref={pointer.bindContainer(gridRef)}
        tabIndex={0}
        className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none"
        onMouseDown={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest("input, textarea, select, button, a, [role='checkbox']")) return;
          (e.currentTarget as HTMLElement).focus({ preventScroll: true });
        }}
        {...vis.hideAttrs}
      >
        <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
          <colgroup>
            {(Object.keys(AGE_COLS) as Array<keyof typeof AGE_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Party" column="party" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.party} onWidth={(n) => cols.setWidth("party", n)} onFit={() => fit("party", "Party")} align={colAligns.aligns.party ?? "center"} onAlign={(a) => colAligns.setAlign("party", a)} fill />
              <SortHeader label="No." column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "No.")} align={colAligns.aligns.number ?? "center"} onAlign={(a) => colAligns.setAlign("number", a)} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.due} onWidth={(n) => cols.setWidth("due", n)} onFit={() => fit("due", "Due")} align={colAligns.aligns.due ?? "center"} onAlign={(a) => colAligns.setAlign("due", a)} />
              <SortHeader label="Age" column="age" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.age} onWidth={(n) => cols.setWidth("age", n)} onFit={() => fit("age", "Age")} align={colAligns.aligns.age ?? "center"} onAlign={(a) => colAligns.setAlign("age", a)} />
              <SortHeader label="Open" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Open")} align={colAligns.aligns.amount ?? "center"} onAlign={(a) => colAligns.setAlign("amount", a)} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nothing open.
                </td>
              </tr>
            ) : (
              <>
                <VirtPad height={listVirt.padTop} colSpan={5} />
                {listVirt.items.map((v) => {
                  const row = sort.sorted[v.index];
                  if (!row) return null;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/70 last:border-0"
                      data-focused={pointer.activeId === row.id ? "true" : undefined}
                      data-row-id={row.id}
                      aria-current={pointer.activeId === row.id ? "true" : undefined}
                      {...openProps(kind, row.id)}
                      onClick={() => pointer.setActiveId(row.id)}
                    >
                      <td className={cn("px-3 py-2", alignClass(colAligns.aligns.party ?? "center"))} data-col="party" data-align={colAligns.aligns.party ?? "center"}>{row.party}</td>
                      <td className={cn("px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.number ?? "center"))} data-col="number" data-align={colAligns.aligns.number ?? "center"}>{row.number}</td>
                      <td className={cn("px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.due ?? "center"))} data-col="due" data-align={colAligns.aligns.due ?? "center"}>{formatDate(row.dueDate)}</td>
                      <td className={cn("px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.age ?? "center"))} data-col="age" data-align={colAligns.aligns.age ?? "center"}>{AGE_LABEL[row.bucket]}</td>
                      <td className={cn("px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                        <Money amount={row.amount} currency={currency} />
                      </td>
                    </tr>
                  );
                })}
                <VirtPad height={listVirt.padBottom} colSpan={5} />
              </>
            )}
            <tr>
              <td className="px-3 py-2 font-medium" colSpan={4}>
                Total
              </td>
              <td className={cn("px-3 py-2 font-medium whitespace-nowrap", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                <Money amount={grand} currency={currency} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

type TbRow = ReturnType<typeof trialBalance>[number];
type PlRow = { account: Account; amount: number };

const TB_COLS = {
  account: 280,
  debit: 176,
  credit: 176,
} as const;

function TrialTable({
  rows,
  currency,
  vis,
  layout,
  registerFit,
}: {
  rows: TbRow[];
  currency: string;
  vis: ReturnType<typeof useColVisible>;
  layout: "list" | "grid";
  registerFit?: (fitAll: () => void) => void;
}) {
  const cols = useColWidths("finance-manager-tb-cols", TB_COLS);
  const colAligns = useColAligns("finance-manager-tb-col-aligns", Object.keys(TB_COLS) as Array<keyof typeof TB_COLS>);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      account: (r: TbRow) => `${r.account.code} ${r.account.name}`,
      debit: (r: TbRow) => r.debit,
      credit: (r: TbRow) => r.credit,
    }),
    [],
  );
  const sort = useEntrySort(rows, "account", getters, "asc");
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((r) => r.account.id),
  });
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.account.id ?? index, 48, layout === "list");
  function fit(id: keyof typeof TB_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  function fitAll() {
    (Object.keys(TB_COLS) as Array<keyof typeof TB_COLS>).forEach((id) => {
      if (vis.on[id] === false) return;
      fit(id, id === "account" ? "Account" : id === "debit" ? "Debit" : "Credit");
    });
  }
  registerFit?.(fitAll);
  if (layout === "grid") {
    return (
      <CardGrid items={sort.sorted} empty="No accounts on the trial balance." getId={(r) => r.account.id}>
        {(row) => (
          <div className="item-card">
            <span className="item-card-title block min-w-0 break-words font-medium">
              <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
            </span>
            <div className="item-card-meta mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-muted-foreground">
              <span className="whitespace-nowrap">
                Debit{" "}
                {row.debit ? (
                  <Money amount={row.debit} currency={currency} className="font-medium text-foreground tabular-nums" />
                ) : (
                  "—"
                )}
              </span>
              <span className="whitespace-nowrap">
                Credit{" "}
                {row.credit ? (
                  <Money amount={row.credit} currency={currency} className="font-medium text-foreground tabular-nums" />
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        )}
      </CardGrid>
    );
  }
  return (
    <div
      ref={pointer.bindContainer(gridRef)}
      tabIndex={0}
      className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none"
      onMouseDown={(e) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest("input, textarea, select, button, a, [role='checkbox']")) return;
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      {...vis.hideAttrs}
    >
      <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
        <colgroup>
          {(Object.keys(TB_COLS) as Array<keyof typeof TB_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Account" column="account" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.account} onWidth={(n) => cols.setWidth("account", n)} onFit={() => fit("account", "Account")} align={colAligns.aligns.account ?? "center"} onAlign={(a) => colAligns.setAlign("account", a)} fill />
            <SortHeader label="Debit" column="debit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.debit} onWidth={(n) => cols.setWidth("debit", n)} onFit={() => fit("debit", "Debit")} align={colAligns.aligns.debit ?? "center"} onAlign={(a) => colAligns.setAlign("debit", a)} />
            <SortHeader label="Credit" column="credit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.credit} onWidth={(n) => cols.setWidth("credit", n)} onFit={() => fit("credit", "Credit")} align={colAligns.aligns.credit ?? "center"} onAlign={(a) => colAligns.setAlign("credit", a)} />
          </tr>
        </thead>
        <tbody>
          <VirtPad height={listVirt.padTop} colSpan={3} />
          {listVirt.items.map((v) => {
            const row = sort.sorted[v.index];
            if (!row) return null;
            return (
              <tr
                key={row.account.id}
                className="border-b border-border/70 last:border-0"
                data-focused={pointer.activeId === row.account.id ? "true" : undefined}
                data-row-id={row.account.id}
                aria-current={pointer.activeId === row.account.id ? "true" : undefined}
                onClick={() => pointer.setActiveId(row.account.id)}
              >
                <td className={cn("px-4 py-2", alignClass(colAligns.aligns.account ?? "center"))} data-col="account" data-align={colAligns.aligns.account ?? "center"}>
                  <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
                </td>
                <td className={cn("px-4 py-2 whitespace-nowrap", alignClass(colAligns.aligns.debit ?? "center"))} data-col="debit" data-align={colAligns.aligns.debit ?? "center"}>
                  {row.debit ? <Money amount={row.debit} currency={currency} /> : ""}
                </td>
                <td className={cn("px-4 py-2 whitespace-nowrap", alignClass(colAligns.aligns.credit ?? "center"))} data-col="credit" data-align={colAligns.aligns.credit ?? "center"}>
                  {row.credit ? <Money amount={row.credit} currency={currency} /> : ""}
                </td>
              </tr>
            );
          })}
          <VirtPad height={listVirt.padBottom} colSpan={3} />
        </tbody>
      </table>
    </div>
  );
}

const PL_COLS = {
  account: 280,
  amount: 176,
} as const;

function PlTable({
  rows,
  net,
  currency,
  vis,
  layout,
  registerFit,
}: {
  rows: PlRow[];
  net: number;
  currency: string;
  vis: ReturnType<typeof useColVisible>;
  layout: "list" | "grid";
  registerFit?: (fitAll: () => void) => void;
}) {
  const cols = useColWidths("finance-manager-pl-cols", PL_COLS);
  const colAligns = useColAligns("finance-manager-pl-col-aligns", Object.keys(PL_COLS) as Array<keyof typeof PL_COLS>);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      account: (r: PlRow) => `${r.account.code} ${r.account.name}`,
      amount: (r: PlRow) => (r.account.type === "expense" ? -r.amount : r.amount),
    }),
    [],
  );
  const sort = useEntrySort(rows, "account", getters, "asc");
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((r) => r.account.id),
  });
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.account.id ?? index, 48, layout === "list");
  function fit(id: keyof typeof PL_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  function fitAll() {
    (Object.keys(PL_COLS) as Array<keyof typeof PL_COLS>).forEach((id) => {
      if (vis.on[id] === false) return;
      fit(id, id === "account" ? "Account" : "Amount");
    });
  }
  registerFit?.(fitAll);
  if (layout === "grid") {
    return (
      <div className="space-y-3">
        <CardGrid items={sort.sorted} empty="No income or expense accounts in range." getId={(r) => r.account.id}>
          {(row) => (
            <div className="item-card">
              <span className="item-card-title block min-w-0 break-words font-medium">
                <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
              </span>
              <Money
                amount={row.account.type === "expense" ? -row.amount : row.amount}
                currency={currency}
                signed
                className="item-card-amount mt-1 font-medium tabular-nums"
              />
            </div>
          )}
        </CardGrid>
        <div className="item-card flex items-center justify-between gap-3">
          <span className="item-card-title font-medium">Net income</span>
          <Money amount={net} currency={currency} signed className="item-card-amount font-medium tabular-nums" />
        </div>
      </div>
    );
  }
  return (
    <div
      ref={pointer.bindContainer(gridRef)}
      tabIndex={0}
      className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none"
      onMouseDown={(e) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest("input, textarea, select, button, a, [role='checkbox']")) return;
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      {...vis.hideAttrs}
    >
      <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
        <colgroup>
          {(Object.keys(PL_COLS) as Array<keyof typeof PL_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Account" column="account" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.account} onWidth={(n) => cols.setWidth("account", n)} onFit={() => fit("account", "Account")} align={colAligns.aligns.account ?? "center"} onAlign={(a) => colAligns.setAlign("account", a)} fill />
            <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} align={colAligns.aligns.amount ?? "center"} onAlign={(a) => colAligns.setAlign("amount", a)} />
          </tr>
        </thead>
        <tbody>
          <VirtPad height={listVirt.padTop} colSpan={2} />
          {listVirt.items.map((v) => {
            const row = sort.sorted[v.index];
            if (!row) return null;
            return (
              <tr
                key={row.account.id}
                className="border-b border-border/70 last:border-0"
                data-focused={pointer.activeId === row.account.id ? "true" : undefined}
                data-row-id={row.account.id}
                aria-current={pointer.activeId === row.account.id ? "true" : undefined}
                onClick={() => pointer.setActiveId(row.account.id)}
              >
                <td className={cn("px-4 py-2", alignClass(colAligns.aligns.account ?? "center"))} data-col="account" data-align={colAligns.aligns.account ?? "center"}>
                  <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
                </td>
                <td className={cn("px-4 py-2 whitespace-nowrap", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                  <Money
                    amount={row.account.type === "expense" ? -row.amount : row.amount}
                    currency={currency}
                    signed
                  />
                </td>
              </tr>
            );
          })}
          <VirtPad height={listVirt.padBottom} colSpan={2} />
          <tr>
            <td className="px-4 py-3 font-medium">Net income</td>
            <td className={cn("px-4 py-3 font-medium whitespace-nowrap", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
              <Money amount={net} currency={currency} signed />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VatPanel({ asOf, currency }: { asOf: string; currency: string }) {
  const data = useFinanceData();
  const vat = vatBalances(data, asOf);
  return (
    <div className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none">
      <table className="text-sm" style={{ width: "100%" }}>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-4 py-3 text-center font-medium">Account</th>
            <th className="px-4 py-3 text-center font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/70">
            <td className="px-4 py-3">Output VAT Payable (2200)</td>
            <td className="px-4 py-3">
              <Money amount={vat.output} currency={currency} />
            </td>
          </tr>
          <tr className="border-b border-border/70">
            <td className="px-4 py-3">Input VAT Receivable (1300)</td>
            <td className="px-4 py-3">
              <Money amount={vat.input} currency={currency} />
            </td>
          </tr>
          <tr>
            <td className="px-4 py-3 font-medium">Net VAT payable</td>
            <td className="px-4 py-3 font-medium">
              <Money amount={vat.netPayable} currency={currency} signed />
            </td>
          </tr>
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Output from taxed invoices and cash sales, input from taxed bills. Amount on a bill is VAT-inclusive when Tax % is set. Not a BIR return.
      </p>
    </div>
  );
}


function PayrollPanel({ asOf, currency }: { asOf: string; currency: string }) {
  const data = useFinanceData();
  const p = payrollRemittance(data, asOf);
  const row = (label: string, amount: number) => (
    <tr className="border-b border-border/70 last:border-0">
      <td className="px-4 py-3">{label}</td>
      <td className="px-4 py-3">
        <Money amount={amount} currency={currency} />
      </td>
    </tr>
  );
  return (
    <div className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none">
      <table className="text-sm" style={{ width: "100%" }}>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-4 py-3 text-center font-medium">Account</th>
            <th className="px-4 py-3 text-center font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {row("SSS Payable (2211)", p.sss)}
          {row("PhilHealth Payable (2212)", p.philhealth)}
          {row("Pag-IBIG Payable (2213)", p.pagibig)}
          {row("Withholding Tax Payable (2214)", p.wht)}
          {row("Other withholdings (2210)", p.other)}
          {row("Employer contributions (5310)", p.employer)}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-muted-foreground">
        2026 PH statutory from posted paychecks. Remit SSS, PhilHealth, Pag-IBIG, and BIR 1601-C from these balances. Not a government filing.
      </p>
    </div>
  );
}
