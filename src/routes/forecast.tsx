import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { FilterPills } from "@/components/filter-pills";
import { Money } from "@/components/money";
import { Sparkline } from "@/components/sparkline";
import { listColClass, listColWidthStyle } from "@/components/list-table";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
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
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { currentMonth, formatMoney, parseAmountToCents } from "@/lib/finance/format";
import { openReceivables, pendingChecksTotal, totalCash } from "@/lib/finance/ledger";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { BudgetItem } from "@/lib/finance/types";

export const Route = createFileRoute("/forecast")({ component: ForecastPage });

const BUDGET_COLS = {
  name: 200,
  kind: 110,
  start: 120,
  amount: 128,
} as const;

function ForecastPage() {
  const data = useFinanceData();
  const { settings, budgetItems } = data;
  const upsertBudget = useFinanceStore((s) => s.upsertBudget);
  const removeBudget = useFinanceStore((s) => s.removeBudget);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "outflow" as "inflow" | "outflow",
    amount: "",
    startMonth: currentMonth(),
  });

  const points = useMemo(
    () => cashForecast(data, 90),
    [data.settings, data.checks, data.invoices, data.bills, data.budgetItems, data.journals],
  );
  const end = points[points.length - 1];
  const [kindFilter, setKindFilter] = useState<"all" | "inflow" | "outflow">("all");
  const budgetVisible = useMemo(
    () => (kindFilter === "all" ? budgetItems : budgetItems.filter((i) => i.kind === kindFilter)),
    [budgetItems, kindFilter],
  );
  const budgetGetters = useMemo(
    () => ({
      name: (i: BudgetItem) => i.name,
      kind: (i: BudgetItem) => i.kind,
      start: (i: BudgetItem) => i.startMonth,
      amount: (i: BudgetItem) => (i.kind === "outflow" ? -i.amount : i.amount),
    }),
    [],
  );
  const budgetSort = useEntrySort(budgetVisible, "name", budgetGetters, "asc");
  const budgetCols = useColWidths("finance-manager-budget-cols", BUDGET_COLS);
  const budgetRef = useRef<HTMLDivElement>(null);

  return (
    <AppShell
      title="Cash forecast"
      description="Ninety-day cash from the bank estimate, pending checks, invoice due dates, then monthly budget items."
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Budget item
        </Button>
      }
    >
      <section className="stat-grid stat-grid-3">
        <Card>
          <CardContent>
            <p className="eyebrow">Book cash</p>
            <Money amount={totalCash(data)} currency={settings.currency} className="stat-value" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="eyebrow">Now + open invoices</p>
            <Money amount={projectedCash(data)} currency={settings.currency} className="stat-value" />
            <p className="mt-1 text-xs text-muted-foreground">
              Collect {formatMoney(openReceivables(data), settings.currency)} · pending checks{" "}
              {formatMoney(pendingChecksTotal(data), settings.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="eyebrow">In 90 days</p>
            <Money amount={end?.cash ?? 0} currency={settings.currency} className="stat-value" />
          </CardContent>
        </Card>
      </section>
      <Card className="mt-3">
        <CardContent className="p-4 sm:p-5">
          <p className="eyebrow">90-day path</p>
          <Sparkline values={points.map((p) => p.cash)} className="mt-2 h-12 w-full" label="Ninety-day cash path" />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Monthly budget</CardTitle>
          <p className="text-sm text-muted-foreground">Applied on the first of each future month. Keep rent and payroll here so the forecast stays honest.</p>
        </CardHeader>
        <CardContent>
          {budgetItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recurring items yet.</p>
          ) : (
            <>
              <div className="mb-3">
                <FilterPills
                  value={kindFilter}
                  onChange={setKindFilter}
                  label="Budget"
                  options={[
                    { id: "all", label: "All" },
                    { id: "outflow", label: "Out" },
                    { id: "inflow", label: "In" },
                  ]}
                />
              </div>
              <div ref={budgetRef} className="list-grid overflow-x-auto rounded-2xl bg-card elevation">
                <table ref={budgetCols.tableRef} className="text-sm" style={{ width: "100%" }}>
                  <colgroup>
                    {(Object.keys(BUDGET_COLS) as Array<keyof typeof BUDGET_COLS>).map((id) => (
                      <col key={id} className={listColClass(id)} style={listColWidthStyle(id, budgetCols.widths[id])} />
                    ))}
                    <col className="col-actions" style={{ width: 88 }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <SortHeader label="Name" column="name" sortKey={budgetSort.key} dir={budgetSort.dir} onToggle={budgetSort.toggle} width={budgetCols.widths.name} onWidth={(n) => budgetCols.setWidth("name", n)} onFit={() => {
                        const table = budgetRef.current?.querySelector("table");
                        if (!table) return;
                        budgetCols.setWidth("name", fitColumnWidth({ table, selector: `td[data-col="name"]`, header: "Name" }));
                      }}  fill/>
                      <SortHeader label="Kind" column="kind" sortKey={budgetSort.key} dir={budgetSort.dir} onToggle={budgetSort.toggle} width={budgetCols.widths.kind} onWidth={(n) => budgetCols.setWidth("kind", n)} onFit={() => {
                        const table = budgetRef.current?.querySelector("table");
                        if (!table) return;
                        budgetCols.setWidth("kind", fitColumnWidth({ table, selector: `td[data-col="kind"]`, header: "Kind" }));
                      }} />
                      <SortHeader label="From" column="start" sortKey={budgetSort.key} dir={budgetSort.dir} onToggle={budgetSort.toggle} width={budgetCols.widths.start} onWidth={(n) => budgetCols.setWidth("start", n)} onFit={() => {
                        const table = budgetRef.current?.querySelector("table");
                        if (!table) return;
                        budgetCols.setWidth("start", fitColumnWidth({ table, selector: `td[data-col="start"]`, header: "From" }));
                      }} />
                      <SortHeader label="Amount" column="amount" sortKey={budgetSort.key} dir={budgetSort.dir} onToggle={budgetSort.toggle} align="center" width={budgetCols.widths.amount} onWidth={(n) => budgetCols.setWidth("amount", n)} onFit={() => {
                        const table = budgetRef.current?.querySelector("table");
                        if (!table) return;
                        budgetCols.setWidth("amount", fitColumnWidth({ table, selector: `td[data-col="amount"]`, header: "Amount" }));
                      }} />
                      <th className="col-actions px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {budgetSort.sorted.map((item) => (
                      <tr key={item.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-2" data-col="name">{item.name}</td>
                        <td className="px-4 py-2" data-col="kind">{item.kind === "inflow" ? "Inflow" : "Outflow"}</td>
                        <td className="px-4 py-2" data-col="start">{item.startMonth}</td>
                        <td className="px-4 py-2 text-right" data-col="amount">
                          <Money
                            amount={item.kind === "outflow" ? -item.amount : item.amount}
                            currency={settings.currency}
                            signed
                          />
                        </td>
                        <td className="col-actions px-4 py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => removeBudget(item.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
