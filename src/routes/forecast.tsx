import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { FilterPills, ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { ListViewMenu } from "@/components/list-view-menu";
import { useListView } from "@/components/view-toggle";
import { CardGrid } from "@/components/doc-cards";
import { Money } from "@/components/money";
import { Sparkline } from "@/components/sparkline";
import { ListCard, listColClass, listColWidthStyle, listTableStyle } from "@/components/list-table";
import { ActionsHeader, SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useListVirtualizer, VirtPad } from "@/components/use-list-virtualizer";
import { useColVisible, visibleTableWidth, viewColumnExtra } from "@/components/column-chips";
import { cn } from "@/lib/utils";
import { stopOpen } from "@/lib/finance/open-record";
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
  actions: 120,
} as const;

const BUDGET_CHIPS = [
  { id: "name", label: "Name" },
  { id: "kind", label: "Kind" },
  { id: "start", label: "From" },
  { id: "amount", label: "Amount" },
] as const;
const BUDGET_VIS_IDS = BUDGET_CHIPS.map((c) => c.id);

const BUDGET_SORT = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "kind:asc", label: "Kind" },
  { value: "start:desc", label: "From · newest" },
  { value: "start:asc", label: "From · oldest" },
  { value: "amount:desc", label: "Amount high–low" },
  { value: "amount:asc", label: "Amount low–high" },
];

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

  const [query, setQuery] = useState("");
  const [view, setView] = useListView("forecast-budget");
  const [kindFilter, setKindFilter] = useState<"all" | "inflow" | "outflow">("all");

  const budgetVisible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return budgetItems.filter((i) => {
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (!q) return true;
      return [i.name, i.kind, i.startMonth].join(" ").toLowerCase().includes(q);
    });
  }, [budgetItems, kindFilter, query]);

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
  const vis = useColVisible("finance-manager-budget-vis", BUDGET_VIS_IDS);
  // -v2 so Amount right default is not stuck on old center prefs
  const budgetAligns = useColAligns(
    "finance-manager-budget-col-aligns-v2",
    Object.keys(BUDGET_COLS) as Array<keyof typeof BUDGET_COLS>,
    { name: "left", amount: "right" },
  );
  const budgetRef = useRef<HTMLDivElement>(null);
  const pointer = useTableKeyboardFocus({
    ids: budgetSort.sorted.map((i) => i.id),
  });
  const listVirt = useListVirtualizer(
    budgetSort.sorted.length,
    budgetRef,
    (index) => budgetSort.sorted[index]?.id ?? index,
    48,
    view === "list",
  );

  function fit(id: keyof typeof BUDGET_COLS, label: string) {
    const table = budgetRef.current?.querySelector("table");
    if (!table) return;
    budgetCols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  function fitAll() {
    (Object.keys(BUDGET_COLS) as Array<keyof typeof BUDGET_COLS>).forEach((id) => {
      if (id !== "actions" && vis.on[id] === false) return;
      fit(id, BUDGET_CHIPS.find((c) => c.id === id)?.label ?? "Actions");
    });
  }

  const emptyMessage =
    budgetItems.length === 0
      ? "No recurring items yet."
      : "No budget items match this search or filter.";

  const signedAmount = (item: BudgetItem) => (item.kind === "outflow" ? -item.amount : item.amount);

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
          <p className="text-sm text-muted-foreground">
            Applied on the first of each future month. Keep rent and payroll here so the forecast stays honest.
          </p>
        </CardHeader>
        <CardContent>
          <ListToolbar
            query={query}
            onQuery={setQuery}
            placeholder="Search name, kind, or start month…"
            label="Search budget items"
          >
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
            <ListFilters
              selects={[]}
              sortValue={`${budgetSort.key}:${budgetSort.dir}`}
              sortOptions={BUDGET_SORT}
              onSort={(v) => applySortValue(budgetSort.set, v)}
              onClear={() => {
                setQuery("");
                setKindFilter("all");
                budgetSort.set("name", "asc");
              }}
            />
            <ListViewMenu
              layout={view}
              onLayout={setView}
              hiddenCount={view === "list" ? vis.hiddenCount : undefined}
              extra={view === "list" ? viewColumnExtra(BUDGET_CHIPS, vis) : undefined}
              onFitAll={view === "list" ? fitAll : undefined}
            />
          </ListToolbar>

          {view === "grid" ? (
            <CardGrid
              items={budgetSort.sorted}
              empty={emptyMessage}
              getId={(i) => i.id}
              estimateSize={140}
            >
              {(item) => (
                <div className="item-card text-left">
                  <span className="item-card-title block min-w-0 break-words font-medium">{item.name}</span>
                  <span className="item-card-meta block break-words text-muted-foreground">
                    {item.kind === "inflow" ? "Inflow" : "Outflow"} · from {item.startMonth}
                  </span>
                  <Money
                    amount={signedAmount(item)}
                    currency={settings.currency}
                    signed
                    className="item-card-amount mt-1 font-medium tabular-nums"
                  />
                  <div className="mt-2" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
                    <Button size="sm" variant="ghost" onClick={() => removeBudget(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardGrid>
          ) : (
            <ListCard
              ref={pointer.bindContainer(budgetRef)}
              tabIndex={0}
              className="outline-none"
              {...vis.hideAttrs}
            >
              <table
                ref={budgetCols.tableRef}
                className="text-sm"
                style={listTableStyle(visibleTableWidth(budgetCols.widths, vis.on))}
              >
                <colgroup>
                  {(Object.keys(BUDGET_COLS) as Array<keyof typeof BUDGET_COLS>).map((id) => (
                    <col
                      key={id}
                      className={listColClass(id)}
                      style={listColWidthStyle(id, budgetCols.widths[id], id === "actions" || vis.on[id] !== false)}
                      data-col={id}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <SortHeader
                      label="Name"
                      column="name"
                      sortKey={budgetSort.key}
                      dir={budgetSort.dir}
                      onToggle={budgetSort.toggle}
                      width={budgetCols.widths.name}
                      onWidth={(n) => budgetCols.setWidth("name", n)}
                      onFit={() => fit("name", "Name")}
                      align={budgetAligns.aligns.name ?? "left"}
                      onAlign={(a) => budgetAligns.setAlign("name", a)}
                      fill
                    />
                    <SortHeader
                      label="Kind"
                      column="kind"
                      sortKey={budgetSort.key}
                      dir={budgetSort.dir}
                      onToggle={budgetSort.toggle}
                      width={budgetCols.widths.kind}
                      onWidth={(n) => budgetCols.setWidth("kind", n)}
                      onFit={() => fit("kind", "Kind")}
                      align={budgetAligns.aligns.kind ?? "center"}
                      onAlign={(a) => budgetAligns.setAlign("kind", a)}
                    />
                    <SortHeader
                      label="From"
                      column="start"
                      sortKey={budgetSort.key}
                      dir={budgetSort.dir}
                      onToggle={budgetSort.toggle}
                      width={budgetCols.widths.start}
                      onWidth={(n) => budgetCols.setWidth("start", n)}
                      onFit={() => fit("start", "From")}
                      align={budgetAligns.aligns.start ?? "center"}
                      onAlign={(a) => budgetAligns.setAlign("start", a)}
                    />
                    <SortHeader
                      label="Amount"
                      column="amount"
                      sortKey={budgetSort.key}
                      dir={budgetSort.dir}
                      onToggle={budgetSort.toggle}
                      width={budgetCols.widths.amount}
                      onWidth={(n) => budgetCols.setWidth("amount", n)}
                      onFit={() => fit("amount", "Amount")}
                      align={budgetAligns.aligns.amount ?? "right"}
                      onAlign={(a) => budgetAligns.setAlign("amount", a)}
                    />
                    <ActionsHeader
                      width={budgetCols.widths.actions}
                      onWidth={(n) => budgetCols.setWidth("actions", n)}
                      onFit={() => fit("actions", "Actions")}
                    />
                  </tr>
                </thead>
                <tbody>
                  {budgetSort.sorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    <>
                      <VirtPad height={listVirt.padTop} colSpan={5} />
                      {listVirt.items.map((v) => {
                        const item = budgetSort.sorted[v.index];
                        if (!item) return null;
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-border/70 last:border-0"
                            data-focused={pointer.activeId === item.id ? "true" : undefined}
                            data-row-id={item.id}
                            aria-current={pointer.activeId === item.id ? "true" : undefined}
                            onClick={() => pointer.setActiveId(item.id)}
                          >
                            <td
                              className={cn("px-4 py-2", alignClass(budgetAligns.aligns.name ?? "left"))}
                              data-col="name"
                              data-align={budgetAligns.aligns.name ?? "left"}
                            >
                              {item.name}
                            </td>
                            <td
                              className={cn("px-4 py-2", alignClass(budgetAligns.aligns.kind ?? "center"))}
                              data-col="kind"
                              data-align={budgetAligns.aligns.kind ?? "center"}
                            >
                              {item.kind === "inflow" ? "Inflow" : "Outflow"}
                            </td>
                            <td
                              className={cn("px-4 py-2", alignClass(budgetAligns.aligns.start ?? "center"))}
                              data-col="start"
                              data-align={budgetAligns.aligns.start ?? "center"}
                            >
                              {item.startMonth}
                            </td>
                            <td
                              className={cn("px-4 py-2", alignClass(budgetAligns.aligns.amount ?? "right"))}
                              data-col="amount"
                              data-align={budgetAligns.aligns.amount ?? "right"}
                            >
                              <Money amount={signedAmount(item)} currency={settings.currency} signed />
                            </td>
                            <td
                              className="col-actions px-4 py-2"
                              data-col="actions"
                              onClick={stopOpen}
                              onDoubleClick={stopOpen}
                              onPointerDown={stopOpen}
                            >
                              <Button size="sm" variant="ghost" onClick={() => removeBudget(item.id)}>
                                Remove
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      <VirtPad height={listVirt.padBottom} colSpan={5} />
                    </>
                  )}
                </tbody>
              </table>
            </ListCard>
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
