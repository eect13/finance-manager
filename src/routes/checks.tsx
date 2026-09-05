import { createFileRoute } from "@tanstack/react-router";
import { DateInput } from "@/components/date-input";
import { PartyCombo } from "@/components/party-combo";
import { Plus, Printer } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { RowActions } from "@/components/row-actions";
import { Field } from "@/components/field";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { CheckStatusControl } from "@/components/check-status-menu";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useListPointer } from "@/components/use-list-pointer";
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
import { checkRegisterRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { openProps, openTxn, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_VENDOR, type CheckRecord } from "@/lib/finance/types";

export const Route = createFileRoute("/checks")({ component: ChecksPage });

const CHK_COLS = {
  number: 100,
  payee: 200,
  bank: 128,
  issued: 118,
  post: 118,
  amount: 128,
  status: 140,
  actions: 44,
} as const;

const CHK_SORT = [
  { value: "issued:desc", label: "Issued · newest" },
  { value: "issued:asc", label: "Issued · oldest" },
  { value: "number:asc", label: "Check number" },
  { value: "payee:asc", label: "Payee A–Z" },
  { value: "amount:desc", label: "Amount high–low" },
];

function ChecksPage() {
  const data = useFinanceData();
  const issueCheck = useFinanceStore((s) => s.issueCheck);
  const addVendor = useFinanceStore((s) => s.addVendor);
  const setCheckStatus = useFinanceStore((s) => s.setCheckStatus);
  const removeCheck = useFinanceStore((s) => s.removeCheck);
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");

  const [open, setOpen] = useState(false);
  const [bankFilter, setBankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "cleared" | "voided" | "bounced">("all");
  const period = useListPeriod("all");
  const [query, setQuery] = useState("");
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
    const q = query.trim().toLowerCase();
    return data.checks
      .filter((c) => (bankFilter === "all" ? true : c.bankId === bankFilter))
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .filter((c) => period.inRange(c.issueDate))
      .filter((c) =>
        !q ? true : [c.checkNumber, c.payee, c.memo].join(" ").toLowerCase().includes(q),
      );
  }, [data.checks, bankFilter, statusFilter, query, period.inRange]);

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
  const cols = useColWidths("finance-manager-checks-cols", CHK_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const openCheck = useCallback((id: string) => openTxn("check", id), []);
  const pointer = useListPointer(
    sort.sorted.map((c) => c.id),
    openCheck,
  );
  function fit(id: keyof typeof CHK_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <AppShell
      title="Check register"
      description="Issue, post-date, clear, void, or bounce. Pending checks stay visible until they hit the bank."
      wide
      actions={
        <>
          <CsvButton filename="check-register.csv" rows={checkRegisterRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Issue check
          </Button>
        </>
      }
    >
      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search check or payee"
        label="Search checks"
      >
        <ListFilters
          datePreset={period.preset}
          dateFrom={period.from}
          dateTo={period.to}
          onPreset={period.applyPreset}
          onDateFrom={period.setDateFrom}
          onDateTo={period.setDateTo}
          defaultPreset="all"
          selects={[
            {
              label: "Bank",
              value: bankFilter,
              options: [
                { value: "all", label: "All banks" },
                ...data.banks.map((b) => ({ value: b.id, label: b.nickname })),
              ],
              onChange: setBankFilter,
            },
            {
              label: "Status",
              value: statusFilter,
              options: [
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "cleared", label: "Cleared" },
                { value: "voided", label: "Voided" },
                { value: "bounced", label: "Bounced" },
              ],
              onChange: (v) => setStatusFilter(v as typeof statusFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={CHK_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            setBankFilter("all");
            setStatusFilter("all");
            period.reset();
          }}
        />
      </ListToolbar>

      <ListCard ref={gridRef}>
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            {(Object.keys(CHK_COLS) as Array<keyof typeof CHK_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Check" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Check")} />
              <SortHeader label="Payee" column="payee" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.payee} onWidth={(n) => cols.setWidth("payee", n)} onFit={() => fit("payee", "Payee")} />
              <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.bank} onWidth={(n) => cols.setWidth("bank", n)} onFit={() => fit("bank", "Bank")} />
              <SortHeader label="Issued" column="issued" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.issued} onWidth={(n) => cols.setWidth("issued", n)} onFit={() => fit("issued", "Issued")} />
              <SortHeader label="Post" column="post" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.post} onWidth={(n) => cols.setWidth("post", n)} onFit={() => fit("post", "Post")} />
              <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} />
              <th className="col-actions relative px-2 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.map((check) => {
              const bank = data.banks.find((b) => b.id === check.bankId);
              const applyStatus = (next: typeof check.status) => {
                try {
                  setCheckStatus(check.id, next);
                  if (next === "voided") toast.success("Check voided and reversed.");
                  else if (next === "bounced") toast.success("Marked bounced and reversed.");
                  else if (next === "cleared") toast.success("Cleared.");
                  else toast.success("Pending.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update status.");
                }
              };
              const rowActions = (
                <RowActions items={[{ label: "Delete", danger: true, onSelect: () => setDeleting(check) }]} />
              );
              return (
                  <tr
                      key={check.id}
                      className="border-b border-border/70 last:border-0"
                      data-active={pointer.activeId === check.id ? "true" : undefined}
                      {...openProps("check", check.id)}
                      onClick={() => pointer.setActiveId(check.id)}
                    >
                      <td className="px-4 py-3 tabular-nums font-medium" data-col="number">#{check.checkNumber}</td>
                      <td className="px-4 py-3" data-col="payee">
                        <p>{check.payee}</p>
                        {check.memo ? <p className="text-xs text-muted-foreground">{check.memo}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" data-col="bank">{bank?.nickname}</td>
                      <td className="px-4 py-3 whitespace-nowrap" data-col="issued">{formatDate(check.issueDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap" data-col="post">{formatDate(check.postDate)}</td>
                      <td className="px-4 py-3 text-right" data-col="amount">
                        <Money amount={check.amount} currency={data.settings.currency} />
                      </td>
                      <td
                        className="px-3 py-3"
                        data-col="status"
                        onClick={stopOpen}
                        onPointerDown={stopOpen}
                        onDoubleClick={stopOpen}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckStatusControl
                            status={check.status}
                            recon={check.recon ?? "pending"}
                            onSetStatus={applyStatus}
                          />
                        </div>
                      </td>
                      <td className="col-actions px-2 py-3" onClick={stopOpen} onDoubleClick={stopOpen}>
                        {rowActions}
                      </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </ListCard>
      <ListPrint
        title="Check register"
        columns={[
          { key: "number", label: "Check" },
          { key: "payee", label: "Payee" },
          { key: "bank", label: "Bank" },
          { key: "issued", label: "Issued" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "status", label: "Status" },
        ]}
        rows={sort.sorted.map((c) => ({
          number: `#${c.checkNumber}`,
          payee: c.payee,
          bank: data.banks.find((b) => b.id === c.bankId)?.nickname ?? "",
          issued: formatDate(c.issueDate),
          amount: formatMoney(c.amount, data.settings.currency),
          status: c.status,
        }))}
      />

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
            <Field label="Vendor">
              <PartyCombo
                items={data.vendors}
                valueId={form.vendorId}
                valueName={data.vendors.find((v) => v.id === form.vendorId)?.name ?? ""}
                label="Vendor"
                placeholder="Pick a vendor"
                invalid={!form.vendorId}
                onChoose={(id, name) => setForm({ ...form, vendorId: id, payee: name })}
                onCreate={(name) => {
                  const id = newId();
                  addVendor({ ...EMPTY_VENDOR, id, name });
                  return { id, name };
                }}
              />
            </Field>
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
                  if (!form.vendorId) {
                    toast.error("Payee must be a registered vendor. Click + Add to create.");
                    return;
                  }
                  issueCheck({
                    bankId: form.bankId,
                    checkNumber: form.checkNumber,
                    payee: data.vendors.find((v) => v.id === form.vendorId)?.name ?? form.payee,
                    issueDate: form.issueDate,
                    postDate: form.postDate,
                    amount: parseAmountToCents(form.amount),
                    memo: form.memo,
                    accountId: form.accountId,
                    vendorId: form.vendorId,
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
