import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DateInput } from "@/components/date-input";
import { Field } from "@/components/field";
import { FilterPills, ListToolbar } from "@/components/filter-pills";
import { ListFilters, applySortValue } from "@/components/list-filters";
import { ListCard, listColClass } from "@/components/list-table";
import { Money } from "@/components/money";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { useTableKeyboardFocus } from "@/components/use-table-keyboard-focus";
import { useColAligns, alignClass } from "@/components/use-col-aligns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseAmountToCents, todayIso } from "@/lib/finance/format";
import { useEntrySort } from "@/lib/finance/sort";
import { EMPTY_EMPLOYEE, type Employee, type PayType } from "@/lib/finance/types";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/employees")({ component: EmployeesPage });

const EMP_COLS = {
  name: 180,
  title: 140,
  rate: 128,
  bank: 120,
  status: 100,
  actions: 200,
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

type FormState = {
  name: string;
  title: string;
  email: string;
  phone: string;
  payType: PayType;
  rate: string;
  bankId: string;
  hireDate: string;
  notes: string;
  active: boolean;
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
      notes: "",
      active: true,
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
    notes: e.notes,
    active: e.active,
  };
}

function EmployeesPage() {
  const data = useFinanceData();
  const addEmployee = useFinanceStore((s) => s.addEmployee);
  const updateEmployee = useFinanceStore((s) => s.updateEmployee);
  const removeEmployee = useFinanceStore((s) => s.removeEmployee);
  const payEmployee = useFinanceStore((s) => s.payEmployee);
  const banks = data.banks.filter((b) => !b.archived);

  const [query, setQuery] = useState("");
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
  const colAligns = useColAligns("finance-manager-employees-col-aligns", Object.keys(EMP_COLS) as Array<keyof typeof EMP_COLS>);
  const pointer = useTableKeyboardFocus({
    ids: sort.sorted.map((e) => e.id),
    onOpen: (id) => {
      const emp = sort.sorted.find((e) => e.id === id);
      if (emp) openEdit(emp);
    },
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const activeCount = (data.employees ?? []).filter((e) => e.active).length;

  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm());
  const [dropId, setDropId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayIso());
  const [payBankId, setPayBankId] = useState("");

  const editing = editId ? (data.employees ?? []).find((e) => e.id === editId) : null;
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
        notes: form.notes,
        active: form.active,
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
    setPayAmount(e.payType === "salary" && e.rate ? String(e.rate / 100) : "");
  }

  function runPay() {
    if (!payId) return;
    try {
      payEmployee({
        employeeId: payId,
        amount: parseAmountToCents(payAmount),
        date: payDate,
        bankId: payBankId,
      });
      toast.success("Paycheck posted to the register.");
      setPayId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post paycheck.");
    }
  }

  return (
    <AppShell
      title="Employees"
      description="People on payroll. Keep a roster, set pay type and rate, and post paychecks to a bank — the check lands in Register like any other payment."
      actions={<Button onClick={openNew}>+ Add employee</Button>}
    >
      <section className="mb-4 grid grid-cols-3 gap-2">
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
      </ListToolbar>

      <ListCard ref={pointer.bindContainer(gridRef)} tabIndex={0} className="outline-none">
        <table ref={cols.tableRef} className="text-sm">
          <colgroup>
            {(Object.keys(EMP_COLS) as Array<keyof typeof EMP_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="Name" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)}  align={colAligns.aligns.name ?? "center"} onAlign={(a) => colAligns.setAlign("name", a)} />
              <SortHeader label="Title" column="title" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.title} onWidth={(n) => cols.setWidth("title", n)} align={colAligns.aligns.title ?? "center"} onAlign={(a) => colAligns.setAlign("title", a)} />
              <SortHeader label="Pay" column="rate" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.rate} onWidth={(n) => cols.setWidth("rate", n)} align={colAligns.aligns.rate ?? "center"} onAlign={(a) => colAligns.setAlign("rate", a)} />
              <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.bank} onWidth={(n) => cols.setWidth("bank", n)} align={colAligns.aligns.bank ?? "center"} onAlign={(a) => colAligns.setAlign("bank", a)} />
              <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} align={colAligns.aligns.status ?? "center"} onAlign={(a) => colAligns.setAlign("status", a)} />
              <th className="col-actions px-4 py-3"><span className="sr-only">Actions</span></th>
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
              sort.sorted.map((e) => {
                const bank = data.banks.find((b) => b.id === e.bankId);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border/70"
                    data-focused={pointer.activeId === e.id ? "true" : undefined}
                    data-row-id={e.id}
                    aria-current={pointer.activeId === e.id ? "true" : undefined}
                    onClick={() => pointer.setActiveId(e.id)}
                    onDoubleClick={() => openEdit(e)}
                  >
                    <td className="px-4 py-3" data-col="name">
                      <button type="button" className="font-medium hover:underline" onClick={() => openEdit(e)}>
                        {e.name}
                      </button>
                      {e.email ? <p className="text-xs text-muted-foreground">{e.email}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" data-col="title">{e.title || "—"}</td>
                    <td className="px-4 py-3" data-col="rate">
                      <Money amount={e.rate} currency={data.settings.currency} />
                      <span className="ml-1 text-xs text-muted-foreground">{e.payType === "hourly" ? "/ hr" : "/ mo"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" data-col="bank">{bank?.nickname ?? "—"}</td>
                    <td className="px-4 py-3" data-col="status">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${e.active ? "bg-muted" : "bg-destructive/10 text-destructive"}`}>
                        {e.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="col-actions px-4 py-3 text-right" data-col="actions">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button size="sm" variant="outline" disabled={!e.active} onClick={() => openPay(e)}>
                          Pay
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDropId(e.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </ListCard>

      <Dialog open={dialogOpen} onOpenChange={(on) => (!on ? closeDialog() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? editing.name : "New employee"}</DialogTitle>
            <DialogDescription>
              Roster details for paychecks. This is not a full tax engine — withholdings stay outside the books for now.
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
                  <SelectItem value="salary">Salary (monthly)</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.payType === "hourly" ? "Hourly rate" : "Monthly salary"}>
              <Input inputMode="decimal" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </Field>
            <Field label="Default pay bank">
              <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Bank" />
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
            <Field label="Hire date">
              <DateInput value={form.hireDate} onChange={(iso) => setForm({ ...form, hireDate: iso })} />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
              Writes a check to the employee from the selected bank (Payroll expense). It appears in Register and Checks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Date">
              <DateInput value={payDate} onChange={setPayDate} />
            </Field>
            <Field label="Bank">
              <Select value={payBankId} onValueChange={setPayBankId}>
                <SelectTrigger>
                  <SelectValue />
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
            <Field label="Amount">
              <Input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayId(null)}>
              Cancel
            </Button>
            <Button onClick={runPay}>Post paycheck</Button>
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
