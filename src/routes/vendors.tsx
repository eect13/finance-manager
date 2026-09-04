import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CsvButton } from "@/components/export-menu";
import { ListPrint } from "@/components/list-print";
import { VendorCenter } from "@/components/party-center";
import { requestPrint } from "@/components/print-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/money";
import { vendorRows } from "@/lib/finance/export";
import { formatMoney } from "@/lib/finance/format";
import { vendorOpenBalance } from "@/lib/finance/ledger";
import { useFinanceData } from "@/lib/finance/store";

export const Route = createFileRoute("/vendors")({ component: VendorsPage });

function VendorsPage() {
  const data = useFinanceData();
  const totalOpen = data.vendors.reduce((sum, v) => sum + vendorOpenBalance(data, v.id), 0);

  return (
    <AppShell
      title="Vendors"
      description="Tap a name to open its history. On a wide screen, click selects; double-tap or double-click or Enter for Details. Filter All / Open / Zero."
      wide
      actions={
        <>
          <CsvButton filename="vendors.csv" rows={vendorRows(data)} />
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
            <p className="eyebrow">Vendors</p>
            <p className="stat-value">{data.vendors.length}</p>
          </CardContent>
        </Card>
      </section>
      <VendorCenter />
      <ListPrint
        title="Vendors"
        columns={[
          { key: "name", label: "Name" },
          { key: "contact", label: "Contact" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "open", label: "Open", align: "right" },
        ]}
        rows={[...data.vendors]
          .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
          .map((v) => ({
            name: v.name,
            contact: v.contact,
            email: v.email,
            phone: v.phone,
            open: formatMoney(vendorOpenBalance(data, v.id), data.settings.currency),
          }))}
      />
    </AppShell>
  );
}
