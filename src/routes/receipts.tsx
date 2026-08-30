import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle } from "@/components/drag-handle";
import { EntryLines, type DraftLine } from "@/components/entry-lines";
import { CsvButton } from "@/components/export-menu";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { ReceiptBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
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
import { invoiceBalance } from "@/lib/finance/ledger";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { addDaysIso, formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { Receipt, ReceiptMethod } from "@/lib/finance/types";

export const Route = createFileRoute("/receipts")({ component: ReceiptsPage });

function ReceiptsPage() {
  const data = useFinanceData();
  const createCashSale = useFinanceStore((s) => s.createCashSale);
  const recordInvoicePayment = useFinanceStore((s) => s.recordInvoicePayment);
  const voidReceipt = useFinanceStore((s) => s.voidReceipt);
  const removeReceipt = useFinanceStore((s) => s.removeReceipt);
  const reorderReceipts = useFinanceStore((s) => s.reorderReceipts);
  const dragEnabled = data.settings.dragDropEnabled;
  const today = todayIso();

  const [createOpen, setCreateOpen] = useState(false);
  const [kind, setKind] = useState<"cash-sale" | "payment">("cash-sale");
  const [deleting, setDeleting] = useState<Receipt | null>(null);
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
  const sort = useEntrySort(data.receipts, dragEnabled ? "order" : "date", getters, "desc");
  const dragOn = dragEnabled && sort.key === "order";
  const drag = useRowDrag(
    dragOn,
    sort.sorted.map((r) => r.id),
    reorderReceipts,
  );

  const posted = data.receipts.filter((r) => r.status === "posted");
  const todaySales = posted.filter((r) => r.kind === "cash-sale" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
  const todayChecks = posted.filter((r) => r.method === "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
  const todayOnAccount = posted.filter((r) => r.kind === "payment" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);

  const openInvoices = data.invoices.filter((i) => i.status === "sent" || i.status === "partial");
  const customerInvoices = openInvoices.filter((i) => !form.customerId || i.customerId === form.customerId);

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
      actions={
        <>
          <CsvButton filename="receipts.csv" rows={receiptRows(data)} />
          <Button variant="outline" onClick={() => openCreate("payment")} disabled={openInvoices.length === 0}>
            On account
          </Button>
          <Button
            variant="outline"
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
      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Cash sales today" value={todaySales} currency={data.settings.currency} />
        <Stat label="Checks today" value={todayChecks} currency={data.settings.currency} />
        <Stat label="On account today" value={todayOnAccount} currency={data.settings.currency} />
      </section>

      <div className="overflow-x-auto rounded-3xl bg-card elevation">
        <table className="w-full min-w-4xl text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {dragEnabled ? (
                <SortHeader label="Order" column="order" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              ) : null}
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Received from" column="from" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Kind" column="kind" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader
                label="Amount"
                column="amount"
                sortKey={sort.key}
                dir={sort.dir}
                onToggle={sort.toggle}
                align="right"
              />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <th className="px-4 py-3" />
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
                return (
                  <tr key={receipt.id} className="border-b border-border/70 last:border-0" {...drag.bind(receipt.id)} {...openProps("receipt", receipt.id)}>
                    {dragEnabled ? (
                      <td className="px-4 py-3">
                        <DragHandle enabled={dragOn} />
                      </td>
                    ) : null}
                    <td className="px-4 py-3 font-medium">{receipt.number}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(receipt.date)}</td>
                    <td className="px-4 py-3">
                      <p>{receipt.receivedFrom}</p>
                      <p className="text-xs text-muted-foreground">
                        {bank?.nickname}
                        {receipt.checkNumber ? ` · Chk ${receipt.checkNumber}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ReceiptBadge status={receipt.status} kind={receipt.kind} method={receipt.method} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Money amount={receipt.amount} currency={data.settings.currency} />
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{receipt.status}</td>
                    <td className="px-4 py-3" onDoubleClick={stopOpen}>
                      <div className="flex justify-end gap-1">
                        {receipt.status === "posted" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              voidReceipt(receipt.id);
                              toast.success("Receipt voided.");
                            }}
                          >
                            Void
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(receipt)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Void keeps a cancelled stub. Delete takes the ticket off the ledger so you can re-enter it.
      </p>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {kind === "cash-sale"
                ? form.method === "check"
                  ? "Cash sale by check"
                  : "Cash sale"
                : form.method === "check"
                  ? "Check payment"
                  : "Receive on account"}
            </DialogTitle>
            <DialogDescription>
              {kind === "cash-sale"
                ? "Walk-in or named customer. Debits the bank, credits income."
                : "Apply money to an open invoice. Debits the bank, credits receivables."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
              <Select
                value={form.customerId || "none"}
                onValueChange={(v) => setForm({ ...form, customerId: v === "none" ? "" : v, invoiceId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{kind === "cash-sale" ? "Walk-in" : "Choose customer"}</SelectItem>
                  {data.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {kind === "cash-sale" ? (
              <>
                <Field label="Received from">
                  <Input
                    value={form.receivedFrom}
                    onChange={(e) => setForm({ ...form, receivedFrom: e.target.value })}
                    placeholder="Walk-in name if no customer"
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
              </>
            ) : (
              <>
                <Field label="Invoice">
                  <Select value={form.invoiceId} onValueChange={(v) => setForm({ ...form, invoiceId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Open invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerInvoices.map((inv) => {
                        const customer = data.customers.find((c) => c.id === inv.customerId);
                        const due = invoiceBalance(data, inv.id);
                        return (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.number} · {customer?.name} · due {addDaysIso(inv.dueDate, 0)} · {due / 100}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Amount">
                  <Input
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    inputMode="decimal"
                    placeholder={
                      form.invoiceId ? String(invoiceBalance(data, form.invoiceId) / 100) : "0.00"
                    }
                  />
                </Field>
              </>
            )}
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
                  if (kind === "cash-sale") {
                    createCashSale({
                      date: form.date,
                      bankId: form.bankId,
                      customerId: form.customerId || undefined,
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
                  } else {
                    if (!form.invoiceId) throw new Error("Choose an invoice.");
                    recordInvoicePayment({
                      invoiceId: form.invoiceId,
                      date: form.date,
                      amount: parseAmountToCents(form.amount) || invoiceBalance(data, form.invoiceId),
                      bankId: form.bankId,
                      memo: form.notes,
                      method: form.method,
                      checkNumber: form.checkNumber,
                    });
                    toast.success(form.method === "check" ? "Check payment posted." : "Receipt posted.");
                  }
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
      <CardContent className="p-5">
        <p className="eyebrow">{label}</p>
        <Money amount={value} currency={currency} className="mt-2 text-2xl font-medium" />
      </CardContent>
    </Card>
  );
}
