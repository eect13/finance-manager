import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DateInput } from "@/components/date-input";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ReportsPrint } from "@/components/period-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { SortHeader } from "@/components/sort-header";
import { listColClass } from "@/components/list-table";
import { useColWidths } from "@/components/use-col-widths";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGE_LABEL, AGE_ORDER, agingTotals, apAging, arAging, type AgingRow } from "@/lib/finance/aging";
import { trialBalanceRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, todayIso } from "@/lib/finance/format";
import { incomeStatement, trialBalance } from "@/lib/finance/ledger";
import type { Account } from "@/lib/finance/types";
import { openProps } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const data = useFinanceData();
  const settings = data.settings;
  const [asOf, setAsOf] = useState(todayIso());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("aging");
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
      description="Trial balance, profit and loss, and 30/60/90 aging as of a date."
      wide
      actions={
        <>
          <CsvButton filename="trial-balance.csv" rows={trialBalanceRows(data)} />
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
        </TabsList>
        <TabsContent value="aging">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search party or number" label="Search aging" />
          <div className="reports-aging">
            <AgingTable title="Receivables" kind="invoice" rows={arVisible} currency={settings.currency} />
            <AgingTable title="Payables" kind="bill" rows={apVisible} currency={settings.currency} />
          </div>
        </TabsContent>
        <TabsContent value="tb">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search account" label="Search trial balance" />
          <p className="mb-3 text-sm text-muted-foreground">
            Debits <Money amount={debit} currency={settings.currency} /> · Credits{" "}
            <Money amount={credit} currency={settings.currency} />
            {debit !== credit ? " — out of balance." : ""}
          </p>
          <TrialTable rows={tbVisible} currency={settings.currency} />
        </TabsContent>
        <TabsContent value="pl">
          <ListToolbar query={query} onQuery={setQuery} placeholder="Search account" label="Search profit and loss" />
          <PlTable rows={plVisible} net={pl.net} currency={settings.currency} />
        </TabsContent>
      </Tabs>
      <ReportsPrint asOf={asOf} tab={tab === "tb" || tab === "pl" ? tab : "aging"} />
    </AppShell>
  );
}

function AgingTable({
  title,
  kind,
  rows,
  currency,
}: {
  title: string;
  kind: "invoice" | "bill";
  rows: AgingRow[];
  currency: string;
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
  const cols = useColWidths(`finance-manager-aging-${kind}-cols`, AGE_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  function fit(id: keyof typeof AGE_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <section>
      <h2 className="font-display mb-2 text-lg font-medium">{title}</h2>
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {AGE_ORDER.map((bucket) => (
          <span key={bucket}>
            {AGE_LABEL[bucket]} <Money amount={totals[bucket]} currency={currency} />
          </span>
        ))}
      </p>
      <div ref={gridRef} className="list-grid list-scroll overflow-auto rounded-2xl bg-card elevation">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%", minWidth: cols.tableWidth }}>
          <colgroup>
            {(Object.keys(AGE_COLS) as Array<keyof typeof AGE_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Party" column="party" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.party} onWidth={(n) => cols.setWidth("party", n)} onFit={() => fit("party", "Party")} />
              <SortHeader label="No." column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "No.")} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.due} onWidth={(n) => cols.setWidth("due", n)} onFit={() => fit("due", "Due")} />
              <SortHeader label="Age" column="age" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.age} onWidth={(n) => cols.setWidth("age", n)} onFit={() => fit("age", "Age")} />
              <SortHeader label="Open" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="center" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Open")} />
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
              sort.sorted.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0" {...openProps(kind, row.id)}>
                  <td className="px-3 py-2" data-col="party">{row.party}</td>
                  <td className="px-3 py-2 whitespace-nowrap" data-col="number">{row.number}</td>
                  <td className="px-3 py-2 whitespace-nowrap" data-col="due">{formatDate(row.dueDate)}</td>
                  <td className="px-3 py-2 whitespace-nowrap" data-col="age">{AGE_LABEL[row.bucket]}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap" data-col="amount">
                    <Money amount={row.amount} currency={currency} />
                  </td>
                </tr>
              ))
            )}
            <tr>
              <td className="px-3 py-2 font-medium" colSpan={4}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-medium whitespace-nowrap" data-col="amount">
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

function TrialTable({ rows, currency }: { rows: TbRow[]; currency: string }) {
  const cols = useColWidths("finance-manager-tb-cols", TB_COLS);
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
  function fit(id: keyof typeof TB_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div ref={gridRef} className="list-grid list-scroll overflow-auto rounded-2xl bg-card elevation">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%", minWidth: cols.tableWidth }}>
        <colgroup>
          {(Object.keys(TB_COLS) as Array<keyof typeof TB_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Account" column="account" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.account} onWidth={(n) => cols.setWidth("account", n)} onFit={() => fit("account", "Account")} />
            <SortHeader label="Debit" column="debit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="center" width={cols.widths.debit} onWidth={(n) => cols.setWidth("debit", n)} onFit={() => fit("debit", "Debit")} />
            <SortHeader label="Credit" column="credit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="center" width={cols.widths.credit} onWidth={(n) => cols.setWidth("credit", n)} onFit={() => fit("credit", "Credit")} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((row) => (
            <tr key={row.account.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-2" data-col="account">
                <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap" data-col="debit">
                {row.debit ? <Money amount={row.debit} currency={currency} /> : ""}
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap" data-col="credit">
                {row.credit ? <Money amount={row.credit} currency={currency} /> : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PL_COLS = {
  account: 280,
  amount: 176,
} as const;

function PlTable({ rows, net, currency }: { rows: PlRow[]; net: number; currency: string }) {
  const cols = useColWidths("finance-manager-pl-cols", PL_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      account: (r: PlRow) => `${r.account.code} ${r.account.name}`,
      amount: (r: PlRow) => (r.account.type === "expense" ? -r.amount : r.amount),
    }),
    [],
  );
  const sort = useEntrySort(rows, "account", getters, "asc");
  function fit(id: keyof typeof PL_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div ref={gridRef} className="list-grid list-scroll overflow-auto rounded-2xl bg-card elevation">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%", minWidth: cols.tableWidth }}>
        <colgroup>
          {(Object.keys(PL_COLS) as Array<keyof typeof PL_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Account" column="account" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.account} onWidth={(n) => cols.setWidth("account", n)} onFit={() => fit("account", "Account")} />
            <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="center" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((row) => (
            <tr key={row.account.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-2" data-col="account">
                <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap" data-col="amount">
                <Money
                  amount={row.account.type === "expense" ? -row.amount : row.amount}
                  currency={currency}
                  signed
                />
              </td>
            </tr>
          ))}
          <tr>
            <td className="px-4 py-3 font-medium">Net income</td>
            <td className="px-4 py-3 text-right font-medium whitespace-nowrap" data-col="amount">
              <Money amount={net} currency={currency} signed />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
