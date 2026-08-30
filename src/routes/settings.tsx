import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { NewCompanyDialog } from "@/components/company-switcher";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { backupPayload, downloadText, workspaceBackupPayload } from "@/lib/finance/export";
import { SAMPLE_COMPANY_ID } from "@/lib/finance/seed";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { browserStorage, countEntries, formatBytes, jsonSize } from "@/lib/finance/storage-usage";
import { CURRENCIES } from "@/lib/finance/types";
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
  const fileRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    function scrollToHash() {
      if (window.location.hash !== "#storage") return;
      document.getElementById("storage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <AppShell title="Settings" description="Company identity, appearance, currency, list order, backup, and storage for the books.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
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
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Light or dark. Saved in this browser, not in the company file.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppearancePicker />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
            <CardDescription>
              Each company has its own banks and books. Pacific Harbor Trading stays as the default sample.
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
                  {order.length > 1 ? (
                    <Button size="sm" variant="ghost" onClick={() => setDropId(id)}>
                      Remove
                    </Button>
                  ) : null}
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
            <CardTitle>Money</CardTitle>
            <CardDescription>One home currency for now. Multi-currency can slot in later without rewriting the ledger.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Currency">
              <Select value={settings.currency} onValueChange={(v) => updateSettings({ currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Sales tax on invoices</p>
                <p className="text-xs text-muted-foreground">Adds a tax line. Default rate is Philippine VAT.</p>
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
            <CardTitle>Backup</CardTitle>
            <CardDescription>
              Download all companies as one JSON file, or just this company. Restore accepts either. Books live in this
              browser (IndexedDB), not a shared server. Watch space under Storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                downloadText(
                  `finance-manager-${new Date().toISOString().slice(0, 10)}.json`,
                  workspaceBackupPayload({
                    companies,
                    companyOrder: order,
                    activeCompanyId: activeId,
                  }),
                  "application/json",
                );
                toast.success("Downloaded backup.");
              }}
            >
              Download books
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                downloadText(
                  `finance-manager-company-${new Date().toISOString().slice(0, 10)}.json`,
                  backupPayload(data),
                  "application/json",
                );
                toast.success("Downloaded this company.");
              }}
            >
              This company
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Restore backup
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
                  toast.success(kind === "workspace" ? "All companies restored." : "This company restored.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not restore.");
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 scroll-mt-6" id="storage">
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>
              Books live in this browser as IndexedDB (with a localStorage fallback). That is the right place — entries
              are unlimited. Watch usage here. When it fills, download a backup, purge closed years, or start a new
              company.
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
              Pacific Harbor Trading is the default sample. Reload it anytime. Start blank clears the company you are in,
              not the others.
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
          </CardContent>
        </Card>
      </div>
      <NewCompanyDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={addCompany} />
      <ConfirmDelete
        open={dropId !== null}
        title="Remove this company?"
        body="Deletes its banks and books from this browser. Other companies stay."
        confirmLabel="Remove"
        requirePhrase={order.length > 1 ? "DELETE" : undefined}
        onClose={() => setDropId(null)}
        onConfirm={() => {
          if (dropId) removeCompany(dropId);
          setDropId(null);
          toast.success("Company removed.");
        }}
      />
    </AppShell>
  );
}

function StoragePanel() {
  const data = useFinanceData();
  const companies = useFinanceStore((s) => s.companies);
  const purgeClosedThrough = useFinanceStore((s) => s.purgeClosedThrough);
  const counts = countEntries(data);
  const companyBytes = useMemo(() => jsonSize(data), [data]);
  const allBytes = useMemo(() => jsonSize(companies), [companies]);
  const [browser, setBrowser] = useState({ usage: 0, quota: 0 });
  const [through, setThrough] = useState(`${new Date().getFullYear() - 1}-12-31`);
  const [purging, setPurging] = useState(false);

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
            {quota > 0 ? `${formatBytes(used)} of ${formatBytes(quota)} in this browser` : formatBytes(used)}
          </p>
          {quota > 0 ? <p className="text-xs tabular-nums text-muted-foreground">{pct}% used</p> : null}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <Input type="date" value={through} onChange={(e) => setThrough(e.target.value)} />
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
