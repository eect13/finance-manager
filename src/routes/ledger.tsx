import { createFileRoute } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CsvButton } from "@/components/export-menu";
import { Money } from "@/components/money";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ledgerRows } from "@/lib/finance/export";
import { formatDate } from "@/lib/finance/format";
import { accountBalance, trialBalance } from "@/lib/finance/ledger";
import { openProps } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData } from "@/lib/finance/store";
import type { Account, JournalEntry } from "@/lib/finance/types";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

function LedgerPage() {
  const data = useFinanceData();
  const { settings, accounts, journals } = data;
  const tb = trialBalance(data);

  const getters = useMemo(
    () => ({
      date: (e: JournalEntry) => e.date,
      description: (e: JournalEntry) => e.description,
      source: (e: JournalEntry) => e.sourceType,
    }),
    [],
  );
  const sort = useEntrySort(journals, "date", getters, "desc");

  return (
    <AppShell
      title="General ledger"
      description="Every movement is double-entry. This is the view you hand an accountant."
      actions={<CsvButton filename="general-ledger.csv" rows={ledgerRows(data)} />}
    >
      <Tabs defaultValue="journal">
        <TabsList>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="accounts">Chart of accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="journal">
          <div className="mb-3 flex flex-wrap gap-2">
            {(
              [
                ["date", "Date"],
                ["description", "Description"],
                ["source", "Source"],
              ] as const
            ).map(([column, label]) => (
              <button
                key={column}
                type="button"
                onClick={() => sort.toggle(column)}
                className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 text-sm text-foreground"
              >
                {label}
                {sort.key === column ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            ))}
          </div>
          <JournalList entries={sort.sorted} accounts={accounts} currency={settings.currency} />
        </TabsContent>
        <TabsContent value="accounts">
          <div className="overflow-x-auto rounded-3xl bg-card elevation">
            <table className="w-full min-w-xl text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 tabular-nums">{account.code}</td>
                    <td className="px-4 py-3">{account.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{account.type}</td>
                    <td className="px-4 py-3 text-right">
                      <Money amount={accountBalance(data, account.id)} currency={settings.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Trial balance debit {tb.reduce((s, r) => s + r.debit, 0) / 100} / credit{" "}
            {tb.reduce((s, r) => s + r.credit, 0) / 100} (in {settings.currency} units).
          </p>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function JournalList({
  entries,
  accounts,
  currency,
}: {
  entries: JournalEntry[];
  accounts: Account[];
  currency: string;
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
    count: entries.length,
    estimateSize: () => 152,
    overscan: 8,
    scrollMargin: margin,
    getItemKey: (index) => entries[index]?.id ?? index,
  });

  if (entries.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No journal entries yet.</p>;
  }

  return (
    <div ref={wrapRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => {
        const entry = entries[item.index];
        if (!entry) return null;
        return (
          <article
            key={entry.id}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 right-0 left-0 pb-3"
            style={{ transform: `translateY(${item.start - margin}px)` }}
            {...openProps("journal", entry.id)}
          >
            <div className="rounded-3xl bg-card p-5 elevation">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium">{entry.description}</h2>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.date)} · {entry.sourceType}
                </p>
              </div>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {entry.lines.map((line) => {
                    const account = accounts.find((a) => a.id === line.accountId);
                    return (
                      <tr key={line.id}>
                        <td className="py-1.5 text-muted-foreground">
                          {account ? `${account.code} ${account.name}` : line.accountId}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {line.debit ? <Money amount={line.debit} currency={currency} /> : ""}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                          {line.credit ? <Money amount={line.credit} currency={currency} /> : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}
