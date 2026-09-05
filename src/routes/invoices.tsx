import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CustomerPayment } from "@/components/customer-payment";
import { DateInput } from "@/components/date-input";
import { PartyCombo } from "@/components/party-combo";
import { Plus, Printer } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { EntryLines, type DraftLine } from "@/components/entry-lines";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { RowActions } from "@/components/row-actions";
import { Field } from "@/components/field";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { InvoiceBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useListPointer } from "@/components/use-list-pointer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { invoiceRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { addDaysIso, formatDate, formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { invoiceBalance, invoiceTotal } from "@/lib/finance/ledger";
import { openProps, openTxn, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_CUSTOMER, type Invoice } from "@/lib/finance/types";

export const Route = createFileRoute("/invoices")({ component: InvoicesPage });

const INV_COLS = {
  number: 128,
  customer: 180,
  date: 118,
  due: 118,
  total: 120,
  balance: 120,
  status: 118,
  actions: 108,
} as const;

const INV_SORT = [
  { value: "date:desc", label: "Date · newest" },
  { value: "date:asc", label: "Date · oldest" },
  { value: "number:asc", label: "Number" },
  { value: "customer:asc", label: "Customer A–Z" },
  { value: "due:asc", label: "Due · soonest" },
  { value: "balance:desc", label: "Balance high–low" },
];

function InvoicesPage() {
  const data = useFinanceData();
  const navigate = useNavigate();
  const createInvoice = useFinanceStore((s) => s.createInvoice);
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const voidInvoice = useFinanceStore((s) => s.voidInvoice);
  const removeInvoice = useFinanceStore((s) => s.removeInvoice);
  const dragEnabled = data.settings.dragDropEnabled;

  const [createOpen, setCreateOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "paid" | "void">("all");
  const period = useListPeriod("all");
  const [form, setForm] = useState({
    customerId: "",
    date: todayIso(),
    dueDate: addDaysIso(todayIso(), 30),
    notes: "",
    taxRate: String(data.settings.defaultTaxRate),
    lines: [{ description: "", quantity: "1", unitPrice: "" }] as DraftLine[],
  });

  const today = todayIso();
  const getters = useMemo(
    () => ({
      number: (inv: Invoice) => inv.number,
      customer: (inv: Invoice) => data.customers.find((c) => c.id === inv.customerId)?.name ?? "",
      date: (inv: Invoice) => inv.date,
      due: (inv: Invoice) => inv.dueDate,
      total: (inv: Invoice) => invoiceTotal(data, inv.id),
      balance: (inv: Invoice) => invoiceBalance(data, inv.id),
      status: (inv: Invoice) => inv.status,
    }),
    [data],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.invoices.filter((inv) => {
      if (statusFilter === "open" && (inv.status === "paid" || inv.status === "void")) return false;
      if (statusFilter === "paid" && inv.status !== "paid") return false;
      if (statusFilter === "void" && inv.status !== "void") return false;
      if (!period.inRange(inv.date)) return false;
      if (!q) return true;
      const name = data.customers.find((c) => c.id === inv.customerId)?.name ?? "";
      return [inv.number, name, inv.notes].join(" ").toLowerCase().includes(q);
    });
  }, [data.invoices, data.customers, query, statusFilter, period.inRange]);
  const sort = useEntrySort(filtered, "date", getters, "desc");
  const paying = data.invoices.find((i) => i.id === payId);
  const cols = useColWidths("finance-manager-invoices-cols", INV_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const openInvoice = useCallback((id: string) => openTxn("invoice", id), []);
  const pointer = useListPointer(
    sort.sorted.map((inv) => inv.id),
    openInvoice,
  );

  function fit(id: keyof typeof INV_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <AppShell
      title="Invoices"
      description="Bill customers, collect into a bank, and print a clean invoice for paper or PDF."
      wide
      actions={
        <>
          <CsvButton filename="invoices.csv" rows={invoiceRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New invoice
          </Button>
        </>
      }
    >
      {data.customers.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Type a new name on the invoice and press Enter to add the customer.</p>
      ) : null}

      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search number or customer"
        label="Search invoices"
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
              label: "Status",
              value: statusFilter,
              options: [
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "paid", label: "Paid" },
                { value: "void", label: "Void" },
              ],
              onChange: (v) => setStatusFilter(v as typeof statusFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={INV_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            setStatusFilter("all");
            period.reset();
          }}
        />
      </ListToolbar>

      <ListCard ref={gridRef} className="doc-list">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            {(Object.keys(INV_COLS) as Array<keyof typeof INV_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Number")} />
              <SortHeader label="Customer" column="customer" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.customer} onWidth={(n) => cols.setWidth("customer", n)} onFit={() => fit("customer", "Customer")} />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.due} onWidth={(n) => cols.setWidth("due", n)} onFit={() => fit("due", "Due")} />
              <SortHeader label="Total" column="total" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.total} onWidth={(n) => cols.setWidth("total", n)} onFit={() => fit("total", "Total")} />
              <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} />
              <th className="col-actions relative px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {data.invoices.length === 0
                    ? "No invoices yet."
                    : "No invoices match this search or filter."}
                </td>
              </tr>
            ) : (
            sort.sorted.map((inv) => {
              const customer = data.customers.find((c) => c.id === inv.customerId);
              const due = invoiceBalance(data, inv.id);
              const overdue = due > 0 && inv.dueDate < today && inv.status !== "void" && inv.status !== "paid";
              const rowActions = (
                <RowActions
                  primary={
                    due > 0 && inv.status !== "void" ? (
                      <Button size="sm" variant="outline" onClick={() => setPayId(inv.id)}>
                        Collect
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/print/$invoiceId" params={{ invoiceId: inv.id }}>
                          Print
                        </Link>
                      </Button>
                    )
                  }
                  items={[
                    ...(due > 0 && inv.status !== "void"
                      ? [
                          {
                            label: "Print",
                            onSelect: () =>
                              navigate({ to: "/print/$invoiceId", params: { invoiceId: inv.id } }),
                          },
                        ]
                      : []),
                    ...(inv.status !== "void" && inv.status !== "paid"
                      ? [
                          {
                            label: "Void",
                            onSelect: () => {
                              voidInvoice(inv.id);
                              toast.success("Invoice voided.");
                            },
                          },
                        ]
                      : []),
                    {
                      label: "Delete",
                      danger: true,
                      onSelect: () => setDeleting(inv),
                    },
                  ]}
                />
              );
              return (
                  <tr
                      key={inv.id}
                      className="border-b border-border/70 last:border-0"
                      data-active={pointer.activeId === inv.id ? "true" : undefined}
                      {...openProps("invoice", inv.id)}
                      onClick={() => pointer.setActiveId(inv.id)}
                    >
                      <td className="px-4 py-3 font-medium" data-col="number">{inv.number}</td>
                      <td className="px-4 py-3" data-col="customer">{customer?.name ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap" data-col="date">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap" data-col="due">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right" data-col="total">
                        <Money amount={invoiceTotal(data, inv.id)} currency={data.settings.currency} />
                      </td>
                      <td className="px-4 py-3 text-right" data-col="balance">
                        <Money amount={due} currency={data.settings.currency} />
                      </td>
                      <td className="px-4 py-3" data-col="status">
                        <InvoiceBadge status={inv.status} overdue={overdue} />
                      </td>
                      <td className="col-actions px-4 py-3" onDoubleClick={stopOpen}>
                        {rowActions}
                      </td>
                    </tr>
                );
            })
            )}
          </tbody>
        </table>
      </ListCard>
      <ListPrint
        title="Invoices"
        columns={[
          { key: "number", label: "Number" },
          { key: "customer", label: "Customer" },
          { key: "date", label: "Date" },
          { key: "due", label: "Due" },
          { key: "total", label: "Total", align: "right" },
          { key: "balance", label: "Balance", align: "right" },
          { key: "status", label: "Status" },
        ]}
        rows={sort.sorted.map((inv) => ({
          number: inv.number,
          customer: data.customers.find((c) => c.id === inv.customerId)?.name ?? "",
          date: formatDate(inv.date),
          due: formatDate(inv.dueDate),
          total: formatMoney(invoiceTotal(data, inv.id), data.settings.currency),
          balance: formatMoney(invoiceBalance(data, inv.id), data.settings.currency),
          status: inv.status,
        }))}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>Posts accounts receivable and income when you save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Customer">
              <PartyCombo
                items={data.customers}
                valueId={form.customerId}
                valueName={data.customers.find((c) => c.id === form.customerId)?.name ?? ""}
                label="Customer"
                placeholder="Type a customer"
                onChoose={(id) => setForm({ ...form, customerId: id })}
                onCreate={(name) => {
                  const id = newId();
                  addCustomer({ ...EMPTY_CUSTOMER, id, name });
                  return { id, name };
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice date">
                <DateInput value={form.date} onChange={(date) => setForm({ ...form, date })} />
              </Field>
              <Field label="Due date">
                <DateInput value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
              </Field>
            </div>
            {data.settings.taxEnabled ? (
              <Field label="Tax %">
                <Input value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} inputMode="decimal" />
              </Field>
            ) : null}
            <EntryLines
              lines={form.lines}
              onChange={(lines) => setForm({ ...form, lines })}
              dragEnabled={dragEnabled}
            />
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  if (!form.customerId) {
                    toast.error("Payee must be a registered customer. Click + Add to create.");
                    return;
                  }
                  createInvoice({
                    customerId: form.customerId,
                    date: form.date,
                    dueDate: form.dueDate,
                    notes: form.notes,
                    taxRate: data.settings.taxEnabled ? Number(form.taxRate) || 0 : 0,
                    lines: form.lines.map((l) => ({
                      description: l.description,
                      quantity: Number(l.quantity) || 0,
                      unitPrice: parseAmountToCents(l.unitPrice),
                    })),
                  });
                  setCreateOpen(false);
                  toast.success("Invoice posted.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not create invoice.");
                }
              }}
            >
              Save invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paying)} onOpenChange={(o) => !o && setPayId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Receive payment</DialogTitle>
          {paying ? <CustomerPayment invoiceId={paying.id} onClose={() => setPayId(null)} /> : null}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        title="Delete invoice?"
        body="Removes this invoice, its payments, and the ledger lines so you can enter it again."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          try {
            removeInvoice(deleting.id);
            toast.success("Invoice deleted.");
            setDeleting(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(null);
          }
        }}
      />
    </AppShell>
  );
}
