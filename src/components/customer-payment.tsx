import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { DateInput } from "@/components/date-input";
import { FilterPills } from "@/components/filter-pills";
import { PartyCombo } from "@/components/party-combo";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { ReceiptBadge } from "@/components/status-badge";
import { ShopTick } from "@/components/shop-tick";
import { listColClass } from "@/components/list-table";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { allocateOldest, customerOpenBalance, invoiceBalance, invoiceTotal } from "@/lib/finance/ledger";
import { methodNeedsReference, methodRefLabel, PAYMENT_METHODS } from "@/lib/finance/methods";
import { findDuplicateCashLine } from "@/lib/finance/register";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_CUSTOMER, type FinanceData, type ReceiptMethod } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const OPEN_CAP = 80;
const APPLY_COL = 40;
const ALLOC_COLS = {
  date: 110,
  number: 108,
  orig: 112,
  due: 112,
  payment: 128,
} as const;

function centsToField(cents: number) {
  return cents ? String(cents / 100) : "";
}

function openCustomerInvoices(data: FinanceData, customerId: string, keepId?: string) {
  const rows: Array<{ id: string; date: string; number: string; due: number; orig: number }> = [];
  for (const inv of data.invoices) {
    if (inv.customerId !== customerId) continue;
    if (inv.status === "void" || inv.status === "draft") continue;
    const due = invoiceBalance(data, inv.id);
    if (due <= 0 && keepId !== inv.id) continue;
    rows.push({ id: inv.id, date: inv.date, number: inv.number, due, orig: invoiceTotal(data, inv.id) });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
  return rows.slice(0, OPEN_CAP);
}

export function CustomerPayment({
  receiptId,
  invoiceId,
  customerId: seedCustomerId,
  initialMethod = "cash",
  onClose,
  onBack,
}: {
  receiptId?: string;
  invoiceId?: string;
  customerId?: string;
  initialMethod?: ReceiptMethod;
  onClose: () => void;
  onBack?: () => void;
}) {
  const data = useFinanceData();
  const updateReceipt = useFinanceStore((s) => s.updateReceipt);
  const applyCustomerPayments = useFinanceStore((s) => s.applyCustomerPayments);
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const voidReceipt = useFinanceStore((s) => s.voidReceipt);
  const removeReceipt = useFinanceStore((s) => s.removeReceipt);
  const receipt = receiptId ? data.receipts.find((r) => r.id === receiptId) : undefined;
  const seedInvoice = invoiceId ? data.invoices.find((i) => i.id === invoiceId) : undefined;
  const customerRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [deleting, setDeleting] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", name: "", cvc: "" });
  const [form, setForm] = useState({
    customerId: "",
    receivedFrom: "",
    amount: "",
    date: todayIso(),
    bankId: data.banks.find((b) => !b.archived)?.id ?? "",
    method: initialMethod,
    checkNumber: "",
    memo: "",
  });
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [invQuery, setInvQuery] = useState("");
  const [invFilter, setInvFilter] = useState<"all" | "applied" | "open">("all");

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
    const bankId = data.banks.find((b) => !b.archived)?.id ?? "";
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
      if (receipt.invoiceId) setApplied({ [receipt.invoiceId]: String(receipt.amount / 100) });
      return;
    }
    if (seedInvoice) {
      const due = invoiceBalance(data, seedInvoice.id);
      const customer = data.customers.find((c) => c.id === seedInvoice.customerId);
      setForm({
        customerId: seedInvoice.customerId,
        receivedFrom: customer?.name ?? seedInvoice.number,
        amount: centsToField(due),
        date: todayIso(),
        bankId,
        method: initialMethod,
        checkNumber: "",
        memo: `Payment ${seedInvoice.number}`,
      });
      const map = allocateOldest(
        openCustomerInvoices(data, seedInvoice.customerId).map((row) => ({ id: row.id, due: row.due })),
        due,
      );
      const next: Record<string, string> = {};
      for (const [id, value] of Object.entries(map)) next[id] = centsToField(value);
      setApplied(next);
      return;
    }
    const customer = seedCustomerId ? data.customers.find((c) => c.id === seedCustomerId) : undefined;
    setForm({
      customerId: customer?.id ?? "",
      receivedFrom: customer?.name ?? "",
      amount: "",
      date: todayIso(),
      bankId,
      method: initialMethod,
      checkNumber: "",
      memo: "",
    });
    setApplied({});
    requestAnimationFrame(() => customerRef.current?.focus());
    // Hydrate once per document, not on every books tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt?.id, seedInvoice?.id, seedCustomerId]);

  const customerId = form.customerId;
  const customer = data.customers.find((c) => c.id === customerId);
  const openInvoices = useMemo(() => {
    if (!customerId) return [];
    return openCustomerInvoices(data, customerId, receipt?.invoiceId);
  }, [data, customerId, receipt?.invoiceId]);

  const visibleInvoices = useMemo(() => {
    const q = invQuery.trim().toLowerCase();
    return openInvoices.filter((inv) => {
      const paid = parseAmountToCents(applied[inv.id] ?? "") || 0;
      if (invFilter === "applied" && paid <= 0) return false;
      if (invFilter === "open" && paid > 0) return false;
      if (!q) return true;
      return [inv.date, inv.number].join(" ").toLowerCase().includes(q);
    });
  }, [openInvoices, invQuery, invFilter, applied]);

  const invGetters = useMemo(
    () => ({
      date: (r: (typeof openInvoices)[number]) => r.date,
      number: (r: (typeof openInvoices)[number]) => r.number,
      orig: (r: (typeof openInvoices)[number]) => r.orig,
      due: (r: (typeof openInvoices)[number]) => r.due,
      payment: (r: (typeof openInvoices)[number]) => parseAmountToCents(applied[r.id] ?? "") || 0,
    }),
    [applied],
  );
  const invSort = useEntrySort(visibleInvoices, "date", invGetters, "asc");
  const allocCols = useColWidths("finance-manager-receive-alloc-cols", ALLOC_COLS);
  const allocRef = useRef<HTMLDivElement>(null);

  const locked = receipt?.status === "void";
  const balance = customerId ? customerOpenBalance(data, customerId) : 0;
  const appliedTotal = Object.values(applied).reduce((sum, raw) => sum + (parseAmountToCents(raw) || 0), 0);
  const payAmount = parseAmountToCents(form.amount) || 0;
  const leftover = Math.max(0, payAmount - appliedTotal);
  const saleLines = receipt?.kind === "cash-sale" ? receipt.lines : [];

  function setMethod(method: ReceiptMethod) {
    setForm((prev) => ({ ...prev, method }));
    if (method === "card") setCardOpen(true);
  }

  function applyAmount(cents: number, invoices = openInvoices) {
    const map = allocateOldest(
      invoices.map((row) => ({ id: row.id, due: row.due })),
      cents,
    );
    const next: Record<string, string> = {};
    for (const [id, value] of Object.entries(map)) next[id] = centsToField(value);
    setApplied(next);
  }

  function chooseCustomer(id: string, name: string) {
    setForm((prev) => ({ ...prev, customerId: id, receivedFrom: name }));
    applyAmount(parseAmountToCents(form.amount) || 0, openCustomerInvoices(data, id));
  }

  function changeAmount(raw: string) {
    setForm((prev) => ({ ...prev, amount: raw }));
    applyAmount(parseAmountToCents(raw) || 0);
  }

  function toggleInvoice(id: string, due: number) {
    if (locked) return;
    const current = parseAmountToCents(applied[id]) || 0;
    const next = { ...applied, [id]: current > 0 ? "" : centsToField(due) };
    const total = Object.values(next).reduce((sum, raw) => sum + (parseAmountToCents(raw) || 0), 0);
    setApplied(next);
    setForm((prev) => {
      const entered = parseAmountToCents(prev.amount) || 0;
      const wasAuto = entered === 0 || entered === appliedTotal;
      return wasAuto ? { ...prev, amount: centsToField(total) } : prev;
    });
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

  function resetForNext() {
    setForm((prev) => ({ ...prev, amount: "", checkNumber: "", memo: "" }));
    setApplied({});
    requestAnimationFrame(() => {
      customerRef.current?.focus();
      customerRef.current?.select();
    });
  }

  function save() {
    if (locked) return;
    try {
      if (!form.customerId) {
        toast.error("Payee must be a registered customer. Click + Add to create.");
        customerRef.current?.focus();
        return;
      }
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
        const extra = Object.entries(applied)
          .filter(([id, raw]) => id !== receipt.invoiceId && (parseAmountToCents(raw) || 0) > 0)
          .map(([id, raw]) => ({ invoiceId: id, amount: parseAmountToCents(raw) || 0 }));
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
      const applications = Object.entries(applied)
        .map(([id, raw]) => ({ invoiceId: id, amount: parseAmountToCents(raw) || 0 }))
        .filter((row) => row.amount > 0);
      if (applications.length === 0) throw new Error("Apply this payment to at least one invoice.");
      if (payAmount > 0 && appliedTotal !== payAmount) {
        throw new Error("Apply the full amount, or lower it to what the open invoices can take.");
      }
      const dup = findDuplicateCashLine(data, {
        date: form.date,
        bankId: form.bankId,
        amount: payAmount || applications.reduce((s, a) => s + a.amount, 0),
        party: form.receivedFrom,
        kind: "payment",
      });
      applyCustomerPayments({
        date: form.date,
        bankId: form.bankId,
        memo: form.memo,
        method: form.method,
        checkNumber: form.checkNumber,
        applications,
      });
      toast.success("Payment recorded.", {
        description: dup ? "Same customer, amount, and date already on this bank. Both kept." : undefined,
      });
      resetForNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save payment.");
    }
  }

  function onFormKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea, [data-party-list]")) return;
    e.preventDefault();
    save();
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
        <p className="stat-value mb-4">
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
    <div onKeyDown={onFormKey}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-2xl font-medium tracking-tight">Receive payment</p>
          <p className="text-sm text-muted-foreground">
            {receipt
              ? receipt.number
              : "Customer, amount, date, ref. Tick invoices or type Payment. Enter posts and stays for the next one."}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="eyebrow">Customer balance</p>
          <Money amount={balance} currency={data.settings.currency} className="text-lg font-medium" />
        </div>
      </div>

      {receipt ? <ReceiptBadge status={receipt.status} kind={receipt.kind} method={form.method} /> : null}

      <div className="txn-context mt-4">
        <Field label="Date">
          <DateInput
            value={form.date}
            disabled={locked}
            tabIndex={-1}
            onChange={(date) => setForm((prev) => ({ ...prev, date }))}
          />
        </Field>
        <Field label="Deposit to">
          <Select value={form.bankId} onValueChange={(v) => setForm((prev) => ({ ...prev, bankId: v }))} disabled={locked}>
            <SelectTrigger tabIndex={-1}>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer">
          <PartyCombo
            items={data.customers}
            valueId={customerId}
            valueName={form.receivedFrom}
            disabled={locked}
            inputRef={customerRef}
            label="Customer"
            placeholder="Pick a customer"
            invalid={!form.customerId && Boolean(form.receivedFrom)}
            onChoose={chooseCustomer}
            onName={(receivedFrom) => setForm((prev) => ({ ...prev, receivedFrom, customerId: "" }))}
            onCreate={(name) => {
              const id = newId();
              addCustomer({ ...EMPTY_CUSTOMER, id, name });
              return { id, name };
            }}
          />
        </Field>
        <Field label="Payment amount">
          <Input
            ref={amountRef}
            value={form.amount}
            disabled={locked}
            inputMode="decimal"
            autoComplete="off"
            onChange={(e) => changeAmount(e.target.value)}
          />
        </Field>
        <Field label={methodRefLabel(form.method)}>
          <Input
            value={form.checkNumber}
            disabled={locked}
            placeholder={form.method === "card" ? "Last 4" : "Check / ref no."}
            autoComplete="off"
            onChange={(e) => setForm((prev) => ({ ...prev, checkNumber: e.target.value }))}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1">
          {PAYMENT_METHODS.map((opt) => {
            const Icon = opt.icon;
            const on = form.method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                tabIndex={-1}
                disabled={locked}
                onClick={() => setMethod(opt.value)}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-medium",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                {opt.short}
              </button>
            );
          })}
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

      {customerId && openInvoices.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Open invoices</p>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center no-print">
            <Input
              value={invQuery}
              onChange={(e) => setInvQuery(e.target.value)}
              placeholder="Search invoice"
              aria-label="Search open invoices"
              className="max-w-md"
            />
            <FilterPills
              className="sm:ml-auto"
              value={invFilter}
              onChange={setInvFilter}
              label="Invoice filter"
              options={[
                { id: "all", label: "All" },
                { id: "open", label: "Unapplied" },
                { id: "applied", label: "Applied" },
              ]}
            />
          </div>
          <div className="receive-alloc">
            <div ref={allocRef} className="list-grid">
              <table ref={allocCols.tableRef} className="text-sm" style={{ width: "100%" }}>
                <colgroup>
                  <col style={{ width: APPLY_COL }} />
                  {(Object.keys(ALLOC_COLS) as Array<keyof typeof ALLOC_COLS>).map((id) => (
                    <col key={id} className={listColClass(id)} style={{ width: allocCols.widths[id] }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="col-apply col-check">
                      <span className="sr-only">Apply</span>
                    </th>
                    <SortHeader
                      compact
                      label="Date"
                      column="date"
                      sortKey={invSort.key}
                      dir={invSort.dir}
                      onToggle={invSort.toggle}
                      width={allocCols.widths.date}
                      onWidth={(n) => allocCols.setWidth("date", n)}
                      onFit={() => {
                        const table = allocRef.current?.querySelector("table");
                        if (!table) return;
                        allocCols.setWidth("date", fitColumnWidth({ table, selector: `td[data-col="date"]`, header: "Date" }));
                      }}
                    />
                    <SortHeader
                      compact
                      label="Invoice no."
                      column="number"
                      sortKey={invSort.key}
                      dir={invSort.dir}
                      onToggle={invSort.toggle}
                      width={allocCols.widths.number}
                      onWidth={(n) => allocCols.setWidth("number", n)}
                      onFit={() => {
                        const table = allocRef.current?.querySelector("table");
                        if (!table) return;
                        allocCols.setWidth("number", fitColumnWidth({ table, selector: `td[data-col="number"]`, header: "Invoice no." }));
                      }}
                    />
                    <SortHeader
                      compact
                      label="Original"
                      column="orig"
                      sortKey={invSort.key}
                      dir={invSort.dir}
                      onToggle={invSort.toggle}
                      align="right"
                      width={allocCols.widths.orig}
                      onWidth={(n) => allocCols.setWidth("orig", n)}
                      onFit={() => {
                        const table = allocRef.current?.querySelector("table");
                        if (!table) return;
                        allocCols.setWidth("orig", fitColumnWidth({ table, selector: `td[data-col="orig"]`, header: "Original" }));
                      }}
                    />
                    <SortHeader
                      compact
                      label="Amt. due"
                      column="due"
                      sortKey={invSort.key}
                      dir={invSort.dir}
                      onToggle={invSort.toggle}
                      align="right"
                      width={allocCols.widths.due}
                      onWidth={(n) => allocCols.setWidth("due", n)}
                      onFit={() => {
                        const table = allocRef.current?.querySelector("table");
                        if (!table) return;
                        allocCols.setWidth("due", fitColumnWidth({ table, selector: `td[data-col="due"]`, header: "Amt. due" }));
                      }}
                    />
                    <SortHeader
                      compact
                      label="Payment"
                      column="payment"
                      sortKey={invSort.key}
                      dir={invSort.dir}
                      onToggle={invSort.toggle}
                      align="right"
                      width={allocCols.widths.payment}
                      onWidth={(n) => allocCols.setWidth("payment", n)}
                      onFit={() => {
                        const table = allocRef.current?.querySelector("table");
                        if (!table) return;
                        allocCols.setWidth("payment", fitColumnWidth({ table, selector: `td[data-col="payment"]`, header: "Payment" }));
                      }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {invSort.sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                        No invoices match.
                      </td>
                    </tr>
                  ) : (
                    invSort.sorted.map((inv, index) => {
                      const paid = parseAmountToCents(applied[inv.id] ?? "") || 0;
                      return (
                        <tr key={inv.id}>
                          <td className="col-apply col-check">
                            <ShopTick
                              checked={paid > 0}
                              onChange={() => toggleInvoice(inv.id, inv.due)}
                              label={`Apply ${inv.number}`}
                            />
                          </td>
                          <td className="whitespace-nowrap" data-col="date">{formatDate(inv.date)}</td>
                          <td className="font-medium" data-col="number">{inv.number}</td>
                          <td className="text-right" data-col="orig">
                            <Money amount={inv.orig} currency={data.settings.currency} />
                          </td>
                          <td className="text-right" data-col="due">
                            <Money amount={inv.due} currency={data.settings.currency} />
                          </td>
                          <td className="text-right col-actions" data-col="payment">
                            <Input
                              className="ml-auto h-9 min-h-9 w-28 text-right"
                              value={applied[inv.id] ?? ""}
                              disabled={locked}
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`Payment for ${inv.number}`}
                              onChange={(e) => setApplied((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                              autoFocus={false}
                              tabIndex={index === 0 ? 0 : undefined}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-right text-sm text-muted-foreground">
            Applied <Money amount={appliedTotal} currency={data.settings.currency} />
            {payAmount ? (
              <>
                {" · "}Entered <Money amount={payAmount} currency={data.settings.currency} />
              </>
            ) : null}
            {leftover > 0 ? (
              <>
                {" · "}Unapplied <Money amount={leftover} currency={data.settings.currency} />
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {customerId ? "No open invoices for this customer." : "Choose a customer to see open invoices."}
        </p>
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
    </div>
  );
}
