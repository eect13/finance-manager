import { createFileRoute } from "@tanstack/react-router";
import { CustomerPayment } from "@/components/customer-payment";
import { DateInput } from "@/components/date-input";
import { PartyCombo } from "@/components/party-combo";
import { Plus, Printer } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle } from "@/components/drag-handle";
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
import { ReceiptStatusControl, type ReceiptStatusAction } from "@/components/receipt-status-menu";
import { ReceiptBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useListPointer } from "@/components/use-list-pointer";
import { useRowDrag } from "@/components/use-row-drag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { receiptRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { openProps, openTxn, stopOpen } from "@/lib/finance/open-record";
import { formatDate, formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_CUSTOMER, type Receipt, type ReceiptMethod } from "@/lib/finance/types";

export const Route = createFileRoute("/receipts")({ component: ReceiptsPage });

const RCP_COLS = {
  number: 140,
  date: 118,
  from: 200,
  kind: 120,
  amount: 128,
  status: 118,
  actions: 52,
} as const;

const RCP_SORT = [
  { value: "date:desc", label: "Date · newest" },
  { value: "date:asc", label: "Date · oldest" },
  { value: "number:asc", label: "Number" },
  { value: "from:asc", label: "Payee A–Z" },
  { value: "amount:desc", label: "Amount high–low" },
];

function ReceiptsPage() {
  const data = useFinanceData();
  const createCashSale = useFinanceStore((s) => s.createCashSale);
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const voidReceipt = useFinanceStore((s) => s.voidReceipt);
  const removeReceipt = useFinanceStore((s) => s.removeReceipt);
  const setCashRecon = useFinanceStore((s) => s.setCashRecon);
  const reorderReceipts = useFinanceStore((s) => s.reorderReceipts);
  const dragEnabled = data.settings.dragDropEnabled;
  const today = todayIso();

  const [createOpen, setCreateOpen] = useState(false);
  const [kind, setKind] = useState<"cash-sale" | "payment">("cash-sale");
  const [deleting, setDeleting] = useState<Receipt | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "cash-sale" | "payment" | "void">("all");
  const period = useListPeriod("all");
  const [form, setForm] = useState({
    date: today,
    bankId: "",
    customerId: "",
    receivedFrom: "",
    invoiceId: "",
    amount: "",
    notes: "",
    taxRate: String(data.settings.defaultTaxRate),
    method: "cash" as ReceiptMethod,
    checkNumber: "",
    lines: [{ description: "", quantity: "1", unitPrice: "" }] as DraftLine[],
  });

  const getters = useMemo(
    () => ({
      order: (r: Receipt) => r.sortOrder,
      number: (r: Receipt) => r.number,
      date: (r: Receipt) => r.date,
      from: (r: Receipt) => r.receivedFrom,
      kind: (r: Receipt) => r.kind,
      amount: (r: Receipt) => r.amount,
      status: (r: Receipt) => r.status,
    }),
    [],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.receipts.filter((r) => {
      if (kindFilter === "void" && r.status !== "void") return false;
      if (kindFilter === "cash-sale" && (r.kind !== "cash-sale" || r.status === "void")) return false;
      if (kindFilter === "payment" && (r.kind !== "payment" || r.status === "void")) return false;
      if (!period.inRange(r.date)) return false;
      if (!q) return true;
      return [r.number, r.receivedFrom, r.memo, r.checkNumber].join(" ").toLowerCase().includes(q);
    });
  }, [data.receipts, query, kindFilter, period.inRange]);
  const sort = useEntrySort(filtered, dragEnabled ? "order" : "date", getters, "desc");
  const dragOn = dragEnabled && sort.key === "order";
  const drag = useRowDrag(
    dragOn,
    sort.sorted.map((r) => r.id),
    reorderReceipts,
  );
  const cols = useColWidths("finance-manager-receipts-cols", RCP_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const openReceipt = useCallback((id: string) => openTxn("receipt", id), []);
  const pointer = useListPointer(
    sort.sorted.map((r) => r.id),
    openReceipt,
  );
  function fit(id: keyof typeof RCP_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  const posted = data.receipts.filter((r) => r.status === "posted");
  const todaySales = posted.filter((r) => r.kind === "cash-sale" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
  const todayChecks = posted.filter((r) => r.method === "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
  const todayOnAccount = posted.filter((r) => r.kind === "payment" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);

  const openInvoices = data.invoices.filter((i) => i.status === "sent" || i.status === "partial");

  function openCreate(nextKind: "cash-sale" | "payment", method: ReceiptMethod = "cash") {
    setKind(nextKind);
    setForm({
      date: today,
      bankId: data.banks.find((b) => !b.archived)?.id ?? "",
      customerId: "",
      receivedFrom: "",
      invoiceId: "",
      amount: "",
      notes: "",
      taxRate: String(data.settings.defaultTaxRate),
      method,
      checkNumber: "",
      lines: [{ description: "", quantity: "1", unitPrice: "" }],
    });
    setCreateOpen(true);
  }

  return (
    <AppShell
      title="Receipts"
      description="Cash, customer checks, and money on account. Delete a ticket to take it off the books if you mistyped it."
      wide
      actions={
        <>
          <CsvButton filename="receipts.csv" rows={receiptRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button variant="outline" className="hidden sm:inline-flex" onClick={() => openCreate("payment")} disabled={openInvoices.length === 0}>
            On account
          </Button>
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => openCreate("payment", "check")}
            disabled={openInvoices.length === 0}
          >
            Check payment
          </Button>
          <Button onClick={() => openCreate("cash-sale")} disabled={data.banks.length === 0}>
            <Plus />
            Cash sale
          </Button>
        </>
      }
    >
      <section className="stat-grid stat-grid-3 mb-4">
        <Stat label="Cash sales today" value={todaySales} currency={data.settings.currency} />
        <Stat label="Checks today" value={todayChecks} currency={data.settings.currency} />
        <Stat label="On account today" value={todayOnAccount} currency={data.settings.currency} />
      </section>

      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search number or payee"
        label="Search receipts"
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
              label: "Kind",
              value: kindFilter,
              options: [
                { value: "all", label: "All" },
                { value: "cash-sale", label: "Cash sale" },
                { value: "payment", label: "On account" },
                { value: "void", label: "Void" },
              ],
              onChange: (v) => setKindFilter(v as typeof kindFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={RCP_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            setKindFilter("all");
            period.reset();
          }}
        />
      </ListToolbar>

      <ListCard ref={gridRef} className="doc-list">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            {dragEnabled ? <col style={{ width: 44 }} /> : null}
            {(Object.keys(RCP_COLS) as Array<keyof typeof RCP_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {dragEnabled ? (
                <SortHeader label="Order" column="order" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              ) : null}
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Number")} />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} />
              <SortHeader label="Received from" column="from" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.from} onWidth={(n) => cols.setWidth("from", n)} onFit={() => fit("from", "Received from")} />
              <SortHeader label="Kind" column="kind" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.kind} onWidth={(n) => cols.setWidth("kind", n)} onFit={() => fit("kind", "Kind")} />
              <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} />
              <th className="col-actions relative px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={dragEnabled ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">
                  No receipts yet.
                </td>
              </tr>
            ) : (
              sort.sorted.map((receipt) => {
                const bank = data.banks.find((b) => b.id === receipt.bankId);
                const applyStatus = (next: ReceiptStatusAction) => {
                  try {
                    if (next === "void") {
                      voidReceipt(receipt.id);
                      toast.success("Receipt voided.");
                      return;
                    }
                    const recon = next === "cleared" ? "cleared" : "pending";
                    setCashRecon({
                      kind: receipt.kind === "payment" ? "payment" : "receipt",
                      sourceId: receipt.id,
                      recon,
                    });
                    toast.success(recon === "cleared" ? "Cleared." : "Pending.");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update status.");
                  }
                };
                const rowActions = (
                  <RowActions items={[{ label: "Delete", danger: true, onSelect: () => setDeleting(receipt) }]} />
                );
                return (
                  <tr
                      key={receipt.id}
                        className="border-b border-border/70 last:border-0"
                        data-active={pointer.activeId === receipt.id ? "true" : undefined}
                        {...drag.bind(receipt.id)}
                        {...openProps("receipt", receipt.id)}
                        onClick={() => pointer.setActiveId(receipt.id)}
                      >
                        {dragEnabled ? (
                          <td className="px-4 py-3">
                            <DragHandle enabled={dragOn} />
                          </td>
                        ) : null}
                        <td className="px-4 py-3 font-medium" data-col="number">{receipt.number}</td>
                        <td className="px-4 py-3 whitespace-nowrap" data-col="date">{formatDate(receipt.date)}</td>
                        <td className="px-4 py-3" data-col="from">
                          <p>{receipt.receivedFrom}</p>
                          <p className="text-xs text-muted-foreground">
                            {bank?.nickname}
                            {receipt.checkNumber ? ` · Chk ${receipt.checkNumber}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3" data-col="kind">
                          <ReceiptBadge status={receipt.status} kind={receipt.kind} method={receipt.method} />
                        </td>
                        <td className="px-4 py-3 text-right" data-col="amount">
                          <Money amount={receipt.amount} currency={data.settings.currency} />
                        </td>
                        <td className="px-4 py-3" data-col="status" onClick={(e) => e.stopPropagation()} onDoubleClick={stopOpen}>
                          <ReceiptStatusControl
                            status={receipt.status}
                            recon={receipt.recon ?? "pending"}
                            kind={receipt.kind}
                            method={receipt.method}
                            onAction={applyStatus}
                          />
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
        title="Receipts"
        columns={[
          { key: "number", label: "Number" },
          { key: "date", label: "Date" },
          { key: "from", label: "Received from" },
          { key: "kind", label: "Kind" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "status", label: "Status" },
        ]}
        rows={sort.sorted.map((r) => ({
          number: r.number,
          date: formatDate(r.date),
          from: r.receivedFrom,
          kind: r.kind === "payment" ? "On account" : "Cash sale",
          amount: formatMoney(r.amount, data.settings.currency),
          status: r.status,
        }))}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Void keeps a cancelled stub. Delete takes the ticket off the ledger so you can re-enter it.
      </p>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        {kind === "payment" ? (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Receive payment</DialogTitle>
            {createOpen ? (
              <CustomerPayment initialMethod={form.method} onClose={() => setCreateOpen(false)} />
            ) : null}
          </DialogContent>
        ) : (
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.method === "check" ? "Cash sale by check" : "Cash sale"}</DialogTitle>
            <DialogDescription>Named customer on file. Debits the bank, credits income.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <DateInput value={form.date} onChange={(date) => setForm({ ...form, date })} />
              </Field>
              <Field label="Deposit to">
                <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.banks
                      .filter((b) => !b.archived)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nickname}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Customer">
              <PartyCombo
                items={data.customers}
                valueId={form.customerId}
                valueName={data.customers.find((c) => c.id === form.customerId)?.name ?? ""}
                label="Customer"
                placeholder="Customer on file — type Add to save a new name"
                onChoose={(id, name) => setForm({ ...form, customerId: id, receivedFrom: name, invoiceId: "" })}
                onName={(name) => setForm({ ...form, receivedFrom: name, customerId: form.customerId })}
                onCreate={(name) => {
                  const id = newId();
                  addCustomer({ ...EMPTY_CUSTOMER, id, name });
                  return { id, name };
                }}
              />
            </Field>
            <Field label="Received from">
              <Input
                value={form.receivedFrom}
                onChange={(e) => setForm({ ...form, receivedFrom: e.target.value })}
                placeholder="Leave blank to use the customer name"
              />
            </Field>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tender">
                <Select
                  value={form.method}
                  onValueChange={(v) => setForm({ ...form, method: v as ReceiptMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Credit / Debit</SelectItem>
                    <SelectItem value="echeck">e-Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.method === "check" ? (
                <Field label="Check number">
                  <Input
                    value={form.checkNumber}
                    onChange={(e) => setForm({ ...form, checkNumber: e.target.value })}
                    placeholder="1044"
                  />
                </Field>
              ) : (
                <div />
              )}
            </div>
            <Field label="Memo">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  createCashSale({
                    date: form.date,
                    bankId: form.bankId,
                    customerId: form.customerId,
                    receivedFrom: form.receivedFrom,
                    notes: form.notes,
                    taxRate: data.settings.taxEnabled ? Number(form.taxRate) || 0 : 0,
                    method: form.method,
                    checkNumber: form.checkNumber,
                    lines: form.lines.map((l) => ({
                      description: l.description,
                      quantity: Number(l.quantity) || 0,
                      unitPrice: parseAmountToCents(l.unitPrice),
                    })),
                  });
                  toast.success(form.method === "check" ? "Check receipt posted." : "Cash sale posted.");
                  setCreateOpen(false);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not post receipt.");
                }
              }}
            >
              Post receipt
            </Button>
          </DialogFooter>
        </DialogContent>
        )}
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        title="Delete receipt?"
        body="Removes this ticket and takes it off the ledger so you can enter it again."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          try {
            removeReceipt(deleting.id);
            toast.success("Receipt deleted.");
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

function Stat({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <Card>
      <CardContent>
        <p className="eyebrow">{label}</p>
        <Money amount={value} currency={currency} className="stat-value" />
      </CardContent>
    </Card>
  );
}
