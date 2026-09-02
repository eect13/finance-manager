import { Field } from "@/components/field";
import { StatementPrint } from "@/components/period-print";
import { requestPrint } from "@/components/print-preview";
import { Money } from "@/components/money";
import { PartyFields } from "@/components/party-form";
import {
  CustomerCreateDialog,
  VendorCreateDialog,
  type CustomerCreateKind,
  type VendorCreateKind,
} from "@/components/party-new";
import { BillBadge, CheckBadge, InvoiceBadge, ReceiptBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRegisterDate, todayIso } from "@/lib/finance/format";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { customerOpenBalance, vendorOpenBalance } from "@/lib/finance/ledger";
import { openProps, openTxn } from "@/lib/finance/open-record";
import { useEntrySort } from "@/lib/finance/sort";
import {
  customerHistory,
  filterCustomerHistory,
  filterVendorHistory,
  partyHistoryRows,
  vendorHistory,
  type CustomerTxnFilter,
  type PartyTxn,
  type VendorTxnFilter,
} from "@/lib/finance/party-history";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { customerStatement } from "@/lib/finance/statement";
import { EMPTY_CUSTOMER, EMPTY_VENDOR, type Customer, type Vendor } from "@/lib/finance/types";
import { ArrowLeft, ChevronDown, Plus, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useListPointer } from "@/components/use-list-pointer";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod, type FilterSelect } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { ViewToggle, useListView } from "@/components/view-toggle";

const TXN_COLS = {
  date: 108,
  type: 108,
  number: 132,
  memo: 180,
  amount: 120,
  open: 110,
  balance: 120,
  status: 112,
} as const;

const TXN_SORT = [
  { value: "date:desc", label: "Date · newest" },
  { value: "date:asc", label: "Date · oldest" },
  { value: "number:asc", label: "Number" },
  { value: "amount:desc", label: "Amount high–low" },
];

function useTapOpens() {
  const [tap, setTap] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setTap(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return tap;
}

export function PartyTxnTable({
  rows,
  currency,
  empty,
  typeSelect,
}: {
  rows: PartyTxn[];
  currency: string;
  empty: string;
  typeSelect?: FilterSelect;
}) {
  const tapOpens = useTapOpens();
  const [query, setQuery] = useState("");
  const period = useListPeriod("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!period.inRange(row.date)) return false;
      if (!q) return true;
      return [row.date, row.type, row.number, row.memo].join(" ").toLowerCase().includes(q);
    });
  }, [rows, query, period.inRange]);
  const getters = useMemo(
    () => ({
      date: (row: PartyTxn) => row.date,
      type: (row: PartyTxn) => row.type,
      number: (row: PartyTxn) => row.number,
      memo: (row: PartyTxn) => row.memo,
      amount: (row: PartyTxn) => row.amount,
      open: (row: PartyTxn) => row.open,
      balance: (row: PartyTxn) => row.balance,
      status: (row: PartyTxn) => row.invoiceStatus ?? row.billStatus ?? row.checkStatus ?? row.receiptStatus ?? "",
    }),
    [],
  );
  const sort = useEntrySort(filtered, "date", getters, "desc");
  const ids = useMemo(() => sort.sorted.map((row) => `${row.openKind}-${row.id}`), [sort.sorted]);
  const openRow = useCallback(
    (key: string) => {
      const row = rows.find((r) => `${r.openKind}-${r.id}` === key);
      if (row) openTxn(row.openKind, row.id);
    },
    [rows],
  );
  const pointer = useListPointer(ids, openRow, ".party-txn-table");
  const wrapRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-party-txn-cols", TXN_COLS);

  function fit(id: keyof typeof TXN_COLS, label: string) {
    const table = wrapRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <div>
      <ListToolbar query={query} onQuery={setQuery} placeholder="Search date, type, number, memo" label="Search transactions">
        <ListFilters
          datePreset={period.preset}
          dateFrom={period.from}
          dateTo={period.to}
          onPreset={period.applyPreset}
          onDateFrom={period.setDateFrom}
          onDateTo={period.setDateTo}
          defaultPreset="all"
          selects={typeSelect ? [typeSelect] : []}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={TXN_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            typeSelect?.onChange("all");
            period.reset();
          }}
        />
      </ListToolbar>
      {sort.sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{query.trim() ? "No transactions match." : empty}</p>
      ) : (
        <ListCard
          ref={wrapRef}
          className="party-txn-table outline-none"
          tabIndex={-1}
          onPointerDown={() => wrapRef.current?.focus()}
        >
          <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
            <colgroup>
              {(Object.keys(TXN_COLS) as Array<keyof typeof TXN_COLS>).map((id) => (
                <col key={id} className={cn(`col-txn-${id}`, listColClass(id))} style={{ width: cols.widths[id] }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-date" width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} />
                <SortHeader label="Type" column="type" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-type" width={cols.widths.type} onWidth={(n) => cols.setWidth("type", n)} onFit={() => fit("type", "Type")} />
                <SortHeader label="No." column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-number" width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "No.")} />
                <SortHeader label="Memo" column="memo" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-memo" width={cols.widths.memo} onWidth={(n) => cols.setWidth("memo", n)} onFit={() => fit("memo", "Memo")} />
                <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-amount" align="right" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} />
                <SortHeader label="Open" column="open" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-open" align="right" width={cols.widths.open} onWidth={(n) => cols.setWidth("open", n)} onFit={() => fit("open", "Open")} />
                <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-balance" align="right" width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} />
                <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-status" width={cols.widths.status} />
              </tr>
            </thead>
            <tbody>
              {sort.sorted.map((row) => {
                const key = `${row.openKind}-${row.id}`;
                return (
                  <tr
                    key={key}
                    className="cursor-pointer"
                    data-active={pointer.activeId === key ? "true" : undefined}
                    {...openProps(row.openKind, row.id, { click: tapOpens })}
                    onClick={(e) => {
                      pointer.setActiveId(key);
                      if (tapOpens) {
                        e.preventDefault();
                        openTxn(row.openKind, row.id);
                      }
                    }}
                  >
                    <td className="col-txn-date px-3 py-2 whitespace-nowrap" data-col="date">{formatRegisterDate(row.date)}</td>
                    <td className="col-txn-type px-3 py-2" data-col="type">{row.type}</td>
                    <td className="col-txn-number px-3 py-2 whitespace-nowrap" data-col="number">{row.number}</td>
                    <td className="col-txn-memo px-3 py-2 text-muted-foreground" data-col="memo">{row.memo || "—"}</td>
                    <td className="col-txn-amount px-3 py-2 text-right whitespace-nowrap" data-col="amount">
                      <Money
                        amount={row.amount}
                        currency={currency}
                        className={row.openKind === "receipt" || row.openKind === "check" ? "text-credit" : undefined}
                      />
                    </td>
                    <td className="col-txn-open px-3 py-2 text-right" data-col="open">{row.open ? <Money amount={row.open} currency={currency} /> : "—"}</td>
                    <td className="col-txn-balance px-3 py-2 text-right" data-col="balance">
                      <Money amount={row.balance} currency={currency} />
                    </td>
                    <td className="col-txn-status px-3 py-2" data-col="status">
                      <TxnBadge row={row} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ListCard>
      )}
    </div>
  );
}

function TxnBadge({ row }: { row: PartyTxn }) {
  if (row.openKind === "invoice" && row.invoiceStatus) {
    return <InvoiceBadge status={row.invoiceStatus} overdue={row.overdue} />;
  }
  if (row.openKind === "bill" && row.billStatus) {
    return <BillBadge status={row.billStatus} overdue={row.overdue} />;
  }
  if (row.openKind === "check" && row.checkStatus) {
    return <CheckBadge status={row.checkStatus} />;
  }
  if (row.openKind === "receipt" && row.receiptStatus) {
    return (
      <ReceiptBadge
        status={row.receiptStatus}
        kind={row.receiptKind === "cash-sale" ? "cash-sale" : "payment"}
        method={row.receiptMethod}
      />
    );
  }
  return null;
}

export function CustomerCenter() {
  const data = useFinanceData();
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const updateCustomer = useFinanceStore((s) => s.updateCustomer);
  const removeCustomer = useFinanceStore((s) => s.removeCustomer);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [txnFilter, setTxnFilter] = useState<CustomerTxnFilter>("all");
  const [createKind, setCreateKind] = useState<CustomerCreateKind | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.customers.filter((c) =>
      !q ? true : [c.name, c.contact, c.email, c.phone].join(" ").toLowerCase().includes(q),
    );
    rows.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    return rows;
  }, [data, query]);

  useEffect(() => {
    if (selectedId && filtered.some((c) => c.id === selectedId)) return;
    setSelectedId(filtered[0]?.id ?? null);
  }, [filtered, selectedId]);

  const selected = data.customers.find((c) => c.id === selectedId) ?? null;
  const history = selected ? customerHistory(data, selected.id) : [];
  const visible = filterCustomerHistory(history, txnFilter);
  const open = selected ? customerOpenBalance(data, selected.id) : 0;

  return (
    <PartySplit
      kindLabel="customer"
      search={query}
      onSearch={setQuery}
      searchPlaceholder="Search name, contact, or email"
      addLabel="Add customer"
      onAdd={() => {
        setForm({ ...EMPTY_CUSTOMER, sortOrder: data.customers.length });
        setCreating(true);
      }}
      creating={creating}
      onCloseCreate={() => setCreating(false)}
      createTitle="New customer"
      createFields={<PartyFields form={form} setForm={setForm} />}
      onSaveCreate={() => {
        if (!form.name.trim()) return toast.error("Customer name is required.");
        addCustomer(form);
        const list = useFinanceStore.getState().companies[useFinanceStore.getState().activeCompanyId]?.customers ?? [];
        setSelectedId(list[list.length - 1]?.id ?? null);
        setCreating(false);
        toast.success("Customer added.");
      }}
      list={filtered.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.contact || c.email || "—",
        balance: customerOpenBalance(data, c.id),
        contact: c.contact,
        email: c.email,
        phone: c.phone,
      }))}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        setTxnFilter("all");
      }}
      emptyList="No customers yet."
      currency={data.settings.currency}
      detail={
        selected ? (
          <PartyDetail
            key={selected.id}
            name={selected.name}
            open={open}
            currency={data.settings.currency}
            actions={
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      New
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCreateKind("invoice")}>Invoice</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreateKind("receive")}>Receive payment</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreateKind("cash-sale")}>Cash sale</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CsvButton filename={`${selected.name}-transactions.csv`} rows={partyHistoryRows(visible)} />
              </>
            }
            typeSelect={{
              label: "Type",
              value: txnFilter,
              options: [
                { value: "all", label: "All" },
                { value: "invoice", label: "Invoices" },
                { value: "payment", label: "Payments" },
                { value: "cash-sale", label: "Cash sales" },
              ],
              onChange: (v) => setTxnFilter(v as CustomerTxnFilter),
            }}
            history={visible}
            emptyHistory="No invoices, payments, or cash sales yet. Use New to invoice or receive."
            details={
              <CustomerDetails
                customer={selected}
                onSave={(next) => {
                  updateCustomer(selected.id, next);
                  toast.success("Customer updated.");
                }}
                onDelete={() => {
                  removeCustomer(selected.id);
                  setSelectedId(null);
                  toast.success("Customer deleted.");
                }}
              />
            }
          />
        ) : (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Pick a customer to see every transaction.</p>
        )
      }
      extra={selected ? <CustomerCreateDialog customerId={selected.id} kind={createKind} onClose={() => setCreateKind(null)} /> : null}
    />
  );
}

export function VendorCenter() {
  const data = useFinanceData();
  const addVendor = useFinanceStore((s) => s.addVendor);
  const updateVendor = useFinanceStore((s) => s.updateVendor);
  const removeVendor = useFinanceStore((s) => s.removeVendor);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [txnFilter, setTxnFilter] = useState<VendorTxnFilter>("all");
  const [createKind, setCreateKind] = useState<VendorCreateKind | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.vendors.filter((v) =>
      !q ? true : [v.name, v.contact, v.email, v.phone].join(" ").toLowerCase().includes(q),
    );
    rows.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    return rows;
  }, [data, query]);

  useEffect(() => {
    if (selectedId && filtered.some((v) => v.id === selectedId)) return;
    setSelectedId(filtered[0]?.id ?? null);
  }, [filtered, selectedId]);

  const selected = data.vendors.find((v) => v.id === selectedId) ?? null;
  const history = selected ? vendorHistory(data, selected.id) : [];
  const visible = filterVendorHistory(history, txnFilter);
  const open = selected ? vendorOpenBalance(data, selected.id) : 0;

  return (
    <PartySplit
      kindLabel="vendor"
      search={query}
      onSearch={setQuery}
      searchPlaceholder="Search name, contact, or email"
      addLabel="Add vendor"
      onAdd={() => {
        setForm({ ...EMPTY_VENDOR, sortOrder: data.vendors.length });
        setCreating(true);
      }}
      creating={creating}
      onCloseCreate={() => setCreating(false)}
      createTitle="New vendor"
      createFields={
        <PartyFields
          form={form}
          setForm={setForm}
          extra={
            <Field label="Their account #">
              <Input
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </Field>
          }
        />
      }
      onSaveCreate={() => {
        if (!form.name.trim()) return toast.error("Vendor name is required.");
        addVendor(form);
        const list = useFinanceStore.getState().companies[useFinanceStore.getState().activeCompanyId]?.vendors ?? [];
        setSelectedId(list[list.length - 1]?.id ?? null);
        setCreating(false);
        toast.success("Vendor added.");
      }}
      list={filtered.map((v) => ({
        id: v.id,
        title: v.name,
        subtitle: v.contact || v.accountNumber || "—",
        balance: vendorOpenBalance(data, v.id),
        contact: v.contact,
        email: v.email,
        phone: v.phone,
      }))}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        setTxnFilter("all");
      }}
      emptyList="No vendors yet."
      currency={data.settings.currency}
      detail={
        selected ? (
          <PartyDetail
            key={selected.id}
            name={selected.name}
            open={open}
            currency={data.settings.currency}
            actions={
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      New
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCreateKind("bill")}>Bill</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreateKind("check")}>Write check</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CsvButton filename={`${selected.name}-transactions.csv`} rows={partyHistoryRows(visible)} />
              </>
            }
            typeSelect={{
              label: "Type",
              value: txnFilter,
              options: [
                { value: "all", label: "All" },
                { value: "bill", label: "Bills" },
                { value: "check", label: "Checks" },
              ],
              onChange: (v) => setTxnFilter(v as VendorTxnFilter),
            }}
            history={visible}
            emptyHistory="No bills or checks yet. Use New to enter a bill or write a check."
            details={
              <VendorDetails
                vendor={selected}
                onSave={(next) => {
                  updateVendor(selected.id, next);
                  toast.success("Vendor updated.");
                }}
                onDelete={() => {
                  removeVendor(selected.id);
                  setSelectedId(null);
                  toast.success("Vendor deleted.");
                }}
              />
            }
          />
        ) : (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">Pick a vendor to see every transaction.</p>
        )
      }
      extra={selected ? <VendorCreateDialog vendorId={selected.id} kind={createKind} onClose={() => setCreateKind(null)} /> : null}
    />
  );
}

type PartyDirRow = {
  id: string;
  title: string;
  subtitle: string;
  balance: number;
  contact?: string;
  email?: string;
  phone?: string;
};

type PartyView = "list" | "grid";

const DIR_COLS = {
  name: 180,
  contact: 140,
  email: 180,
  phone: 128,
  balance: 128,
} as const;

function PartyDirectoryTable({
  kindLabel,
  list,
  selectedId,
  onSelect,
  onOpen,
  currency,
}: {
  kindLabel: string;
  list: PartyDirRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  currency: string;
}) {
  const cols = useColWidths(`finance-manager-${kindLabel}-dir-cols`, DIR_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      name: (row: PartyDirRow) => row.title,
      contact: (row: PartyDirRow) => row.contact ?? "",
      email: (row: PartyDirRow) => row.email ?? "",
      phone: (row: PartyDirRow) => row.phone ?? "",
      balance: (row: PartyDirRow) => row.balance,
    }),
    [],
  );
  const sort = useEntrySort(list, "name", getters, "asc");
  const ids = useMemo(() => sort.sorted.map((row) => row.id), [sort.sorted]);
  const pointer = useListPointer(ids, onOpen, "[data-party-dir]", onSelect);

  useEffect(() => {
    if (selectedId) pointer.setActiveId(selectedId);
  }, [selectedId, pointer.setActiveId]);

  function fit(id: keyof typeof DIR_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <div
      ref={gridRef}
      data-party-dir
      tabIndex={-1}
      className="party-dir-table list-grid overflow-x-auto outline-none"
      onPointerDown={() => gridRef.current?.focus()}
    >
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(DIR_COLS) as Array<keyof typeof DIR_COLS>).map((id) => (
            <col key={id} className={cn(`col-dir-${id}`, listColClass(id))} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Name" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-name" width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Name")} />
            <SortHeader label="Contact" column="contact" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-contact" width={cols.widths.contact} onWidth={(n) => cols.setWidth("contact", n)} onFit={() => fit("contact", "Contact")} />
            <SortHeader label="Email" column="email" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-email" width={cols.widths.email} onWidth={(n) => cols.setWidth("email", n)} onFit={() => fit("email", "Email")} />
            <SortHeader label="Phone" column="phone" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-phone" width={cols.widths.phone} onWidth={(n) => cols.setWidth("phone", n)} onFit={() => fit("phone", "Phone")} />
            <SortHeader label="Open" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-balance" align="right" width={cols.widths.balance} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                No {kindLabel}s yet.
              </td>
            </tr>
          ) : (
            sort.sorted.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "cursor-pointer border-b border-border/70 last:border-0",
                  selectedId === row.id && "bg-primary/10",
                )}
                data-active={pointer.activeId === row.id ? "true" : undefined}
                onClick={() => {
                  pointer.setActiveId(row.id);
                  onSelect(row.id);
                }}
                onDoubleClick={() => onOpen(row.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget === e.target) {
                    e.preventDefault();
                    onSelect(row.id);
                  }
                }}
              >
                <td className="px-4 py-3 font-medium" data-col="name">{row.title}</td>
                <td className="px-4 py-3 text-muted-foreground" data-col="contact">{row.contact || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground" data-col="email">{row.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground" data-col="phone">{row.phone || "—"}</td>
                <td className="px-4 py-3 text-right" data-col="balance">
                  <Money amount={row.balance} currency={currency} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PartyDirectoryCards({
  kindLabel,
  list,
  selectedId,
  onSelect,
  onOpen,
  currency,
}: {
  kindLabel: string;
  list: PartyDirRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  currency: string;
}) {
  return (
    <div className="party-dir-cards" aria-label={`${kindLabel}s`}>
      {list.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No {kindLabel}s yet.</p>
      ) : (
        list.map((item) => {
          const on = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "min-h-11 rounded-2xl border border-border bg-card p-4 text-left",
                on && "border-primary/40 bg-primary/10",
              )}
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onOpen(item.id)}
            >
              <span className="block truncate font-medium">{item.title}</span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
              <Money amount={item.balance} currency={currency} className="mt-3 text-sm" />
            </button>
          );
        })
      )}
    </div>
  );
}

function PartySplit({
  kindLabel,
  search,
  onSearch,
  searchPlaceholder,
  addLabel,
  onAdd,
  creating,
  onCloseCreate,
  createTitle,
  createFields,
  onSaveCreate,
  list,
  selectedId,
  onSelect,
  emptyList,
  currency,
  detail,
  extra,
}: {
  kindLabel: string;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  addLabel: string;
  onAdd: () => void;
  creating: boolean;
  onCloseCreate: () => void;
  createTitle: string;
  createFields: ReactNode;
  onSaveCreate: () => void;
  list: PartyDirRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyList: string;
  currency: string;
  detail: ReactNode;
  extra?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useListView(`${kindLabel}-dir`);
  const [balFilter, setBalFilter] = useState<"all" | "open" | "zero">("all");
  const [detailTab, setDetailTab] = useState("transactions");
  const tapOpens = useTapOpens();

  const visible = useMemo(() => {
    if (balFilter === "open") return list.filter((row) => row.balance > 0);
    if (balFilter === "zero") return list.filter((row) => row.balance === 0);
    return list;
  }, [list, balFilter]);

  function pick(id: string) {
    onSelect(id);
    setMobileOpen(true);
    setDetailTab("transactions");
  }

  function openDetails(id: string) {
    pick(id);
    setDetailTab("details");
  }

  return (
    <>
      <ListToolbar
        query={search}
        onQuery={onSearch}
        placeholder={searchPlaceholder}
        label={`Search ${kindLabel}s`}
      >
        <ListFilters
          selects={[
            {
              label: "Balance",
              value: balFilter,
              options: [
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "zero", label: "Zero" },
              ],
              onChange: (v) => setBalFilter(v as typeof balFilter),
            },
          ]}
          onClear={() => setBalFilter("all")}
        />
        <ViewToggle value={view} onChange={setView} />
        <Button className="no-print w-fit" onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </ListToolbar>
      <div className="party-center" data-view={view} data-pane={mobileOpen ? "detail" : "list"}>
        <aside className={cn("party-pane-list min-w-0 rounded-3xl bg-card elevation", mobileOpen && "is-detail")}>
          {view === "grid" ? (
            <>
              {list.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyList}</p>
              ) : (
                <PartyDirectoryCards kindLabel={kindLabel} list={visible} selectedId={selectedId} onSelect={pick} onOpen={tapOpens ? pick : openDetails} currency={currency} />
              )}
            </>
          ) : (
            <PartyDirectoryTable kindLabel={kindLabel} list={visible} selectedId={selectedId} onSelect={pick} onOpen={tapOpens ? pick : openDetails} currency={currency} />
          )}
        </aside>
        <section className={cn("party-pane-detail min-w-0 rounded-3xl bg-card elevation", !mobileOpen && "is-list")}>
          <div className="party-pane-back no-print border-b border-border px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
              <ArrowLeft />
              All {kindLabel}s
            </Button>
          </div>
          {isValidElement(detail) && selectedId
            ? cloneElement(detail as ReactElement<{ tab?: string; onTab?: (v: string) => void }>, {
                tab: detailTab,
                onTab: setDetailTab,
              })
            : detail}
        </section>
      </div>
      <Dialog open={creating} onOpenChange={(o) => !o && onCloseCreate()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createTitle}</DialogTitle>
          </DialogHeader>
          {createFields}
          <DialogFooter>
            <Button onClick={onSaveCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {extra}
    </>
  );
}

function PartyDetail({
  name,
  open,
  currency,
  actions,
  typeSelect,
  history,
  emptyHistory,
  details,
  tab,
  onTab,
}: {
  name: string;
  open: number;
  currency: string;
  actions: ReactNode;
  typeSelect?: FilterSelect;
  history: PartyTxn[];
  emptyHistory: string;
  details: ReactNode;
  tab?: string;
  onTab?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">
            Open balance <Money amount={open} currency={currency} className="inline font-medium text-foreground" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">{actions}</div>
      </header>
      <Tabs
        className="px-5 pb-5"
        {...(tab != null && onTab ? { value: tab, onValueChange: onTab } : { defaultValue: "transactions" })}
      >
        <TabsList className="no-print">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <p className="mb-3 text-xs text-muted-foreground no-print">
            <span className="sm:hidden">Tap a line to open it.</span>
            <span className="hidden sm:inline">Click to select. Double-click or Enter to open.</span>
          </p>
          <PartyTxnTable rows={history} currency={currency} empty={emptyHistory} typeSelect={typeSelect} />
        </TabsContent>
        <TabsContent value="details">{details}</TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerDetails({
  customer,
  onSave,
  onDelete,
}: {
  customer: Customer;
  onSave: (next: Omit<Customer, "id">) => void;
  onDelete: () => void;
}) {
  const data = useFinanceData();
  const mergeCustomers = useFinanceStore((s) => s.mergeCustomers);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [deleting, setDeleting] = useState(false);
  const [mergeId, setMergeId] = useState("");
  const others = data.customers.filter((c) => c.id !== customer.id);
  useEffect(() => {
    const { id: _id, ...rest } = customer;
    setForm(rest);
    setMergeId("");
  }, [customer]);
  const stmt = customerStatement(data, customer.id, todayIso());
  return (
    <>
      {stmt ? <StatementPrint stmt={stmt} currency={data.settings.currency} /> : null}
      <PartyFields form={form} setForm={setForm} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!form.name.trim()) return toast.error("Customer name is required.");
            onSave(form);
          }}
        >
          Save
        </Button>
        <Button variant="outline" onClick={requestPrint}>
          <Printer />
          Statement
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </div>
      {others.length > 0 ? (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium">Merge into this customer</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Moves invoices and receipts from the other name. Journals stay balanced. The other customer is removed.
          </p>
          <div className="flex flex-wrap gap-2">
            <Select value={mergeId} onValueChange={setMergeId}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Duplicate to absorb" />
              </SelectTrigger>
              <SelectContent>
                {others.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!mergeId}
              onClick={() => {
                try {
                  mergeCustomers(customer.id, mergeId);
                  toast.success("Merged. History now sits on this customer.");
                  setMergeId("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not merge.");
                }
              }}
            >
              Merge
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDelete
        open={deleting}
        title="Delete customer?"
        body={`${customer.name} will be removed. This is blocked if invoices or receipts still point here.`}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            onDelete();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}

function VendorDetails({
  vendor,
  onSave,
  onDelete,
}: {
  vendor: Vendor;
  onSave: (next: Omit<Vendor, "id">) => void;
  onDelete: () => void;
}) {
  const data = useFinanceData();
  const mergeVendors = useFinanceStore((s) => s.mergeVendors);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [deleting, setDeleting] = useState(false);
  const [mergeId, setMergeId] = useState("");
  const others = data.vendors.filter((v) => v.id !== vendor.id);
  useEffect(() => {
    const { id: _id, ...rest } = vendor;
    setForm(rest);
    setMergeId("");
  }, [vendor]);
  return (
    <>
      <PartyFields
        form={form}
        setForm={setForm}
        extra={
          <Field label="Their account #">
            <Input
              id="edit-vendor-account"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            />
          </Field>
        }
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!form.name.trim()) return toast.error("Vendor name is required.");
            onSave(form);
          }}
        >
          Save
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </div>
      {others.length > 0 ? (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium">Merge into this vendor</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Moves bills, checks, and recurring items from the other name. The other vendor is removed.
          </p>
          <div className="flex flex-wrap gap-2">
            <Select value={mergeId} onValueChange={setMergeId}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Duplicate to absorb" />
              </SelectTrigger>
              <SelectContent>
                {others.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!mergeId}
              onClick={() => {
                try {
                  mergeVendors(vendor.id, mergeId);
                  toast.success("Merged. History now sits on this vendor.");
                  setMergeId("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not merge.");
                }
              }}
            >
              Merge
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDelete
        open={deleting}
        title="Delete vendor?"
        body={`${vendor.name} will be removed. This is blocked if bills still point here.`}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          try {
            onDelete();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not delete.");
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
