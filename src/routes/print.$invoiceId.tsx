import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { InvoiceDocument } from "@/components/invoice-document";
import { Button } from "@/components/ui/button";
import { bootBooks, useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { useEffect } from "react";

export const Route = createFileRoute("/print/$invoiceId")({ component: PrintInvoice });

function PrintInvoice() {
  const { invoiceId } = Route.useParams();
  const hydrated = useFinanceStore((s) => s.hydrated);
  const { invoices, customers, settings } = useFinanceData();
  useEffect(() => {
    void bootBooks();
  }, []);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8 text-sm text-muted-foreground">
        Opening the books…
      </main>
    );
  }

  const invoice = invoices.find((i) => i.id === invoiceId);
  const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : undefined;

  if (!invoice || !customer) {
    return (
      <main className="p-8">
        <p>Invoice not found.</p>
        <Link to="/invoices" className="mt-4 inline-block text-sm underline">
          Back to invoices
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between px-4">
        <Button variant="outline" asChild>
          <Link to="/invoices">Back</Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer />
          Print / save PDF
        </Button>
      </div>
      <InvoiceDocument invoice={invoice} customer={customer} settings={settings} />
    </main>
  );
}
