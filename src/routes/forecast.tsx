import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cashForecast, projectedCash } from "@/lib/finance/forecast";
import { currentMonth, formatDate, formatMoney, parseAmountToCents } from "@/lib/finance/format";
import { openReceivables, pendingChecksTotal, totalCash } from "@/lib/finance/ledger";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/forecast")({ component: ForecastPage });

function ForecastPage() {
  const data = useFinanceData();
  const { settings, budgetItems } = data;
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const removeBudget = useFinanceStore((s) => s.removeBudget);

  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "outflow" as "inflow" | "outflow",
    amount: "",
    startMonth: currentMonth(),
  });

  useEffect(() => setReady(true), []);

  const points = useMemo(
    () => cashForecast(data, 90),
    [data.settings, data.checks, data.invoices, data.bills, data.budgetItems, data.journals],
  );
  const chart = points.map((p) => ({
    date: formatDate(p.date),
    label: p.date.slice(5),
    cash: p.cash / 100,
    inflows: p.inflows / 100,
    outflows: p.outflows / 100,
  }));
  const end = points[points.length - 1];

  return (
    <AppShell
      title="Cash forecast"
      description="Rolling ninety days: bank estimate, pending checks, invoice due dates, then monthly budget items."
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Budget item
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">Book cash</p>
            <Money amount={totalCash(data)} currency={settings.currency} className="mt-2 text-2xl font-medium" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">Now + open invoices</p>
            <Money amount={projectedCash(data)} currency={settings.currency} className="mt-2 text-2xl font-medium" />
            <p className="mt-1 text-xs text-muted-foreground">
              Collect {formatMoney(openReceivables(data), settings.currency)} · pending checks{" "}
              {formatMoney(pendingChecksTotal(data), settings.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">In 90 days</p>
            <Money amount={end?.cash ?? 0} currency={settings.currency} className="mt-2 text-2xl font-medium" />
          </CardContent>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {ready ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} interval={13} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={(v: number) => new Intl.NumberFormat("en-PH", { notation: "compact" }).format(v)}
                  />
                  <Tooltip
                    formatter={(value: number | string) => formatMoney(Number(value) * 100, settings.currency)}
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="cash" stroke="var(--color-primary)" fill="url(#forecastFill)" strokeWidth={1.75} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-muted" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Monthly budget</CardTitle>
          <p className="text-sm text-muted-foreground">Applied on the first of each future month. Keep rent and payroll here so the forecast stays honest.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {budgetItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recurring items yet.</p>
          ) : (
            budgetItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/70 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.kind === "inflow" ? "Inflow" : "Outflow"} · from {item.startMonth}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Money
                    amount={item.kind === "outflow" ? -item.amount : item.amount}
                    currency={settings.currency}
                    signed
                    className="text-sm font-medium"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeBudget(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Budget item</DialogTitle>
            <DialogDescription>Repeats every month from the start month onward.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Direction">
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as "inflow" | "outflow" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outflow">Money out</SelectItem>
                  <SelectItem value="inflow">Money in</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Monthly amount">
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Start month">
              <Input type="month" value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.name.trim()) return toast.error("Name the item.");
                upsertBudget({
                  name: form.name.trim(),
                  kind: form.kind,
                  amount: parseAmountToCents(form.amount),
                  cadence: "monthly",
                  startMonth: form.startMonth,
                });
                setOpen(false);
                toast.success("Budget item saved.");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
