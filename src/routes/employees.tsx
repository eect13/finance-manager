import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DateInput } from "@/components/date-input";
import { Field } from "@/components/field";
import { BankCombo } from "@/components/bank-combo";
import { CardGrid } from "@/components/doc-cards";
import { ListViewMenu } from "@/components/list-view-menu";
import { useListView } from "@/components/view-toggle";
import { FilterPills, ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { ListCard, listColClass, listColWidthStyle, listTableStyle} from "@/components/list-table";
import { Money } from "@/components/money";
import { ActionsHeader, SortHeader } from "@/components/sort-header";
import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { useListVirtualizer, VirtPad } from "@/components/use-list-virtualizer";
import { useColVisible, visibleTableWidth, viewColumnExtra } from "@/components/column-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatMoney, parseAmountToCents, todayIso } from "@/lib/finance/format";
import { computePhPayroll, periodPayAmount } from "@/lib/finance/ph-payroll";
import { useEntrySort } from "@/lib/finance/sort";
import { EMPTY_EMPLOYEE, type Employee, type PayPeriod, type PayType } from "@/lib/finance/types";
import { stopOpen } from "@/lib/finance/open-record";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/employees")({ component: EmployeesPage });

const EMP_COLS = {
  name: 180,
  title: 140,
  rate: 128,
  bank: 120,
  status: 100,
  actions: 240,
} as const;

const EMP_SORT = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "title:asc", label: "Title A–Z" },
  { value: "rate:desc", label: "Rate high–low" },
  { value: "rate:asc", label: "Rate low–high" },
  { value: "hireDate:desc", label: "Hired · newest" },
  { value: "hireDate:asc", label: "Hired · oldest" },
  { value: "status:asc", label: "Status" },
];

const EMP_CHIPS = [
  { id: "name", label: "Name" },
  { id: "title", label: "Title" },
  { id: "rate", label: "Rate" },
  { id: "bank", label: "Bank" },
  { id: "status", label: "Status" },
] as const;
const EMP_VIS_IDS = EMP_CHIPS.map((c) => c.id);

type FormState = {
  name: string;
  title: string;
  email: string;
  phone: string;
  payType: PayType;
  rate: string;
  bankId: string;
  hireDate: string;
  payPeriod: PayPeriod;
  notes: string;
  active: boolean;
  statutory: boolean;
};

function toForm(e?: Employee | null): FormState {
  if (!e) {
    return {
      name: "",
      title: "",
      email: "",
      phone: "",
      payType: "salary",
      rate: "",
      bankId: "",
      hireDate: todayIso(),
      payPeriod: "monthly",
      notes: "",
      active: true,
      statutory: true,
    };
  }
  return {
    name: e.name,
    title: e.title,
    email: e.email,
    phone: e.phone,
    payType: e.payType,
    rate: e.rate ? String(e.rate / 100) : "",
    bankId: e.bankId,
    hireDate: e.hireDate || todayIso(),
    payPeriod: e.payPeriod ?? "monthly",
    notes: e.notes,
    active: e.active,
    statutory: e.statutory !== false,
  };
}

function EmployeesPage() {
  const data = useFinanceData();
  const addEmployee = useFinanceStore((s) => s.addEmployee);
  const updateEmployee = useFinanceStore((s) => s.updateEmployee);
  const removeEmployee = useFinanceStore((s) => s.removeEmployee);
  const payEmployee = useFinanceStore((s) => s.payEmployee);
  const payEmployees = useFinanceStore((s) => s.payEmployees);
  const banks = data.banks.filter((b) => !b.archived);

  const [query, setQuery] = useState("");
  const [view, setView] = useListView("employees");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [payTypeFilter, setPayTypeFilter] = useState<"all" | PayType>("all");

  const getters = useMemo(
    () => ({
      name: (e: Employee) => e.name,
      title: (e: Employee) => e.title || "",
      rate: (e: Employee) => e.rate,
      bank: (e: Employee) => data.banks.find((b) => b.id === e.bankId)?.nickname ?? "",
      hireDate: (e: Employee) => e.hireDate || "",
      status: (e: Employee) => (e.active ? "0-active" : "1-inactive"),
      payType: (e: Employee) => e.payType,
      order: (e: Employee) => e.sortOrder,
    }),
    [data.banks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.employees ?? []).filter((e) => {
      if (statusFilter === "active" && !e.active) return false;
      if (statusFilter === "inactive" && e.active) return false;
      if (payTypeFilter !== "all" && e.payType !== payTypeFilter) return false;
      if (!q) return true;
      const bank = data.banks.find((b) => b.id === e.bankId)?.nickname ?? "";
      return [e.name, e.title, e.email, e.phone, e.notes, bank, e.payType].join(" ").toLowerCase().includes(q);
    });
  }, [data.employees, data.banks, query, statusFilter, payTypeFilter]);

  const sort = useEntrySort(filtered, "name", getters, "asc");
  const cols = useColWidths("finance-manager-employees-cols", EMP_COLS);
  const vis = useColVisible("finance-manager-employees-vis", EMP_VIS_IDS);
  const colAligns = useColAligns("finance-manager-employees-col-aligns-v3", Object.keys(EMP_COLS) as Array<keyof typeof EMP_COLS>, { name: "left", rate: "right" });
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((e) => e.id),
    onOpen: (id) => {
      const emp = sort.sorted.find((e) => e.id === id);
      if (emp) openEdit(emp);
    },
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const listVirt = useListVirtualizer(sort.sorted.length, gridRef, (index) => sort.sorted[index]?.id ?? index, 48, view === "list");
  function fit(id: keyof typeof EMP_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  function fitAll() {
    (Object.keys(EMP_COLS) as Array<keyof typeof EMP_COLS>).forEach((id) => {
      if (vis.on[id] === false) return;
      fit(id, EMP_CHIPS.find((c) => c.id === id)?.label ?? "Actions");
    });
  }
  const activeCount = (data.employees ?? []).filter((e) => e.active).length;

  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm());
  const [dropId, setDropId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payHours, setPayHours] = useState("");
  const [payWithholding, setPayWithholding] = useState("");
  const [payDate, setPayDate] = useState(todayIso());
  const [payBankId, setPayBankId] = useState("");
  const [runOpen, setRunOpen] = useState(false);
  const [runDate, setRunDate] = useState(todayIso());
  const [runBankId, setRunBankId] = useState("");
  const [payStatutory, setPayStatutory] = useState(true);

  const editing = editId ? (data.employees ?? []).find((e) => e.id === editId) : null;
  const payingEmp = payId ? (data.employees ?? []).find((e) => e.id === payId) : null;
  const dialogOpen = creating || Boolean(editing);

  function openNew() {
    setEditId(null);
    setCreating(true);
    const bankId = banks.find((b) => b.nickname === "Payroll")?.id ?? banks[0]?.id ?? "";
    setForm({ ...toForm(null), bankId });
  }

  function openEdit(e: Employee) {
    setCreating(false);
    setEditId(e.id);
    setForm(toForm(e));
  }

  function closeDialog() {
    setCreating(false);
    setEditId(null);
  }

  function saveEmployee() {
    try {
      const payload = {
        name: form.name,
        title: form.title,
        email: form.email,
        phone: form.phone,
        payType: form.payType,
        rate: parseAmountToCents(form.rate),
        bankId: form.bankId,
        hireDate: form.hireDate,
        payPeriod: form.payPeriod,
        notes: form.notes,
        active: form.active,
        statutory: form.statutory,
      };
      if (editing) {
        updateEmployee(editing.id, payload);
        toast.success("Employee updated.");
      } else {
        addEmployee({ ...EMPTY_EMPLOYEE, ...payload });
        toast.success("Employee added.");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save employee.");
    }
  }

  function openPay(e: Employee) {
    setPayId(e.id);
    setPayDate(todayIso());
    setPayBankId(e.bankId || banks[0]?.id || "");
    setPayHours("");
    setPayWithholding("");
    setPayStatutory(e.statutory !== false);
    const periodAmt = periodPayAmount(e.rate, e.payPeriod ?? "monthly", e.payType);
    setPayAmount(e.payType === "salary" && periodAmt ? String(periodAmt / 100) : "");
  }

  function runPay() {
    if (!payId) return;
    try {
      payEmployee({
        employeeId: payId,
        amount: parseAmountToCents(payAmount),
        hours: payHours ? Number(payHours) : undefined,
        withholding: parseAmountToCents(payWithholding),
        date: payDate,
        bankId: payBankId,
        statutory: payStatutory,
      });
      toast.success("Paycheck posted to the register.");
      setPayId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post paycheck.");
    }
  }

  function runPayAll() {
    try {
      const result = payEmployees({ date: runDate, bankId: runBankId || undefined });
      const hourly = result.skippedHourly
        ? ` ${result.skippedHourly} hourly ${result.skippedHourly === 1 ? "person needs" : "people need"} hours — post those one at a time.`
        : "";
      toast.success(
        result.posted === 1 ? `1 paycheck posted.${hourly}` : `${result.posted} paychecks posted.${hourly}`,
      );
      setRunOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post pay run.");
    }
  }

  return (
    <AppShell
      title="Employees"
      description="People on payroll. Keep a roster, set pay type and rate, and post paychecks to a bank — the check lands in Register like any other payment."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              setRunDate(todayIso());
              setRunBankId(banks[0]?.id ?? "");
              setRunOpen(true);
            }}
            disabled={activeCount === 0}
          >
            Pay all active
          </Button>
          <Button onClick={openNew}>+ Add employee</Button>
        </>
      }
    >
      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="eyebrow">Active</p>
            <p className="mt-2 text-2xl font-medium tabular-nums">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="eyebrow">On file</p>
            <p className="mt-2 text-2xl font-medium tabular-nums">{(data.employees ?? []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="eyebrow">Showing</p>
            <p className="mt-2 text-2xl font-medium tabular-nums">{sort.sorted.length}</p>
          </CardContent>
        </Card>
      </section>

      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, title, email, bank…"
        label="Search employees"
      >
        <FilterPills
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ]}
        />
        <FilterPills
          label="Pay type"
          value={payTypeFilter}
          onChange={setPayTypeFilter}
          options={[
            { id: "all", label: "Any pay" },
            { id: "salary", label: "Salary" },
            { id: "hourly", label: "Hourly" },
          ]}
        />
        <ListFilters
          selects={[]}
          sortValue={`${sort.key}:${sort.dir}`}
          sortOptions={EMP_SORT}
          onSort={(v) => applySortValue(sort.set, v)}
          onClear={() => {
            setQuery("");
            setStatusFilter("all");
            setPayTypeFilter("all");
            sort.set("name", "asc");
          }}
        />
        <ListViewMenu
          layout={view}
          onLayout={setView}
          hiddenCount={view === "list" ? vis.hiddenCount : undefined}
          extra={view === "list" ? viewColumnExtra(EMP_CHIPS, vis) : undefined}
          onFitAll={view === "list" ? fitAll : undefined}
        />
      </ListToolbar>

      {view === "grid" ? (
        <CardGrid
          items={sort.sorted}
          empty={
            (data.employees ?? []).length === 0
              ? "No employees yet. Add someone to start payroll checks."
              : "No employees match this search or filter."
          }
          getId={(e) => e.id}
          estimateSize={140}
        >
          {(e) => {
            const bank = data.banks.find((b) => b.id === e.bankId);
            return (
              <div className="item-card text-left">
                <span className="flex items-start justify-between gap-2">
                  <button type="button" className="item-card-title block min-w-0 break-words text-left font-medium hover:underline" onClick={() => openEdit(e)}>
                    {e.name}
                  </button>
                  <Badge variant={e.active ? "default" : "voided"}>{e.active ? "Active" : "Inactive"}</Badge>
                </span>
                <span className="item-card-meta block break-words text-muted-foreground">
                  {[e.title, e.payType === "hourly" ? "Hourly" : "Salary", bank?.nickname].filter(Boolean).join(" · ")}
                </span>
                <Money amount={e.rate} currency={data.settings.currency} className="item-card-amount mt-1 font-medium tabular-nums" />
                <span className="item-card-meta text-muted-foreground">{e.payType === "hourly" ? "/ hr" : "/ mo"}</span>
                <div className="mt-2" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
                  <RowActions
                    primary={
                      <Button size="sm" variant="outline" disabled={!e.active} onClick={() => openPay(e)}>
                        Pay
                      </Button>
                    }
                    primaryAsItem={
                      e.active
                        ? { label: "Pay", onSelect: () => openPay(e) }
                        : undefined
                    }
                    items={[
                      { label: "Edit", onSelect: () => openEdit(e) },
                      { label: "Delete", onSelect: () => setDropId(e.id), danger: true },
                    ]}
                  />
                </div>
              </div>
            );
          }}
        </CardGrid>
      ) : (
      <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="outline-none" {...vis.hideAttrs}>
        <table ref={cols.tableRef} className="text-sm" style={listTableStyle(visibleTableWidth(cols.widths, vis.on))}>
          <colgroup>
            {(Object.keys(EMP_COLS) as Array<keyof typeof EMP_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={listColWidthStyle(id, cols.widths[id], vis.on[id] !== false)} data-col={id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Name" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Name")} align={colAligns.aligns.name ?? "left"} onAlign={(a) => colAligns.setAlign("name", a)} fill />
              <SortHeader label="Title" column="title" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.title} onWidth={(n) => cols.setWidth("title", n)} onFit={() => fit("title", "Title")} align={colAligns.aligns.title ?? "center"} onAlign={(a) => colAligns.setAlign("title", a)} />
              <SortHeader label="Pay" column="rate" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.rate} onWidth={(n) => cols.setWidth("rate", n)} onFit={() => fit("rate", "Pay")} align={colAligns.aligns.rate ?? "right"} onAlign={(a) => colAligns.setAlign("rate", a)} />
              <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.bank} onWidth={(n) => cols.setWidth("bank", n)} onFit={() => fit("bank", "Bank")} align={colAligns.aligns.bank ?? "center"} onAlign={(a) => colAligns.setAlign("bank", a)} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} align={colAligns.aligns.status ?? "center"} onAlign={(a) => colAligns.setAlign("status", a)} />
              <ActionsHeader width={cols.widths.actions} onWidth={(n) => cols.setWidth("actions", n)} onFit={() => fit("actions", "Actions")} />
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {(data.employees ?? []).length === 0
                    ? "No employees yet. Add someone to start payroll checks."
                    : "No employees match this search or filter."}
                </td>
              </tr>
            ) : (
              <>
              <VirtPad height={listVirt.padTop} colSpan={6} />
              {listVirt.items.map((v) => {
                const e = sort.sorted[v.index];
                if (!e) return null;
                const bank = data.banks.find((b) => b.id === e.bankId);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border/70"
                    data-focused={pointer.activeId === e.id ? "true" : undefined}
                    data-row-id={e.id}
                    aria-current={pointer.activeId === e.id ? "true" : undefined}
                    title="Double-tap, double-click, or press Enter to open"
                    onClick={() => pointer.setActiveId(e.id)}
                    onDoubleClick={() => openEdit(e)}
                  >
                    <td className={cn("px-4 py-3", alignClass(colAligns.aligns.name ?? "left"))} data-col="name" data-align={colAligns.aligns.name ?? "left"}>
                      <button type="button" className="font-medium hover:underline" onClick={() => openEdit(e)}>
                        {e.name}
                      </button>
                      {e.email ? <p className="text-xs text-muted-foreground">{e.email}</p> : null}
                    </td>
                    <td className={cn("px-4 py-3 text-muted-foreground", alignClass(colAligns.aligns.title ?? "center"))} data-col="title" data-align={colAligns.aligns.title ?? "center"}>{e.title || "—"}</td>
                    <td className={cn("px-4 py-3", alignClass(colAligns.aligns.rate ?? "right"))} data-col="rate" data-align={colAligns.aligns.rate ?? "right"}>
                      <Money amount={e.rate} currency={data.settings.currency} />
                      <span className="ml-1 text-xs text-muted-foreground">{e.payType === "hourly" ? "/ hr" : "/ mo"}</span>
                    </td>
                    <td className={cn("px-4 py-3 text-muted-foreground", alignClass(colAligns.aligns.bank ?? "center"))} data-col="bank" data-align={colAligns.aligns.bank ?? "center"}>{bank?.nickname ?? "—"}</td>
                    <td className={cn("px-4 py-3", alignClass(colAligns.aligns.status ?? "center"))} data-col="status" data-align={colAligns.aligns.status ?? "center"}>
                      <Badge variant={e.active ? "default" : "voided"}>{e.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="col-actions" data-col="actions" onClick={stopOpen} onDoubleClick={stopOpen} onPointerDown={stopOpen}>
                      <RowActions
                        primary={
                          <Button size="sm" variant="outline" disabled={!e.active} onClick={() => openPay(e)}>
                            Pay
                          </Button>
                        }
                        primaryAsItem={
                          e.active
                            ? { label: "Pay", onSelect: () => openPay(e) }
                            : undefined
                        }
                        items={[
                          { label: "Edit", onSelect: () => openEdit(e) },
                          { label: "Delete", onSelect: () => setDropId(e.id), danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              <VirtPad height={listVirt.padBottom} colSpan={6} />
              </>
            )}
          </tbody>
        </table>
      </ListCard>
      )}

      <Dialog open={dialogOpen} onOpenChange={(on) => (!on ? closeDialog() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? editing.name : "New employee"}</DialogTitle>
            <DialogDescription>
              Roster details for paychecks. Hourly rate is per hour; salary is monthly. PH statutory (SSS, PhilHealth, Pag-IBIG, TRAIN) is on by default.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Pay type">
              <Select value={form.payType} onValueChange={(v) => setForm({ ...form, payType: v as PayType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.payType === "hourly" ? "Hourly rate" : "Monthly salary"}>
              <Input inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </Field>
            <Field label="Default pay bank">
              <BankCombo
                valueId={form.bankId}
                onChoose={(id) => setForm({ ...form, bankId: id })}
                label="Default pay bank"
                placeholder="Type a bank"
              />
            </Field>
            <Field label="Hire date">
              <DateInput value={form.hireDate} onChange={(iso) => setForm({ ...form, hireDate: iso })} />
            </Field>
            <Field label="Pay period">
              <Select
                value={form.payPeriod}
                onValueChange={(v) => setForm({ ...form, payPeriod: v as PayPeriod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every two weeks</SelectItem>
                  <SelectItem value="semimonthly">Twice a month</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <Field label="PH statutory (2026)">
              <div className="flex h-10 items-center gap-2">
                <Switch checked={form.statutory} onCheckedChange={(v) => setForm({ ...form, statutory: v })} />
                <span className="text-sm text-muted-foreground">SSS, PhilHealth, Pag-IBIG, TRAIN</span>
              </div>
            </Field>
            <Field label="Status">
              <Select value={form.active ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, active: v === "active" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={saveEmployee}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payId)} onOpenChange={(on) => (!on ? setPayId(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post paycheck</DialogTitle>
            <DialogDescription>
              Writes a check from the selected bank. Hourly is hours × rate. PH statutory computes SSS, PhilHealth, Pag-IBIG, and TRAIN withholding for this period.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Date">
              <DateInput value={payDate} onChange={setPayDate} />
            </Field>
            <Field label="Bank">
              <BankCombo valueId={payBankId} onChoose={(id) => setPayBankId(id)} placeholder="Type a bank" />
            </Field>
            {payingEmp?.payType === "hourly" ? (
              <Field label="Hours">
                <Input
                  inputMode="decimal"
                  value={payHours}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPayHours(v);
                    const h = Number(v);
                    if (payingEmp.rate && Number.isFinite(h) && h > 0) {
                      setPayAmount(String((h * payingEmp.rate) / 100));
                    }
                  }}
                />
              </Field>
            ) : null}
            <Field label={payingEmp?.payType === "hourly" ? "Gross" : "Amount"}>
              <Input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
            <Field label="PH statutory (2026)">
              <div className="flex h-10 items-center gap-2">
                <Switch checked={payStatutory} onCheckedChange={setPayStatutory} />
                <span className="text-sm text-muted-foreground">SSS, PhilHealth, Pag-IBIG, TRAIN</span>
              </div>
            </Field>
            <Field label="Other deduction">
              <Input inputMode="decimal" value={payWithholding} onChange={(e) => setPayWithholding(e.target.value)} />
            </Field>
            {payingEmp ? (
              <PayPreview
                emp={payingEmp}
                amount={payAmount}
                hours={payHours}
                extra={payWithholding}
                statutory={payStatutory}
                currency={data.settings.currency}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayId(null)}>
              Cancel
            </Button>
            <Button onClick={runPay}>Post paycheck</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay all active</DialogTitle>
            <DialogDescription>
              Posts a period paycheck for each active salaried employee (weekly is 12/52 of monthly, twice a month is half). Hourly people need hours on a single slip. PH statutory is taken from each employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Date">
              <DateInput value={runDate} onChange={setRunDate} />
            </Field>
            <Field label="Bank">
              <BankCombo valueId={runBankId} onChoose={(id) => setRunBankId(id)} placeholder="Type a bank" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runPayAll}>Post pay run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(dropId)}
        title="Delete this employee?"
        body="Removes them from the roster. Past paychecks in the register stay."
        confirmLabel="Delete"
        onClose={() => setDropId(null)}
        onConfirm={() => {
          if (dropId) {
            try {
              removeEmployee(dropId);
              toast.success("Employee deleted.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not delete.");
            }
          }
          setDropId(null);
        }}
      />
    </AppShell>
  );
}

function PayPreview({
  emp,
  amount,
  hours,
  extra,
  statutory,
  currency,
}: {
  emp: Employee;
  amount: string;
  hours: string;
  extra: string;
  statutory: boolean;
  currency: string;
}) {
  const h = Number(hours);
  const gross =
    emp.payType === "hourly" && Number.isFinite(h) && h > 0
      ? Math.round(h * emp.rate)
      : parseAmountToCents(amount);
  const parts = computePhPayroll({
    gross,
    period: emp.payPeriod ?? "monthly",
    statutory,
    extra: parseAmountToCents(extra),
  });
  const row = (label: string, cents: number) =>
    cents ? (
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{formatMoney(cents, currency)}</span>
      </div>
    ) : null;
  return (
    <div className="rounded-xl border border-border px-3 py-2.5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">This paycheck</p>
      {row("Gross", gross)}
      {row("SSS", parts.sssEe)}
      {row("PhilHealth", parts.philEe)}
      {row("Pag-IBIG", parts.pagEe)}
      {row("Withholding tax", parts.bir)}
      {row("Other", parts.extra)}
      <div className="mt-2 flex justify-between gap-3 text-sm font-medium">
        <span>Net</span>
        <span className="tabular-nums">{formatMoney(parts.net, currency)}</span>
      </div>
      {row("Employer contributions", parts.employerCost)}
    </div>
  );
}
