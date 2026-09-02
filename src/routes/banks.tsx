import { createFileRoute, Link } from "@tanstack/react-router";
import { DateInput } from "@/components/date-input";
import { ArrowLeftRight, Plus, Printer } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Field } from "@/components/field";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { RowActions } from "@/components/row-actions";
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
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { CsvButton } from "@/components/export-menu";
import { ViewToggle, useListView } from "@/components/view-toggle";
import { bankRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { bookByBankId, pendingByBankId } from "@/lib/finance/ledger";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { Bank } from "@/lib/finance/types";

export const Route = createFileRoute("/banks")({ component: BanksPage });

const BANK_COLS = {
  nickname: 140,
  name: 220,
  number: 128,
  status: 100,
  book: 128,
  pending: 128,
  actions: 52,
} as const;

const BANK_SORT = [
  { value: "nickname:asc", label: "Nickname A–Z" },
  { value: "name:asc", label: "Bank A–Z" },
  { value: "book:desc", label: "Book high–low" },
  { value: "pending:desc", label: "Pending high–low" },
];

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
  const [view, setView] = useListView("banks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
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
  const books = useMemo(() => bookByBankId(data), [data]);
  const pendingMap = useMemo(() => pendingByBankId(data), [data]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return banks.filter((b) => {
      if (statusFilter === "active" && b.archived) return false;
      if (statusFilter === "closed" && !b.archived) return false;
      if (!q) return true;
      return [b.name, b.nickname, b.accountNumber].join(" ").toLowerCase().includes(q);
    });
  }, [banks, query, statusFilter]);
  const getters = useMemo(
    () => ({
      nickname: (b: Bank) => b.nickname,
      name: (b: Bank) => b.name,
      number: (b: Bank) => b.accountNumber,
      status: (b: Bank) => (b.archived ? "Closed" : "Active"),
      book: (b: Bank) => books[b.id] ?? 0,
      pending: (b: Bank) => pendingMap[b.id] ?? 0,
    }),
    [books, pendingMap],
  );
  const sort = useEntrySort(visible, "nickname", getters, "asc");
  const sorted = sort.sorted;
  const cols = useColWidths("finance-manager-banks-cols", BANK_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  function fit(id: keyof typeof BANK_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  const printRows = sorted.map((b) => ({
    nickname: b.nickname,
    name: b.name,
    number: b.accountNumber,
    book: formatMoney(books[b.id] ?? 0, settings.currency),
    pending: formatMoney(pendingMap[b.id] ?? 0, settings.currency),
    status: b.archived ? "Closed" : "Active",
  }));

  return (
    <AppShell
      title="Banks"
      description="Balances across every account. List matches the register. Double-click a row to edit, or tap a card. Delete is in ⋯ on the list — not on every card."
      wide
      actions={
        <>
          <CsvButton filename="banks.csv" rows={bankRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button asChild variant="outline">
            <Link to="/reconcile">Reconcile</Link>
          </Button>
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
      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search bank name or account"
        label="Search banks"
      >
        <ListFilters
          selects={[
            {
              label: "Status",
              value: statusFilter,
              options: [
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "closed", label: "Closed" },
              ],
              onChange: (v) => setStatusFilter(v as typeof statusFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={BANK_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => setStatusFilter("all")}
        />
        <ViewToggle value={view} onChange={setView} />
      </ListToolbar>
      {view === "grid" ? (
      <div className="item-cards">
        {sorted.map((bank) => {
            const book = books[bank.id] ?? 0;
            const pending = pendingMap[bank.id] ?? 0;
            return (
              <button
                key={bank.id}
                type="button"
                className="item-card"
                {...openProps("bank", bank.id, { click: true })}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="block min-w-0 truncate font-medium">{bank.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {bank.archived ? "Closed" : "Active"}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {bank.nickname} · {bank.accountNumber}
                </span>
                <Money amount={book} currency={settings.currency} className="mt-auto pt-2 text-xl font-medium tabular-nums" />
                <span className="text-xs text-muted-foreground">
                  Pending <Money amount={pending} currency={settings.currency} />
                </span>
              </button>
            );
          })}
      </div>
      ) : (
        <ListCard ref={gridRef}>
          <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
            <colgroup>
              {(Object.keys(BANK_COLS) as Array<keyof typeof BANK_COLS>).map((id) => (
                <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <SortHeader label="Nickname" column="nickname" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.nickname} onWidth={(n) => cols.setWidth("nickname", n)} onFit={() => fit("nickname", "Nickname")} />
                <SortHeader label="Bank" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Bank")} />
                <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Number")} />
                <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} />
                <SortHeader label="Book" column="book" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.book} onWidth={(n) => cols.setWidth("book", n)} onFit={() => fit("book", "Book")} />
                <SortHeader label="Pending" column="pending" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.pending} onWidth={(n) => cols.setWidth("pending", n)} onFit={() => fit("pending", "Pending")} />
                <th className="col-actions px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((bank) => {
                const book = books[bank.id] ?? 0;
                const pending = pendingMap[bank.id] ?? 0;
                return (
                  <tr
                    key={bank.id}
                    className="border-b border-border/70 last:border-0"
                    {...openProps("bank", bank.id)}
                    style={bank.archived ? { opacity: 0.55 } : undefined}
                  >
                    <td className="px-4 py-3 font-medium" data-col="nickname">{bank.nickname}</td>
                    <td className="px-4 py-3 text-muted-foreground" data-col="name">{bank.name}</td>
                    <td className="px-4 py-3 text-muted-foreground" data-col="number">{bank.accountNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground" data-col="status">{bank.archived ? "Closed" : "Active"}</td>
                    <td className="px-4 py-3 text-right" data-col="book"><Money amount={book} currency={settings.currency} /></td>
                    <td className="px-4 py-3 text-right" data-col="pending"><Money amount={pending} currency={settings.currency} /></td>
                    <td className="col-actions px-4 py-3 text-right" data-col="actions" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
                      <RowActions items={[{ label: "Delete", onSelect: () => setDeletingId(bank.id), danger: true }]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ListCard>
      )}
      <ListPrint
        title="Banks"
        columns={[
          { key: "nickname", label: "Nickname" },
          { key: "name", label: "Bank" },
          { key: "number", label: "Number" },
          { key: "status", label: "Status" },
          { key: "book", label: "Book", align: "right" },
          { key: "pending", label: "Pending", align: "right" },
        ]}
        rows={printRows}
      />

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
              <DateInput value={moneyForm.date} onChange={(date) => setMoneyForm({ ...moneyForm, date })} />
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
              <DateInput value={transferForm.date} onChange={(date) => setTransferForm({ ...transferForm, date })} />
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
