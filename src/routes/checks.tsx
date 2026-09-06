import { createFileRoute } from "@tanstack/react-router";
import { DateInput } from "@/components/date-input";
import { PartyCombo } from "@/components/party-combo";
import { BankCombo } from "@/components/bank-combo";
import { AccountCombo } from "@/components/account-combo";
import { DocCards } from "@/components/doc-cards";
import { ListViewMenu } from "@/components/list-view-menu";
import { useListView } from "@/components/view-toggle";
import { CheckBadge } from "@/components/status-badge";
import { Plus, Printer } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod } from "@/components/list-filters";
import { ListCard, listColClass, listColWidthStyle, listTableStyle} from "@/components/list-table";
import { RowActions } from "@/components/row-actions";
import { Field } from "@/components/field";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { CheckStatusControl } from "@/components/check-status-menu";
import { ActionsHeader, SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { useListVirtualizer, VirtPad } from "@/components/use-list-virtualizer";
import { cn } from "@/lib/utils";
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
  actions: 88,
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
  const [view, setView] = useListView("checks");
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
  const colAligns = useColAligns("finance-manager-checks-col-aligns", Object.keys(CHK_COLS) as Array<keyof typeof CHK_COLS>);
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((c) => c.id),
    onOpen: openCheck,
  });
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.id ?? index);
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
        <ListViewMenu layout={view} onLayout={setView} />
      </ListToolbar>

      {view === "grid" ? (
        <DocCards
          empty={data.checks.length === 0 ? "No checks yet." : "No checks match this search or filter."}
          rows={sort.sorted.map((check) => ({
            id: check.id,
            title: `#${check.checkNumber} · ${check.payee}`,
            meta: [formatDate(check.issueDate), data.banks.find((b) => b.id === check.bankId)?.nickname]
              .filter(Boolean)
              .join(" · "),
            amount: check.amount,
            currency: data.settings.currency,
            status: <CheckBadge status={check.status} />,
            onOpen: () => openTxn("check", check.id),
          }))}
        />
      ) : (
      <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="outline-none">
        <table ref={cols.tableRef} className="text-sm" style={listTableStyle(cols.tableWidth)}>
          <colgroup>
            {(Object.keys(CHK_COLS) as Array<keyof typeof CHK_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id])} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Check" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Check")} align={colAligns.aligns.number ?? "center"} onAlign={(a) => colAligns.setAlign("number", a)} />
              <SortHeader label="Payee" column="payee" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.payee} onWidth={(n) => cols.setWidth("payee", n)} onFit={() => fit("payee", "Payee")} align={colAligns.aligns.payee ?? "center"} onAlign={(a) => colAligns.setAlign("payee", a)} fill />
              <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.bank} onWidth={(n) => cols.setWidth("bank", n)} onFit={() => fit("bank", "Bank")} align={colAligns.aligns.bank ?? "center"} onAlign={(a) => colAligns.setAlign("bank", a)} />
              <SortHeader label="Issued" column="issued" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.issued} onWidth={(n) => cols.setWidth("issued", n)} onFit={() => fit("issued", "Issued")} align={colAligns.aligns.issued ?? "center"} onAlign={(a) => colAligns.setAlign("issued", a)} />
              <SortHeader label="Post" column="post" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.post} onWidth={(n) => cols.setWidth("post", n)} onFit={() => fit("post", "Post")} align={colAligns.aligns.post ?? "center"} onAlign={(a) => colAligns.setAlign("post", a)} />
              <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} align={colAligns.aligns.amount ?? "center"} onAlign={(a) => colAligns.setAlign("amount", a)} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} align={colAligns.aligns.status ?? "center"} onAlign={(a) => colAligns.setAlign("status", a)} />
              <ActionsHeader width={cols.widths.actions} onWidth={(n) => cols.setWidth("actions", n)} onFit={() => fit("actions", "Actions")} />
            </tr>
          </thead>
          <tbody>
            <VirtPad height={listVirt.padTop} colSpan={8} />
            {listVirt.items.map((v) => {
              const check = sort.sorted[v.index];
              if (!check) return null;
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
                      data-focused={pointer.activeId === check.id ? "true" : undefined}
                      data-row-id={check.id}
                      aria-current={pointer.activeId === check.id ? "true" : undefined}
                      {...openProps("check", check.id)}
                      onClick={() => pointer.setActiveId(check.id)}
                    >
                      <td className={cn("px-4 py-3 tabular-nums font-medium", alignClass(colAligns.aligns.number ?? "center"))} data-col="number" data-align={colAligns.aligns.number ?? "center"}>#{check.checkNumber}</td>
                      <td className={cn("px-4 py-3", alignClass(colAligns.aligns.payee ?? "center"))} data-col="payee" data-align={colAligns.aligns.payee ?? "center"}>
                        <p>{check.payee}</p>
                        {check.memo ? <p className="text-xs text-muted-foreground">{check.memo}</p> : null}
                      </td>
                      <td className={cn("px-4 py-3 text-muted-foreground", alignClass(colAligns.aligns.bank ?? "center"))} data-col="bank" data-align={colAligns.aligns.bank ?? "center"}>{bank?.nickname}</td>
                      <td className={cn("px-4 py-3 whitespace-nowrap", alignClass(colAligns.aligns.issued ?? "center"))} data-col="issued" data-align={colAligns.aligns.issued ?? "center"}>{formatDate(check.issueDate)}</td>
                      <td className={cn("px-4 py-3 whitespace-nowrap", alignClass(colAligns.aligns.post ?? "center"))} data-col="post" data-align={colAligns.aligns.post ?? "center"}>{formatDate(check.postDate)}</td>
                      <td className={cn("px-4 py-3", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                        <Money amount={check.amount} currency={data.settings.currency} />
                      </td>
                      <td
                        className={cn("px-3 py-3", alignClass(colAligns.aligns.status ?? "center"))}
                        data-col="status"
                        data-align={colAligns.aligns.status ?? "center"}
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
                      <td className="col-actions" data-col="actions" onClick={stopOpen} onDoubleClick={stopOpen}>
                        {rowActions}
                      </td>
                    </tr>
                );
            })}
            <VirtPad height={listVirt.padBottom} colSpan={8} />
          </tbody>
        </table>
      </ListCard>
      )}
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
              <BankCombo
                valueId={form.bankId}
                onChoose={(id) => setForm({ ...form, bankId: id })}
                placeholder="Type a bank"
              />
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
                placeholder="Type a vendor"
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
              <AccountCombo
                valueId={form.accountId}
                onChoose={(id) => setForm({ ...form, accountId: id })}
                type="expense"
                label="Charge to"
              />
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
                    toast.error("Type a vendor, then Quick Add.");
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
