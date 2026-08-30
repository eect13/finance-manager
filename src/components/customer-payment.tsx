import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { ShopTick } from "@/components/shop-tick";
import { ReceiptBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { customerOpenBalance, invoiceBalance, invoiceTotal } from "@/lib/finance/ledger";
import { methodNeedsReference, methodRefLabel, PAYMENT_METHODS } from "@/lib/finance/methods";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { ReceiptMethod } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function CustomerPayment({
  receiptId,
  invoiceId,
  customerId: seedCustomerId,
  onClose,
  onBack,
}: {
  receiptId?: string;
  invoiceId?: string;
  customerId?: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  const data = useFinanceData();
  const updateReceipt = useFinanceStore((s) => s.updateReceipt);
  const applyCustomerPayments = useFinanceStore((s) => s.applyCustomerPayments);
  const voidReceipt = useFinanceStore((s) => s.voidReceipt);
  const removeReceipt = useFinanceStore((s) => s.removeReceipt);
  const receipt = receiptId ? data.receipts.find((r) => r.id === receiptId) : undefined;
  const seedInvoice = invoiceId ? data.invoices.find((i) => i.id === invoiceId) : undefined;

  const [deleting, setDeleting] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", name: "", cvc: "" });
  const [form, setForm] = useState({
    customerId: "",
    receivedFrom: "",
    amount: "",
    date: todayIso(),
    bankId: data.banks.find((b) => !b.archived)?.id ?? "",
    method: "cash" as ReceiptMethod,
    checkNumber: "",
    memo: "",
  });
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (receiptId && !receipt) {
      onClose();
      return;
    }
    if (invoiceId && !seedInvoice) {
      onClose();
    }
  }, [receiptId, receipt, invoiceId, seedInvoice, onClose]);

  useEffect(() => {
    if (receipt) {
      setForm({
        customerId: receipt.customerId ?? "",
        receivedFrom: receipt.receivedFrom,
        amount: String(receipt.amount / 100),
        date: receipt.date,
        bankId: receipt.bankId,
        method: receipt.method,
        checkNumber: receipt.checkNumber,
        memo: receipt.memo,
      });
      if (receipt.invoiceId) {
        setPicked([receipt.invoiceId]);
        setApplied({ [receipt.invoiceId]: String(receipt.amount / 100) });
      }
      return;
    }
    if (seedInvoice) {
      const due = invoiceBalance(data, seedInvoice.id);
      const customer = data.customers.find((c) => c.id === seedInvoice.customerId);
      setForm({
        customerId: seedInvoice.customerId,
        receivedFrom: customer?.name ?? seedInvoice.number,
        amount: String(due / 100),
        date: todayIso(),
        bankId: data.banks.find((b) => !b.archived)?.id ?? "",
        method: "cash",
        checkNumber: "",
        memo: `Payment ${seedInvoice.number}`,
      });
      setPicked([seedInvoice.id]);
      setApplied({ [seedInvoice.id]: String(due / 100) });
      return;
    }
    if (seedCustomerId) {
      const customer = data.customers.find((c) => c.id === seedCustomerId);
      if (!customer) return;
      const invoices = data.invoices.filter(
        (inv) => inv.customerId === seedCustomerId && (inv.status === "sent" || inv.status === "partial"),
      );
      const dueMap: Record<string, string> = {};
      const ids: string[] = [];
      let total = 0;
      for (const inv of invoices) {
        const due = invoiceBalance(data, inv.id);
        if (due <= 0) continue;
        dueMap[inv.id] = String(due / 100);
        ids.push(inv.id);
        total += due;
      }
      setForm({
        customerId: seedCustomerId,
        receivedFrom: customer.name,
        amount: total ? String(total / 100) : "",
        date: todayIso(),
        bankId: data.banks.find((b) => !b.archived)?.id ?? "",
        method: "cash",
        checkNumber: "",
        memo: "",
      });
      setPicked(ids);
      setApplied(dueMap);
    }
    // Hydrate once per document, not on every books tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt?.id, seedInvoice?.id, seedCustomerId]);

  const customerId = form.customerId;
  const customer = data.customers.find((c) => c.id === customerId);
  const openInvoices = useMemo(() => {
    return data.invoices
      .filter((inv) => {
        if (inv.status === "void" || inv.status === "draft") return false;
        if (customerId && inv.customerId !== customerId) return false;
        const due = invoiceBalance(data, inv.id);
        if (receipt?.invoiceId === inv.id) return true;
        return due > 0;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
  }, [data, customerId, receipt]);

  const locked = receipt?.status === "void";
  const balance = customerId ? customerOpenBalance(data, customerId) : 0;
  const appliedTotal = picked.reduce((sum, id) => sum + (parseAmountToCents(applied[id] ?? "0") || 0), 0);
  const payAmount = parseAmountToCents(form.amount) || 0;
  const saleLines = receipt?.kind === "cash-sale" ? receipt.lines : [];

  function setMethod(method: ReceiptMethod) {
    setForm((prev) => ({ ...prev, method }));
    if (method === "card") setCardOpen(true);
  }

  function chooseCustomer(id: string) {
    const next = data.customers.find((c) => c.id === id);
    setForm((prev) => ({ ...prev, customerId: id, receivedFrom: next?.name ?? prev.receivedFrom }));
    const invoices = data.invoices.filter((inv) => inv.customerId === id && (inv.status === "sent" || inv.status === "partial"));
    const dueMap: Record<string, string> = {};
    const ids: string[] = [];
    let left = parseAmountToCents(form.amount) || 0;
    for (const inv of invoices) {
      const due = invoiceBalance(data, inv.id);
      if (due <= 0 || left <= 0) continue;
      const take = Math.min(due, left);
      dueMap[inv.id] = String(take / 100);
      ids.push(inv.id);
      left -= take;
    }
    setApplied(dueMap);
    setPicked(ids);
  }

  function autoApply() {
    let left = parseAmountToCents(form.amount) || 0;
    const next: Record<string, string> = {};
    const ids: string[] = [];
    for (const inv of openInvoices) {
      const due = invoiceBalance(data, inv.id);
      if (due <= 0 || left <= 0) continue;
      const take = Math.min(due, left);
      next[inv.id] = String(take / 100);
      ids.push(inv.id);
      left -= take;
    }
    setApplied(next);
    setPicked(ids);
  }

  function toggleInvoice(id: string, on: boolean) {
    const inv = openInvoices.find((i) => i.id === id);
    if (!inv) return;
    if (!on) {
      setPicked((prev) => prev.filter((x) => x !== id));
      return;
    }
    const due = invoiceBalance(data, id);
    setPicked((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setApplied((prev) => ({ ...prev, [id]: prev[id] || String(due / 100) }));
  }

  function finishCard() {
    const digits = card.number.replace(/\D/g, "");
    if (digits.length < 4) {
      toast.error("Enter the card number, or tap Swipe card.");
      return;
    }
    const last4 = digits.slice(-4);
    setForm((prev) => ({ ...prev, method: "card", checkNumber: last4 }));
    setCardOpen(false);
    toast.success(`Card •••• ${last4} ready.`);
  }

  function save() {
    if (locked) return;
    try {
      if (form.method === "card" && !form.checkNumber) {
        setCardOpen(true);
        return;
      }
      if (methodNeedsReference(form.method) && !form.checkNumber.trim()) {
        throw new Error(`Enter the ${methodRefLabel(form.method).toLowerCase()}.`);
      }
      if (receipt) {
        updateReceipt(receipt.id, {
          date: form.date,
          receivedFrom: form.receivedFrom,
          amount: payAmount || receipt.amount,
          memo: form.memo,
          method: form.method,
          checkNumber: form.checkNumber,
          bankId: form.bankId,
        });
        const extra = picked
          .filter((id) => id !== receipt.invoiceId)
          .map((id) => ({ invoiceId: id, amount: parseAmountToCents(applied[id] ?? "0") || 0 }))
          .filter((a) => a.amount > 0);
        if (extra.length) {
          applyCustomerPayments({
            date: form.date,
            bankId: form.bankId,
            memo: form.memo,
            method: form.method,
            checkNumber: form.checkNumber,
            applications: extra,
          });
        }
        toast.success("Payment saved.");
        onClose();
        return;
      }
      const applications = picked
        .map((id) => ({ invoiceId: id, amount: parseAmountToCents(applied[id] ?? "0") || 0 }))
        .filter((a) => a.amount > 0);
      if (applications.length === 0) throw new Error("Tick at least one invoice to apply this payment.");
      applyCustomerPayments({
        date: form.date,
        bankId: form.bankId,
        memo: form.memo,
        method: form.method,
        checkNumber: form.checkNumber,
        applications,
      });
      toast.success("Payment recorded.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save payment.");
    }
  }

  if (receiptId && !receipt) return null;
  if (invoiceId && !seedInvoice) return null;

  if (cardOpen) {
    return (
      <>
        <div className="mb-4">
          <p className="font-display text-xl font-medium tracking-tight">Process credit card</p>
          <p className="text-sm text-muted-foreground">Card details stay on this screen. Only the last four digits are kept on the books.</p>
        </div>
        <p className="mb-4 text-2xl font-medium tabular-nums">
          <Money amount={payAmount || appliedTotal} currency={data.settings.currency} />
        </p>
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCard({
                number: "4242424242424242",
                exp: "12/28",
                name: form.receivedFrom || customer?.name || "",
                cvc: "",
              })
            }
          >
            Swipe card
          </Button>
          <Field label="Card number">
            <Input
              value={card.number}
              inputMode="numeric"
              autoComplete="off"
              placeholder="•••• •••• •••• ••••"
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Expiration">
              <Input value={card.exp} placeholder="MM/YY" onChange={(e) => setCard({ ...card, exp: e.target.value })} />
            </Field>
            <Field label="Security code">
              <Input
                value={card.cvc}
                inputMode="numeric"
                autoComplete="off"
                placeholder="CVC"
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Name on card">
            <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
          </Field>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setCardOpen(false)}>
            Cancel
          </Button>
          <Button onClick={finishCard}>Process payment</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">Customer payment</p>
          <p className="text-sm text-muted-foreground">
            {receipt ? receipt.number : "Apply cash, check, or card to open invoices."}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="eyebrow">Customer balance</p>
          <Money amount={balance} currency={data.settings.currency} className="text-lg font-medium" />
        </div>
      </div>

      {receipt ? <ReceiptBadge status={receipt.status} kind={receipt.kind} method={form.method} /> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Received from">
            {data.customers.length ? (
              <Select value={customerId || "walkin"} onValueChange={(v) => (v === "walkin" ? setForm({ ...form, customerId: "" }) : chooseCustomer(v))} disabled={locked}>
                <SelectTrigger>
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walkin">{form.receivedFrom || "Walk-in"}</SelectItem>
                  {data.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.receivedFrom} disabled={locked} onChange={(e) => setForm({ ...form, receivedFrom: e.target.value })} />
            )}
          </Field>
          <Field label="Payment amount">
            <Input
              value={form.amount}
              disabled={locked}
              inputMode="decimal"
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} disabled={locked} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label={methodRefLabel(form.method)}>
            <Input
              value={form.checkNumber}
              disabled={locked}
              placeholder={form.method === "card" ? "Last 4" : "Optional"}
              onChange={(e) => setForm({ ...form, checkNumber: e.target.value })}
            />
          </Field>
          <Field label="Deposit to">
            <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })} disabled={locked}>
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
          <Field label="Memo">
            <Input value={form.memo} disabled={locked} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-1 lg:w-36">
          {PAYMENT_METHODS.map((opt) => {
            const Icon = opt.icon;
            const on = form.method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={locked}
                onClick={() => setMethod(opt.value)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-medium transition-colors",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                {opt.short}
              </button>
            );
          })}
        </div>
      </div>

      {saleLines.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-muted/50">
          <table className="w-full text-sm">
            <tbody>
              {saleLines.map((line) => (
                <tr key={line.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{line.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    <Money amount={Math.round(line.quantity * line.unitPrice)} currency={data.settings.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {openInvoices.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Open invoices</p>
            {locked ? null : (
              <Button type="button" size="sm" variant="ghost" onClick={autoApply}>
                Auto apply
              </Button>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl bg-muted/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Number</th>
                  <th className="px-3 py-2 text-right font-medium">Orig.</th>
                  <th className="px-3 py-2 text-right font-medium">Due</th>
                  <th className="px-3 py-2 text-right font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {openInvoices.map((inv) => {
                  const due = invoiceBalance(data, inv.id);
                  const orig = invoiceTotal(data, inv.id);
                  const on = picked.includes(inv.id);
                  return (
                    <tr key={inv.id} className="border-t border-border/60" data-selected={on ? "true" : undefined}>
                      <td className="px-3 py-2">
                        <ShopTick
                          checked={on}
                          onChange={(next) => toggleInvoice(inv.id, next)}
                          label={`Apply to ${inv.number}`}
                        />
                      </td>
                      <td className="px-3 py-2">{formatDate(inv.date)}</td>
                      <td className="px-3 py-2 font-medium">{inv.number}</td>
                      <td className="px-3 py-2 text-right">
                        <Money amount={orig} currency={data.settings.currency} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Money amount={due} currency={data.settings.currency} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {on ? (
                          <Input
                            className="ml-auto h-9 min-h-9 w-28 text-right"
                            value={applied[inv.id] ?? ""}
                            disabled={locked}
                            inputMode="decimal"
                            onChange={(e) => setApplied((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-right text-sm text-muted-foreground">
            Applied <Money amount={appliedTotal} currency={data.settings.currency} />
            {payAmount ? (
              <>
                {" · "}Entered <Money amount={payAmount} currency={data.settings.currency} />
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No open invoices for this customer.</p>
      )}

      <DialogFooter className="mt-6 flex-wrap gap-2">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {locked ? null : (
          <Button onClick={save}>{receipt ? "Save" : "Process payment"}</Button>
        )}
        {receipt?.status === "posted" ? (
          <Button
            variant="ghost"
            onClick={() => {
              voidReceipt(receipt.id);
              toast.success("Payment voided.");
            }}
          >
            Void
          </Button>
        ) : null}
        {receipt ? (
          <Button variant="ghost" onClick={() => setDeleting(true)}>
            Delete
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
      {receipt ? (
        <ConfirmDelete
          open={deleting}
          title="Delete this payment?"
          body="Removes the ticket from the books so you can enter it again."
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            try {
              removeReceipt(receipt.id);
              toast.success("Payment deleted.");
              onClose();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not delete.");
              setDeleting(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
