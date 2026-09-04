import { createFileRoute, Link } from "@tanstack/react-router";
import { DateInput } from "@/components/date-input";
import { FilterPills } from "@/components/filter-pills";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { NewCompanyDialog } from "@/components/company-switcher";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { listColClass } from "@/components/list-table";
import { SortHeader } from "@/components/sort-header";
import { useColWidths } from "@/components/use-col-widths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { backupPayload, saveCompanyFile } from "@/lib/finance/export";
import { listLocalBackups, readLocalBackup } from "@/lib/finance/local-backup";
import { SAMPLE_COMPANY_ID } from "@/lib/finance/seed";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate, todayIso } from "@/lib/finance/format";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { browserStorage, countEntries, formatBytes, jsonSize, requestPersistentStorage } from "@/lib/finance/storage-usage";
import { COUNTRY_TAX_PACKS, CURRENCIES, countryTaxPackForCurrency, type RecurringItem } from "@/lib/finance/types";
import { useShallow } from "zustand/react/shallow";
import { AppearancePicker } from "@/components/theme-toggle";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const data = useFinanceData();
  const settings = data.settings;
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const resetDemo = useFinanceStore((s) => s.resetDemo);
  const startFresh = useFinanceStore((s) => s.startFresh);
  const importBackup = useFinanceStore((s) => s.importBackup);
  const restoreLocalCopy = useFinanceStore((s) => s.restoreLocalCopy);
  const fileRef = useRef<HTMLInputElement>(null);
  const [countryPackId, setCountryPackId] = useState("");
  /** When applying a country tax pack, also set home currency to the pack’s currency. */
  const [updateCurrencyWithPack, setUpdateCurrencyWithPack] = useState(true);
  const { order, companies, activeId, switchCompany, addCompany, removeCompany } = useFinanceStore(
    useShallow((s) => ({
      order: s.companyOrder,
      companies: s.companies,
      activeId: s.activeCompanyId,
      switchCompany: s.switchCompany,
      addCompany: s.addCompany,
      removeCompany: s.removeCompany,
    })),
  );
  const [newOpen, setNewOpen] = useState(false);
  const [dropId, setDropId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [localStamp, setLocalStamp] = useState<string | null>(null);

  useEffect(() => {
    function scrollToHash() {
      if (window.location.hash !== "#storage") return;
      document.getElementById("storage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const mine = await readLocalBackup(activeId);
      const stamp = mine?.savedAt ?? (await listLocalBackups()).sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]?.savedAt ?? null;
      if (alive) setLocalStamp(stamp);
    })();
    return () => {
      alive = false;
    };
  }, [activeId, data]);

  return (
    <AppShell title="Options" description="Company profile, display, currency and tax, multi-company files, backups, and local storage. Changes apply to the open company unless noted.">
      <div className="workspace-split">
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>Printed on invoices and the register for the company you are in.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Name">
              <Input value={settings.companyName} onChange={(e) => updateSettings({ companyName: e.target.value })} />
            </Field>
            <Field label="Address">
              <Input value={settings.companyAddress} onChange={(e) => updateSettings({ companyAddress: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={settings.companyPhone} onChange={(e) => updateSettings({ companyPhone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={settings.companyEmail} onChange={(e) => updateSettings({ companyEmail: e.target.value })} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display / Formatting</CardTitle>
            <CardDescription>
              Appearance is saved in this browser. Thousand separators and decimal places are stored with the company
              file.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AppearancePicker />
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Use thousand separators</p>
                <p className="text-xs text-muted-foreground">
                  Show amounts like 9,825,076.00 instead of 9825076.00 — including when currency is blank.
                </p>
              </div>
              <Switch
                checked={settings.useThousandSeparators !== false}
                onCheckedChange={(v) => updateSettings({ useThousandSeparators: v })}
              />
            </div>
            <Field label="Decimal places">
              <Select
                value={String(settings.decimalPlaces ?? 2)}
                onValueChange={(v) => updateSettings({ decimalPlaces: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company files</CardTitle>
            <CardDescription>
              Each company has its own banks and books. The Pacific Harbor sample can be removed — Reload sample brings it back.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {order.map((id) => {
              const label = companies[id]?.settings.companyName ?? "Company";
              const on = id === activeId;
              return (
                <div key={id} className="flex min-h-11 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-sm font-medium"
                    onClick={() => switchCompany(id)}
                  >
                    {label}
                    {id === SAMPLE_COMPANY_ID ? (
                      <span className="ml-1 font-normal text-muted-foreground">sample</span>
                    ) : null}
                    {on ? <span className="ml-1 font-normal text-muted-foreground">· open</span> : null}
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => setDropId(id)}>
                    Remove
                  </Button>
                </div>
              );
            })}
            <Button variant="outline" className="w-fit" onClick={() => setNewOpen(true)}>
              New company
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency and tax</CardTitle>
            <CardDescription>
              One home currency for now. Country packs fill a common default tax rate — they are starting points, not
              legal advice. Confirm current rates with your accountant or tax authority.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Currency">
              <Select
                value={settings.currency || "__none__"}
                onValueChange={(v) => {
                  const code = v === "__none__" ? "" : v;
                  updateSettings({ currency: code });
                  const pack = countryTaxPackForCurrency(code);
                  if (pack) setCountryPackId(pack.id);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No currency</SelectItem>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Country / tax defaults">
              <Select value={countryPackId || "__none__"} onValueChange={(v) => setCountryPackId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a country pack…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Choose a country pack…</SelectItem>
                  {COUNTRY_TAX_PACKS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.country} — {p.taxLabel}
                      {p.currency ? ` · ${p.currency}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {countryPackId ? (
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
                {(() => {
                  const pack = COUNTRY_TAX_PACKS.find((p) => p.id === countryPackId);
                  if (!pack) return null;
                  const canChangeCurrency = Boolean(pack.currency);
                  return (
                    <>
                      <p className="text-xs text-muted-foreground">{pack.note}</p>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Also update home currency</p>
                          <p className="text-xs text-muted-foreground">
                            {canChangeCurrency
                              ? `When on, sets currency to ${pack.currency}. Turn off to keep ${settings.currency} and only apply tax defaults.`
                              : "This pack never changes currency."}
                          </p>
                        </div>
                        <Switch
                          checked={canChangeCurrency && updateCurrencyWithPack}
                          disabled={!canChangeCurrency}
                          onCheckedChange={setUpdateCurrencyWithPack}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-fit"
                        onClick={() => {
                          const patch: Parameters<typeof updateSettings>[0] = {
                            taxEnabled: pack.taxEnabled,
                            defaultTaxRate: pack.defaultTaxRate,
                          };
                          const willUpdateCurrency = canChangeCurrency && updateCurrencyWithPack;
                          if (willUpdateCurrency) patch.currency = pack.currency;
                          updateSettings(patch);
                          toast.success(
                            willUpdateCurrency
                              ? `Applied ${pack.country}: ${pack.taxLabel}, currency ${pack.currency}.`
                              : `Applied ${pack.country}: ${pack.taxLabel} (currency unchanged).`,
                          );
                        }}
                      >
                        Apply tax defaults
                        {canChangeCurrency && updateCurrencyWithPack ? ` + ${pack.currency}` : " (no currency update)"}
                      </Button>
                    </>
                  );
                })()}
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Sales tax on invoices</p>
                <p className="text-xs text-muted-foreground">
                  Adds a tax line using the default rate below. Pick a country pack for a common starting rate.
                </p>
              </div>
              <Switch checked={settings.taxEnabled} onCheckedChange={(v) => updateSettings({ taxEnabled: v })} />
            </div>
            {settings.taxEnabled ? (
              <Field label="Default tax %">
                <Input
                  value={String(settings.defaultTaxRate)}
                  onChange={(e) => updateSettings({ defaultTaxRate: Number(e.target.value) || 0 })}
                  inputMode="decimal"
                />
              </Field>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entry lists</CardTitle>
            <CardDescription>
              Sort by clicking column headers on every register. Drag-and-drop is optional and off by default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Allow drag-and-drop reordering</p>
                <p className="text-xs text-muted-foreground">
                  Grab the handle on customers, vendors, bills, receipts, and invoice lines. The bank register has its
                  own Drag rows toggle.
                </p>
              </div>
              <Switch
                checked={settings.dragDropEnabled}
                onCheckedChange={(v) => updateSettings({ dragDropEnabled: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup and restore</CardTitle>
            <CardDescription>
              This JSON is this company — banks, invoices, receipts, recon, close, and audit. There is no cloud; the
              file in this browser is the books. Save writes a copy on this device where the browser allows it;
              otherwise it downloads. Open replaces this company, or adds it if it is a different file. After every
              save this browser also keeps a local copy, so you can restore the company you are in without leaving the
              app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                try {
                  const name = `finance-manager-company-${new Date().toISOString().slice(0, 10)}.json`;
                  const how = await saveCompanyFile(name, backupPayload(data));
                  toast.success(how === "saved" ? "Company file saved." : "Company file downloaded.");
                } catch (err) {
                  if (err instanceof DOMException && err.name === "AbortError") return;
                  toast.error(err instanceof Error ? err.message : "Could not save.");
                }
              }}
            >
              Save company file
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Open company file
            </Button>
            <Button variant="outline" onClick={() => setRestoring(true)} disabled={!localStamp}>
              Restore last local copy
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const kind = importBackup(await file.text());
                  toast.success(kind === "workspace" ? "Opened companies from that file." : "Company file opened.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not restore.");
                }
              }}
            />
            <p className="w-full text-xs text-muted-foreground">
              {localStamp
                ? `Last local copy ${new Date(localStamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
                : "No local copy yet — post or save once and this browser will keep one."}
            </p>
          </CardContent>
        </Card>

        <CloseBooksCard />
        <RecurringCard />

        <Card className="lg:col-span-2 scroll-mt-6" id="storage">
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>
              Books live in this browser as IndexedDB (with a localStorage fallback). That is the right place — entries
              are unlimited. This browser is asked to keep them when disk is tight. Watch usage here. When it fills,
              download a backup, purge closed years, or start a new company. There is no cloud sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoragePanel />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sample data</CardTitle>
            <CardDescription>
              Pacific Harbor Trading is the default sample. Reload it anytime. Remove sample deletes that file from this
              browser — a blank company takes its place if it was the only one. Restore last local copy brings the last
              automatic snapshot back without Reload sample. Start blank clears the company you are in, not the others.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                startFresh();
                toast.success("Blank books. Add a bank to begin.");
              }}
            >
              Start blank
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetDemo();
                toast.success("Pacific Harbor sample is open.");
              }}
            >
              Reload sample
            </Button>
            {order.includes(SAMPLE_COMPANY_ID) ? (
              <Button variant="ghost" onClick={() => setDropId(SAMPLE_COMPANY_ID)}>
                Remove sample
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <NewCompanyDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={addCompany} />
      <ConfirmDelete
        open={Boolean(dropId)}
        title={dropId === SAMPLE_COMPANY_ID ? "Remove the sample company?" : "Remove this company?"}
        body={
          dropId === SAMPLE_COMPANY_ID
            ? order.length <= 1
              ? "Deletes Pacific Harbor from this browser and opens a blank company. Restore last local copy or Reload sample brings it back."
              : "Deletes Pacific Harbor from this browser. Other companies stay. Restore last local copy or Reload sample brings the demo back."
            : order.length <= 1
              ? "Deletes this file from the browser. A blank company takes its place. Restore last local copy can bring it back."
              : "Deletes its banks and books from this browser. Other companies stay. Restore last local copy can bring it back."
        }
        confirmLabel="Remove"
        requirePhrase="DELETE"
        onClose={() => setDropId(null)}
        onConfirm={() => {
          if (dropId) removeCompany(dropId);
          setDropId(null);
          toast.success("Company removed.");
        }}
      />
      <ConfirmDelete
        open={restoring}
        title="Restore last local copy?"
        body={
          localStamp
            ? `Replaces the open company with the snapshot from ${new Date(localStamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}. If you removed this file, it comes back. A downloaded JSON is not required.`
            : "This browser has not saved a local copy yet."
        }
        confirmLabel="Restore"
        requirePhrase="RESTORE"
        onClose={() => setRestoring(false)}
        onConfirm={async () => {
          try {
            const result = await restoreLocalCopy();
            setRestoring(false);
            toast.success(
              result.revived
                ? `Restored ${result.name} from the last local copy.`
                : `Restored ${result.name} to the last local copy.`,
            );
          } catch (err) {
            setRestoring(false);
            toast.error(err instanceof Error ? err.message : "Could not restore.");
          }
        }}
      />
    </AppShell>
  );
}

function CloseBooksCard() {
  const data = useFinanceData();
  const reopenBooks = useFinanceStore((s) => s.reopenBooks);
  const closed = data.settings.closedThrough ?? "";
  const [reopening, setReopening] = useState(false);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Close the month</CardTitle>
        <CardDescription>
          Rec every bank, post recurring, print the period pack, then lock — on Close. Reopen is a dated event.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Button asChild>
          <Link to="/close">Open close checklist</Link>
        </Button>
        {closed ? (
          <Button variant="outline" onClick={() => setReopening(true)}>
            Reopen
          </Button>
        ) : null}
        <p className="w-full text-sm text-muted-foreground">
          {closed ? `Currently closed through ${formatDate(closed)}.` : "Books are open."}
        </p>
      </CardContent>
      <ConfirmDelete
        open={reopening}
        title="Reopen the books?"
        body="This is a dated event. Anyone can post into the previously closed period. The close journal stays."
        confirmLabel="Reopen"
        requirePhrase="REOPEN"
        onClose={() => setReopening(false)}
        onConfirm={() => {
          try {
            reopenBooks("Reopened from Settings.");
            toast.success("Books are open. Reopen is on the audit.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not reopen.");
          }
          setReopening(false);
        }}
      />
    </Card>
  );
}

function RecurringCard() {
  const data = useFinanceData();
  const postRecurring = useFinanceStore((s) => s.postRecurring);
  const items = (data.recurrences ?? []).filter((r) => r.active);
  const due = items.filter((r) => r.nextDate <= todayIso());
  const [filter, setFilter] = useState<"all" | "due">("all");
  const visible = filter === "due" ? due : items;
  const getters = useMemo(
    () => ({
      name: (r: RecurringItem) => r.name,
      next: (r: RecurringItem) => r.nextDate,
      amount: (r: RecurringItem) => r.amount,
    }),
    [],
  );
  const sort = useEntrySort(visible, "next", getters, "asc");
  const cols = useColWidths("finance-manager-recurring-cols", REC_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  function fit(id: keyof typeof REC_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recurring</CardTitle>
        <CardDescription>
          Rent and payroll as documents you post, not seed rows. Post due writes a check (or bill) and rolls the next
          date forward one month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recurring items in this company.</p>
        ) : (
          <>
            <div className="mb-3">
              <FilterPills
                value={filter}
                onChange={setFilter}
                label="Recurring"
                options={[
                  { id: "all", label: "All" },
                  { id: "due", label: "Due" },
                ]}
              />
            </div>
            <div ref={gridRef} className="list-grid overflow-x-auto rounded-2xl bg-card elevation">
              <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
                <colgroup>
                  {(Object.keys(REC_COLS) as Array<keyof typeof REC_COLS>).map((id) => (
                    <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
                  ))}
                  <col className="col-actions" style={{ width: 88 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <SortHeader label="Name" column="name" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.name} onWidth={(n) => cols.setWidth("name", n)} onFit={() => fit("name", "Name")} />
                    <SortHeader label="Next" column="next" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.next} onWidth={(n) => cols.setWidth("next", n)} onFit={() => fit("next", "Next")} />
                    <SortHeader label="Amount" column="amount" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.amount} onWidth={(n) => cols.setWidth("amount", n)} onFit={() => fit("amount", "Amount")} />
                    <th className="col-actions px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sort.sorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        Nothing due.
                      </td>
                    </tr>
                  ) : (
                    sort.sorted.map((item) => (
                      <tr key={item.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-2" data-col="name">{item.name}</td>
                        <td className="px-4 py-2" data-col="next">{formatDate(item.nextDate)}</td>
                        <td className="px-4 py-2 text-right" data-col="amount">
                          <Money amount={item.amount} currency={data.settings.currency} />
                        </td>
                        <td className="col-actions px-4 py-2 text-right">
                          <Button
                            size="sm"
                            variant={item.nextDate <= todayIso() ? "default" : "ghost"}
                            onClick={() => {
                              try {
                                postRecurring(item.id);
                                toast.success(`Posted ${item.name}.`);
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Could not post.");
                              }
                            }}
                          >
                            Post
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {due.length > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {due.length} due on or before today.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const REC_COLS = {
  name: 200,
  next: 128,
  amount: 128,
} as const;

function StoragePanel() {
  const data = useFinanceData();
  const companies = useFinanceStore((s) => s.companies);
  const purgeClosedThrough = useFinanceStore((s) => s.purgeClosedThrough);
  const counts = countEntries(data);
  const companyBytes = useMemo(() => jsonSize(data), [data]);
  const allBytes = useMemo(() => jsonSize(companies), [companies]);
  const [browser, setBrowser] = useState<{
    usage: number;
    quota: number;
    persisted: boolean | null;
    engine: "indexeddb" | "localstorage" | "unknown";
  }>({ usage: 0, quota: 0, persisted: null, engine: "unknown" });
  const [through, setThrough] = useState(`${new Date().getFullYear() - 1}-12-31`);
  const [purging, setPurging] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let alive = true;
    browserStorage().then((next) => {
      if (alive) setBrowser(next);
    });
    return () => {
      alive = false;
    };
  }, [allBytes]);

  const quota = browser.quota;
  const used = Math.max(browser.usage, allBytes);
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <div className="grid gap-5">
      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <p className="text-sm font-medium">
            {quota > 0
              ? `${formatBytes(used)} used of ${formatBytes(quota)} granted`
              : formatBytes(used)}
          </p>
          {quota > 0 ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              {pct}% · {formatBytes(Math.max(0, quota - used))} free
            </p>
          ) : null}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {browser.engine === "indexeddb"
            ? "IndexedDB"
            : browser.engine === "localstorage"
              ? "localStorage fallback"
              : "This browser"}
          {browser.persisted === true
            ? " · persistent (this browser will keep the books)"
            : browser.persisted === false
              ? " · not persistent — download a company file if you clear site data"
              : ""}
          . Finance Manager does not cap storage. The grant is this browser’s — often about 10 GB
          until you tap Keep books, then a large share of free disk. There is no API to type a GB
          number.
        </p>
        {browser.persisted !== true ? (
          <Button
            className="mt-3"
            variant="outline"
            disabled={asking}
            onClick={() => {
              setAsking(true);
              void (async () => {
                try {
                  const ok = await requestPersistentStorage();
                  setBrowser(await browserStorage());
                  if (ok) toast.success("This browser will keep the books.");
                  else toast.message("This browser did not raise the grant. Download a company file as backup.");
                } finally {
                  setAsking(false);
                }
              })();
            }}
          >
            Keep books on this computer
          </Button>
        ) : null}
      </div>
      <dl className="stat-grid stat-grid-4">
        <Stat label="This company" value={formatBytes(companyBytes)} hint={`${counts.total} entries`} />
        <Stat label="All companies" value={formatBytes(allBytes)} hint={`${Object.keys(companies).length} files`} />
        <Stat
          label="Documents"
          value={String(counts.invoices + counts.bills + counts.receipts + counts.checks)}
          hint={`${counts.invoices} invoices · ${counts.bills} bills · ${counts.receipts} receipts · ${counts.checks} checks`}
        />
        <Stat
          label="Parties"
          value={String(counts.customers + counts.vendors)}
          hint={`${counts.customers} customers · ${counts.vendors} vendors`}
        />
      </dl>
      <div className="flex flex-col gap-3 rounded-2xl bg-muted/70 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1">
          <Field label="Purge closed activity through">
            <DateInput value={through} onChange={setThrough} />
          </Field>
        </div>
        <Button variant="outline" onClick={() => setPurging(true)} disabled={!through}>
          Purge closed
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Removes paid, void, and cleared documents on or before that date. Open invoices, bills, and pending checks
          stay. A condensed journal keeps balances the same. Download a backup first.
        </p>
      </div>
      <ConfirmDelete
        open={purging}
        title="Purge closed activity?"
        body={`Deletes paid, void, and cleared entries through ${through}. Open items stay. Balances stay the same. This cannot be undone unless you restore a backup.`}
        confirmLabel="Purge"
        requirePhrase="PURGE"
        onClose={() => setPurging(false)}
        onConfirm={() => {
          try {
            const n = purgeClosedThrough(through);
            toast.success(`Removed ${n} closed ${n === 1 ? "entry" : "entries"}.`);
            setPurging(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not purge.");
            setPurging(false);
          }
        }}
      />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-muted/70 px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
