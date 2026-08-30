import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseAmountToCents, todayIso } from "@/lib/finance/format";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

const POST_KEY = "finance-manager-post";

type PostKind = "check" | "receipt" | "transfer";

export function RegisterPost({ defaultBankId }: { defaultBankId?: string }) {
  const data = useFinanceData();
  const issueCheck = useFinanceStore((s) => s.issueCheck);
  const createCashSale = useFinanceStore((s) => s.createCashSale);
  const transferBanks = useFinanceStore((s) => s.transferBanks);
  const banks = data.banks.filter((b) => !b.archived);
  const expense = data.accounts.find((a) => a.code === "5900") ?? data.accounts.find((a) => a.type === "expense");
  const fallbackBank = defaultBankId && banks.some((b) => b.id === defaultBankId) ? defaultBankId : (banks[0]?.id ?? "");
  const payeeRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<PostKind>("check");
  const [payee, setPayee] = useState("");
  const [bankId, setBankId] = useState(fallbackBank);
  const [toBankId, setToBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [open, setOpen] = useState(true);

  useLayoutEffect(() => {
    try {
      setOpen(localStorage.getItem(POST_KEY) !== "off");
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (fallbackBank) setBankId(fallbackBank);
  }, [fallbackBank]);

  const fromId = bankId || fallbackBank;
  const toId = toBankId && toBankId !== fromId ? toBankId : (banks.find((b) => b.id !== fromId)?.id ?? "");

  const payees = [
    ...data.customers.map((c) => c.name),
    ...data.vendors.map((v) => v.name),
  ].filter((name, i, all) => name && all.indexOf(name) === i);

  function toggle() {
    setOpen((on) => {
      const next = !on;
      try {
        localStorage.setItem(POST_KEY, next ? "on" : "off");
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  function chooseKind(next: PostKind) {
    setKind(next);
    if (next === "transfer") {
      const dest = banks.find((b) => b.id !== fromId)?.id ?? "";
      setToBankId(dest);
    }
  }

  function chooseFrom(id: string) {
    setBankId(id);
    if (kind === "transfer" && id === toBankId) {
      setToBankId(banks.find((b) => b.id !== id)?.id ?? "");
    }
  }

  function snapFocus() {
    requestAnimationFrame(() => {
      if (kind === "transfer") amountRef.current?.focus();
      else payeeRef.current?.focus();
    });
  }

  function post() {
    const dest = fromId;
    if (!dest) {
      toast.error("Select which bank this hits.");
      return;
    }
    const cents = parseAmountToCents(amount);
    if (cents <= 0) {
      toast.error("Enter an amount.");
      amountRef.current?.focus();
      return;
    }
    try {
      if (kind === "transfer") {
        if (banks.length < 2) throw new Error("Add another bank first.");
        if (!toId || toId === dest) throw new Error("Pick a different bank to receive it.");
        const fromName = banks.find((b) => b.id === dest)?.nickname ?? "bank";
        const toName = banks.find((b) => b.id === toId)?.nickname ?? "bank";
        transferBanks({ fromId: dest, toId, date, amount: cents, memo: "" });
        toast.success(`Transferred ${fromName} → ${toName}.`);
        setAmount("");
        snapFocus();
        return;
      }
      const name = payee.trim();
      if (!name) {
        toast.error("Enter a payee.");
        payeeRef.current?.focus();
        return;
      }
      if (kind === "check") {
        if (!expense) throw new Error("No expense account on the books.");
        const vendor = data.vendors.find((v) => v.name.toLowerCase() === name.toLowerCase());
        issueCheck({
          bankId: dest,
          payee: name,
          issueDate: date,
          postDate: date,
          amount: cents,
          memo: "Posted from register",
          accountId: expense.id,
          vendorId: vendor?.id,
        });
        toast.success(`Check posted to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`);
      } else {
        createCashSale({
          date,
          bankId: dest,
          receivedFrom: name,
          customerId: data.customers.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id,
          lines: [{ description: "Cash received", quantity: 1, unitPrice: cents }],
          notes: "Posted from register",
          method: "cash",
        });
        toast.success(`Receipt deposited to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`);
      }
      setPayee("");
      setAmount("");
      snapFocus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    }
  }

  return (
    <div className="register-post-well no-print">
      <button
        type="button"
        className="flex min-h-10 w-full items-center gap-2 px-1 text-left"
        aria-expanded={open}
        aria-label={open ? "Hide post" : "Add entry"}
        onClick={toggle}
      >
        <span className="eyebrow">Post</span>
        <span className="ml-auto text-sm font-medium">{open ? "Hide" : "Add entry"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open ? (
        <form
          className="mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            post();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-select-content]")) return;
            e.preventDefault();
            setPayee("");
            setAmount("");
            snapFocus();
          }}
        >
          <div className="register-post-grid">
            <div className="register-post-context" role="group" aria-label="Date and bank">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Date"
                className="register-post-date h-9 min-h-9"
              />
              <Select value={fromId} onValueChange={chooseFrom}>
                <SelectTrigger className="h-9 min-h-9" aria-label={kind === "transfer" ? "From bank" : "Bank"}>
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
            </div>
            <div className="register-post-vars" role="group" aria-label="Entry">
              {kind === "transfer" ? (
                <Select value={toId} onValueChange={setToBankId}>
                  <SelectTrigger className="register-post-payee h-9 min-h-9 w-full" aria-label="To bank">
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
              ) : (
                <>
                  <Input
                    ref={payeeRef}
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    placeholder={kind === "check" ? "Payee" : "Received from"}
                    aria-label="Payee"
                    list="register-payees"
                    autoComplete="off"
                    className="register-post-payee h-9 min-h-9"
                  />
                  <datalist id="register-payees">
                    {payees.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </>
              )}
              <Input
                ref={amountRef}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                inputMode="decimal"
                aria-label="Amount"
                className="register-post-amount h-9 min-h-9"
              />
              <Select value={kind} onValueChange={(v) => chooseKind(v as PostKind)}>
                <SelectTrigger className="h-9 min-h-9" aria-label="Entry type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="receipt">Receive</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" className="register-post-submit h-9 min-h-9">
              Post
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
