import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CsvButton } from "@/components/export-menu";
import { ListPrint } from "@/components/list-print";
import { CustomerCenter } from "@/components/party-center";
import { requestPrint } from "@/components/print-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/money";
import { customerRows } from "@/lib/finance/export";
import { formatMoney } from "@/lib/finance/format";
import { customerOpenBalance } from "@/lib/finance/ledger";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/customers")({ component: CustomersPage });

function CustomersPage() {
  const data = useFinanceData();
  const totalOpen = data.customers.reduce((sum, c) => sum + customerOpenBalance(data, c.id), 0);

  return (
    <AppShell
      title="Customers"
      description="Tap a name to open its history. On a wide screen, click selects; double-click or Enter for Details. Filter All / Open / Zero."
      actions={
        <>
          <CsvButton filename="customers.csv" rows={customerRows(data)} />
          <Button variant="outline" onClick={requestPrint}>
            <Printer />
            Print
          </Button>
        </>
      }
    >
      <section className="stat-grid mb-4">
        <Card>
          <CardContent>
            <p className="eyebrow">Total open</p>
            <Money amount={totalOpen} currency={data.settings.currency} className="stat-value" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="eyebrow">Customers</p>
            <p className="stat-value">{data.customers.length}</p>
          </CardContent>
        </Card>
      </section>
      <CustomerCenter />
      <ListPrint
        title="Customers"
        columns={[
          { key: "name", label: "Name" },
          { key: "contact", label: "Contact" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "open", label: "Open", align: "right" },
        ]}
        rows={[...data.customers]
          .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
          .map((c) => ({
            name: c.name,
            contact: c.contact,
            email: c.email,
            phone: c.phone,
            open: formatMoney(customerOpenBalance(data, c.id), data.settings.currency),
          }))}
      />
    </AppShell>
  );
}
