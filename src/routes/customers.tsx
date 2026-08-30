import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CsvButton } from "@/components/export-menu";
import { CustomerCenter } from "@/components/party-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/money";
import { customerRows } from "@/lib/finance/export";
import { customerOpenBalance } from "@/lib/finance/ledger";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/customers")({ component: CustomersPage });

function CustomersPage() {
  const data = useFinanceData();
  const totalOpen = data.customers.reduce((sum, c) => sum + customerOpenBalance(data, c.id), 0);

  return (
    <AppShell
      title="Customers"
      description="Pick a customer to see every invoice, payment, and cash sale. Tap a line to edit it, or use New to invoice and receive without leaving this page."
      actions={
        <>
          <CsvButton filename="customers.csv" rows={customerRows(data)} />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
        </>
      }
    >
      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">Total open</p>
            <Money amount={totalOpen} currency={data.settings.currency} className="mt-2 text-2xl font-medium" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="eyebrow">Customers</p>
            <p className="mt-2 text-2xl font-medium tabular-nums">{data.customers.length}</p>
          </CardContent>
        </Card>
      </section>
      <CustomerCenter />
    </AppShell>
  );
}
