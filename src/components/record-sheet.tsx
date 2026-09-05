import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DateInput } from "@/components/date-input";
import { Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CustomerPayment } from "@/components/customer-payment";
import { EntryLines, type DraftLine } from "@/components/entry-lines";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { PartyFields } from "@/components/party-form";
import { PartyTxnTable } from "@/components/party-center";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { checkStatusMenuItems } from "@/components/check-status-menu";
import { BillBadge, CheckBadge, InvoiceBadge } from "@/components/status-badge";
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
import { parseAmountToCents, todayIso, formatDate } from "@/lib/finance/format";
import { useEntrySort } from "@/lib/finance/sort";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import {
  billBalance,
  bankBookBalance,
  customerOpenBalance,
  invoiceBalance,
  invoiceTotal,
  vendorOpenBalance,
} from "@/lib/finance/ledger";
import type { OpenKind } from "@/lib/finance/open-record";
import { customerHistory, vendorHistory } from "@/lib/finance/party-history";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { EMPTY_CUSTOMER, EMPTY_VENDOR } from "@/lib/finance/types";

export function RecordSheet() {
  const target = useFinanceStore((s) => s.openRecord);
  const closeTxn = useFinanceStore((s) => s.closeTxn);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const open = Boolean(target);

  useEffect(() => {
    closeTxn();
  }, [pathname, closeTxn]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeTxn()}>
      <DialogContent
        className={cn(
          "max-w-2xl",
          (target?.kind === "receipt" || target?.kind === "invoice") && "max-w-3xl",
          (target?.kind === "customer" || target?.kind === "vendor") && "max-w-4xl",
        )}
      >
        {target ? <RecordBody kind={target.kind} id={target.id} onClose={closeTxn} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordBody({ kind, id, onClose }: { kind: OpenKind; id: string; onClose: () => void }) {
  if (kind === "invoice") return <InvoiceBody id={id} onClose={onClose} />;
  if (kind === "bill") return <BillBody id={id} onClose={onClose} />;
  if (kind === "receipt") return <ReceiptBody id={id} onClose={onClose} />;
  if (kind === "check") return <CheckBody id={id} onClose={onClose} />;
  if (kind === "customer") return <CustomerBody id={id} onClose={onClose} />;
  if (kind === "vendor") return <VendorBody id={id} onClose={onClose} />;
  if (kind === "bank") return <BankBody id={id} onClose={onClose} />;
  return <JournalBody id={id} onClose={onClose} />;
}

function InvoiceBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const invoice = data.invoices.find((i) => i.id === id);
  const updateInvoiceRecord = useFinanceStore((s) => s.updateInvoiceRecord);
  const voidInvoice = useFinanceStore((s) => s.voidInvoice);
  const removeInvoice = useFinanceStore((s) => s.removeInvoice);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [edit, setEdit] = useState({
    date: "",
    dueDate: "",
    notes: "",
    taxRate: "",
    lines: [] as DraftLine[],
  });

  useEffect(() => {
    if (!invoice) {
      onClose();
      return;
    }
    setEdit({
      date: invoice.date,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      taxRate: String(invoice.taxRate),
      lines: invoice.lines.map((line) => ({
        description: line.description,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice / 100),
      })),
    });
  }, [invoice, onClose]);
  if (!invoice) return null;

  const customer = data.customers.find((c) => c.id === invoice.customerId);
  const total = invoiceTotal(data, invoice.id);
  const due = invoiceBalance(data, invoice.id);
  const overdue = due > 0 && invoice.dueDate < todayIso() && invoice.status !== "void" && invoice.status !== "paid";

  if (paying) {
    return <CustomerPayment invoiceId={id} onClose={onClose} onBack={() => setPaying(false)} />;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{invoice.number}</DialogTitle>
        <DialogDescription>
          {customer?.name ?? "Customer"} · {formatDate(invoice.date)}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2">
        <InvoiceBadge status={invoice.status} overdue={overdue} />
        <span className="text-sm text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Invoice date">
          <DateInput
            value={edit.date}
            disabled={invoice.status === "void"}
            onChange={(date) => setEdit({ ...edit, date })}
          />
        </Field>
        <Field label="Due date">
          <DateInput
            value={edit.dueDate}
            disabled={invoice.status === "void"}
            onChange={(dueDate) => setEdit({ ...edit, dueDate })}
          />
        </Field>
        <Field label="Notes">
          <Input value={edit.notes} disabled={invoice.status === "void"} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
        </Field>
        {data.settings.taxEnabled ? (
          <Field label="Tax %">
            <Input
              value={edit.taxRate}
              disabled={invoice.status === "void"}
              inputMode="decimal"
              onChange={(e) => setEdit({ ...edit, taxRate: e.target.value })}
            />
          </Field>
        ) : null}
      </div>
      {invoice.status === "void" ? (
        <table className="w-full text-sm">
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-border/70">
                <td className="py-2">{line.description}</td>
                <td className="py-2 text-right tabular-nums">{line.quantity}</td>
                <td className="py-2 text-right">
                  <Money amount={line.unitPrice} currency={data.settings.currency} />
                </td>
                <td className="py-2 text-right">
                  <Money amount={Math.round(line.quantity * line.unitPrice)} currency={data.settings.currency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EntryLines
          lines={edit.lines}
          onChange={(lines) => setEdit({ ...edit, lines })}
          dragEnabled={data.settings.dragDropEnabled}
        />
      )}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Meta label="Total" value={<Money amount={total} currency={data.settings.currency} />} />
        <Meta label="Balance" value={<Money amount={due} currency={data.settings.currency} />} />
        <Meta label="Payments" value={String(invoice.payments.length)} />
      </div>
      <DialogFooter className="flex-wrap gap-2">
        {invoice.status === "void" ? null : (
          <Button
            onClick={() => {
              try {
                updateInvoiceRecord(invoice.id, {
                  date: edit.date,
                  dueDate: edit.dueDate,
                  notes: edit.notes,
                  taxRate: data.settings.taxEnabled ? Number(edit.taxRate) || 0 : invoice.taxRate,
                  lines: edit.lines.map((line) => ({
                    description: line.description,
                    quantity: Number(line.quantity) || 0,
                    unitPrice: parseAmountToCents(line.unitPrice),
                  })),
                });
                toast.success("Invoice updated.");
                onClose();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save.");
              }
            }}
          >
            Save
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/print/$invoiceId" params={{ invoiceId: invoice.id }} onClick={onClose}>
            Print
          </Link>
        </Button>
        {due > 0 && invoice.status !== "void" ? (
          <Button variant="outline" onClick={() => setPaying((v) => !v)}>
            Collect
          </Button>
        ) : null}
        {invoice.status !== "void" && invoice.status !== "paid" ? (
          <Button
            variant="ghost"
            onClick={() => {
              voidInvoice(invoice.id);
              toast.success("Invoice voided.");
            }}
          >
            Void
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete invoice?"
        body="Removes this invoice and its ledger lines so you can enter it again."
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeInvoice(invoice.id);
            toast.success("Invoice deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function BillBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const bill = data.bills.find((b) => b.id === id);
  const payBill = useFinanceStore((s) => s.payBill);
  const updateBillRecord = useFinanceStore((s) => s.updateBillRecord);
  const voidBill = useFinanceStore((s) => s.voidBill);
  const removeBill = useFinanceStore((s) => s.removeBill);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [edit, setEdit] = useState({ date: "", dueDate: "", amount: "", memo: "" });
  const [payForm, setPayForm] = useState({
    amount: "",
    date: todayIso(),
    bankId: data.banks[0]?.id ?? "",
  });

  useEffect(() => {
    if (!bill) {
      onClose();
      return;
    }
    setEdit({
      date: bill.date,
      dueDate: bill.dueDate,
      amount: String(bill.amount / 100),
      memo: bill.memo,
    });
  }, [bill, onClose]);
  if (!bill) return null;

  const vendor = data.vendors.find((v) => v.id === bill.vendorId);
  const due = billBalance(bill);
  const overdue = due > 0 && bill.dueDate < todayIso() && bill.status !== "void" && bill.status !== "paid";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{bill.number}</DialogTitle>
        <DialogDescription>
          {vendor?.name ?? "Vendor"} · {formatDate(bill.date)}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2">
        <BillBadge status={bill.status} overdue={overdue} />
        <span className="text-sm text-muted-foreground">Due {formatDate(bill.dueDate)}</span>
      </div>
      {bill.memo ? <p className="text-sm text-muted-foreground">{bill.memo}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bill date">
          <DateInput value={edit.date} disabled={bill.status === "void"} onChange={(date) => setEdit({ ...edit, date })} />
        </Field>
        <Field label="Due date">
          <DateInput value={edit.dueDate} disabled={bill.status === "void"} onChange={(dueDate) => setEdit({ ...edit, dueDate })} />
        </Field>
        <Field label="Amount">
          <Input value={edit.amount} disabled={bill.status === "void"} inputMode="decimal" onChange={(e) => setEdit({ ...edit, amount: e.target.value })} />
        </Field>
        <Field label="Memo">
          <Input value={edit.memo} disabled={bill.status === "void"} onChange={(e) => setEdit({ ...edit, memo: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Meta label="Amount" value={<Money amount={bill.amount} currency={data.settings.currency} />} />
        <Meta label="Balance" value={<Money amount={due} currency={data.settings.currency} />} />
      </div>
      {paying ? (
        <div className="grid gap-3 rounded-xl bg-muted/70 p-4 sm:grid-cols-2">
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
          <Field label="Amount">
            <Input
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              inputMode="decimal"
              placeholder={String(due / 100)}
            />
          </Field>
          <Button
            className="sm:col-span-2"
            onClick={() => {
              try {
                payBill({
                  billId: bill.id,
                  date: payForm.date,
                  amount: parseAmountToCents(payForm.amount) || due,
                  bankId: payForm.bankId,
                });
                setPaying(false);
                toast.success("Bill paid.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not pay bill.");
              }
            }}
          >
            Record payment
          </Button>
        </div>
      ) : null}
      <DialogFooter className="flex-wrap gap-2">
        {bill.status === "void" ? null : (
          <Button
            onClick={() => {
              try {
                updateBillRecord(bill.id, {
                  date: edit.date,
                  dueDate: edit.dueDate,
                  amount: parseAmountToCents(edit.amount),
                  memo: edit.memo,
                });
                toast.success("Bill updated.");
                onClose();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save.");
              }
            }}
          >
            Save
          </Button>
        )}
        {due > 0 && bill.status !== "void" ? (
          <Button variant="outline" onClick={() => setPaying((v) => !v)}>
            Pay
          </Button>
        ) : null}
        {bill.status !== "void" && bill.status !== "paid" ? (
          <Button
            variant="ghost"
            onClick={() => {
              voidBill(bill.id);
              toast.success("Bill voided.");
            }}
          >
            Void
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete bill?"
        body="Removes this bill and its ledger lines so you can enter it again."
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeBill(bill.id);
            toast.success("Bill deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function ReceiptBody({ id, onClose }: { id: string; onClose: () => void }) {
  return <CustomerPayment receiptId={id} onClose={onClose} />;
}

function CheckBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const check = data.checks.find((c) => c.id === id);
  const updateCheck = useFinanceStore((s) => s.updateCheck);
  const setCheckStatus = useFinanceStore((s) => s.setCheckStatus);
  const removeCheck = useFinanceStore((s) => s.removeCheck);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    payee: "",
    amount: "",
    issueDate: "",
    postDate: "",
    memo: "",
    checkNumber: "",
    accountId: "",
    bankId: "",
  });

  useEffect(() => {
    if (!check) {
      onClose();
      return;
    }
    setForm({
      payee: check.payee,
      amount: String(check.amount / 100),
      issueDate: check.issueDate,
      postDate: check.postDate,
      memo: check.memo,
      checkNumber: check.checkNumber,
      accountId: check.accountId,
      bankId: check.bankId,
    });
  }, [check, onClose]);
  if (!check) return null;

  const bank = data.banks.find((b) => b.id === check.bankId);
  const locked = check.status === "voided" || check.status === "bounced" || check.recon === "reconciled";
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Write check #{check.checkNumber}</DialogTitle>
        <DialogDescription>
          {bank?.nickname ?? "Bank"} · Edit payee, dates, and amount.
        </DialogDescription>
      </DialogHeader>
      <CheckBadge status={check.status} />
      {check.recon === "reconciled" ? (
        <p className="text-sm text-muted-foreground">Reconciled — unlock from the register status column to edit.</p>
      ) : null}
      <div className="txn-context">
        <Field label="Date">
          <DateInput value={form.issueDate} disabled={locked} tabIndex={-1} onChange={(issueDate) => setForm({ ...form, issueDate, postDate: issueDate })} />
        </Field>
        <Field label="Bank">
          <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })} disabled={locked}>
            <SelectTrigger tabIndex={-1}>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {data.banks.filter((b) => !b.archived).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nickname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3">
        <Field label="Payee">
          <Input value={form.payee} disabled={locked} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
        </Field>
        <Field label="Amount">
          <Input value={form.amount} disabled={locked} inputMode="decimal" onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Memo">
          <Input value={form.memo} disabled={locked} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Check number">
            <Input value={form.checkNumber} disabled={locked} tabIndex={-1} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} />
          </Field>
          <Field label="Expense account">
            <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })} disabled={locked}>
              <SelectTrigger tabIndex={-1}>
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
        </div>
      </div>
      <DialogFooter className="flex-wrap gap-2">
        {locked ? null : (
          <Button
            onClick={() => {
              try {
                updateCheck(check.id, {
                  payee: form.payee,
                  amount: parseAmountToCents(form.amount),
                  issueDate: form.issueDate,
                  postDate: form.postDate,
                  memo: form.memo,
                  checkNumber: form.checkNumber,
                  accountId: form.accountId,
                  bankId: form.bankId,
                });
                toast.success("Check updated.");
                onClose();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save.");
              }
            }}
          >
            Save
          </Button>
        )}
        {check.status === "pending" || check.status === "cleared" ? (
          <>
            {checkStatusMenuItems(check.status, (next) => {
              try {
                setCheckStatus(check.id, next);
                if (next === "voided") toast.success("Check voided.");
                else if (next === "bounced") toast.success("Marked bounced.");
                else if (next === "cleared") toast.success("Cleared.");
                else toast.success("Pending.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not update status.");
              }
            }).map((item) => (
              <Button
                key={item.label}
                variant={item.label === "Cleared" || item.label === "Pending" ? "outline" : "ghost"}
                className={item.danger ? "text-destructive" : undefined}
                onClick={item.onSelect}
              >
                {item.label === "Cleared" ? "Clear" : item.label === "Pending" ? "Pending" : item.label}
              </Button>
            ))}
          </>
        ) : null}
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete check?"
        body="Removes this check and takes it off the ledger so you can issue it again."
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeCheck(check.id);
            toast.success("Check deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function CustomerBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const customer = data.customers.find((c) => c.id === id);
  const updateCustomer = useFinanceStore((s) => s.updateCustomer);
  const removeCustomer = useFinanceStore((s) => s.removeCustomer);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!customer) {
      onClose();
      return;
    }
    const { id: _id, ...rest } = customer;
    setForm(rest);
  }, [customer, onClose]);
  if (!customer) return null;
  const history = customerHistory(data, customer.id);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{customer.name}</DialogTitle>
        <DialogDescription>
          Open balance{" "}
          <Money amount={customerOpenBalance(data, customer.id)} currency={data.settings.currency} className="inline" />
          {" · "}
          {history.length} {history.length === 1 ? "transaction" : "transactions"}
        </DialogDescription>
      </DialogHeader>
      <p className="text-xs text-muted-foreground">Tap a line to open and edit it.</p>
      <PartyTxnTable
        rows={history}
        currency={data.settings.currency}
        empty="No invoices, payments, or cash sales yet."
      />
      <PartyFields form={form} setForm={setForm} />
      <DialogFooter className="flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!form.name.trim()) return toast.error("Customer name is required.");
            updateCustomer(customer.id, form);
            toast.success("Customer updated.");
            onClose();
          }}
        >
          Save
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete customer?"
        body={`${customer.name} will be removed. This is blocked if invoices or receipts still point here.`}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeCustomer(customer.id);
            toast.success("Customer deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function VendorBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const vendor = data.vendors.find((v) => v.id === id);
  const updateVendor = useFinanceStore((s) => s.updateVendor);
  const removeVendor = useFinanceStore((s) => s.removeVendor);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!vendor) {
      onClose();
      return;
    }
    const { id: _id, ...rest } = vendor;
    setForm(rest);
  }, [vendor, onClose]);
  if (!vendor) return null;
  const history = vendorHistory(data, vendor.id);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{vendor.name}</DialogTitle>
        <DialogDescription>
          Open balance{" "}
          <Money amount={vendorOpenBalance(data, vendor.id)} currency={data.settings.currency} className="inline" />
          {" · "}
          {history.length} {history.length === 1 ? "transaction" : "transactions"}
        </DialogDescription>
      </DialogHeader>
      <p className="text-xs text-muted-foreground">Tap a line to open and edit it.</p>
      <PartyTxnTable
        rows={history}
        currency={data.settings.currency}
        empty="No bills or checks yet."
      />
      <PartyFields
        form={form}
        setForm={setForm}
        extra={
          <Field label="Their account #">
            <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </Field>
        }
      />
      <DialogFooter className="flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!form.name.trim()) return toast.error("Vendor name is required.");
            updateVendor(vendor.id, form);
            toast.success("Vendor updated.");
            onClose();
          }}
        >
          Save
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete vendor?"
        body={`${vendor.name} will be removed. This is blocked if bills still point here.`}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeVendor(vendor.id);
            toast.success("Vendor deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function BankBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const bank = data.banks.find((b) => b.id === id);
  const updateBank = useFinanceStore((s) => s.updateBank);
  const removeBank = useFinanceStore((s) => s.removeBank);
  const [form, setForm] = useState({ name: "", nickname: "", accountNumber: "" });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!bank) {
      onClose();
      return;
    }
    setForm({ name: bank.name, nickname: bank.nickname, accountNumber: bank.accountNumber });
  }, [bank, onClose]);
  if (!bank) return null;

  const book = bankBookBalance(data, bank.id);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{bank.nickname}</DialogTitle>
        <DialogDescription>
          Book balance <Money amount={book} currency={data.settings.currency} className="inline" />
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Field label="Bank name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Nickname">
          <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
        </Field>
        <Field label="Account number">
          <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
        </Field>
      </div>
      <DialogFooter className="flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!form.name.trim()) return toast.error("Name the bank.");
            updateBank(bank.id, {
              name: form.name.trim(),
              nickname: form.nickname.trim() || form.name.trim(),
              accountNumber: form.accountNumber.trim() || "—",
            });
            toast.success("Bank updated.");
            onClose();
          }}
        >
          Save
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </DialogFooter>
      <ConfirmDelete
        open={deleting}
        title="Delete bank?"
        body="Removes this account if it has no checks, receipts, or other activity. Opening balance is reversed."
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            removeBank(bank.id);
            toast.success("Bank deleted.");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function JournalBody({ id, onClose }: { id: string; onClose: () => void }) {
  const data = useFinanceData();
  const entry = data.journals.find((j) => j.id === id);
  const updateJournalEntry = useFinanceStore((s) => s.updateJournalEntry);
  const [form, setForm] = useState({ date: "", description: "", amount: "" });

  useEffect(() => {
    if (!entry) {
      onClose();
      return;
    }
    setForm({
      date: entry.date,
      description: entry.description,
      amount: String(entry.lines.reduce((s, l) => s + l.debit, 0) / 100),
    });
  }, [entry, onClose]);
  if (!entry) return null;

  const canEdit =
    (entry.sourceType === "deposit" || entry.sourceType === "expense" || entry.sourceType === "transfer") &&
    entry.recon !== "reconciled";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry.description}</DialogTitle>
        <DialogDescription>
          {formatDate(entry.date)} · {entry.sourceType}
        </DialogDescription>
      </DialogHeader>
      {canEdit ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <DateInput value={form.date} onChange={(date) => setForm({ ...form, date })} />
          </Field>
          <Field label="Amount">
            <Input value={form.amount} inputMode="decimal" onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      ) : null}
      <JournalLineTable entry={entry} currency={data.settings.currency} />
      {canEdit ? (
        <DialogFooter>
          <Button
            onClick={() => {
              try {
                updateJournalEntry(entry.id, {
                  date: form.date,
                  description: form.description,
                  amount: parseAmountToCents(form.amount),
                });
                toast.success("Entry updated.");
                onClose();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save.");
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      ) : null}
    </>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

const JL_COLS = { account: 240, debit: 120, credit: 120 };

function JournalLineTable({
  entry,
  currency,
}: {
  entry: { lines: Array<{ id: string; accountId: string; debit: number; credit: number }> };
  currency: string;
}) {
  const data = useFinanceData();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-journal-line-cols", JL_COLS);
  const getters = useMemo(
    () => ({
      account: (line: (typeof entry.lines)[number]) => {
        const account = data.accounts.find((a) => a.id === line.accountId);
        return account ? `${account.code} ${account.name}` : line.accountId;
      },
      debit: (line: (typeof entry.lines)[number]) => line.debit,
      credit: (line: (typeof entry.lines)[number]) => line.credit,
    }),
    [data.accounts, entry.lines],
  );
  const sort = useEntrySort(entry.lines, "account", getters, "asc");
  function fit(id: keyof typeof JL_COLS, label: string) {
    const table = wrapRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div ref={wrapRef} className="list-grid overflow-x-auto">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(JL_COLS) as Array<keyof typeof JL_COLS>).map((id) => (
            <col key={id} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader compact label="Account" column="account" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.account} onWidth={(n) => cols.setWidth("account", n)} onFit={() => fit("account", "Account")} />
            <SortHeader compact label="Debit" column="debit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.debit} onWidth={(n) => cols.setWidth("debit", n)} onFit={() => fit("debit", "Debit")} />
            <SortHeader compact label="Credit" column="credit" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.credit} onWidth={(n) => cols.setWidth("credit", n)} onFit={() => fit("credit", "Credit")} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((line) => {
            const account = data.accounts.find((a) => a.id === line.accountId);
            return (
              <tr key={line.id} className="border-b border-border/70 last:border-0">
                <td className="py-2 text-muted-foreground" data-col="account">{account ? `${account.code} ${account.name}` : line.accountId}</td>
                <td className="py-2 text-right" data-col="debit">{line.debit ? <Money amount={line.debit} currency={currency} /> : "—"}</td>
                <td className="py-2 text-right" data-col="credit">{line.credit ? <Money amount={line.credit} currency={currency} /> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
