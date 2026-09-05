import { createFileRoute } from "@tanstack/react-router";
import { DateInput } from "@/components/date-input";
import { PartyCombo } from "@/components/party-combo";
import { Plus, Printer } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DragHandle } from "@/components/drag-handle";
import { CsvButton } from "@/components/export-menu";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod } from "@/components/list-filters";
import { ListCard, listColClass, listColWidthStyle } from "@/components/list-table";
import { RowActions } from "@/components/row-actions";
import { Field } from "@/components/field";
import { ListPrint } from "@/components/list-print";
import { Money } from "@/components/money";
import { requestPrint } from "@/components/print-preview";
import { BillBadge } from "@/components/status-badge";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { cn } from "@/lib/utils";
import { useRowDrag } from "@/components/use-row-drag";
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
import { billRows } from "@/lib/finance/export";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { addDaysIso, formatDate, formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { newId } from "@/lib/finance/ids";
import { billBalance } from "@/lib/finance/ledger";
import { openProps, openTxn, stopOpen } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { EMPTY_VENDOR, type Bill } from "@/lib/finance/types";

export const Route = createFileRoute("/bills")({ component: BillsPage });

const BILL_COLS = {
  number: 128,
  vendor: 180,
  date: 118,
  due: 118,
  amount: 120,
  balance: 120,
  status: 118,
  actions: 120,
} as const;

const BILL_SORT = [
  { value: "date:desc", label: "Date · newest" },
  { value: "date:asc", label: "Date · oldest" },
  { value: "number:asc", label: "Number" },
  { value: "vendor:asc", label: "Vendor A–Z" },
  { value: "due:asc", label: "Due · soonest" },
  { value: "balance:desc", label: "Balance high–low" },
];

function BillsPage() {
  const data = useFinanceData();
  const createBill = useFinanceStore((s) => s.createBill);
  const addVendor = useFinanceStore((s) => s.addVendor);
  const payBill = useFinanceStore((s) => s.payBill);
  const voidBill = useFinanceStore((s) => s.voidBill);
  const removeBill = useFinanceStore((s) => s.removeBill);
  const reorderBills = useFinanceStore((s) => s.reorderBills);
  const dragEnabled = data.settings.dragDropEnabled;
  const today = todayIso();
  const expenseAccounts = data.accounts.filter((a) => a.type === "expense");

  const [createOpen, setCreateOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Bill | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "paid" | "void">("all");
  const period = useListPeriod("all");
  const [payForm, setPayForm] = useState({ amount: "", date: today, bankId: "" });
  const [form, setForm] = useState({
    vendorId: "",
    date: today,
    dueDate: addDaysIso(today, 15),
    amount: "",
    accountId: expenseAccounts[0]?.id ?? "",
    memo: "",
    reference: "",
  });

  const getters = useMemo(
    () => ({
      order: (b: Bill) => b.sortOrder,
      number: (b: Bill) => b.number,
      vendor: (b: Bill) => data.vendors.find((v) => v.id === b.vendorId)?.name ?? "",
      date: (b: Bill) => b.date,
      due: (b: Bill) => b.dueDate,
      amount: (b: Bill) => b.amount,
      balance: (b: Bill) => billBalance(b),
      status: (b: Bill) => b.status,
    }),
    [data.vendors],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.bills.filter((b) => {
      if (statusFilter === "open" && (b.status === "paid" || b.status === "void")) return false;
      if (statusFilter === "paid" && b.status !== "paid") return false;
      if (statusFilter === "void" && b.status !== "void") return false;
      if (!period.inRange(b.date)) return false;
      if (!q) return true;
      const name = data.vendors.find((v) => v.id === b.vendorId)?.name ?? "";
      return [b.number, name, b.memo, b.reference].join(" ").toLowerCase().includes(q);
    });
  }, [data.bills, data.vendors, query, statusFilter, period.inRange]);
  const sort = useEntrySort(filtered, dragEnabled ? "order" : "date", getters, "desc");
  const dragOn = dragEnabled && sort.key === "order";
  const drag = useRowDrag(
    dragOn,
    sort.sorted.map((b) => b.id),
    reorderBills,
  );

  const paying = data.bills.find((b) => b.id === payId);
  const cols = useColWidths("finance-manager-bills-cols", BILL_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const openBill = useCallback((id: string) => openTxn("bill", id), []);
  const colAligns = useColAligns("finance-manager-bills-col-aligns", Object.keys(BILL_COLS) as Array<keyof typeof BILL_COLS>);
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((b) => b.id),
    onOpen: openBill,
  });
  function fit(id: keyof typeof BILL_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <AppShell
      title="Bills"
      description="Vendor invoices on accounts payable. Pay from a bank, or void and delete once reversed."
      wide
      actions={
        <>
          <CsvButton filename="bills.csv" rows={billRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New bill
          </Button>
        </>
      }
    >
      {data.vendors.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Type a new vendor on the bill and press Enter to add them.</p>
      ) : null}

      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search number or vendor"
        label="Search bills"
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
              label: "Status",
              value: statusFilter,
              options: [
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "paid", label: "Paid" },
                { value: "void", label: "Void" },
              ],
              onChange: (v) => setStatusFilter(v as typeof statusFilter),
            },
          ]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={BILL_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            setStatusFilter("all");
            period.reset();
          }}
        />
      </ListToolbar>

      <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="doc-list outline-none">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            {dragEnabled ? <col style={{ width: 44 }} /> : null}
            {(Object.keys(BILL_COLS) as Array<keyof typeof BILL_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id])} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {dragEnabled ? (
                <SortHeader label="Order" column="order" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} />
              ) : null}
              <SortHeader label="Number" column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "Number")} align={colAligns.aligns.number ?? "center"} onAlign={(a) => colAligns.setAlign("number", a)} />
              <SortHeader label="Vendor" column="vendor" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.vendor} onWidth={(n) => cols.setWidth("vendor", n)} onFit={() => fit("vendor", "Vendor")} align={colAligns.aligns.vendor ?? "center"} onAlign={(a) => colAligns.setAlign("vendor", a)} fill />
              <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} align={colAligns.aligns.date ?? "center"} onAlign={(a) => colAligns.setAlign("date", a)} />
              <SortHeader label="Due" column="due" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.due} onWidth={(n) => cols.setWidth("due", n)} onFit={() => fit("due", "Due")} align={colAligns.aligns.due ?? "center"} onAlign={(a) => colAligns.setAlign("due", a)} />
              <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} align={colAligns.aligns.amount ?? "center"} onAlign={(a) => colAligns.setAlign("amount", a)} />
              <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} align={colAligns.aligns.balance ?? "center"} onAlign={(a) => colAligns.setAlign("balance", a)} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} align={colAligns.aligns.status ?? "center"} onAlign={(a) => colAligns.setAlign("status", a)} />
              <th className="col-actions relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={dragEnabled ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
                  No bills yet.
                </td>
              </tr>
            ) : (
              sort.sorted.map((bill) => {
                const vendor = data.vendors.find((v) => v.id === bill.vendorId);
                const due = billBalance(bill);
                const overdue = due > 0 && bill.dueDate < today && bill.status !== "void" && bill.status !== "paid";
                const canPay = due > 0 && bill.status !== "void";
                const openPay = () => {
                  setPayId(bill.id);
                  setPayForm({
                    amount: String(due / 100),
                    date: today,
                    bankId: data.banks[0]?.id ?? "",
                  });
                };
                const rowActions = (
                  <RowActions
                    primary={
                      canPay ? (
                        <Button size="sm" variant="outline" onClick={openPay}>
                          Pay
                        </Button>
                      ) : undefined
                    }
                    primaryAsItem={canPay ? { label: "Pay", onSelect: openPay } : undefined}
                    items={[
                      ...(bill.status !== "void" && bill.status !== "paid"
                        ? [
                            {
                              label: "Void",
                              onSelect: () => {
                                voidBill(bill.id);
                                toast.success("Bill voided.");
                              },
                            },
                          ]
                        : []),
                      { label: "Delete", danger: true, onSelect: () => setDeleting(bill) },
                    ]}
                  />
                );
                return (
                  <tr
                      key={bill.id}
                        className="border-b border-border/70 last:border-0"
                        data-active={pointer.activeId === bill.id ? "true" : undefined}
                        data-focused={pointer.activeId === bill.id ? "true" : undefined}
                        data-row-id={bill.id}
                        aria-current={pointer.activeId === bill.id ? "true" : undefined}
                        {...drag.bind(bill.id)}
                        {...openProps("bill", bill.id)}
                        onClick={() => pointer.setActiveId(bill.id)}
                      >
                        {dragEnabled ? (
                          <td className="px-4 py-3">
                            <DragHandle enabled={dragOn} />
                          </td>
                        ) : null}
                        <td className={cn("px-4 py-3 font-medium", alignClass(colAligns.aligns.number ?? "center"))} data-col="number" data-align={colAligns.aligns.number ?? "center"}>{bill.number}</td>
                        <td className={cn("px-4 py-3", alignClass(colAligns.aligns.vendor ?? "center"))} data-col="vendor" data-align={colAligns.aligns.vendor ?? "center"}>{vendor?.name ?? "—"}</td>
                        <td className={cn("px-4 py-3 whitespace-nowrap", alignClass(colAligns.aligns.date ?? "center"))} data-col="date" data-align={colAligns.aligns.date ?? "center"}>{formatDate(bill.date)}</td>
                        <td className={cn("px-4 py-3 whitespace-nowrap", alignClass(colAligns.aligns.due ?? "center"))} data-col="due" data-align={colAligns.aligns.due ?? "center"}>{formatDate(bill.dueDate)}</td>
                        <td className={cn("px-4 py-3", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                          <Money amount={bill.amount} currency={data.settings.currency} />
                        </td>
                        <td className={cn("px-4 py-3", alignClass(colAligns.aligns.balance ?? "center"))} data-col="balance" data-align={colAligns.aligns.balance ?? "center"}>
                          <Money amount={due} currency={data.settings.currency} />
                        </td>
                        <td className={cn("px-4 py-3", alignClass(colAligns.aligns.status ?? "center"))} data-col="status" data-align={colAligns.aligns.status ?? "center"}>
                          <BillBadge status={bill.status} overdue={overdue} />
                        </td>
                        <td className="col-actions" onDoubleClick={stopOpen}>
                          {rowActions}
                        </td>
                      </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ListCard>
      <ListPrint
        title="Bills"
        columns={[
          { key: "number", label: "Number" },
          { key: "vendor", label: "Vendor" },
          { key: "date", label: "Date" },
          { key: "due", label: "Due" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "balance", label: "Balance", align: "right" },
          { key: "status", label: "Status" },
        ]}
        rows={sort.sorted.map((b) => ({
          number: b.number,
          vendor: data.vendors.find((v) => v.id === b.vendorId)?.name ?? "",
          date: formatDate(b.date),
          due: formatDate(b.dueDate),
          amount: formatMoney(b.amount, data.settings.currency),
          balance: formatMoney(billBalance(b), data.settings.currency),
          status: b.status,
        }))}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New bill</DialogTitle>
            <DialogDescription>Posts expense and accounts payable when you save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Vendor">
              <PartyCombo
                items={data.vendors}
                valueId={form.vendorId}
                valueName={data.vendors.find((v) => v.id === form.vendorId)?.name ?? ""}
                label="Vendor"
                placeholder="Type a vendor"
                onChoose={(id) => setForm({ ...form, vendorId: id })}
                onCreate={(name) => {
                  const id = newId();
                  addVendor({ ...EMPTY_VENDOR, id, name });
                  return { id, name };
                }}
              />
            </Field>
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
                  if (!form.vendorId) {
                    toast.error("Payee must be a registered vendor. Click + Add to create.");
                    return;
                  }
                  createBill({
                    vendorId: form.vendorId,
                    date: form.date,
                    dueDate: form.dueDate,
                    amount: parseAmountToCents(form.amount),
                    accountId: form.accountId,
                    memo: form.memo,
                    reference: form.reference,
                  });
                  setCreateOpen(false);
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

      <Dialog open={Boolean(paying)} onOpenChange={(o) => !o && setPayId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay bill</DialogTitle>
            <DialogDescription>
              {paying ? (
                <>
                  {paying.number} · balance{" "}
                  <Money amount={billBalance(paying)} currency={data.settings.currency} />
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Bank">
              <Select value={payForm.bankId} onValueChange={(v) => setPayForm({ ...payForm, bankId: v })}>
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
            <Field label="Date">
              <DateInput value={payForm.date} onChange={(date) => setPayForm({ ...payForm, date })} />
            </Field>
            <Field label="Amount">
              <Input value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} inputMode="decimal" />
            </Field>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!payId) return;
                try {
                  payBill({
                    billId: payId,
                    date: payForm.date,
                    amount: parseAmountToCents(payForm.amount),
                    bankId: payForm.bankId,
                  });
                  setPayId(null);
                  toast.success("Bill paid.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not pay bill.");
                }
              }}
            >
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleting)}
        title="Delete bill?"
        body="Removes this bill, its payments, and the ledger lines so you can enter it again."
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          try {
            removeBill(deleting.id);
            toast.success("Bill deleted.");
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
