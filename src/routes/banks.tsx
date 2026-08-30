import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, Landmark, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
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
import { CsvButton } from "@/components/export-menu";
import { bankRows } from "@/lib/finance/export";
import { parseAmountToCents, todayIso } from "@/lib/finance/format";
import { bankBookBalance, pendingChecksTotal } from "@/lib/finance/ledger";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/banks")({ component: BanksPage });

function BanksPage() {
  const data = useFinanceData();
  const { settings, banks, accounts } = data;
  const addBank = useFinanceStore((s) => s.addBank);
  const addDeposit = useFinanceStore((s) => s.addDeposit);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const transferBanks = useFinanceStore((s) => s.transferBanks);
  const removeBank = useFinanceStore((s) => s.removeBank);

  const [dialog, setDialog] = useState<"bank" | "money" | "transfer" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({ name: "", nickname: "", accountNumber: "", opening: "" });
  const [moneyForm, setMoneyForm] = useState({
    bankId: "",
    kind: "deposit" as "deposit" | "expense",
    amount: "",
    date: todayIso(),
    memo: "",
    accountId: "",
  });
  const [transferForm, setTransferForm] = useState({
    fromId: "",
    toId: "",
    amount: "",
    date: todayIso(),
    memo: "",
  });

  const expenseAccounts = accounts.filter((a) => a.type === "expense");
  const incomeAccounts = accounts.filter((a) => a.type === "income");

  return (
    <AppShell
      title="Banks"
      description="Balances across every account. Double-click a card to edit. Delete is blocked while the bank still has activity."
      actions={
        <>
          <CsvButton filename="banks.csv" rows={bankRows(data)} />
          <Button variant="outline" onClick={() => setDialog("transfer")}>
            <ArrowLeftRight />
            Transfer
          </Button>
          <Button variant="outline" onClick={() => setDialog("money")}>
            Record
          </Button>
          <Button onClick={() => setDialog("bank")}>
            <Plus />
            Add bank
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {banks
          .filter((b) => !b.archived)
          .map((bank) => {
            const book = bankBookBalance(data, bank.id);
            const pending = pendingChecksTotal(data, bank.id);
            return (
              <Card key={bank.id} {...openProps("bank", bank.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">{bank.name}</p>
                      <h2 className="font-display mt-1 text-2xl font-medium tracking-tight">{bank.nickname}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{bank.accountNumber}</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Landmark className="size-4" />
                    </div>
                  </div>
                  <p className="mt-6 eyebrow">Book balance</p>
                  <Money amount={book} currency={settings.currency} className="text-2xl font-medium" />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending checks</span>
                    <Money amount={pending} currency={settings.currency} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Still in bank (est.)</span>
                    <Money amount={book + pending} currency={settings.currency} />
                  </div>
                  <div className="mt-4 flex justify-end gap-1" onDoubleClick={stopOpen}>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingId(bank.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <Dialog open={dialog === "bank"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a bank</DialogTitle>
            <DialogDescription>Creates a cash account and posts the opening balance to equity.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Bank name">
              <Input value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} placeholder="BDO Unibank" />
            </Field>
            <Field label="Nickname">
              <Input value={bankForm.nickname} onChange={(e) => setBankForm({ ...bankForm, nickname: e.target.value })} placeholder="Operating" />
            </Field>
            <Field label="Account number">
              <Input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="•••• 1234" />
            </Field>
            <Field label={`Opening balance (${settings.currency})`}>
              <Input value={bankForm.opening} onChange={(e) => setBankForm({ ...bankForm, opening: e.target.value })} inputMode="decimal" placeholder="0.00" />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!bankForm.name.trim()) return toast.error("Name the bank.");
                addBank({
                  name: bankForm.name.trim(),
                  nickname: bankForm.nickname.trim() || bankForm.name.trim(),
                  accountNumber: bankForm.accountNumber.trim() || "—",
                  openingBalance: parseAmountToCents(bankForm.opening),
                });
                setBankForm({ name: "", nickname: "", accountNumber: "", opening: "" });
                setDialog(null);
                toast.success("Bank added.");
              }}
            >
              Save bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "money"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record money in or out</DialogTitle>
            <DialogDescription>Online transfers, cash deposits, and expenses that are not checks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Bank">
              <Select value={moneyForm.bankId} onValueChange={(v) => setMoneyForm({ ...moneyForm, bankId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.filter((b) => !b.archived).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={moneyForm.kind} onValueChange={(v) => setMoneyForm({ ...moneyForm, kind: v as "deposit" | "expense" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit / money in</SelectItem>
                  <SelectItem value="expense">Expense / money out</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={moneyForm.date} onChange={(e) => setMoneyForm({ ...moneyForm, date: e.target.value })} />
            </Field>
            <Field label="Amount">
              <Input value={moneyForm.amount} onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Account">
              <Select value={moneyForm.accountId} onValueChange={(v) => setMoneyForm({ ...moneyForm, accountId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {(moneyForm.kind === "deposit" ? incomeAccounts : expenseAccounts).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Memo">
              <Input value={moneyForm.memo} onChange={(e) => setMoneyForm({ ...moneyForm, memo: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                const amount = parseAmountToCents(moneyForm.amount);
                if (!moneyForm.bankId || amount <= 0) return toast.error("Bank and amount are required.");
                try {
                  if (moneyForm.kind === "deposit") {
                    addDeposit({
                      bankId: moneyForm.bankId,
                      date: moneyForm.date,
                      amount,
                      memo: moneyForm.memo,
                      accountId: moneyForm.accountId || undefined,
                    });
                  } else {
                    if (!moneyForm.accountId) return toast.error("Pick an expense account.");
                    addExpense({
                      bankId: moneyForm.bankId,
                      date: moneyForm.date,
                      amount,
                      memo: moneyForm.memo,
                      accountId: moneyForm.accountId,
                    });
                  }
                  setDialog(null);
                  toast.success("Posted to the books.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not post.");
                }
              }}
            >
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "transfer"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer between banks</DialogTitle>
            <DialogDescription>Moves cash on the books. No income or expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="From">
              <Select value={transferForm.fromId} onValueChange={(v) => setTransferForm({ ...transferForm, fromId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Source bank" />
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
            <Field label="To">
              <Select value={transferForm.toId} onValueChange={(v) => setTransferForm({ ...transferForm, toId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination bank" />
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
            <Field label="Date">
              <Input type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
            </Field>
            <Field label="Amount">
              <Input value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} inputMode="decimal" />
            </Field>
            <Field label="Memo">
              <Input value={transferForm.memo} onChange={(e) => setTransferForm({ ...transferForm, memo: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  transferBanks({
                    fromId: transferForm.fromId,
                    toId: transferForm.toId,
                    date: transferForm.date,
                    amount: parseAmountToCents(transferForm.amount),
                    memo: transferForm.memo,
                  });
                  setDialog(null);
                  toast.success("Transfer posted.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not transfer.");
                }
              }}
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deletingId)}
        title="Delete bank?"
        body="Removes this account if it has no checks, receipts, or other activity. Opening balance is reversed."
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (!deletingId) return;
          try {
            removeBank(deletingId);
            toast.success("Bank deleted.");
            setDeletingId(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeletingId(null);
          }
        }}
      />
    </AppShell>
  );
}
