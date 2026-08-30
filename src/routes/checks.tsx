import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { CheckBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { checkRegisterRows } from "@/lib/finance/export";
import { formatDate, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { openProps, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { CheckRecord } from "@/lib/finance/types";

export const Route = createFileRoute("/checks")({ component: ChecksPage });

function ChecksPage() {
  const data = useFinanceData();
  const issueCheck = useFinanceStore((s) => s.issueCheck);
  const setCheckStatus = useFinanceStore((s) => s.setCheckStatus);
  const removeCheck = useFinanceStore((s) => s.removeCheck);
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");

  const [open, setOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<CheckRecord | null>(null);
  const [form, setForm] = useState({
    bankId: "",
    checkNumber: "",
    payee: "",
    vendorId: "",
    issueDate: todayIso(),
    postDate: todayIso(),
    amount: "",
    memo: "",
    accountId: expenseAccounts[0]?.id ?? "",
  });

  const filtered = useMemo(() => {
    return data.checks
      .filter((c) => (bankFilter === "all" ? true : c.bankId === bankFilter))
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter));
  }, [data.checks, bankFilter, statusFilter]);

  const getters = useMemo(
    () => ({
      number: (c: CheckRecord) => c.checkNumber,
      payee: (c: CheckRecord) => c.payee,
      bank: (c: CheckRecord) => data.banks.find((b) => b.id === c.bankId)?.nickname ?? "",
      issued: (c: CheckRecord) => c.issueDate,
      post: (c: CheckRecord) => c.postDate,
      amount: (c: CheckRecord) => c.amount,
      status: (c: CheckRecord) => c.status,
    }),
    [data.banks],
  );
  const sort = useEntrySort(filtered, "issued", getters, "desc");

  return (
    <AppShell
      title="Check register"
      description="Issue, post-date, clear, void, or bounce. Pending checks stay visible until they hit the bank."
      actions={
        <>
          <CsvButton filename="check-register.csv" rows={checkRegisterRows(data)} />
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Issue check
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All banks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All banks</SelectItem>
            {data.banks.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nickname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card elevation">
        <table className="w-full min-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Check" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Payee" column="payee" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Issued" column="issued" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader label="Post" column="post" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              <SortHeader
                label="Amount"
                column="amount"
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
            {sort.sorted.map((check) => {
              const bank = data.banks.find((b) => b.id === check.bankId);
              return (
                <tr key={check.id} className="border-b border-border/70 last:border-0" {...openProps("check", check.id)}>
                  <td className="px-4 py-3 tabular-nums font-medium">#{check.checkNumber}</td>
                  <td className="px-4 py-3">
                    <p>{check.payee}</p>
                    {check.memo ? <p className="text-xs text-muted-foreground">{check.memo}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{bank?.nickname}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(check.issueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(check.postDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Money amount={check.amount} currency={data.settings.currency} />
                  </td>
                  <td className="px-4 py-3">
                    <CheckBadge status={check.status} />
                  </td>
                  <td className="px-4 py-3" onDoubleClick={stopOpen}>
                    <div className="flex flex-wrap justify-end gap-1">
                    {check.status === "pending" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setCheckStatus(check.id, "cleared")}>Clear</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCheckStatus(check.id, "voided");
                              toast.success("Check voided and reversed.");
                            }}
                          >
                            Void
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCheckStatus(check.id, "bounced");
                              toast.success("Marked bounced and reversed.");
                            }}
                          >
                            Bounce
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(check)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue a check</DialogTitle>
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
            {data.vendors.length > 0 ? (
              <Field label="Vendor (optional)">
                <Select
                  value={form.vendorId || "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setForm({ ...form, vendorId: "", payee: form.payee });
                      return;
                    }
                    const vendor = data.vendors.find((x) => x.id === v);
                    setForm({ ...form, vendorId: v, payee: vendor?.name ?? form.payee });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type a payee or pick a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vendor</SelectItem>
                    {data.vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Field label="Payee">
              <Input value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Issue date">
                <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </Field>
              <Field label="Post date">
                <Input type="date" value={form.postDate} onChange={(e) => setForm({ ...form, postDate: e.target.value })} />
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
                    payee: form.payee,
                    issueDate: form.issueDate,
                    postDate: form.postDate,
                    amount: parseAmountToCents(form.amount),
                    memo: form.memo,
                    accountId: form.accountId,
                    vendorId: form.vendorId || undefined,
                  });
                  setOpen(false);
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

      <ConfirmDelete
        open={Boolean(deleting)}
        title="Delete check?"
        body="Removes this check and takes it off the ledger so you can issue it again."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          try {
            removeCheck(deleting.id);
            toast.success("Check deleted.");
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
