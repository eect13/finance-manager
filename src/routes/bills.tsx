import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle } from "@/components/drag-handle";
import { CsvButton } from "@/components/export-menu";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { BillBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
import { useRowDrag } from "@/components/use-row-drag";
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
import { billRows } from "@/lib/finance/export";
import { addDaysIso, formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { billBalance } from "@/lib/finance/ledger";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { Bill } from "@/lib/finance/types";

export const Route = createFileRoute("/bills")({ component: BillsPage });

function BillsPage() {
  const data = useFinanceData();
  const createBill = useFinanceStore((s) => s.createBill);
  const payBill = useFinanceStore((s) => s.payBill);
  const voidBill = useFinanceStore((s) => s.voidBill);
  const removeBill = useFinanceStore((s) => s.removeBill);
  const reorderBills = useFinanceStore((s) => s.reorderBills);
  const dragEnabled = data.settings.dragDropEnabled;
  const today = todayIso();
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");

  const [createOpen, setCreateOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Bill | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", date: today, bankId: "" });
  const [form, setForm] = useState({
    vendorId: "",
    date: today,
    dueDate: addDaysIso(today, 15),
    amount: "",
    accountId: expenseAccounts[0]?.id ?? "",
    memo: "",
    reference: "",
  });

  const getters = useMemo(
    () => ({
      order: (b: Bill) => b.sortOrder,
      number: (b: Bill) => b.number,
      vendor: (b: Bill) => data.vendors.find((v) => v.id === b.vendorId)?.name ?? "",
      date: (b: Bill) => b.date,
      due: (b: Bill) => b.dueDate,
      amount: (b: Bill) => b.amount,
      balance: (b: Bill) => billBalance(b),
      status: (b: Bill) => b.status,
    }),
    [data.vendors],
  );
  const sort = useEntrySort(data.bills, dragEnabled ? "order" : "date", getters, "desc");
  const dragOn = dragEnabled && sort.key === "order";
  const drag = useRowDrag(
    dragOn,
    sort.sorted.map((b) => b.id),
    reorderBills,
  );

  const paying = data.bills.find((b) => b.id === payId);

  return (
    <AppShell
      title="Bills"
      description="Vendor invoices on accounts payable. Pay from a bank, or void and delete once reversed."
      actions={
        <>
          <CsvButton filename="bills.csv" rows={billRows(data)} />
          <Button onClick={() => setCreateOpen(true)} disabled={data.vendors.length === 0}>
            <Plus />
            New bill
          </Button>
        </>
      }
    >
      {data.vendors.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Add a vendor before you enter a bill.</p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl bg-card elevation">
        <table className="w-full min-w-4xl text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {dragEnabled ? (
                <SortHeader label="Order" column="order" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              ) : null}
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Vendor" column="vendor" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader
                label="Amount"
                column="amount"
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
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={dragEnabled ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
                  No bills yet.
                </td>
              </tr>
            ) : (
              sort.sorted.map((bill) => {
                const vendor = data.vendors.find((v) => v.id === bill.vendorId);
                const due = billBalance(bill);
                const overdue = due > 0 && bill.dueDate < today && bill.status !== "void" && bill.status !== "paid";
                return (
                  <tr key={bill.id} className="border-b border-border/70 last:border-0" {...drag.bind(bill.id)} {...openProps("bill", bill.id)}>
                    {dragEnabled ? (
                      <td className="px-4 py-3">
                        <DragHandle enabled={dragOn} />
                      </td>
                    ) : null}
                    <td className="px-4 py-3 font-medium">{bill.number}</td>
                    <td className="px-4 py-3">{vendor?.name ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(bill.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(bill.dueDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Money amount={bill.amount} currency={data.settings.currency} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Money amount={due} currency={data.settings.currency} />
                    </td>
                    <td className="px-4 py-3">
                      <BillBadge status={bill.status} overdue={overdue} />
                    </td>
                    <td className="px-4 py-3" onDoubleClick={stopOpen}>
                      <div className="flex flex-wrap justify-end gap-1">
                        {due > 0 && bill.status !== "void" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayId(bill.id);
                              setPayForm({
                                amount: String(due / 100),
                                date: today,
                                bankId: data.banks[0]?.id ?? "",
                              });
                            }}
                          >
                            Pay
                          </Button>
                        ) : null}
                        {bill.status !== "void" && bill.status !== "paid" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              voidBill(bill.id);
                              toast.success("Bill voided.");
                            }}
                          >
                            Void
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(bill)}>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New bill</DialogTitle>
            <DialogDescription>Posts expense and accounts payable when you save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Vendor">
              <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose vendor" />
                </SelectTrigger>
                <SelectContent>
                  {data.vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bill date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Due date">
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Amount">
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Charge to">
              <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference">
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </Field>
            <Field label="Memo">
              <Textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  createBill({
                    vendorId: form.vendorId,
                    date: form.date,
                    dueDate: form.dueDate,
                    amount: parseAmountToCents(form.amount),
                    accountId: form.accountId,
                    memo: form.memo,
                    reference: form.reference,
                  });
                  setCreateOpen(false);
                  toast.success("Bill posted.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not create bill.");
                }
              }}
            >
              Save bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paying)} onOpenChange={(o) => !o && setPayId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay bill</DialogTitle>
            <DialogDescription>
              {paying ? (
                <>
                  {paying.number} · balance{" "}
                  <Money amount={billBalance(paying)} currency={data.settings.currency} />
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
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!payId) return;
                try {
                  payBill({
                    billId: payId,
                    date: payForm.date,
                    amount: parseAmountToCents(payForm.amount),
                    bankId: payForm.bankId,
                  });
                  setPayId(null);
                  toast.success("Bill paid.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not pay bill.");
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
        title="Delete bill?"
        body="Removes this bill, its payments, and the ledger lines so you can enter it again."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          try {
            removeBill(deleting.id);
            toast.success("Bill deleted.");
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
