import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Money } from "@/components/money";
import { Sparkline } from "@/components/sparkline";
import { BillBadge, CheckBadge, InvoiceBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectedCash, cashForecast } from "@/lib/finance/forecast";
import { formatDate } from "@/lib/finance/format";
import { billBalance, cashByBankId, invoiceBalance, openPayables, openReceivables, pendingChecksTotal, totalCash } from "@/lib/finance/ledger";
import { openProps } from "@/lib/finance/open-record";
import { closeChecklist, monthEndIso } from "@/lib/finance/close";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/")({ component: Desk });

function Desk() {
  const data = useFinanceData();
  const postDueRecurring = useFinanceStore((s) => s.postDueRecurring);
  const { settings, banks, customers, vendors, invoices, bills, checks } = data;

  const book = useMemo(() => totalCash(data), [data]);
  const pending = useMemo(() => pendingChecksTotal(data), [data]);
  const inBank = book + pending;
  const receivables = useMemo(() => openReceivables(data), [data]);
  const payables = useMemo(() => openPayables(data), [data]);
  const projected = useMemo(() => projectedCash(data), [data]);
  const byBank = useMemo(() => cashByBankId(data), [data]);
  const points = useMemo(
    () => cashForecast(data, 90),
    [data.settings, data.checks, data.invoices, data.bills, data.budgetItems, data.journals],
  );
  const spark = useMemo(() => points.map((p) => p.cash), [points]);
  const in90 = points[points.length - 1]?.cash ?? projected;

  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return invoices
      .filter((i) => {
        if (i.status === "paid" || i.status === "void") return false;
        return i.dueDate < today && invoiceBalance(data, i.id) > 0;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data, invoices]);
  const pendingList = useMemo(
    () => [...checks].filter((c) => c.status === "pending").sort((a, b) => a.postDate.localeCompare(b.postDate)),
    [checks],
  );
  const openBills = useMemo(
    () =>
      [...bills]
        .filter((b) => b.status === "open" || b.status === "partial")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills],
  );

  const through = monthEndIso();
  const close = useMemo(() => closeChecklist(data, through), [data, through]);
  const liveBanks = banks.filter((b) => !b.archived);
  const dueLabel =
    close.due.length === 0
      ? ""
      : close.due.length === 1
        ? `Post ${close.due[0].name}`
        : `Post ${close.due.length} due`;

  return (
    <AppShell
      title="Treasury desk"
      description="Cash across banks, money still to collect, and bills still to pay. Double-tap or double-click a line to open it."
    >
      {!close.ok ? (
        <div className="close-banner mb-4 rounded-2xl bg-card px-4 py-3 text-sm elevation">
          <p className="min-w-0 flex-1">
            {formatDate(through)} cannot close yet. {close.blockers[0]}{" "}
            <Link to="/close" className="font-medium underline-offset-2 hover:underline">
              Open the checklist
            </Link>
            .
          </p>
          {close.due.length > 0 ? (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => {
                try {
                  const posted = postDueRecurring(through);
                  if (posted.length === 0) {
                    toast.message("Nothing due.");
                    return;
                  }
                  const unique = [...new Set(posted.map((p) => p.name))];
                  toast.success(
                    unique.length === 1 && posted.length === 1
                      ? `Posted ${unique[0]}.`
                      : `Posted ${posted.length} (${unique.join(", ")}).`,
                  );
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not post.");
                }
              }}
            >
              {dueLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
      <section className="desk-stats">
        <Stat label="In the bank (est.)" hint="Book cash plus pending checks">
          <Money amount={inBank} currency={settings.currency} className="stat-value" />
        </Stat>
        <Stat label="Book cash" hint="After issued checks">
          <Money amount={book} currency={settings.currency} className="stat-value" />
        </Stat>
        <Stat label="To collect" hint="Open invoices">
          <Money amount={receivables} currency={settings.currency} className="stat-value" />
        </Stat>
        <Stat label="To pay" hint="Open vendor bills">
          <Money amount={payables} currency={settings.currency} className="stat-value" />
        </Stat>
      </section>

      <Card className="mt-3">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">90-day cash</p>
            <Sparkline values={spark} className="mt-2 h-12 w-full" label="Ninety-day cash path" />
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xs text-muted-foreground">In 90 days</p>
            <Money amount={in90} currency={settings.currency} className="text-lg font-medium" />
            <p className="mt-1 text-xs text-muted-foreground">
              After invoices in and bills out:{" "}
              <Money amount={projected} currency={settings.currency} className="inline font-medium text-foreground" />
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Banks</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {liveBanks.map((bank) => (
            <div
              key={bank.id}
              {...openProps("bank", bank.id, { click: true })}
              className="desk-row bg-muted/70 px-4"
            >
              <div className="desk-row-copy">
                <p className="text-sm font-medium">{bank.nickname}</p>
                <p className="text-xs text-muted-foreground">
                  {bank.name} · {bank.accountNumber}
                </p>
              </div>
              <Money amount={byBank[bank.id] ?? 0} currency={settings.currency} className="shrink-0 text-sm font-medium" />
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="desk-trio mt-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 min-w-0">
            <CardTitle className="min-w-0 truncate">Pending checks</CardTitle>
            <Link to="/checks" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
              Checks
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {pendingList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding checks.</p>
            ) : (
              pendingList.slice(0, 5).map((check) => (
                <div key={check.id} className="desk-row" {...openProps("check", check.id, { click: true })}>
                  <div className="desk-row-copy">
                    <p className="text-sm font-medium">{check.payee}</p>
                    <p className="text-xs text-muted-foreground">
                      #{check.checkNumber} · posts {formatDate(check.postDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money amount={check.amount} currency={settings.currency} className="text-sm" />
                    <CheckBadge status={check.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 min-w-0">
            <CardTitle className="min-w-0 truncate">Overdue invoices</CardTitle>
            <Link to="/invoices" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
              All invoices
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue. Good books.</p>
            ) : (
              overdue.slice(0, 5).map((inv) => {
                const customer = customers.find((c) => c.id === inv.customerId);
                return (
                  <div key={inv.id} className="desk-row" {...openProps("invoice", inv.id, { click: true })}>
                    <div className="desk-row-copy">
                      <p className="text-sm font-medium">{customer?.name ?? inv.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.number} · due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
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
          <CardHeader className="flex-row items-center justify-between gap-2 min-w-0">
            <CardTitle className="min-w-0 truncate">Open bills</CardTitle>
            <Link to="/bills" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
              All bills
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {openBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor bills waiting.</p>
            ) : (
              openBills.slice(0, 5).map((bill) => {
                const vendor = vendors.find((v) => v.id === bill.vendorId);
                const overdueBill = bill.dueDate < new Date().toISOString().slice(0, 10);
                return (
                  <div key={bill.id} className="desk-row" {...openProps("bill", bill.id, { click: true })}>
                    <div className="desk-row-copy">
                      <p className="text-sm font-medium">{vendor?.name ?? bill.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.number} · due {formatDate(bill.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
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
      <CardContent className="p-4 sm:p-5">
        <p className="eyebrow">{label}</p>
        <div>{children}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
