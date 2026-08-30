import { formatDate, formatMoney } from "@/lib/finance/format";
import { invoiceSubtotal, invoiceTax, invoiceTotal } from "@/lib/finance/ledger";
import type { Customer, Invoice, Settings } from "@/lib/finance/types";

export function InvoiceDocument({
  invoice,
  customer,
  settings,
}: {
  invoice: Invoice;
  customer: Customer;
  settings: Settings;
}) {
  const sub = invoiceSubtotal(invoice.lines);
  const tax = invoiceTax(sub, invoice.taxRate, settings.taxEnabled);
  const total = invoiceTotal(
    {
      settings,
      invoices: [invoice],
      banks: [],
      accounts: [],
      customers: [],
      checks: [],
      journals: [],
      budgetItems: [],
      nextNumbers: { invoice: 0, check: {}, receipt: 1, bill: 1 },
      vendors: [],
      bills: [],
      receipts: [],
    },
    invoice.id,
  );
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <article className="mx-auto w-full max-w-3xl bg-card p-8 text-card-foreground md:p-12">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:justify-between">
        <div>
          <p className="eyebrow">Invoice</p>
          <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">{invoice.number}</h1>
          <p className="mt-4 text-sm font-medium">{settings.companyName}</p>
          {settings.companyAddress ? <p className="text-sm text-muted-foreground">{settings.companyAddress}</p> : null}
          {settings.companyEmail ? <p className="text-sm text-muted-foreground">{settings.companyEmail}</p> : null}
          {settings.companyPhone ? <p className="text-sm text-muted-foreground">{settings.companyPhone}</p> : null}
        </div>
        <div className="text-sm sm:text-right">
          <p>
            <span className="text-muted-foreground">Date </span>
            {formatDate(invoice.date)}
          </p>
          <p>
            <span className="text-muted-foreground">Due </span>
            {formatDate(invoice.dueDate)}
          </p>
          <p className="mt-2 capitalize">{invoice.status === "sent" ? "Open" : invoice.status}</p>
        </div>
      </header>

      <section className="mt-8">
        <p className="eyebrow">Bill to</p>
        <p className="mt-1 font-medium">{customer.name}</p>
        {customer.contact ? <p className="text-sm text-muted-foreground">{customer.contact}</p> : null}
        {customer.address ? <p className="text-sm text-muted-foreground">{customer.address}</p> : null}
        {customer.email ? <p className="text-sm text-muted-foreground">{customer.email}</p> : null}
      </section>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Unit</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b border-border/70">
              <td className="py-3">{line.description}</td>
              <td className="py-3 text-right tabular-nums">{line.quantity}</td>
              <td className="py-3 text-right tabular-nums">{formatMoney(line.unitPrice, settings.currency)}</td>
              <td className="py-3 text-right tabular-nums">
                {formatMoney(Math.round(line.quantity * line.unitPrice), settings.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(sub, settings.currency)}</span>
        </div>
        {settings.taxEnabled ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax {invoice.taxRate}%</span>
            <span className="tabular-nums">{formatMoney(tax, settings.currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total, settings.currency)}</span>
        </div>
        {paid > 0 ? (
          <div className="flex justify-between text-credit">
            <span>Paid</span>
            <span className="tabular-nums">{formatMoney(paid, settings.currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-medium">
          <span>Balance due</span>
          <span className="tabular-nums">{formatMoney(Math.max(0, total - paid), settings.currency)}</span>
        </div>
      </div>

      {invoice.notes ? (
        <p className="mt-10 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes. </span>
          {invoice.notes}
        </p>
      ) : null}

      {customer.terms ? <p className="mt-4 text-sm text-muted-foreground">Terms: {customer.terms}</p> : null}
    </article>
  );
}
