import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns } from "@/components/use-col-aligns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ledgerRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, formatMoney } from "@/lib/finance/format";
import { accountBalance, trialBalance } from "@/lib/finance/ledger";
import { openProps, openTxn } from "@/lib/finance/open-record";
import { useEntrySort, type EntrySort } from "@/lib/finance/sort";
import { useFinanceData } from "@/lib/finance/store";
import type { Account, JournalEntry } from "@/lib/finance/types";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

function LedgerPage() {
  const data = useFinanceData();
  const { settings, accounts, journals } = data;
  const tb = trialBalance(data);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | JournalEntry["sourceType"]>("all");
  const period = useListPeriod("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journals.filter((e) => {
      if (source !== "all" && e.sourceType !== source) return false;
      if (!period.inRange(e.date)) return false;
      if (!q) return true;
      return [e.description, e.sourceType, e.date].join(" ").toLowerCase().includes(q);
    });
  }, [journals, query, source, period.inRange]);

  const getters = useMemo(
    () => ({
      date: (e: JournalEntry) => e.date,
      description: (e: JournalEntry) => e.description,
      source: (e: JournalEntry) => e.sourceType,
      debit: (e: JournalEntry) => e.lines.reduce((s, l) => s + l.debit, 0),
      credit: (e: JournalEntry) => e.lines.reduce((s, l) => s + l.credit, 0),
    }),
    [],
  );
  const sort = useEntrySort(filtered, "date", getters, "desc");
  const printRows = sort.sorted.map((e) => {
    const debit = e.lines.reduce((s, l) => s + l.debit, 0);
    return {
      date: formatDate(e.date),
      description: e.description,
      source: e.sourceType,
      amount: formatMoney(debit, settings.currency),
    };
  });

  return (
    <AppShell
      title="General ledger"
      description="Every movement is double-entry. This is the view you hand an accountant."
      wide
      actions={
        <>
          <CsvButton filename="general-ledger.csv" rows={ledgerRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
        </>
      }
    >
      <Tabs defaultValue="journal">
        <TabsList className="mb-3">
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="accounts">Chart of accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="journal">
          <ListToolbar
            query={query}
            onQuery={setQuery}
            placeholder="Search description"
            label="Search journal"
          >
            <ListFilters
              datePreset={period.preset}
              dateFrom={period.from}
              dateTo={period.to}
              onPreset={period.applyPreset}
              onDateFrom={period.setDateFrom}
              onDateTo={period.setDateTo}
              defaultPreset="all"
              selects={[
                {
                  label: "Source",
                  value: source,
                  options: [
                    { value: "all", label: "All" },
                    { value: "check", label: "Check" },
                    { value: "receipt", label: "Receipt" },
                    { value: "payment", label: "Payment" },
                    { value: "bill", label: "Bill" },
                    { value: "invoice", label: "Invoice" },
                    { value: "transfer", label: "Transfer" },
                    { value: "deposit", label: "Deposit" },
                    { value: "expense", label: "Expense" },
                    { value: "close", label: "Close" },
                  ],
                  onChange: (v) => setSource(v as typeof source),
                },
              ]}
              sortValue={`${sort.key}:${sort.dir}`}
              sortOptions={[
                { value: "date:desc", label: "Date · newest" },
                { value: "date:asc", label: "Date · oldest" },
                { value: "description:asc", label: "Description" },
                { value: "debit:desc", label: "Debit high–low" },
              ]}
              onSort={(v) => applySortValue(sort.set, v)}
              onClear={() => {
                setSource("all");
                period.reset();
              }}
            />
          </ListToolbar>
          <JournalTable entries={sort.sorted} currency={settings.currency} sort={sort} />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsTable accounts={accounts} currency={settings.currency} data={data} />
          <p className="mt-3 text-xs text-muted-foreground">
            Trial balance debit {tb.reduce((s, r) => s + r.debit, 0) / 100} / credit{" "}
            {tb.reduce((s, r) => s + r.credit, 0) / 100} (in {settings.currency} units).
          </p>
        </TabsContent>
      </Tabs>
      <ListPrint
        title="General ledger"
        columns={[
          { key: "date", label: "Date" },
          { key: "description", label: "Description" },
          { key: "source", label: "Source" },
          { key: "amount", label: "Amount", align: "right" },
        ]}
        rows={printRows}
      />
    </AppShell>
  );
}

const JRN_COLS = {
  date: 118,
  description: 280,
  source: 120,
  debit: 128,
  credit: 128,
} as const;

function JournalTable({
  entries,
  currency,
  sort,
}: {
  entries: JournalEntry[];
  currency: string;
  sort: EntrySort<JournalEntry>;
}) {
  const cols = useColWidths("finance-manager-journal-cols", JRN_COLS);
  const colAligns = useColAligns("finance-manager-journal-col-aligns", Object.keys(JRN_COLS) as Array<keyof typeof JRN_COLS>);
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((r) => r.id),
    onOpen: (id) => openTxn("journal", id),
  });
  const rows = sort.sorted;
  const gridRef = useRef<HTMLDivElement>(null);
  function fit(id: keyof typeof JRN_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  if (entries.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No journal entries yet.</p>;
  }
  return (
    <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="outline-none">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(JRN_COLS) as Array<keyof typeof JRN_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} align={colAligns.aligns.date ?? "center"} onAlign={(a) => colAligns.setAlign("date", a)} />
            <SortHeader label="Description" column="description" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.description} onWidth={(n) => cols.setWidth("description", n)} onFit={() => fit("description", "Description")} align={colAligns.aligns.description ?? "center"} onAlign={(a) => colAligns.setAlign("description", a)} />
            <SortHeader label="Source" column="source" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.source} onWidth={(n) => cols.setWidth("source", n)} onFit={() => fit("source", "Source")} align={colAligns.aligns.source ?? "center"} onAlign={(a) => colAligns.setAlign("source", a)} />
            <SortHeader label="Debit" column="debit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.debit} onWidth={(n) => cols.setWidth("debit", n)} onFit={() => fit("debit", "Debit")} align={colAligns.aligns.debit ?? "center"} onAlign={(a) => colAligns.setAlign("debit", a)} />
            <SortHeader label="Credit" column="credit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.credit} onWidth={(n) => cols.setWidth("credit", n)} onFit={() => fit("credit", "Credit")} align={colAligns.aligns.credit ?? "center"} onAlign={(a) => colAligns.setAlign("credit", a)} />
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const debit = entry.lines.reduce((s, l) => s + l.debit, 0);
            const credit = entry.lines.reduce((s, l) => s + l.credit, 0);
            return (
              <tr
                key={entry.id}
                className="border-b border-border/70 last:border-0"
                data-focused={pointer.activeId === entry.id ? "true" : undefined}
                data-row-id={entry.id}
                aria-current={pointer.activeId === entry.id ? "true" : undefined}
                {...openProps("journal", entry.id)}
                onClick={() => pointer.setActiveId(entry.id)}
              >
                <td className="px-4 py-3 whitespace-nowrap" data-col="date">{formatDate(entry.date)}</td>
                <td className="px-4 py-3 font-medium" data-col="description">{entry.description}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground" data-col="source">{entry.sourceType}</td>
                <td className="px-4 py-3 text-right" data-col="debit"><Money amount={debit} currency={currency} /></td>
                <td className="px-4 py-3 text-right" data-col="credit"><Money amount={credit} currency={currency} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ListCard>
  );
}

const ACCT_COLS = {
  code: 88,
  name: 240,
  type: 120,
  balance: 140,
} as const;

function AccountsTable({
  accounts,
  currency,
  data,
}: {
  accounts: Account[];
  currency: string;
  data: ReturnType<typeof useFinanceData>;
}) {
  const cols = useColWidths("finance-manager-accounts-cols", ACCT_COLS);
  const colAligns = useColAligns("finance-manager-accounts-col-aligns", Object.keys(ACCT_COLS) as Array<keyof typeof ACCT_COLS>);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      code: (a: Account) => a.code,
      name: (a: Account) => a.name,
      type: (a: Account) => a.type,
      balance: (a: Account) => accountBalance(data, a.id),
    }),
    [data],
  );
  const sort = useEntrySort(accounts, "code", getters, "asc");
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((a) => a.id),
    onOpen: () => {},
  });
  function fit(id: keyof typeof ACCT_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="outline-none">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(ACCT_COLS) as Array<keyof typeof ACCT_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Code" column="code" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.code} onWidth={(n) => cols.setWidth("code", n)} onFit={() => fit("code", "Code")} align={colAligns.aligns.code ?? "center"} onAlign={(a) => colAligns.setAlign("code", a)} />
            <SortHeader label="Account" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Account")} align={colAligns.aligns.name ?? "center"} onAlign={(a) => colAligns.setAlign("name", a)} />
            <SortHeader label="Type" column="type" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.type} onWidth={(n) => cols.setWidth("type", n)} onFit={() => fit("type", "Type")} align={colAligns.aligns.type ?? "center"} onAlign={(a) => colAligns.setAlign("type", a)} />
            <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} align={colAligns.aligns.balance ?? "center"} onAlign={(a) => colAligns.setAlign("balance", a)} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((account) => (
            <tr
              key={account.id}
              className="border-b border-border/70 last:border-0"
              data-focused={pointer.activeId === account.id ? "true" : undefined}
              data-row-id={account.id}
              aria-current={pointer.activeId === account.id ? "true" : undefined}
              onClick={() => pointer.setActiveId(account.id)}
            >
              <td className="px-4 py-3 tabular-nums" data-col="code">{account.code}</td>
              <td className="px-4 py-3" data-col="name">{account.name}</td>
              <td className="px-4 py-3 capitalize text-muted-foreground" data-col="type">{account.type}</td>
              <td className="px-4 py-3 text-right" data-col="balance">
                <Money amount={accountBalance(data, account.id)} currency={currency} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListCard>
  );
}
