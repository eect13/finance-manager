import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CsvButton, ExportMenu } from "@/components/export-menu";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trialBalanceRows } from "@/lib/finance/export";
import { incomeStatement, trialBalance } from "@/lib/finance/ledger";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const data = useFinanceData();
  const settings = data.settings;
  const tb = trialBalance(data);
  const pl = incomeStatement(data);
  const debit = tb.reduce((s, r) => s + r.debit, 0);
  const credit = tb.reduce((s, r) => s + r.credit, 0);

  return (
    <AppShell
      title="Reports"
      description="Trial balance and profit & loss, ready for Excel, Google Sheets, or a PDF print."
      actions={
        <>
          <CsvButton filename="trial-balance.csv" rows={trialBalanceRows(data)} />
          <ExportMenu data={data} />
          <Button variant="outline" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trial balance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Debits <Money amount={debit} currency={settings.currency} /> · Credits{" "}
              <Money amount={credit} currency={settings.currency} />
            </p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Account</th>
                  <th className="pb-2 text-right font-medium">Debit</th>
                  <th className="pb-2 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {tb.map((row) => (
                  <tr key={row.account.id} className="border-t border-border/70">
                    <td className="py-2">
                      <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
                    </td>
                    <td className="py-2 text-right">
                      {row.debit ? <Money amount={row.debit} currency={settings.currency} /> : "—"}
                    </td>
                    <td className="py-2 text-right">
                      {row.credit ? <Money amount={row.credit} currency={settings.currency} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit and loss</CardTitle>
            <p className="text-sm text-muted-foreground">Income minus expenses for all posted activity.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {pl.byAccount.map((row) => (
              <div key={row.account.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-muted-foreground">{row.account.code}</span> {row.account.name}
                </span>
                <Money
                  amount={row.account.type === "expense" ? -row.amount : row.amount}
                  currency={settings.currency}
                  signed
                />
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3 font-medium">
              <span>Net income</span>
              <Money amount={pl.net} currency={settings.currency} signed />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
