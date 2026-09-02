import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AGE_LABEL, AGE_ORDER, agingTotals, apAging, arAging } from "@/lib/finance/aging";
import { monthStartIso } from "@/lib/finance/close";
import { formatDate, formatMoney } from "@/lib/finance/format";
import { fiscalStartOn, incomeStatement, trialBalance } from "@/lib/finance/ledger";
import { customerStatement, type CustomerStatement } from "@/lib/finance/statement";
import type { CashLine } from "@/lib/finance/register";
import { KIND_LABEL } from "@/lib/finance/register";
import type { CloseSnapshot, FinanceData, ReconNamedLine, ReconStatement } from "@/lib/finance/types";
import { PrintFrame, PrintLetterhead } from "@/components/print-preview";
import { useFinanceData } from "@/lib/finance/store";

function SheetHead({ title, subtitle }: { title: string; subtitle?: string }) {
  const data = useFinanceData();
  return (
    <PrintLetterhead
      title={title}
      subtitle={subtitle}
      companyName={data.settings.companyName}
      companyAddress={data.settings.companyAddress}
      companyPhone={data.settings.companyPhone}
      companyEmail={data.settings.companyEmail}
    />
  );
}

function usePrintPortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}


export function ReconPrint({
  bankName,
  statementDate,
  beginning,
  ending,
  bookBalance,
  clearedIn,
  clearedOut,
  difference,
  explained,
  outstanding,
  inTransit,
  ticked,
  outstandingNamed,
  ditNamed,
  adjustmentNamed,
  aging,
  currency,
  finished,
}: {
  bankName: string;
  statementDate: string;
  beginning: number;
  ending: number;
  bookBalance?: number;
  clearedIn: number;
  clearedOut: number;
  difference: number;
  explained?: number;
  outstanding: CashLine[];
  inTransit: CashLine[];
  ticked: CashLine[];
  outstandingNamed?: ReconNamedLine[];
  ditNamed?: ReconNamedLine[];
  adjustmentNamed?: ReconNamedLine[];
  aging?: { d30: number; d60: number; d90: number; late: number; lateCount: number };
  currency: string;
  finished?: boolean;
}) {
  const mounted = usePrintPortal();
  if (!mounted) return null;
  const money = (n: number) => formatMoney(n, currency);
  const outRows = outstandingNamed ?? outstanding.map((l) => ({ date: l.date, party: l.party, number: l.number, amount: l.payment, days: 0, kind: l.kind, sourceId: l.sourceId }));
  const ditRows = ditNamed ?? inTransit.map((l) => ({ date: l.date, party: l.party, number: l.number, amount: l.deposit, days: 0, kind: l.kind, sourceId: l.sourceId }));
  const adjRows = adjustmentNamed ?? [];
  const adjTotal = adjRows.reduce((s, r) => s + r.amount, 0);
  return createPortal(
    <PrintFrame>
      <article className="print-sheet">
        <SheetHead
          title="Bank reconciliation"
          subtitle={`${bankName} · statement ${formatDate(statementDate)}${finished ? " · finished" : " · working"}`}
        />
        <table className="register-print-table">
          <tbody>
            <tr><td>Beginning (last statement)</td><td className="col-money">{money(beginning)}</td></tr>
            <tr><td>Deposits cleared</td><td className="col-money">{money(clearedIn)}</td></tr>
            <tr><td>Payments cleared</td><td className="col-money">{money(clearedOut)}</td></tr>
            <tr><td>Cleared balance</td><td className="col-money">{money(beginning + clearedIn - clearedOut)}</td></tr>
            <tr><td>Statement ending</td><td className="col-money">{money(ending)}</td></tr>
            <tr><td>Cleared difference</td><td className="col-money">{money(difference)}</td></tr>
            {bookBalance !== undefined ? (
              <>
                <tr><td>Book balance</td><td className="col-money">{money(bookBalance)}</td></tr>
                <tr><td>Outstanding checks</td><td className="col-money">{money(outRows.reduce((s, r) => s + r.amount, 0))}</td></tr>
                <tr><td>Deposits in transit</td><td className="col-money">{money(ditRows.reduce((s, r) => s + r.amount, 0))}</td></tr>
                {adjRows.length > 0 ? (
                  <tr><td>Adjustments this statement</td><td className="col-money">{money(adjTotal)}</td></tr>
                ) : null}
                <tr><td>Explained difference</td><td className="col-money">{money(explained ?? 0)}</td></tr>
              </>
            ) : null}
          </tbody>
        </table>
        {aging ? (
          <p className="mt-3 text-sm">
            Uncleared age · 1–30 {money(aging.d30)} · 31–60 {money(aging.d60)} · 61–90 {money(aging.d90)} · 90+ {money(aging.late)}
            {aging.lateCount ? ` (${aging.lateCount} items)` : ""}
          </p>
        ) : null}
        <h2 className="mt-3 text-sm font-medium">Outstanding checks</h2>
        <NamedTable rows={outRows} currency={currency} empty="None." />
        <h2 className="mt-3 text-sm font-medium">Deposits in transit</h2>
        <NamedTable rows={ditRows} currency={currency} empty="None." />
        {adjRows.length > 0 ? (
          <>
            <h2 className="mt-3 text-sm font-medium">Adjustments</h2>
            <NamedTable rows={adjRows} currency={currency} empty="None." />
          </>
        ) : null}
        {ticked.length > 0 ? (
          <>
            <h2 className="mt-3 text-sm font-medium">Cleared this statement</h2>
            <LineTable lines={ticked} currency={currency} empty="None ticked." />
          </>
        ) : null}
      </article>
    </PrintFrame>,
    document.body,
  );
}

function NamedTable({ rows, currency, empty }: { rows: ReconNamedLine[]; currency: string; empty: string }) {
  if (rows.length === 0) return <p className="print-sheet-empty">{empty}</p>;
  return (
    <table className="register-print-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Payee</th>
          <th>No.</th>
          <th>Days</th>
          <th className="col-money">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.sourceId}-${i}`}>
            <td>{formatDate(r.date)}</td>
            <td>{r.party}</td>
            <td>{r.number}</td>
            <td>{r.days || ""}</td>
            <td className="col-money">{formatMoney(r.amount, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LineTable({ lines, currency, empty }: { lines: CashLine[]; currency: string; empty: string }) {
  if (lines.length === 0) return <p className="print-sheet-empty">{empty}</p>;
  return (
    <table className="register-print-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Payee</th>
          <th className="col-money">Payment</th>
          <th className="col-money">Deposit</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.id}>
            <td>{formatDate(l.date)}</td>
            <td>{KIND_LABEL[l.kind]}</td>
            <td>{l.party}</td>
            <td className="col-money">{l.payment ? formatMoney(l.payment, currency) : ""}</td>
            <td className="col-money">{l.deposit ? formatMoney(l.deposit, currency) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StatementPrint({ stmt, currency }: { stmt: CustomerStatement; currency: string }) {
  const mounted = usePrintPortal();
  if (!mounted) return null;
  return createPortal(
    <PrintFrame>
      <article className="print-sheet">
        <SheetHead title="Customer statement" subtitle={`As of ${formatDate(stmt.asOf)}`} />
        <p className="mb-4 text-sm">
          {stmt.name}
          {stmt.address ? ` · ${stmt.address}` : ""}
          {stmt.phone ? ` · ${stmt.phone}` : ""}
        </p>
        {stmt.lastPayment ? (
          <p className="mb-3 text-sm">
            Last payment {formatDate(stmt.lastPayment.date)} {formatMoney(stmt.lastPayment.amount, currency)}
            {stmt.lastPayment.number ? ` · ${stmt.lastPayment.number}` : ""}
          </p>
        ) : (
          <p className="mb-3 text-sm">No payments on file.</p>
        )}
        {stmt.lines.length === 0 ? (
          <p className="print-sheet-empty">No open invoices.</p>
        ) : (
          <table className="register-print-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Due</th>
                <th>No.</th>
                <th>Age</th>
                <th className="col-money">Open</th>
              </tr>
            </thead>
            <tbody>
              {stmt.lines.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.date)}</td>
                  <td>{formatDate(l.dueDate)}</td>
                  <td>{l.number}</td>
                  <td>{AGE_LABEL[l.bucket]}</td>
                  <td className="col-money">{formatMoney(l.open, currency)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>Balance due</td>
                <td className="col-money">{formatMoney(stmt.total, currency)}</td>
              </tr>
            </tbody>
          </table>
        )}
        {stmt.notes ? <p className="mt-4 text-sm">{stmt.notes}</p> : null}
      </article>
    </PrintFrame>,
    document.body,
  );
}

export function PeriodPackPrint({
  data,
  through,
  snapshot,
}: {
  data: FinanceData;
  through: string;
  snapshot?: CloseSnapshot | null;
}) {
  const mounted = usePrintPortal();
  if (!mounted) return null;
  const currency = data.settings.currency;
  const money = (n: number) => formatMoney(n, currency);
  const tb = trialBalance(data, through);
  const ytdFrom = fiscalStartOn(data, through);
  const monthFrom = monthStartIso(through);
  const plMonth = incomeStatement(data, through, monthFrom);
  const plYtd = incomeStatement(data, through, ytdFrom);
  const ar = arAging(data, through);
  const ap = apAging(data, through);
  const arT = agingTotals(ar);
  const apT = agingTotals(ap);
  const recs: ReconStatement[] = [];
  for (const bank of data.banks.filter((b) => !b.archived)) {
    const last = (data.reconHistory ?? [])
      .filter((r) => r.bankId === bank.id && r.statementDate <= through)
      .sort((a, b) => a.statementDate.localeCompare(b.statementDate) || a.finishedAt - b.finishedAt)
      .at(-1);
    if (last) recs.push(last);
  }
  const statements = data.customers
    .map((c) => customerStatement(data, c.id, through))
    .filter((s): s is NonNullable<typeof s> => Boolean(s && s.total > 0));
  return createPortal(
    <PrintFrame>
      <article className="print-sheet">
        <SheetHead title="Trial balance" subtitle={`Period pack · as of ${formatDate(through)}`} />
        {snapshot ? (
          <p className="mb-3 text-sm">
            Close snapshot {formatDate(snapshot.through)} · AR {money(snapshot.ar)} · AP {money(snapshot.ap)}
            {snapshot.journalId ? ` · journal ${snapshot.journalId.slice(0, 8)}` : ""}
          </p>
        ) : null}
        <TbTable rows={tb} money={money} />
      </article>
      <article className="print-sheet">
        <SheetHead title="Profit and loss" subtitle={`This month · ${formatDate(monthFrom)} – ${formatDate(through)}`} />
        <p className="mb-2 text-sm">
          Income {money(plMonth.income)} · Expense {money(plMonth.expense)} · Net {money(plMonth.net)}
        </p>
        <PlAccountTable rows={plMonth.byAccount} money={money} />
      </article>
      <article className="print-sheet">
        <SheetHead title="Profit and loss" subtitle={`Year to date · ${formatDate(ytdFrom)} – ${formatDate(through)}`} />
        <p className="mb-2 text-sm">
          Income {money(plYtd.income)} · Expense {money(plYtd.expense)} · Net {money(plYtd.net)}
        </p>
        <PlAccountTable rows={plYtd.byAccount} money={money} />
      </article>
      <article className="print-sheet">
        <SheetHead title="AR aging" subtitle={`As of ${formatDate(through)}`} />
        <p className="mb-3 text-sm">{AGE_ORDER.map((b) => `${AGE_LABEL[b]} ${money(arT[b])}`).join(" · ")}</p>
        <AgingPrint rows={ar} currency={currency} empty="No open invoices." />
      </article>
      <article className="print-sheet">
        <SheetHead title="AP aging" subtitle={`As of ${formatDate(through)}`} />
        <p className="mb-3 text-sm">{AGE_ORDER.map((b) => `${AGE_LABEL[b]} ${money(apT[b])}`).join(" · ")}</p>
        <AgingPrint rows={ap} currency={currency} empty="No open bills." />
      </article>
      {recs.map((r) => {
        const bank = data.banks.find((b) => b.id === r.bankId);
        const aging = r.unclearedAging;
        return (
          <article className="print-sheet" key={r.id}>
            <SheetHead title="Bank reconciliation" subtitle={`${bank?.nickname ?? r.bankId} · ${formatDate(r.statementDate)} · finished`} />
            <table className="register-print-table">
              <tbody>
                <tr><td>Beginning (last statement)</td><td className="col-money">{money(r.beginning)}</td></tr>
                <tr><td>Deposits cleared</td><td className="col-money">{money(r.clearedIn)}</td></tr>
                <tr><td>Payments cleared</td><td className="col-money">{money(r.clearedOut)}</td></tr>
                <tr><td>Statement ending</td><td className="col-money">{money(r.statementEnding)}</td></tr>
                <tr><td>Book balance</td><td className="col-money">{money(r.bookBalance ?? 0)}</td></tr>
                <tr><td>Outstanding checks</td><td className="col-money">{money(r.outstanding)}</td></tr>
                <tr><td>Deposits in transit</td><td className="col-money">{money(r.depositsInTransit)}</td></tr>
                <tr><td>Explained difference</td><td className="col-money">{money(r.explained ?? 0)}</td></tr>
              </tbody>
            </table>
            {aging ? (
              <p className="mt-3 text-sm">
                Uncleared age · 1–30 {money(aging.d30)} · 31–60 {money(aging.d60)} · 61–90 {money(aging.d90)} · 90+ {money(aging.late)}
                {aging.lateCount ? ` (${aging.lateCount} items)` : ""}
              </p>
            ) : null}
            <h2 className="mt-3 text-sm font-medium">Outstanding checks</h2>
            <NamedTable rows={r.outstandingLines ?? []} currency={currency} empty="None." />
            <h2 className="mt-3 text-sm font-medium">Deposits in transit</h2>
            <NamedTable rows={r.ditLines ?? []} currency={currency} empty="None." />
            {(r.adjustmentLines ?? []).length > 0 ? (
              <>
                <h2 className="mt-3 text-sm font-medium">Adjustments</h2>
                <NamedTable rows={r.adjustmentLines} currency={currency} empty="None." />
              </>
            ) : null}
          </article>
        );
      })}
      {statements.map((stmt) => (
        <article className="print-sheet" key={stmt.customerId}>
          <SheetHead title="Customer statement" subtitle={`As of ${formatDate(stmt.asOf)}`} />
          <p className="mb-3 text-sm">
            {stmt.name}
            {stmt.address ? ` · ${stmt.address}` : ""}
            {stmt.phone ? ` · ${stmt.phone}` : ""}
          </p>
          {stmt.lastPayment ? (
            <p className="mb-3 text-sm">
              Last payment {formatDate(stmt.lastPayment.date)} {formatMoney(stmt.lastPayment.amount, currency)}
              {stmt.lastPayment.number ? ` · ${stmt.lastPayment.number}` : ""}
            </p>
          ) : (
            <p className="mb-3 text-sm">No payments on file through this date.</p>
          )}
          {stmt.lines.length === 0 ? (
            <p className="print-sheet-empty">No open invoices.</p>
          ) : (
            <table className="register-print-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Due</th>
                  <th>No.</th>
                  <th>Age</th>
                  <th className="col-money">Open</th>
                </tr>
              </thead>
              <tbody>
                {stmt.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.date)}</td>
                    <td>{formatDate(l.dueDate)}</td>
                    <td>{l.number}</td>
                    <td>{AGE_LABEL[l.bucket]}</td>
                    <td className="col-money">{formatMoney(l.open, currency)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4}>Balance due</td>
                  <td className="col-money">{formatMoney(stmt.total, currency)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </article>
      ))}
    </PrintFrame>,
    document.body,
  );
}

export function ReportsPrint({ asOf, tab }: { asOf: string; tab: "aging" | "tb" | "pl" }) {
  const data = useFinanceData();
  const mounted = usePrintPortal();
  if (!mounted) return null;
  const currency = data.settings.currency;
  const money = (n: number) => formatMoney(n, currency);
  if (tab === "tb") {
    const tb = trialBalance(data, asOf);
    return createPortal(
      <PrintFrame>
        <article className="print-sheet">
          <SheetHead title="Trial balance" subtitle={`As of ${formatDate(asOf)}`} />
          <TbTable rows={tb} money={money} />
        </article>
      </PrintFrame>,
      document.body,
    );
  }
  if (tab === "pl") {
    const pl = incomeStatement(data, asOf);
    return createPortal(
      <PrintFrame>
        <article className="print-sheet">
          <SheetHead title="Profit and loss" subtitle={`As of ${formatDate(asOf)}`} />
          <p className="mb-2 text-sm">
            Income {money(pl.income)} · Expense {money(pl.expense)} · Net {money(pl.net)}
          </p>
          <PlAccountTable rows={pl.byAccount} money={money} />
        </article>
      </PrintFrame>,
      document.body,
    );
  }
  const ar = arAging(data, asOf);
  const ap = apAging(data, asOf);
  const arT = agingTotals(ar);
  const apT = agingTotals(ap);
  return createPortal(
    <PrintFrame>
      <article className="print-sheet">
        <SheetHead title="AR aging" subtitle={`As of ${formatDate(asOf)}`} />
        <p className="mb-3 text-sm">{AGE_ORDER.map((b) => `${AGE_LABEL[b]} ${money(arT[b])}`).join(" · ")}</p>
        <AgingPrint rows={ar} currency={currency} empty="No open invoices." />
      </article>
      <article className="print-sheet">
        <SheetHead title="AP aging" subtitle={`As of ${formatDate(asOf)}`} />
        <p className="mb-3 text-sm">{AGE_ORDER.map((b) => `${AGE_LABEL[b]} ${money(apT[b])}`).join(" · ")}</p>
        <AgingPrint rows={ap} currency={currency} empty="No open bills." />
      </article>
    </PrintFrame>,
    document.body,
  );
}

function TbTable({
  rows,
  money,
}: {
  rows: ReturnType<typeof trialBalance>;
  money: (n: number) => string;
}) {
  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);
  return (
    <table className="register-print-table">
      <thead>
        <tr>
          <th>Account</th>
          <th className="col-money">Debit</th>
          <th className="col-money">Credit</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.account.id}>
            <td>
              {row.account.code} {row.account.name}
            </td>
            <td className="col-money">{row.debit ? money(row.debit) : ""}</td>
            <td className="col-money">{row.credit ? money(row.credit) : ""}</td>
          </tr>
        ))}
        <tr>
          <td>Total</td>
          <td className="col-money">{money(debit)}</td>
          <td className="col-money">{money(credit)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function PlAccountTable({
  rows,
  money,
}: {
  rows: ReturnType<typeof incomeStatement>["byAccount"];
  money: (n: number) => string;
}) {
  if (rows.length === 0) return <p className="print-sheet-empty">No activity in this period.</p>;
  return (
    <table className="register-print-table">
      <thead>
        <tr>
          <th>Account</th>
          <th className="col-money">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.account.id}>
            <td>
              {r.account.code} {r.account.name}
            </td>
            <td className="col-money">{money(r.account.type === "expense" ? -r.amount : r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AgingPrint({
  rows,
  currency,
  empty,
}: {
  rows: ReturnType<typeof arAging>;
  currency: string;
  empty: string;
}) {
  if (rows.length === 0) return <p className="print-sheet-empty">{empty}</p>;
  return (
    <table className="register-print-table">
      <thead>
        <tr>
          <th>Party</th>
          <th>No.</th>
          <th>Date</th>
          <th>Due</th>
          <th>Age</th>
          <th className="col-money">Open</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.party}</td>
            <td>{r.number}</td>
            <td>{formatDate(r.date)}</td>
            <td>{formatDate(r.dueDate)}</td>
            <td>{AGE_LABEL[r.bucket]}</td>
            <td className="col-money">{formatMoney(r.amount, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
