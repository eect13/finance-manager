import { CsvButton } from "@/components/export-menu";
import { Money } from "@/components/money";
import { auBasCsvRows, auBasSummary, AU_BOOKS_DISCLAIMER } from "@/lib/finance/au-bas";
import { fxDocumentCsvRows, fxDocumentRows, fxRateCsvRows, FX_BOOKS_DISCLAIMER } from "@/lib/finance/fx";
import { genericVatCsvRows, genericVatMonthlyCsvRows, vatWorkbook, VAT_BOOKS_DISCLAIMER } from "@/lib/finance/generic-vat";
import { sgCpfCsvRows, sgCpfRows, SG_BOOKS_DISCLAIMER } from "@/lib/finance/sg-cpf";
import { ukPayeCsvRows, ukPayeRows, UK_BOOKS_DISCLAIMER } from "@/lib/finance/uk-paye";
import { usW2CsvRows, usWithholdingSummary, US_BOOKS_DISCLAIMER } from "@/lib/finance/us-payroll";
import type { AllRegionalModules } from "@/lib/finance/types";
import { useFinanceData } from "@/lib/finance/store";
import { useMemo, type ReactNode } from "react";

function Paper({ children }: { children: ReactNode }) {
  return <div className="list-grid list-scroll overflow-auto rounded-2xl table-paper elevation outline-none">{children}</div>;
}

function Head({ title, note }: { title: string; note: string }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function RegionalPayrollSections({
  asOf,
  year,
  currency,
  mods,
}: {
  asOf: string;
  year: number;
  currency: string;
  mods: AllRegionalModules;
}) {
  const data = useFinanceData();
  const us = useMemo(() => (mods.usPayroll ? usWithholdingSummary(data, year, asOf) : null), [mods.usPayroll, data, year, asOf]);
  const sg = useMemo(() => (mods.sgCpf ? sgCpfRows(data, year, asOf) : []), [mods.sgCpf, data, year, asOf]);
  const au = useMemo(() => (mods.auBas ? auBasSummary(data, year, asOf) : null), [mods.auBas, data, year, asOf]);
  const uk = useMemo(() => (mods.ukPaye ? ukPayeRows(data, year, asOf) : []), [mods.ukPaye, data, year, asOf]);

  return (
    <div className="space-y-4">
      {mods.usPayroll && us ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <CsvButton filename={`us-w2-estimate-${year}.csv`} rows={usW2CsvRows(data, year, asOf)} label="Export US W-2 estimate" />
          </div>
          <Paper>
            <Head
              title={`US FIT + FICA · W-2 style · ${year}`}
              note={`Single-filer FIT stub, SS 6.2% (wage base $184,500), Medicare 1.45%. From posted gross or salary pro-rata. ${US_BOOKS_DISCLAIMER}`}
            />
            <table className="text-sm" style={{ width: "100%" }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-center font-medium">Employee</th>
                  <th className="px-4 py-3 text-center font-medium">Wages</th>
                  <th className="px-4 py-3 text-center font-medium">FIT</th>
                  <th className="px-4 py-3 text-center font-medium">SS</th>
                  <th className="px-4 py-3 text-center font-medium">Medicare</th>
                </tr>
              </thead>
              <tbody>
                {us.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={5}>
                      No active employees.
                    </td>
                  </tr>
                ) : (
                  us.rows.map((r) => (
                    <tr key={r.employeeId} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3">
                        <Money amount={r.wages} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.fit} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.ssEe} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.medicareEe + r.additionalMedicare} currency={currency} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Paper>
        </div>
      ) : null}

      {mods.sgCpf ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <CsvButton filename={`sg-cpf-estimate-${year}.csv`} rows={sgCpfCsvRows(data, year, asOf)} label="Export CPF estimate" />
          </div>
          <Paper>
            <Head
              title={`Singapore CPF · ${year}`}
              note={`Age ≤55 ordinary-wage stub: employee 20% / employer 17%, OW ceiling $8,000/month. From posted salary or monthly rate. ${SG_BOOKS_DISCLAIMER}`}
            />
            <table className="text-sm" style={{ width: "100%" }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-center font-medium">Employee</th>
                  <th className="px-4 py-3 text-center font-medium">OW</th>
                  <th className="px-4 py-3 text-center font-medium">Employee</th>
                  <th className="px-4 py-3 text-center font-medium">Employer</th>
                  <th className="px-4 py-3 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sg.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={5}>
                      No active employees.
                    </td>
                  </tr>
                ) : (
                  sg.map((r) => (
                    <tr key={r.employeeId} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3">
                        <Money amount={r.ordinaryWage} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.ee} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.er} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.total} currency={currency} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Paper>
        </div>
      ) : null}

      {mods.auBas && au ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <CsvButton filename={`au-bas-payg-${year}.csv`} rows={auBasCsvRows(data, year, asOf)} label="Export BAS / PAYG" />
          </div>
          <Paper>
            <Head
              title={`Australia PAYG / BAS · ${year}`}
              note={`GST from output/input accounts plus PAYG estimate (resident brackets + 2% Medicare levy). ${AU_BOOKS_DISCLAIMER}`}
            />
            <table className="text-sm" style={{ width: "100%" }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-center font-medium">Item</th>
                  <th className="px-4 py-3 text-center font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">GST on sales (2200)</td>
                  <td className="px-4 py-3">
                    <Money amount={au.gstOnSales} currency={currency} />
                  </td>
                </tr>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">GST on purchases (1300)</td>
                  <td className="px-4 py-3">
                    <Money amount={au.gstOnPurchases} currency={currency} />
                  </td>
                </tr>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">Net GST</td>
                  <td className="px-4 py-3">
                    <Money amount={au.netGst} currency={currency} signed />
                  </td>
                </tr>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">PAYG withheld estimate</td>
                  <td className="px-4 py-3">
                    <Money amount={au.paygEstimate} currency={currency} />
                  </td>
                </tr>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">Posted other withholdings (2210)</td>
                  <td className="px-4 py-3">
                    <Money amount={au.postedWithholdings} currency={currency} />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Suggested remittance</td>
                  <td className="px-4 py-3 font-medium">
                    <Money amount={au.remittance} currency={currency} signed />
                  </td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </div>
      ) : null}

      {mods.ukPaye ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <CsvButton filename={`uk-paye-ni-${year}.csv`} rows={ukPayeCsvRows(data, year, asOf)} label="Export PAYE + NI" />
          </div>
          <Paper>
            <Head
              title={`UK PAYE + NI · ${year}`}
              note={`Personal allowance £12,570, basic 20% / higher 40% / additional 45%. Class 1 NI employee 8% then 2%; employer 13.8% above ST. ${UK_BOOKS_DISCLAIMER}`}
            />
            <table className="text-sm" style={{ width: "100%" }}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-center font-medium">Employee</th>
                  <th className="px-4 py-3 text-center font-medium">Annualized</th>
                  <th className="px-4 py-3 text-center font-medium">PAYE</th>
                  <th className="px-4 py-3 text-center font-medium">NI EE</th>
                  <th className="px-4 py-3 text-center font-medium">NI ER</th>
                </tr>
              </thead>
              <tbody>
                {uk.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={5}>
                      No active employees.
                    </td>
                  </tr>
                ) : (
                  uk.map((r) => (
                    <tr key={r.employeeId} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3">
                        <Money amount={r.annual} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.paye} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.niEe} currency={currency} />
                      </td>
                      <td className="px-4 py-3">
                        <Money amount={r.niEr} currency={currency} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Paper>
        </div>
      ) : null}
    </div>
  );
}

export function GenericVatWorkbook({ asOf, currency }: { asOf: string; currency: string }) {
  const data = useFinanceData();
  const w = useMemo(() => vatWorkbook(data, asOf), [data, asOf]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <CsvButton filename={`vat-gst-workbook-${asOf}.csv`} rows={genericVatCsvRows(data, asOf)} label="Export VAT/GST workbook" />
        <CsvButton filename={`vat-gst-monthly-${asOf}.csv`} rows={genericVatMonthlyCsvRows(data, asOf)} label="Export monthly VAT/GST" />
      </div>
      <Paper>
        <Head
          title="VAT / GST workbook"
          note={`Default rate ${w.rate}%${w.taxEnabled ? "" : " (sales tax is off — rate is a placeholder)"}. Monthly buckets from 2200 / 1300 journals. ${VAT_BOOKS_DISCLAIMER}`}
        />
        <table className="text-sm" style={{ width: "100%" }}>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-center font-medium">Period</th>
              <th className="px-4 py-3 text-center font-medium">Output</th>
              <th className="px-4 py-3 text-center font-medium">Input</th>
              <th className="px-4 py-3 text-center font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {w.months.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                  No VAT/GST journal activity through this date.
                </td>
              </tr>
            ) : (
              w.months.map((m) => (
                <tr key={m.period} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">{m.period}</td>
                  <td className="px-4 py-3">
                    <Money amount={m.output} currency={currency} />
                  </td>
                  <td className="px-4 py-3">
                    <Money amount={m.input} currency={currency} />
                  </td>
                  <td className="px-4 py-3">
                    <Money amount={m.net} currency={currency} signed />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Paper>
    </div>
  );
}

export function FxPanel({ asOf, currency }: { asOf: string; currency: string }) {
  const data = useFinanceData();
  const secondary = data.settings.secondaryCurrency || "";
  const docs = useMemo(() => fxDocumentRows(data, asOf), [data, asOf]);
  const rates = data.settings.fxRates ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <CsvButton filename={`fx-rates-${asOf}.csv`} rows={fxRateCsvRows(data)} label="Export FX rates" />
        <CsvButton filename={`fx-documents-${asOf}.csv`} rows={fxDocumentCsvRows(data, asOf)} label="Export converted docs" />
      </div>
      <Paper>
        <Head
          title="FX rates"
          note={`Home ${currency || "—"} · secondary ${secondary || "—"}. ${FX_BOOKS_DISCLAIMER} Invoices stay in home currency (no per-document FX field).`}
        />
        <table className="text-sm" style={{ width: "100%" }}>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-center font-medium">From</th>
              <th className="px-4 py-3 text-center font-medium">To</th>
              <th className="px-4 py-3 text-center font-medium">Rate</th>
              <th className="px-4 py-3 text-center font-medium">As of</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                  No rates yet — add them under Settings → Tax & payroll modules.
                </td>
              </tr>
            ) : (
              rates.map((r) => (
                <tr key={r.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">{r.from}</td>
                  <td className="px-4 py-3">{r.to}</td>
                  <td className="px-4 py-3">{r.rate}</td>
                  <td className="px-4 py-3">{r.asOf || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Paper>
      <Paper>
        <Head title="Documents in secondary currency" note="Converted at the latest rate on or before the as-of date (or the document date)." />
        <table className="text-sm" style={{ width: "100%" }}>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-center font-medium">Type</th>
              <th className="px-4 py-3 text-center font-medium">No.</th>
              <th className="px-4 py-3 text-center font-medium">Party</th>
              <th className="px-4 py-3 text-center font-medium">Home</th>
              <th className="px-4 py-3 text-center font-medium">{secondary || "Secondary"}</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-muted-foreground" colSpan={5}>
                  No documents through this date.
                </td>
              </tr>
            ) : (
              docs.slice(0, 80).map((r) => (
                <tr key={`${r.kind}-${r.number}-${r.date}`} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">{r.kind}</td>
                  <td className="px-4 py-3">{r.number}</td>
                  <td className="px-4 py-3">{r.party}</td>
                  <td className="px-4 py-3">
                    <Money amount={r.homeCents} currency={currency} />
                  </td>
                  <td className="px-4 py-3">
                    {r.found ? <Money amount={r.secondaryCents} currency={secondary} /> : <span className="text-muted-foreground">No rate</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {docs.length > 80 ? <p className="px-4 py-3 text-xs text-muted-foreground">Showing first 80 — export CSV for the full list.</p> : null}
      </Paper>
    </div>
  );
}
