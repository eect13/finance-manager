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
import { ArrowLeft, ChevronDown, PanelRightClose, Plus, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { useColVisible, visibleTableWidth, viewColumnExtra } from "@/components/column-chips";
import { ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue, useListPeriod, type FilterSelect } from "@/components/list-filters";
import { ListCard, listColClass, listColWidthStyle, listTableStyle } from "@/components/list-table";
import { ListViewMenu } from "@/components/list-view-menu";
import { useListView } from "@/components/view-toggle";
import { useListVirtualizer, VirtPad } from "@/components/use-list-virtualizer";

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
const TXN_CHIPS = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "number", label: "No." },
  { id: "memo", label: "Memo" },
  { id: "amount", label: "Amount" },
  { id: "open", label: "Open" },
  { id: "balance", label: "Balance" },
  { id: "status", label: "Status" },
] as const;
const TXN_VIS_IDS = TXN_CHIPS.map((c) => c.id);

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
  const colAligns = useColAligns("finance-manager-party-txn-col-aligns", Object.keys(TXN_COLS) as Array<keyof typeof TXN_COLS>);
  const pointer = useTableKeyboardFocus({ ids, onOpen: openRow });
  const wrapRef = useRef<HTMLDivElement>(null);
  const cols = useColWidths("finance-manager-party-txn-cols", TXN_COLS);
  const vis = useColVisible("finance-manager-party-txn-vis", TXN_VIS_IDS);
  const listVirt = useListVirtualizer(sort.sorted.length, wrapRef, (index) => {
    const row = sort.sorted[index];
    return row ? `${row.openKind}-${row.id}` : index;
  });

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
        <ListViewMenu
          hiddenCount={vis.hiddenCount}
          extra={viewColumnExtra(TXN_CHIPS, vis)}
          onFitAll={() => {
            (Object.keys(TXN_COLS) as Array<keyof typeof TXN_COLS>).forEach((id) => {
              if (vis.on[id] === false) return;
              fit(id, TXN_CHIPS.find((c) => c.id === id)?.label ?? id);
            });
          }}
        />
      </ListToolbar>
      {sort.sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{query.trim() ? "No transactions match." : empty}</p>
      ) : (
        <ListCard
          ref={pointer.bindContainer(wrapRef)}
          className="party-txn-table outline-none"
          tabIndex={0}
          {...vis.hideAttrs}
        >
          <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
            <colgroup>
              {(Object.keys(TXN_COLS) as Array<keyof typeof TXN_COLS>).map((id) => (
                <col key={id} className={cn(`col-txn-${id}`, listColClass(id))} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <SortHeader label="Date" column="date" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-date" width={cols.widths.date} onWidth={(n) => cols.setWidth("date", n)} onFit={() => fit("date", "Date")} 
                align={colAligns.aligns.date ?? "center"}
                onAlign={(a) => colAligns.setAlign("date", a)}
              />
                <SortHeader label="Type" column="type" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-type" width={cols.widths.type} onWidth={(n) => cols.setWidth("type", n)} onFit={() => fit("type", "Type")} align={colAligns.aligns.type ?? "center"} onAlign={(a) => colAligns.setAlign("type", a)} />
                <SortHeader label="No." column="number" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-number" width={cols.widths.number} onWidth={(n) => cols.setWidth("number", n)} onFit={() => fit("number", "No.")} align={colAligns.aligns.number ?? "center"} onAlign={(a) => colAligns.setAlign("number", a)} />
                <SortHeader label="Memo" column="memo" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-memo" width={cols.widths.memo} onWidth={(n) => cols.setWidth("memo", n)} onFit={() => fit("memo", "Memo")} align={colAligns.aligns.memo ?? "center"} onAlign={(a) => colAligns.setAlign("memo", a)} fill />
                <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-amount" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} align={colAligns.aligns.amount ?? "center"} onAlign={(a) => colAligns.setAlign("amount", a)} />
                <SortHeader label="Open" column="open" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-open" width={cols.widths.open} onWidth={(n) => cols.setWidth("open", n)} onFit={() => fit("open", "Open")} align={colAligns.aligns.open ?? "center"} onAlign={(a) => colAligns.setAlign("open", a)} />
                <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-balance" width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} align={colAligns.aligns.balance ?? "center"} onAlign={(a) => colAligns.setAlign("balance", a)} />
                <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-txn-status" width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} align={colAligns.aligns.status ?? "center"} onAlign={(a) => colAligns.setAlign("status", a)} />
              </tr>
            </thead>
            <tbody>
              <VirtPad height={listVirt.padTop} colSpan={8} />
              {listVirt.items.map((v) => {
                const row = sort.sorted[v.index];
                if (!row) return null;
                const key = `${row.openKind}-${row.id}`;
                return (
                  <tr
                    key={key}
                    className="cursor-pointer"
                    data-focused={pointer.activeId === key ? "true" : undefined}
                    data-row-id={key}
                    aria-current={pointer.activeId === key ? "true" : undefined}
                    {...openProps(row.openKind, row.id, { click: tapOpens })}
                    onClick={(e) => {
                      pointer.setActiveId(key);
                      if (tapOpens) {
                        e.preventDefault();
                        openTxn(row.openKind, row.id);
                      }
                    }}
                  >
                    <td className={cn("col-txn-date px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.date ?? "center"))} data-col="date" data-align={colAligns.aligns.date ?? "center"}>{formatRegisterDate(row.date)}</td>
                    <td className={cn("col-txn-type px-3 py-2", alignClass(colAligns.aligns.type ?? "center"))} data-col="type" data-align={colAligns.aligns.type ?? "center"}>{row.type}</td>
                    <td className={cn("col-txn-number px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.number ?? "center"))} data-col="number" data-align={colAligns.aligns.number ?? "center"}>{row.number}</td>
                    <td className={cn("col-txn-memo px-3 py-2 text-muted-foreground", alignClass(colAligns.aligns.memo ?? "center"))} data-col="memo" data-align={colAligns.aligns.memo ?? "center"}>{row.memo || "—"}</td>
                    <td className={cn("col-txn-amount px-3 py-2 whitespace-nowrap", alignClass(colAligns.aligns.amount ?? "center"))} data-col="amount" data-align={colAligns.aligns.amount ?? "center"}>
                      <Money
                        amount={row.amount}
                        currency={currency}
                        className={row.openKind === "receipt" || row.openKind === "check" ? "text-credit" : undefined}
                      />
                    </td>
                    <td className={cn("col-txn-open px-3 py-2", alignClass(colAligns.aligns.open ?? "center"))} data-col="open" data-align={colAligns.aligns.open ?? "center"}>{row.open ? <Money amount={row.open} currency={currency} /> : "—"}</td>
                    <td className={cn("col-txn-balance px-3 py-2", alignClass(colAligns.aligns.balance ?? "center"))} data-col="balance" data-align={colAligns.aligns.balance ?? "center"}>
                      <Money amount={row.balance} currency={currency} />
                    </td>
                    <td className={cn("col-txn-status px-3 py-2", alignClass(colAligns.aligns.status ?? "center"))} data-col="status" data-align={colAligns.aligns.status ?? "center"}>
                      <TxnBadge row={row} />
                    </td>
                  </tr>
                );
              })}
              <VirtPad height={listVirt.padBottom} colSpan={8} />
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
    if (selectedId && !filtered.some((c) => c.id === selectedId)) setSelectedId(null);
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
    if (selectedId && !filtered.some((v) => v.id === selectedId)) setSelectedId(null);
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

const DIR_COLS = {
  name: 180,
  contact: 140,
  email: 180,
  phone: 128,
  balance: 128,
} as const;
const DIR_CHIPS = [
  { id: "name", label: "Name" },
  { id: "contact", label: "Contact" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "balance", label: "Open" },
] as const;
const DIR_VIS_IDS = DIR_CHIPS.map((c) => c.id);

function PartyDirectoryTable({
  kindLabel,
  list,
  selectedId,
  onSelect,
  onOpen,
  onHighlight,
  currency,
  vis,
}: {
  kindLabel: string;
  list: PartyDirRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  /** Focus sync only — must not reset detail tabs (unlike onSelect/pick). */
  onHighlight: (id: string) => void;
  currency: string;
  vis: ReturnType<typeof useColVisible>;
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
  const colAligns = useColAligns(`finance-manager-${kindLabel}-dir-col-aligns`, Object.keys(DIR_COLS) as Array<keyof typeof DIR_COLS>);
  const pointer = useTableKeyboardFocus({ ids, onOpen, onActive: onHighlight });
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.id ?? index);

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
      ref={pointer.bindContainer(gridRef)}
      data-party-dir
      tabIndex={0}
      className="party-dir-table list-grid min-w-0 max-w-full outline-none"
      onMouseDown={pointer.containerProps.onMouseDown}
      {...vis.hideAttrs}
    >
      <table ref={cols.tableRef} className="text-sm" style={{ width: visibleTableWidth(cols.widths, vis.on), minWidth: visibleTableWidth(cols.widths, vis.on) }}>
        <colgroup>
          {(Object.keys(DIR_COLS) as Array<keyof typeof DIR_COLS>).map((id) => (
            <col key={id} className={cn(`col-dir-${id}`, "col-fit")} style={vis.on[id] === false ? { width: 0, minWidth: 0 } : { width: cols.widths[id], minWidth: cols.widths[id] }} data-col={id} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Name" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-name" width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Name")} align={colAligns.aligns.name ?? "center"} onAlign={(a) => colAligns.setAlign("name", a)} />
            <SortHeader label="Contact" column="contact" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-contact" width={cols.widths.contact} onWidth={(n) => cols.setWidth("contact", n)} onFit={() => fit("contact", "Contact")} align={colAligns.aligns.contact ?? "center"} onAlign={(a) => colAligns.setAlign("contact", a)} />
            <SortHeader label="Email" column="email" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-email" width={cols.widths.email} onWidth={(n) => cols.setWidth("email", n)} onFit={() => fit("email", "Email")} align={colAligns.aligns.email ?? "center"} onAlign={(a) => colAligns.setAlign("email", a)} />
            <SortHeader label="Phone" column="phone" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-phone" width={cols.widths.phone} onWidth={(n) => cols.setWidth("phone", n)} onFit={() => fit("phone", "Phone")} align={colAligns.aligns.phone ?? "center"} onAlign={(a) => colAligns.setAlign("phone", a)} />
            <SortHeader label="Open" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} className="col-dir-balance" width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Open")} align={colAligns.aligns.balance ?? "center"} onAlign={(a) => colAligns.setAlign("balance", a)} />
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
            <>
              <VirtPad height={listVirt.padTop} colSpan={5} />
              {listVirt.items.map((v) => {
                const row = sort.sorted[v.index];
                if (!row) return null;
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-border/70 last:border-0"
                    data-selected={selectedId === row.id ? "true" : undefined}
                    data-focused={pointer.activeId === row.id ? "true" : undefined}
                    data-row-id={row.id}
                    aria-current={pointer.activeId === row.id ? "true" : undefined}
                    onClick={() => {
                      pointer.setActiveId(row.id);
                      onSelect(row.id);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      onOpen(row.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget === e.target) {
                        e.preventDefault();
                        onOpen(row.id);
                      }
                    }}
                  >
                    <td className={cn("px-4 py-3 font-medium", alignClass(colAligns.aligns.name ?? "center"))} data-col="name" data-align={colAligns.aligns.name ?? "center"}>{row.title}</td>
                    <td className={cn("px-4 py-3 text-muted-foreground", alignClass(colAligns.aligns.contact ?? "center"))} data-col="contact" data-align={colAligns.aligns.contact ?? "center"}>{row.contact || "—"}</td>
                    <td className={cn("px-4 py-3 text-muted-foreground truncate", alignClass(colAligns.aligns.email ?? "center"))} data-col="email" data-align={colAligns.aligns.email ?? "center"} title={row.email || undefined}>{row.email || "—"}</td>
                    <td className={cn("px-4 py-3 text-muted-foreground", alignClass(colAligns.aligns.phone ?? "center"))} data-col="phone" data-align={colAligns.aligns.phone ?? "center"}>{row.phone || "—"}</td>
                    <td className={cn("px-4 py-3", alignClass(colAligns.aligns.balance ?? "center"))} data-col="balance" data-align={colAligns.aligns.balance ?? "center"}>
                      <Money amount={row.balance} currency={currency} />
                    </td>
                  </tr>
                );
              })}
              <VirtPad height={listVirt.padBottom} colSpan={5} />
            </>
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
                "party-card-row text-left",
                on && "bg-primary/10",
              )}
              onClick={() => onSelect(item.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                onOpen(item.id);
              }}
            >
              <span className="item-card-title block truncate font-medium">{item.title}</span>
              <span className="item-card-meta mt-1 block truncate text-muted-foreground">{item.subtitle}</span>
              <Money amount={item.balance} currency={currency} className="item-card-amount mt-1 font-medium tabular-nums" />
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
  onSelect: (id: string | null) => void;
  emptyList: string;
  currency: string;
  detail: ReactNode;
  extra?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useListView(`${kindLabel}-dir`);
  const dirVis = useColVisible(`finance-manager-${kindLabel}-dir-vis`, DIR_VIS_IDS);
  const [balFilter, setBalFilter] = useState<"all" | "open" | "zero">("all");
  const [detailTab, setDetailTab] = useState("transactions");
  const tapOpens = useTapOpens();

  const visible = useMemo(() => {
    if (balFilter === "open") return list.filter((row) => row.balance > 0);
    if (balFilter === "zero") return list.filter((row) => row.balance === 0);
    return list;
  }, [list, balFilter]);

  function highlight(id: string) {
    onSelect(id);
  }

  function hideDetail() {
    onSelect(null);
    setMobileOpen(false);
  }

  function pick(id: string) {
    onSelect(id);
    setMobileOpen(true);
    setDetailTab("transactions");
  }

  function openDetails(id: string) {
    onSelect(id);
    setMobileOpen(true);
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
        <ListViewMenu
          layout={view}
          onLayout={setView}
          hiddenCount={dirVis.hiddenCount}
          extra={viewColumnExtra(DIR_CHIPS, dirVis)}
        />
        {selectedId ? (
          <Button variant="outline" className="no-print w-fit" onClick={hideDetail}>
            <PanelRightClose />
            Hide details
          </Button>
        ) : null}
        <Button className="no-print w-fit" onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </ListToolbar>
      <div className="party-center min-w-0" data-view={view} data-pane={mobileOpen ? "detail" : "list"} data-has-selection={selectedId ? "true" : "false"}>
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
            <PartyDirectoryTable kindLabel={kindLabel} list={visible} selectedId={selectedId} onSelect={pick} onOpen={tapOpens ? pick : openDetails} onHighlight={highlight} currency={currency} vis={dirVis} />
          )}
        </aside>
        <section className={cn("party-pane-detail min-w-0 rounded-3xl bg-card elevation", !mobileOpen && "is-list")}>
          <div className="party-pane-back no-print border-b border-border px-3 py-2">
            <Button variant="ghost" size="sm" onClick={hideDetail}>
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
            <span className="hidden sm:inline">Click to select. Double-tap or double-click or Enter to open.</span>
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
