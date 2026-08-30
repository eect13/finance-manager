import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Money } from "@/components/money";
import { BillBadge, CheckBadge, InvoiceBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cashForecast, projectedCash } from "@/lib/finance/forecast";
import { formatDate, formatMoney } from "@/lib/finance/format";
import { billBalance, invoiceBalance, openPayables, openReceivables, pendingChecksTotal, totalCash } from "@/lib/finance/ledger";
import { openProps } from "@/lib/finance/open-record";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/")({ component: Desk });

function Desk() {
  const data = useFinanceData();
  const { settings, banks, accounts, customers, vendors, invoices, bills, checks, journals } = data;
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => setChartReady(true), []);

  const book = totalCash(data);
  const pending = pendingChecksTotal(data);
  const inBank = book + pending;
  const receivables = openReceivables(data);
  const payables = openPayables(data);
  const projected = projectedCash(data);
  const forecast = useMemo(
    () => cashForecast(data, 90),
    [data.settings, data.checks, data.invoices, data.bills, data.budgetItems, data.journals],
  );

  const chart = forecast
    .filter((_, i) => i % 3 === 0)
    .map((p) => ({
      date: p.date.slice(5),
      cash: p.cash / 100,
    }));

  const overdue = invoices.filter((i) => {
    if (i.status === "paid" || i.status === "void") return false;
    return i.dueDate < new Date().toISOString().slice(0, 10) && invoiceBalance(data, i.id) > 0;
  });
  const pendingList = [...checks].filter((c) => c.status === "pending").sort((a, b) => a.postDate.localeCompare(b.postDate));
  const openBills = [...bills]
    .filter((b) => b.status === "open" || b.status === "partial")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <AppShell
      title="Treasury desk"
      description="Cash across banks, money still to collect, and bills still to pay. Double-click a line to open it."
    >
      <section className="desk-stats">
        <Stat label="In the bank (est.)" hint="Book cash plus pending checks">
          <Money amount={inBank} currency={settings.currency} className="text-2xl font-medium" />
        </Stat>
        <Stat label="Book cash" hint="After issued checks">
          <Money amount={book} currency={settings.currency} className="text-2xl font-medium" />
        </Stat>
        <Stat label="To collect" hint="Open invoices">
          <Money amount={receivables} currency={settings.currency} className="text-2xl font-medium" />
        </Stat>
        <Stat label="To pay" hint="Open vendor bills">
          <Money amount={payables} currency={settings.currency} className="text-2xl font-medium" />
        </Stat>
      </section>

      <section className="desk-split mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ninety-day cash</CardTitle>
            <p className="text-sm text-muted-foreground">
              Starts from bank estimate, then applies pending checks, invoice due dates, bills, and monthly budgets.
              Projected after AR and AP: <Money amount={projected} currency={settings.currency} className="inline" />.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      tickFormatter={(v: number) =>
                        new Intl.NumberFormat("en-PH", { notation: "compact" }).format(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number | string) => formatMoney(Number(value) * 100, settings.currency)}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="cash" stroke="var(--color-primary)" fill="url(#cashFill)" strokeWidth={1.75} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl bg-muted" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {banks
              .filter((b) => !b.archived)
              .map((bank) => {
                const account = accounts.find((a) => a.id === bank.accountId);
                const balance = account
                  ? journals.reduce((sum, j) => {
                      for (const line of j.lines) {
                        if (line.accountId === bank.accountId) sum += line.debit - line.credit;
                      }
                      return sum;
                    }, 0)
                  : 0;
                return (
                  <div
                    key={bank.id}
                    {...openProps("bank", bank.id)}
                    className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{bank.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {bank.name} · {bank.accountNumber}
                      </p>
                    </div>
                    <Money amount={balance} currency={settings.currency} className="text-sm font-medium" />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </section>

      <section className="desk-trio mt-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pending checks</CardTitle>
            <Link to="/checks" className="text-sm text-muted-foreground hover:text-foreground">
              Checks
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding checks.</p>
            ) : (
              pendingList.slice(0, 5).map((check) => (
                <div key={check.id} className="flex items-start justify-between gap-3 rounded-xl px-1 py-1" {...openProps("check", check.id)}>
                  <div>
                    <p className="text-sm font-medium">{check.payee}</p>
                    <p className="text-xs text-muted-foreground">
                      #{check.checkNumber} · posts {formatDate(check.postDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Money amount={check.amount} currency={settings.currency} className="text-sm" />
                    <CheckBadge status={check.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Overdue invoices</CardTitle>
            <Link to="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
              All invoices
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue. Good books.</p>
            ) : (
              overdue.map((inv) => {
                const customer = customers.find((c) => c.id === inv.customerId);
                return (
                  <div key={inv.id} className="flex items-start justify-between gap-3 rounded-xl px-1 py-1" {...openProps("invoice", inv.id)}>
                    <div>
                      <p className="text-sm font-medium">{customer?.name ?? inv.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.number} · due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Money amount={invoiceBalance(data, inv.id)} currency={settings.currency} className="text-sm" />
                      <InvoiceBadge status={inv.status} overdue />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open bills</CardTitle>
            <Link to="/bills" className="text-sm text-muted-foreground hover:text-foreground">
              All bills
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {openBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor bills waiting.</p>
            ) : (
              openBills.slice(0, 5).map((bill) => {
                const vendor = vendors.find((v) => v.id === bill.vendorId);
                const overdueBill = bill.dueDate < new Date().toISOString().slice(0, 10);
                return (
                  <div key={bill.id} className="flex items-start justify-between gap-3 rounded-xl px-1 py-1" {...openProps("bill", bill.id)}>
                    <div>
                      <p className="text-sm font-medium">{vendor?.name ?? bill.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.number} · due {formatDate(bill.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Money amount={billBalance(bill)} currency={settings.currency} className="text-sm" />
                      <BillBadge status={bill.status} overdue={overdueBill} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="eyebrow">{label}</p>
        <div className="mt-2">{children}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
