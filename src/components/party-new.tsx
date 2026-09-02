import { useEffect, useState } from "react";
import { DateInput } from "@/components/date-input";
import { toast } from "sonner";
import { CustomerPayment } from "@/components/customer-payment";
import { EntryLines, type DraftLine } from "@/components/entry-lines";
import { Field } from "@/components/field";
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
import { addDaysIso, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { methodNeedsReference, methodRefLabel } from "@/lib/finance/methods";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { ReceiptMethod } from "@/lib/finance/types";

export type CustomerCreateKind = "invoice" | "receive" | "cash-sale";
export type VendorCreateKind = "bill" | "check";

export function CustomerCreateDialog({
  customerId,
  kind,
  onClose,
}: {
  customerId: string;
  kind: CustomerCreateKind | null;
  onClose: () => void;
}) {
  return (
    <>
      <PartyInvoiceDialog customerId={customerId} open={kind === "invoice"} onClose={onClose} />
      <Dialog open={kind === "receive"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Receive payment</DialogTitle>
          {kind === "receive" ? <CustomerPayment customerId={customerId} onClose={onClose} /> : null}
        </DialogContent>
      </Dialog>
      <PartyCashSaleDialog customerId={customerId} open={kind === "cash-sale"} onClose={onClose} />
    </>
  );
}

export function VendorCreateDialog({
  vendorId,
  kind,
  onClose,
}: {
  vendorId: string;
  kind: VendorCreateKind | null;
  onClose: () => void;
}) {
  return (
    <>
      <PartyBillDialog vendorId={vendorId} open={kind === "bill"} onClose={onClose} />
      <PartyCheckDialog vendorId={vendorId} open={kind === "check"} onClose={onClose} />
    </>
  );
}

function PartyInvoiceDialog({
  customerId,
  open,
  onClose,
}: {
  customerId: string;
  open: boolean;
  onClose: () => void;
}) {
  const data = useFinanceData();
  const createInvoice = useFinanceStore((s) => s.createInvoice);
  const customer = data.customers.find((c) => c.id === customerId);
  const [form, setForm] = useState({
    date: todayIso(),
    dueDate: addDaysIso(todayIso(), 30),
    notes: "",
    taxRate: String(data.settings.defaultTaxRate),
    lines: [{ description: "", quantity: "1", unitPrice: "" }] as DraftLine[],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      date: todayIso(),
      dueDate: addDaysIso(todayIso(), 30),
      notes: "",
      taxRate: String(data.settings.defaultTaxRate),
      lines: [{ description: "", quantity: "1", unitPrice: "" }],
    });
  }, [open, data.settings.defaultTaxRate]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice {customer?.name ?? "customer"}</DialogTitle>
          <DialogDescription>Posts accounts receivable and income when you save.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
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
            dragEnabled={data.settings.dragDropEnabled}
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
                  customerId,
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
                onClose();
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
  );
}

function PartyCashSaleDialog({
  customerId,
  open,
  onClose,
}: {
  customerId: string;
  open: boolean;
  onClose: () => void;
}) {
  const data = useFinanceData();
  const createCashSale = useFinanceStore((s) => s.createCashSale);
  const customer = data.customers.find((c) => c.id === customerId);
  const defaultBank = data.banks.find((b) => !b.archived)?.id ?? "";
  const [form, setForm] = useState({
    date: todayIso(),
    bankId: defaultBank,
    notes: "",
    taxRate: String(data.settings.defaultTaxRate),
    method: "cash" as ReceiptMethod,
    checkNumber: "",
    lines: [{ description: "", quantity: "1", unitPrice: "" }] as DraftLine[],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      date: todayIso(),
      bankId: defaultBank,
      notes: "",
      taxRate: String(data.settings.defaultTaxRate),
      method: "cash",
      checkNumber: "",
      lines: [{ description: "", quantity: "1", unitPrice: "" }],
    });
  }, [open, defaultBank, data.settings.defaultTaxRate]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cash sale — {customer?.name ?? "customer"}</DialogTitle>
          <DialogDescription>Debits the bank and credits income. Does not change the open balance.</DialogDescription>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tender">
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as ReceiptMethod })}>
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
            {methodNeedsReference(form.method) ? (
              <Field label={methodRefLabel(form.method)}>
                <Input value={form.checkNumber} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} />
              </Field>
            ) : null}
          </div>
          {data.settings.taxEnabled ? (
            <Field label="Tax %">
              <Input value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} inputMode="decimal" />
            </Field>
          ) : null}
          <EntryLines
            lines={form.lines}
            onChange={(lines) => setForm({ ...form, lines })}
            dragEnabled={data.settings.dragDropEnabled}
          />
          <Field label="Memo">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              try {
                createCashSale({
                  date: form.date,
                  bankId: form.bankId,
                  customerId,
                  receivedFrom: customer?.name ?? "",
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
                onClose();
                toast.success("Cash sale posted.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not post sale.");
              }
            }}
          >
            Save sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartyBillDialog({
  vendorId,
  open,
  onClose,
}: {
  vendorId: string;
  open: boolean;
  onClose: () => void;
}) {
  const data = useFinanceData();
  const createBill = useFinanceStore((s) => s.createBill);
  const vendor = data.vendors.find((v) => v.id === vendorId);
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
  const defaultExpense = expenseAccounts[0]?.id ?? "";
  const [form, setForm] = useState({
    date: todayIso(),
    dueDate: addDaysIso(todayIso(), 15),
    amount: "",
    accountId: defaultExpense,
    memo: "",
    reference: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      date: todayIso(),
      dueDate: addDaysIso(todayIso(), 15),
      amount: "",
      accountId: defaultExpense,
      memo: "",
      reference: "",
    });
  }, [open, defaultExpense]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bill from {vendor?.name ?? "vendor"}</DialogTitle>
          <DialogDescription>Posts expense and accounts payable when you save.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bill date">
              <DateInput value={form.date} onChange={(date) => setForm({ ...form, date })} />
            </Field>
            <Field label="Due date">
              <DateInput value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
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
                  vendorId,
                  date: form.date,
                  dueDate: form.dueDate,
                  amount: parseAmountToCents(form.amount),
                  accountId: form.accountId,
                  memo: form.memo,
                  reference: form.reference,
                });
                onClose();
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
  );
}

function PartyCheckDialog({
  vendorId,
  open,
  onClose,
}: {
  vendorId: string;
  open: boolean;
  onClose: () => void;
}) {
  const data = useFinanceData();
  const issueCheck = useFinanceStore((s) => s.issueCheck);
  const vendor = data.vendors.find((v) => v.id === vendorId);
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
  const defaultBank = data.banks.find((b) => !b.archived)?.id ?? "";
  const defaultExpense = expenseAccounts[0]?.id ?? "";
  const [form, setForm] = useState({
    bankId: defaultBank,
    checkNumber: "",
    issueDate: todayIso(),
    postDate: todayIso(),
    amount: "",
    memo: "",
    accountId: defaultExpense,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      bankId: defaultBank,
      checkNumber: "",
      issueDate: todayIso(),
      postDate: todayIso(),
      amount: "",
      memo: "",
      accountId: defaultExpense,
    });
  }, [open, defaultBank, defaultExpense]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check to {vendor?.name ?? "vendor"}</DialogTitle>
          <DialogDescription>Posts the expense immediately. Status stays pending until you clear it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Bank">
            <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bank" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check number">
              <Input
                value={form.checkNumber}
                onChange={(e) => setForm({ ...form, checkNumber: e.target.value })}
                placeholder="Auto if blank"
              />
            </Field>
            <Field label="Amount">
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issue date">
              <DateInput value={form.issueDate} onChange={(issueDate) => setForm({ ...form, issueDate })} />
            </Field>
            <Field label="Post date">
              <DateInput value={form.postDate} onChange={(postDate) => setForm({ ...form, postDate })} />
            </Field>
          </div>
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
          <Field label="Memo">
            <Input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              try {
                issueCheck({
                  bankId: form.bankId,
                  checkNumber: form.checkNumber,
                  payee: vendor?.name ?? "",
                  issueDate: form.issueDate,
                  postDate: form.postDate,
                  amount: parseAmountToCents(form.amount),
                  memo: form.memo,
                  accountId: form.accountId,
                  vendorId,
                });
                onClose();
                toast.success("Check issued.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not issue check.");
              }
            }}
          >
            Issue check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
