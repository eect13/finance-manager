import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { EntryLines, type DraftLine } from "@/components/entry-lines";
import { CsvButton } from "@/components/export-menu";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { InvoiceBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { invoiceRows } from "@/lib/finance/export";
import { addDaysIso, formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { invoiceBalance, invoiceTotal } from "@/lib/finance/ledger";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { Invoice, ReceiptMethod } from "@/lib/finance/types";

export const Route = createFileRoute("/invoices")({ component: InvoicesPage });

function InvoicesPage() {
  const data = useFinanceData();
  const createInvoice = useFinanceStore((s) => s.createInvoice);
  const recordInvoicePayment = useFinanceStore((s) => s.recordInvoicePayment);
  const voidInvoice = useFinanceStore((s) => s.voidInvoice);
  const removeInvoice = useFinanceStore((s) => s.removeInvoice);
  const dragEnabled = data.settings.dragDropEnabled;

  const [createOpen, setCreateOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    date: todayIso(),
    bankId: "",
    method: "cash" as ReceiptMethod,
    checkNumber: "",
  });
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
  const sort = useEntrySort(data.invoices, "date", getters, "desc");
  const paying = data.invoices.find((i) => i.id === payId);

  return (
    <AppShell
      title="Invoices"
      description="Bill customers, collect into a bank, and print a clean invoice for paper or PDF."
      actions={
        <>
          <CsvButton filename="invoices.csv" rows={invoiceRows(data)} />
          <Button onClick={() => setCreateOpen(true)} disabled={data.customers.length === 0}>
            <Plus />
            New invoice
          </Button>
        </>
      }
    >
      {data.customers.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Add a customer before you invoice.</p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl bg-card elevation">
        <table className="w-full min-w-4xl text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Customer" column="customer" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader
                label="Total"
                column="total"
                sortKey={sort.key}
                dir={sort.dir}
                onToggle={sort.toggle}
                align="right"
              />
              <SortHeader
                label="Balance"
                column="balance"
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
            {sort.sorted.map((inv) => {
              const customer = data.customers.find((c) => c.id === inv.customerId);
              const due = invoiceBalance(data, inv.id);
              const overdue = due > 0 && inv.dueDate < today && inv.status !== "void" && inv.status !== "paid";
              return (
                <tr key={inv.id} className="border-b border-border/70 last:border-0" {...openProps("invoice", inv.id)}>
                  <td className="px-4 py-3 font-medium">{inv.number}</td>
                  <td className="px-4 py-3">{customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Money amount={invoiceTotal(data, inv.id)} currency={data.settings.currency} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Money amount={due} currency={data.settings.currency} />
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceBadge status={inv.status} overdue={overdue} />
                  </td>
                  <td className="px-4 py-3" onDoubleClick={stopOpen}>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/print/$invoiceId" params={{ invoiceId: inv.id }}>
                          Print
                        </Link>
                      </Button>
                      {due > 0 && inv.status !== "void" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayId(inv.id);
                            setPayForm({
                              amount: String(due / 100),
                              date: todayIso(),
                              bankId: data.banks[0]?.id ?? "",
                              method: "cash",
                              checkNumber: "",
                            });
                          }}
                        >
                          Collect
                        </Button>
                      ) : null}
                      {inv.status !== "void" && inv.status !== "paid" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            voidInvoice(inv.id);
                            toast.success("Invoice voided.");
                          }}
                        >
                          Void
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(inv)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>Posts accounts receivable and income when you save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Customer">
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose customer" />
                </SelectTrigger>
                <SelectContent>
                  {data.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Invoice date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Due date">
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect payment</DialogTitle>
            <DialogDescription>
              {paying ? (
                <>
                  {paying.number} · balance{" "}
                  <Money amount={invoiceBalance(data, paying.id)} currency={data.settings.currency} />
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Bank">
              <Select value={payForm.bankId} onValueChange={(v) => setPayForm({ ...payForm, bankId: v })}>
                <SelectTrigger>
                  <SelectValue />
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
            <Field label="Date">
              <Input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
            </Field>
            <Field label="Amount">
              <Input value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} inputMode="decimal" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tender">
                <Select
                  value={payForm.method}
                  onValueChange={(v) => setPayForm({ ...payForm, method: v as ReceiptMethod })}
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
              {payForm.method === "check" ? (
                <Field label="Check number">
                  <Input
                    value={payForm.checkNumber}
                    onChange={(e) => setPayForm({ ...payForm, checkNumber: e.target.value })}
                    placeholder="1044"
                  />
                </Field>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!payId) return;
                try {
                  recordInvoicePayment({
                    invoiceId: payId,
                    date: payForm.date,
                    amount: parseAmountToCents(payForm.amount),
                    bankId: payForm.bankId,
                    method: payForm.method,
                    checkNumber: payForm.checkNumber,
                  });
                  setPayId(null);
                  toast.success("Payment recorded.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not record payment.");
                }
              }}
            >
              Record payment
            </Button>
          </DialogFooter>
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
