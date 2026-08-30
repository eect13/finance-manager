import { Field } from "@/components/field";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/finance/format";
import { customerOpenBalance, vendorOpenBalance } from "@/lib/finance/ledger";
import { openProps } from "@/lib/finance/open-record";
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
import { EMPTY_CUSTOMER, EMPTY_VENDOR, type Customer, type Vendor } from "@/lib/finance/types";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CsvButton } from "@/components/export-menu";

export function PartyTxnTable({
  rows,
  currency,
  empty,
}: {
  rows: PartyTxn[];
  currency: string;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="party-txn-table overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>No.</th>
            <th>Memo</th>
            <th className="num">Amount</th>
            <th className="num">Open</th>
            <th className="num">Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.openKind}-${row.id}`}
              className="cursor-pointer"
              {...openProps(row.openKind, row.id, { click: true })}
            >
              <td className="whitespace-nowrap">{formatDate(row.date)}</td>
              <td>{row.type}</td>
              <td className="whitespace-nowrap">{row.number}</td>
              <td className="text-muted-foreground">{row.memo || "—"}</td>
              <td className="num">
                <Money
                  amount={row.amount}
                  currency={currency}
                  className={row.openKind === "receipt" || row.openKind === "check" ? "text-credit" : undefined}
                />
              </td>
              <td className="num">{row.open ? <Money amount={row.open} currency={currency} /> : "—"}</td>
              <td className="num">
                <Money amount={row.balance} currency={currency} />
              </td>
              <td>
                <TxnBadge row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1 no-print" role="group" aria-label="Transaction type">
      {options.map((opt) => (
        <Button
          key={opt.id}
          type="button"
          size="sm"
          variant={value === opt.id ? "default" : "ghost"}
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export function CustomerCenter() {
  const data = useFinanceData();
  const addCustomer = useFinanceStore((s) => s.addCustomer);
  const updateCustomer = useFinanceStore((s) => s.updateCustomer);
  const removeCustomer = useFinanceStore((s) => s.removeCustomer);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(data.customers[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [txnFilter, setTxnFilter] = useState<CustomerTxnFilter>("all");
  const [createKind, setCreateKind] = useState<CustomerCreateKind | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.customers]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((c) => (!q ? true : [c.name, c.contact, c.email, c.phone].join(" ").toLowerCase().includes(q)));
  }, [data.customers, query]);

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
            filterBar={
              <FilterPills
                value={txnFilter}
                onChange={setTxnFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "invoice", label: "Invoices" },
                  { id: "payment", label: "Payments" },
                  { id: "cash-sale", label: "Cash sales" },
                ]}
              />
            }
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
  const [selectedId, setSelectedId] = useState<string | null>(data.vendors[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [txnFilter, setTxnFilter] = useState<VendorTxnFilter>("all");
  const [createKind, setCreateKind] = useState<VendorCreateKind | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.vendors]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((v) => (!q ? true : [v.name, v.contact, v.email, v.phone].join(" ").toLowerCase().includes(q)));
  }, [data.vendors, query]);

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
            filterBar={
              <FilterPills
                value={txnFilter}
                onChange={setTxnFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "bill", label: "Bills" },
                  { id: "check", label: "Checks" },
                ]}
              />
            }
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
  list: Array<{ id: string; title: string; subtitle: string; balance: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyList: string;
  currency: string;
  detail: ReactNode;
  extra?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-md no-print"
          aria-label={`Search ${kindLabel}s`}
        />
        <Button className="no-print w-fit sm:ml-auto" onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </div>
      <div className="party-center">
        <aside className={cn("rounded-3xl bg-card elevation", mobileOpen && "max-lg:hidden")}>
          <div role="listbox" aria-label={`${kindLabel}s`} className="divide-y divide-border">
            {list.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyList}</p>
            ) : (
              list.map((item) => {
                const on = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left",
                      on && "bg-primary/10",
                    )}
                    onClick={() => {
                      onSelect(item.id);
                      setMobileOpen(true);
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                    </span>
                    <Money amount={item.balance} currency={currency} className="shrink-0 text-sm" />
                  </button>
                );
              })
            )}
          </div>
        </aside>
        <section className={cn("rounded-3xl bg-card elevation", !mobileOpen && "max-lg:hidden")}>
          <div className="lg:hidden no-print border-b border-border px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
              <ArrowLeft />
              All {kindLabel}s
            </Button>
          </div>
          {detail}
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
  filterBar,
  history,
  emptyHistory,
  details,
}: {
  name: string;
  open: number;
  currency: string;
  actions: ReactNode;
  filterBar?: ReactNode;
  history: PartyTxn[];
  emptyHistory: string;
  details: ReactNode;
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
      <Tabs defaultValue="transactions" className="px-5 pb-5">
        <TabsList className="no-print">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <p className="mb-3 text-xs text-muted-foreground no-print">Tap a line to open and edit it.</p>
          {filterBar}
          <PartyTxnTable rows={history} currency={currency} empty={emptyHistory} />
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
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const { id: _id, ...rest } = customer;
    setForm(rest);
  }, [customer]);
  return (
    <>
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
        <Button variant="ghost" onClick={() => setDeleting(true)}>
          Delete
        </Button>
      </div>
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
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const { id: _id, ...rest } = vendor;
    setForm(rest);
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
