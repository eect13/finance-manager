import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CustomerPayment } from "@/components/customer-payment";
import { DateInput } from "@/components/date-input";
import { Field } from "@/components/field";
import { PartyCombo } from "@/components/party-combo";
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
import { parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { billBalance } from "@/lib/finance/ledger";
import { findDuplicateCashLine, type CashLine, type CashLineKind } from "@/lib/finance/register";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_CUSTOMER, EMPTY_VENDOR } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

type PostKind = "check" | "cash-sale" | "receive" | "transfer" | "vendor-pay" | "deposit" | "expense";

const KINDS: Array<{ id: PostKind; label: string }> = [
  { id: "check", label: "Check" },
  { id: "cash-sale", label: "Cash sale" },
  { id: "receive", label: "Receive payment" },
  { id: "transfer", label: "Transfer" },
  { id: "vendor-pay", label: "Vendor pay" },
  { id: "deposit", label: "Deposit" },
  { id: "expense", label: "Expense" },
];

const KIND_KEY = "finance-manager-post-kind";
const DATE_KEY = "finance-manager-post-date";

function readLastKind(): PostKind {
  try {
    const raw = localStorage.getItem(KIND_KEY);
    if (KINDS.some((k) => k.id === raw)) return raw as PostKind;
  } catch {
    /* private mode */
  }
  return "check";
}

function rememberKind(next: PostKind) {
  try {
    localStorage.setItem(KIND_KEY, next);
  } catch {
    /* quota */
  }
}

function readLastDate(): string {
  try {
    const raw = localStorage.getItem(DATE_KEY);
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  } catch {
    /* private mode */
  }
  return todayIso();
}

function rememberDate(iso: string) {
  try {
    localStorage.setItem(DATE_KEY, iso);
  } catch {
    /* quota */
  }
}

function kindFromLine(line: CashLine): PostKind | null {
  if (line.kind === "check") return "check";
  if (line.kind === "receipt") return "cash-sale";
  if (line.kind === "payment") return "receive";
  if (line.kind === "transfer") return "transfer";
  if (line.kind === "bill-payment") return "vendor-pay";
  if (line.kind === "deposit") return "deposit";
  if (line.kind === "expense") return "expense";
  return null;
}

function lineKindForPost(kind: PostKind): CashLineKind | undefined {
  if (kind === "check") return "check";
  if (kind === "cash-sale") return "receipt";
  if (kind === "receive") return "payment";
  if (kind === "transfer") return "transfer";
  if (kind === "vendor-pay") return "bill-payment";
  if (kind === "deposit") return "deposit";
  if (kind === "expense") return "expense";
  return undefined;
}

function notePosted(message: string, dup: CashLine | undefined) {
  if (dup) {
    toast.success(message, { description: "Same payee, amount, and date already on this bank. Both kept." });
  } else {
    toast.success(message);
  }
}

export function RegisterPost({
  defaultBankId,
  edit,
  onClearEdit,
}: {
  defaultBankId?: string;
  edit?: CashLine | null;
  onClearEdit?: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const open = createOpen || Boolean(edit);
  return (
    <>
      <Button onClick={() => setCreateOpen(true)}>Post</Button>
      <PostDialog
        open={open}
        onClose={() => {
          setCreateOpen(false);
          onClearEdit?.();
        }}
        defaultBankId={defaultBankId}
        edit={edit ?? null}
      />
    </>
  );
}

function PostDialog({
  open,
  onClose,
  defaultBankId,
  edit,
}: {
  open: boolean;
  onClose: () => void;
  defaultBankId?: string;
  edit: CashLine | null;
}) {
  const data = useFinanceData();
  const issueCheck = useFinanceStore((s) => s.issueCheck);
  const createCashSale = useFinanceStore((s) => s.createCashSale);
  const transferBanks = useFinanceStore((s) => s.transferBanks);
  const payBill = useFinanceStore((s) => s.payBill);
  const addDeposit = useFinanceStore((s) => s.addDeposit);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const addVendor = useFinanceStore((s) => s.addVendor);
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const updateCheck = useFinanceStore((s) => s.updateCheck);
  const updateReceipt = useFinanceStore((s) => s.updateReceipt);
  const updateJournalEntry = useFinanceStore((s) => s.updateJournalEntry);
  const banks = data.banks.filter((b) => !b.archived);
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
  const expenseDefault = data.accounts.find((a) => a.code === "5900") ?? expenseAccounts[0];
  const fallbackBank = defaultBankId && banks.some((b) => b.id === defaultBankId) ? defaultBankId : (banks[0]?.id ?? "");
  const payeeRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const flashRef = useRef(0);
  const focusDateAfterSave = useRef(false);
  const [posted, setPosted] = useState(false);

  const [kind, setKind] = useState<PostKind>(readLastKind);
  const [payee, setPayee] = useState("");
  const [bankId, setBankId] = useState(fallbackBank);
  const [toBankId, setToBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(readLastDate);
  const [vendorId, setVendorId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [billId, setBillId] = useState("");
  const [partyError, setPartyError] = useState(false);
  const [accountId, setAccountId] = useState(expenseDefault?.id ?? "");
  const [memo, setMemo] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [docNumber, setDocNumber] = useState("");

  const editing = Boolean(edit);
  const locked = edit?.recon === "reconciled";

  useEffect(() => {
    if (fallbackBank && !edit) setBankId(fallbackBank);
  }, [fallbackBank, edit]);

  useEffect(() => {
    if (!open) return;
    if (edit) {
      const nextKind = kindFromLine(edit);
      if (nextKind) setKind(nextKind);
      setPayee(edit.kind === "deposit" || edit.kind === "transfer" ? "" : edit.party);
      setAmount(String((edit.payment || edit.deposit) / 100));
      setDate(edit.date);
      setBankId(edit.bankId);
      setMemo(edit.memo);
      setCheckNumber("");
      setDocNumber("");
      if (edit.kind === "check") {
        const check = data.checks.find((c) => c.id === edit.sourceId);
        if (check) {
          setPayee(check.payee);
          setAmount(String(check.amount / 100));
          setMemo(check.memo);
          setAccountId(check.accountId);
          setVendorId(check.vendorId ?? "");
          setCheckNumber(check.checkNumber);
          setDocNumber("");
        }
      }
      if (edit.kind === "receipt") {
        const receipt = data.receipts.find((r) => r.id === edit.sourceId);
        if (receipt) {
          setPayee(receipt.receivedFrom);
          setAmount(String(receipt.amount / 100));
          setMemo(receipt.memo);
          setCustomerId(receipt.customerId ?? "");
          setDocNumber(receipt.number);
          setCheckNumber(receipt.checkNumber ?? "");
        }
      }
      if (edit.kind === "transfer" || edit.kind === "deposit" || edit.kind === "expense") {
        const journal = data.journals.find((j) => j.id === edit.sourceId);
        if (journal) {
          setMemo(journal.description);
          let from = edit.bankId;
          let to = "";
          for (const line of journal.lines) {
            const account = data.accounts.find((a) => a.id === line.accountId);
            if (!account?.bankId) continue;
            if (line.credit > 0) from = account.bankId;
            if (line.debit > 0 && journal.sourceType === "transfer") to = account.bankId;
            if (journal.sourceType === "expense" && !account.bankId) setAccountId(account.id);
          }
          setBankId(from);
          if (to) setToBankId(to);
        }
      }
    } else {
      setDate(readLastDate());
      if (fallbackBank) setBankId(fallbackBank);
      setCheckNumber("");
      setDocNumber("");
    }
    requestAnimationFrame(() => {
      const next = edit ? kindFromLine(edit) : kind;
      if (next === "receive") return;
      if (edit) amountRef.current?.focus();
      else dateRef.current?.focus();
    });
    // Hydrate once per open/edit, not on every books tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id]);

  const fromId = bankId || fallbackBank;
  const toId = toBankId && toBankId !== fromId ? toBankId : (banks.find((b) => b.id !== fromId)?.id ?? "");

  const openBills = useMemo(() => {
    if (!vendorId) return [];
    return data.bills
      .filter((b) => b.vendorId === vendorId && b.status !== "void" && b.status !== "paid")
      .map((b) => ({ id: b.id, number: b.number, date: b.date, due: billBalance(b) }))
      .filter((b) => b.due > 0)
      .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
  }, [data.bills, vendorId]);

  useEffect(() => {
    if (!openBills.some((b) => b.id === billId)) setBillId(openBills[0]?.id ?? "");
  }, [openBills, billId]);

  function chooseKind(next: PostKind) {
    setKind(next);
    rememberKind(next);
    if (next === "transfer") {
      setToBankId(banks.find((b) => b.id !== fromId)?.id ?? "");
    }
  }

  function TypeField({ disabled }: { disabled?: boolean }) {
    return (
      <Field label="Type">
        <Select value={kind} onValueChange={(v) => chooseKind(v as PostKind)} disabled={disabled}>
          <SelectTrigger tabIndex={-1} aria-label="Type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }

  function chooseFrom(id: string) {
    setBankId(id);
    if (kind === "transfer" && id === toBankId) {
      setToBankId(banks.find((b) => b.id !== id)?.id ?? "");
    }
  }

  function resetLine() {
    setPayee("");
    setAmount("");
    setMemo("");
    setVendorId("");
    setCustomerId("");
    setBillId("");
    setPartyError(false);
    setCheckNumber("");
    setDocNumber("");
  }

  function finishPost() {
    setPosted(true);
    window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => {
      focusDateAfterSave.current = true;
      setPosted(false);
      resetLine();
    }, 600);
  }

  useLayoutEffect(() => {
    if (!focusDateAfterSave.current || posted) return;
    focusDateAfterSave.current = false;
    dateRef.current?.focus();
  }, [posted]);

  useEffect(() => {
    return () => window.clearTimeout(flashRef.current);
  }, []);

  function post() {
    if (locked || posted) return;
    const dest = fromId;
    if (!dest) {
      toast.error("Select which bank this hits.");
      return;
    }
    const cents = parseAmountToCents(amount);
    if (kind !== "receive" && cents <= 0) {
      toast.error("Enter an amount.");
      amountRef.current?.focus();
      return;
    }
    try {
      if (edit) {
        if (edit.kind === "check") {
          updateCheck(edit.sourceId, {
            payee: payee.trim(),
            amount: cents,
            issueDate: date,
            postDate: date,
            memo: memo.trim(),
            bankId: dest,
            accountId: accountId || expenseDefault?.id,
            checkNumber: checkNumber.trim(),
          });
          toast.success("Check saved.");
        } else if (edit.kind === "receipt") {
          updateReceipt(edit.sourceId, {
            receivedFrom: payee.trim() || edit.party,
            amount: cents,
            date,
            memo: memo.trim(),
            bankId: dest,
            checkNumber: checkNumber.trim(),
          });
          toast.success("Cash sale saved.");
        } else if (edit.kind === "transfer" || edit.kind === "deposit" || edit.kind === "expense") {
          updateJournalEntry(edit.sourceId, {
            date,
            amount: cents,
            description: memo.trim() || payee.trim() || edit.party,
          });
          toast.success("Entry saved.");
        }
        rememberDate(date);
        onClose();
        return;
      }
      const dup = findDuplicateCashLine(data, {
        date,
        bankId: dest,
        amount: cents,
        party: kind === "transfer" || kind === "deposit" || kind === "vendor-pay" ? undefined : payee,
        kind: lineKindForPost(kind),
      });
      rememberKind(kind);
      rememberDate(date);
      if (kind === "transfer") {
        if (banks.length < 2) throw new Error("Add another bank first.");
        if (!toId || toId === dest) throw new Error("Pick a different bank to receive it.");
        const fromName = banks.find((b) => b.id === dest)?.nickname ?? "bank";
        const toName = banks.find((b) => b.id === toId)?.nickname ?? "bank";
        transferBanks({ fromId: dest, toId, date, amount: cents, memo: memo.trim() });
        notePosted(`Transferred ${fromName} → ${toName}.`, dup);
        finishPost();
        return;
      }
      if (kind === "deposit") {
        addDeposit({ bankId: dest, date, amount: cents, memo: memo.trim() || payee.trim() });
        notePosted(`Deposit posted to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`, dup);
        finishPost();
        return;
      }
      if (kind === "expense") {
        if (!vendorId) {
          setPartyError(true);
          toast.error("Payee must be a registered vendor. Click + Add to create.");
          payeeRef.current?.focus();
          return;
        }
        if (!accountId) throw new Error("Pick an expense account.");
        const vendor = data.vendors.find((v) => v.id === vendorId);
        addExpense({
          bankId: dest,
          date,
          amount: cents,
          accountId,
          memo: memo.trim() || vendor?.name || "Expense",
        });
        notePosted("Expense posted.", dup);
        finishPost();
        return;
      }
      if (kind === "vendor-pay") {
        if (!vendorId) {
          setPartyError(true);
          toast.error("Payee must be a registered vendor. Click + Add to create.");
          payeeRef.current?.focus();
          return;
        }
        if (!billId) throw new Error("Pick an open bill.");
        payBill({ billId, date, amount: cents, bankId: dest });
        notePosted("Vendor payment posted.", dup);
        finishPost();
        return;
      }
      const name = payee.trim();
      if (kind === "check") {
        if (!vendorId) {
          setPartyError(true);
          toast.error("Payee must be a registered vendor. Click + Add to create.");
          payeeRef.current?.focus();
          return;
        }
        if (!expenseDefault) throw new Error("No expense account on the books.");
        const vendor = data.vendors.find((v) => v.id === vendorId);
        if (!vendor) {
          setPartyError(true);
          toast.error("Payee must be a registered vendor. Click + Add to create.");
          payeeRef.current?.focus();
          return;
        }
        issueCheck({
          bankId: dest,
          payee: vendor.name,
          issueDate: date,
          postDate: date,
          amount: cents,
          memo: memo.trim() || "Posted from register",
          accountId: expenseDefault.id,
          vendorId: vendor.id,
          checkNumber: checkNumber.trim() || undefined,
        });
        notePosted(`Check posted to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`, dup);
      } else {
        const customer = data.customers.find((c) => c.id === customerId);
        if (!customer) {
          setPartyError(true);
          toast.error("Payee must be a registered customer. Click + Add to create.");
          payeeRef.current?.focus();
          return;
        }
        createCashSale({
          date,
          bankId: dest,
          receivedFrom: customer.name,
          customerId: customer.id,
          lines: [{ description: memo.trim() || "Cash received", quantity: 1, unitPrice: cents }],
          notes: "Posted from register",
          method: "cash",
        });
        notePosted(`Cash sale deposited to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`, dup);
      }
      finishPost();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    }
  }

  const receive = kind === "receive";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={receive ? "max-w-3xl max-h-[90vh] overflow-y-auto" : "max-w-lg"}>
        {receive ? (
          <>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Post"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Same window as Post. Save writes this line."
                  : "Date and bank stay put. Tab skips them. Payee, amount, memo, Enter."}
              </DialogDescription>
            </DialogHeader>
            {editing ? <TypeField disabled /> : <TypeField />}
            <div className="mt-4">
              <CustomerPayment
                receiptId={edit?.kind === "payment" ? edit.sourceId : undefined}
                onClose={onClose}
              />
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              const target = e.target as HTMLElement | null;
              if (target?.closest("[data-radix-select-content]")) return;
              e.preventDefault();
              onClose();
            }}
          >
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Post"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Same window as Post. Save writes this line."
                  : "Date, payee, amount, memo, bank. Type remembers the last one. Enter posts — the window stays open."}
              </DialogDescription>
            </DialogHeader>
            <fieldset disabled={posted} className={cn("min-w-0", posted && "pointer-events-none opacity-80")}>
            <TypeField disabled={editing} />
            <div className="mt-3 grid gap-3">
              <Field label="Date">
                <DateInput inputRef={dateRef} value={date} disabled={locked} onChange={setDate} aria-label="Date" />
              </Field>
              {kind === "check" ? (
                <Field label="Check #">
                  <Input
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Auto if blank"
                    inputMode="numeric"
                    aria-label="Check number"
                    disabled={locked}
                    className="tabular-nums"
                  />
                </Field>
              ) : null}
              {kind === "cash-sale" && editing && docNumber ? (
                <Field label="No.">
                  <Input value={docNumber} readOnly disabled aria-label="Receipt number" className="tabular-nums" />
                </Field>
              ) : null}
              {kind === "cash-sale" && editing ? (
                <Field label="Ref">
                  <Input
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Optional check / card ref"
                    aria-label="Reference"
                    disabled={locked}
                    className="tabular-nums"
                  />
                </Field>
              ) : null}
              {kind === "vendor-pay" ? (
                <>
                  <Field label="Vendor">
                  <PartyCombo
                      items={data.vendors.map((v) => ({ id: v.id, name: v.name }))}
                      valueId={vendorId}
                      valueName={data.vendors.find((v) => v.id === vendorId)?.name ?? ""}
                      label="Vendor"
                      placeholder="Type a vendor"
                      inputRef={payeeRef}
                      invalid={partyError && !vendorId}
                      onChoose={(id) => {
                        setVendorId(id);
                        setPartyError(false);
                      }}
                      onCreate={(name) => {
                        const id = newId();
                        addVendor({ ...EMPTY_VENDOR, id, name });
                        return { id, name };
                      }}
                    />
                  </Field>
                  <Field label="Bill">
                    <Select value={billId} onValueChange={setBillId} disabled={openBills.length === 0}>
                      <SelectTrigger aria-label="Open bill">
                        <SelectValue placeholder={vendorId ? "No open bills" : "Pick a vendor first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {openBills.map((bill) => (
                          <SelectItem key={bill.id} value={bill.id}>
                            {bill.number} · {(bill.due / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : kind === "deposit" ? (
                <Field label="Memo">
                  <Input
                    ref={payeeRef}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Optional memo"
                    aria-label="Memo"
                  />
                </Field>
              ) : (
                <Field label={kind === "check" || kind === "expense" ? "Payee" : "Received from"}>
                  <PartyCombo
                    items={
                      kind === "cash-sale"
                        ? data.customers.map((c) => ({ id: c.id, name: c.name }))
                        : data.vendors.map((v) => ({ id: v.id, name: v.name }))
                    }
                    valueId={kind === "cash-sale" ? customerId : vendorId}
                    valueName={
                      kind === "cash-sale"
                        ? (data.customers.find((c) => c.id === customerId)?.name ?? payee)
                        : (data.vendors.find((v) => v.id === vendorId)?.name ?? payee)
                    }
                    inputRef={payeeRef}
                    invalid={partyError && (kind === "cash-sale" ? !customerId : !vendorId)}
                    label={kind === "check" || kind === "expense" ? "Payee" : "Received from"}
                    placeholder="Pick from the list"
                    onChoose={(id, name) => {
                      setPayee(name);
                      setPartyError(false);
                      if (kind === "cash-sale") setCustomerId(id);
                      else setVendorId(id);
                    }}
                    onName={() => {
                      setPayee("");
                      setVendorId("");
                      setCustomerId("");
                    }}
                    onCreate={(name) => {
                      const id = newId();
                      if (kind === "cash-sale") {
                        addCustomer({ ...EMPTY_CUSTOMER, id, name });
                        setCustomerId(id);
                      } else {
                        addVendor({ ...EMPTY_VENDOR, id, name });
                        setVendorId(id);
                      }
                      setPayee(name);
                      return { id, name };
                    }}
                  />
                </Field>
              )}
              {kind === "expense" ? (
                <Field label="Account">
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger aria-label="Expense account">
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
              <Field label="Amount">
                <Input
                  ref={amountRef}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  inputMode="decimal"
                  aria-label="Amount"
                  disabled={locked}
                />
              </Field>
              {kind === "deposit" ? null : (
                <Field label="Memo">
                  <Input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Optional memo"
                    aria-label="Memo"
                    disabled={locked}
                  />
                </Field>
              )}
              <Field label={kind === "transfer" ? "From bank" : "Bank"}>
                <Select value={fromId} onValueChange={chooseFrom} disabled={locked}>
                  <SelectTrigger aria-label={kind === "transfer" ? "From bank" : "Bank"}>
                    <SelectValue placeholder={kind === "transfer" ? "From" : "Bank"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nickname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {kind === "transfer" ? (
                <Field label="To bank">
                  <Select value={toId} onValueChange={setToBankId}>
                    <SelectTrigger aria-label="To bank">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks
                        .filter((b) => b.id !== fromId)
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nickname}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
            </div>
            </fieldset>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={posted}>
                Close
              </Button>
              {locked ? null : (
                <Button type="submit" disabled={posted} className={posted ? "bg-credit text-primary-foreground hover:bg-credit" : undefined}>
                  {posted ? "Saved" : editing ? "Save" : "Post"}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
