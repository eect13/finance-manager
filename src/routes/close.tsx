import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DateInput } from "@/components/date-input";
import { FilterPills, ListToolbar } from "@/components/filter-pills";
import { Money } from "@/components/money";
import { PeriodPackPrint } from "@/components/period-print";
import { requestPrint } from "@/components/print-preview";
import { SortHeader } from "@/components/sort-header";
import { listColClass } from "@/components/list-table";
import { useColWidths } from "@/components/use-col-widths";
import { Button } from "@/components/ui/button";
import { closeChecklist, closeTotals, monthEndIso, type CloseCheck } from "@/lib/finance/close";
import { fitColumnWidth } from "@/lib/finance/fit-column";
import { formatDate } from "@/lib/finance/format";
import { auditRows, exportCsv } from "@/lib/finance/export";
import { useEntrySort } from "@/lib/finance/sort";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { AuditEvent } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/close")({ component: ClosePage });

function ClosePage() {
  const data = useFinanceData();
  const closeBooks = useFinanceStore((s) => s.closeBooks);
  const reopenBooks = useFinanceStore((s) => s.reopenBooks);
  const postDueRecurring = useFinanceStore((s) => s.postDueRecurring);
  const closed = data.settings.closedThrough ?? "";
  const [through, setThrough] = useState(closed || monthEndIso());
  const [packetPrinted, setPacketPrinted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const check = useMemo(() => closeChecklist(data, through), [data, through]);
  const totals = useMemo(() => closeTotals(data, through), [data, through]);
  const snapshot = (data.closeHistory ?? []).filter((s) => !s.reopenedAt).at(-1) ?? (data.closeHistory ?? []).at(-1);
  const audit = [...(data.audit ?? [])].slice(-50).reverse();
  const [checkFilter, setCheckFilter] = useState<"all" | "blocked" | "clear">("all");

  return (
    <AppShell
      title="Close the month"
      description="Print the period pack (TB, P&L, aging, rec reports, open statements), then lock. Packet figures are as of the close date. Opening is the posted snapshot. Reopen is a dated event, not a toggle."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              setPacketPrinted(true);
              requestPrint();
            }}
          >
            <Printer />
            Period pack
          </Button>
          <Button
            variant="outline"
            onClick={() => exportCsv(`audit-${new Date().toISOString().slice(0, 10)}.csv`, auditRows(data))}
          >
            Export audit
          </Button>
          {closed ? (
            <Button variant="outline" onClick={() => setReopening(true)}>
              Reopen
            </Button>
          ) : null}
        </>
      }
    >
      <PeriodPackPrint data={data} through={through} snapshot={snapshot} />

      <div className="close-meta mb-4">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Close through</p>
          <DateInput value={through} onChange={setThrough} />
        </div>
        <div>
          <p className="eyebrow">Open AR</p>
          <p className="stat-value">
            <Money amount={totals.ar} currency={data.settings.currency} />
          </p>
        </div>
        <div>
          <p className="eyebrow">Open AP</p>
          <p className="stat-value">
            <Money amount={totals.ap} currency={data.settings.currency} />
          </p>
        </div>
        <div>
          <p className="eyebrow">Trial balance</p>
          <p className={cn("stat-value", totals.tbDebit === totals.tbCredit ? "text-credit" : "text-debit")}>
            {totals.tbDebit === totals.tbCredit ? "In balance" : "Out of balance"}
          </p>
        </div>
      </div>

      {closed ? (
        <p className="mb-4 text-sm text-muted-foreground">Currently closed through {formatDate(closed)}.</p>
      ) : null}

      <div className="mb-3">
        <FilterPills
          value={checkFilter}
          onChange={setCheckFilter}
          label="Checklist"
          options={[
            { id: "all", label: "All" },
            { id: "blocked", label: "Blocked" },
            { id: "clear", label: "Clear" },
          ]}
        />
      </div>
      <ChecklistTable
        items={check.items.filter((item) => {
          if (checkFilter === "blocked") return !item.ok;
          if (checkFilter === "clear") return item.ok;
          return true;
        })}
        onPostDue={
          check.due.length === 0
            ? undefined
            : () => {
                try {
                  const posted = postDueRecurring(through);
                  if (posted.length === 0) {
                    toast.message("Nothing due.");
                    return;
                  }
                  toast.success(`Posted ${posted.length} recurring ${posted.length === 1 ? "item" : "items"}.`);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not post.");
                }
              }
        }
        dueLabel={
          check.due.length === 1 ? `Post ${check.due[0].name}` : check.due.length > 1 ? `Post ${check.due.length} due` : ""
        }
      />

      {snapshot ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium">Last close — posted balances</h2>
          <p className="mb-2 text-xs text-muted-foreground">
            {formatDate(snapshot.through)}. These bank figures posted as the opening fact
            {snapshot.journalId ? ` (journal ${snapshot.journalId.slice(0, 8)})` : ""}.
            {snapshot.reopenedAt ? ` Reopened ${new Date(snapshot.reopenedAt).toLocaleString()}.` : ""}
          </p>
          <SnapshotTable banks={snapshot.banks} currency={data.settings.currency} />
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => setClosing(true)} disabled={!check.ok || !packetPrinted}>
          Close books
        </Button>
        <p className="text-sm text-muted-foreground">
          {!check.ok
            ? "Finish the blocked rows first."
            : packetPrinted
              ? "Pack printed this session. Close posts the opening fact."
              : "Print the period pack first — that is the review."}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium">Audit</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Close, reopen, recon, merge, and recurring post here. Who is this browser.</p>
        ) : (
          <AuditTable rows={audit} />
        )}
      </section>

      <ConfirmDelete
        open={closing}
        title="Close the books?"
        body={`Dates on or before ${formatDate(through)} cannot be posted or edited until you reopen. Bank balances post as a close journal — that is the opening fact for the next month.`}
        confirmLabel="Close"
        requirePhrase="CLOSE"
        onClose={() => setClosing(false)}
        onConfirm={() => {
          try {
            closeBooks(through, packetPrinted);
            toast.success(`Closed through ${formatDate(through)}.`);
            setClosing(false);
            setPacketPrinted(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not close.");
            setClosing(false);
          }
        }}
      />
      <ConfirmDelete
        open={reopening}
        title="Reopen the books?"
        body="This is a dated event. Anyone can post into the previously closed period. The close journal stays."
        confirmLabel="Reopen"
        requirePhrase="REOPEN"
        onClose={() => setReopening(false)}
        onConfirm={() => {
          try {
            reopenBooks("Reopened from Close.");
            toast.success("Books are open. Reopen is on the audit.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not reopen.");
          }
          setReopening(false);
        }}
      />
    </AppShell>
  );
}

const CHECK_COLS = { check: 200, status: 100, detail: 360 } as const;

function ChecklistTable({
  items,
  onPostDue,
  dueLabel,
}: {
  items: CloseCheck[];
  onPostDue?: () => void;
  dueLabel?: string;
}) {
  const cols = useColWidths("finance-manager-close-check-cols", CHECK_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      check: (i: CloseCheck) => i.label,
      status: (i: CloseCheck) => (i.ok ? "Clear" : "Blocked"),
      detail: (i: CloseCheck) => i.detail,
    }),
    [],
  );
  const sort = useEntrySort(items, "status", getters, "asc");
  function fit(id: keyof typeof CHECK_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div ref={gridRef} className="list-grid overflow-x-auto rounded-2xl bg-card elevation">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(CHECK_COLS) as Array<keyof typeof CHECK_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Check" column="check" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.check} onWidth={(n) => cols.setWidth("check", n)} onFit={() => fit("check", "Check")} />
            <SortHeader label="Status" column="status" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.status} onWidth={(n) => cols.setWidth("status", n)} onFit={() => fit("status", "Status")} />
            <SortHeader label="Detail" column="detail" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.detail} onWidth={(n) => cols.setWidth("detail", n)} onFit={() => fit("detail", "Detail")} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Nothing in this filter.
              </td>
            </tr>
          ) : (
            sort.sorted.map((item) => (
              <tr key={item.id} className="border-b border-border/70 last:border-0" data-active={item.ok ? undefined : "true"}>
                <td className="px-4 py-3 font-medium" data-col="check">{item.label}</td>
                <td className="px-4 py-3" data-col="status">{item.ok ? "Clear" : "Blocked"}</td>
                <td className="px-4 py-3" data-col="detail">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.href ? (
                      <Link to={item.href} className="underline-offset-2 hover:underline">
                        {item.detail}
                      </Link>
                    ) : (
                      item.detail
                    )}
                    {item.id === "recurring" && !item.ok && onPostDue ? (
                      <Button size="sm" onClick={onPostDue}>
                        {dueLabel || "Post due"}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const SNAP_COLS = { bank: 200, balance: 140, statement: 160 } as const;

function SnapshotTable({
  banks,
  currency,
}: {
  banks: Array<{ bankId: string; nickname: string; balance: number; lastStatementDate: string }>;
  currency: string;
}) {
  const cols = useColWidths("finance-manager-close-snap-cols", SNAP_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  const getters = useMemo(
    () => ({
      bank: (b: (typeof banks)[number]) => b.nickname,
      balance: (b: (typeof banks)[number]) => b.balance,
      statement: (b: (typeof banks)[number]) => b.lastStatementDate,
    }),
    [],
  );
  const sort = useEntrySort(banks, "bank", getters, "asc");
  function fit(id: keyof typeof SNAP_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div ref={gridRef} className="list-grid overflow-x-auto rounded-2xl bg-card elevation">
      <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
        <colgroup>
          {(Object.keys(SNAP_COLS) as Array<keyof typeof SNAP_COLS>).map((id) => (
            <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Bank" column="bank" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.bank} onWidth={(n) => cols.setWidth("bank", n)} onFit={() => fit("bank", "Bank")} />
            <SortHeader label="Balance" column="balance" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} align="right" width={cols.widths.balance} onWidth={(n) => cols.setWidth("balance", n)} onFit={() => fit("balance", "Balance")} />
            <SortHeader label="Statement" column="statement" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.statement} onWidth={(n) => cols.setWidth("statement", n)} onFit={() => fit("statement", "Statement")} />
          </tr>
        </thead>
        <tbody>
          {sort.sorted.map((b) => (
            <tr key={b.bankId} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-3" data-col="bank">{b.nickname}</td>
              <td className="px-4 py-3 text-right" data-col="balance">
                <Money amount={b.balance} currency={currency} />
              </td>
              <td className="px-4 py-3" data-col="statement">{b.lastStatementDate ? formatDate(b.lastStatementDate) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AUDIT_COLS = {
  when: 180,
  who: 120,
  action: 120,
  detail: 240,
  old: 140,
  next: 140,
} as const;

function AuditTable({ rows }: { rows: AuditEvent[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const actions = useMemo(() => {
    const set = new Set(rows.map((r) => r.action).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((ev) => {
      if (action !== "all" && ev.action !== action) return false;
      if (!q) return true;
      return [ev.who, ev.action, ev.detail, ev.old, ev.new, new Date(ev.at).toLocaleString()].join(" ").toLowerCase().includes(q);
    });
  }, [rows, query, action]);
  const getters = useMemo(
    () => ({
      when: (e: AuditEvent) => e.at,
      who: (e: AuditEvent) => e.who,
      action: (e: AuditEvent) => e.action,
      detail: (e: AuditEvent) => e.detail,
      old: (e: AuditEvent) => e.old,
      next: (e: AuditEvent) => e.new,
    }),
    [],
  );
  const sort = useEntrySort(filtered, "when", getters, "desc");
  const cols = useColWidths("finance-manager-audit-cols", AUDIT_COLS);
  const gridRef = useRef<HTMLDivElement>(null);
  function fit(id: keyof typeof AUDIT_COLS, label: string) {
    const table = gridRef.current?.querySelector("table");
    if (!table) return;
    cols.setWidth(id, fitColumnWidth({ table, selector: `td[data-col="${id}"]`, header: label }));
  }
  return (
    <div>
      <ListToolbar query={query} onQuery={setQuery} placeholder="Search audit" label="Search audit">
        <FilterPills
          value={action}
          onChange={setAction}
          label="Action"
          options={actions.map((id) => ({ id, label: id === "all" ? "All" : id }))}
        />
      </ListToolbar>
      <div ref={gridRef} className="list-grid overflow-x-auto rounded-2xl bg-card elevation">
        <table ref={cols.tableRef} className="text-sm" style={{ width: "100%" }}>
          <colgroup>
            {(Object.keys(AUDIT_COLS) as Array<keyof typeof AUDIT_COLS>).map((id) => (
              <col key={id} className={listColClass(id)} style={{ width: cols.widths[id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader label="When" column="when" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.when} onWidth={(n) => cols.setWidth("when", n)} onFit={() => fit("when", "When")} />
              <SortHeader label="Who" column="who" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.who} onWidth={(n) => cols.setWidth("who", n)} onFit={() => fit("who", "Who")} />
              <SortHeader label="Action" column="action" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.action} onWidth={(n) => cols.setWidth("action", n)} onFit={() => fit("action", "Action")} />
              <SortHeader label="Detail" column="detail" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.detail} onWidth={(n) => cols.setWidth("detail", n)} onFit={() => fit("detail", "Detail")} />
              <SortHeader label="Old" column="old" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.old} onWidth={(n) => cols.setWidth("old", n)} onFit={() => fit("old", "Old")} />
              <SortHeader label="New" column="next" sortKey={sort.key} dir={sort.dir} onToggle={sort.toggle} width={cols.widths.next} onWidth={(n) => cols.setWidth("next", n)} onFit={() => fit("next", "New")} />
            </tr>
          </thead>
          <tbody>
            {sort.sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No events match.
                </td>
              </tr>
            ) : (
              sort.sorted.map((ev) => (
                <tr key={ev.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap" data-col="when">{new Date(ev.at).toLocaleString()}</td>
                  <td className="px-4 py-3" data-col="who">{ev.who || "this browser"}</td>
                  <td className="px-4 py-3" data-col="action">{ev.action}</td>
                  <td className="px-4 py-3" data-col="detail">{ev.detail}</td>
                  <td className="px-4 py-3" data-col="old">{ev.old}</td>
                  <td className="px-4 py-3" data-col="next">{ev.new}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
