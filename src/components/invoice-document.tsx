import { formatDate, formatMoney } from "@/lib/finance/format";
import { invoiceSubtotal, invoiceTax, invoiceTotal } from "@/lib/finance/ledger";
import type { Customer, Invoice, Settings } from "@/lib/finance/types";

function contactLine(address?: string, phone?: string, email?: string) {
  const addr = (address ?? "").replace(/\s*\n+\s*/g, " · ").trim();
  return [addr || null, phone || null, email || null].filter(Boolean).join(" · ");
}

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
      recurrences: [],
      reconHistory: [],
      closeHistory: [],
      audit: [],
      nextNumbers: { invoice: 0, check: {}, receipt: 1, bill: 1 },
      vendors: [],
      bills: [],
      receipts: [],
    },
    invoice.id,
  );
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const meta = contactLine(settings.companyAddress, settings.companyPhone, settings.companyEmail);
  const status = invoice.status === "sent" ? "Open" : invoice.status;

  return (
    <article className="invoice-doc mx-auto w-full max-w-3xl bg-card px-6 py-5 text-card-foreground md:px-8 md:py-6">
      <header className="invoice-doc-head">
        <div className="invoice-doc-who">
          <p className="invoice-doc-company">{settings.companyName}</p>
          {meta ? <p className="invoice-doc-meta">{meta}</p> : null}
        </div>
        <div className="invoice-doc-what">
          <p className="invoice-doc-kicker">Invoice</p>
          <h1>{invoice.number}</h1>
          <p>
            {formatDate(invoice.date)} · Due {formatDate(invoice.dueDate)} · <span className="capitalize">{status}</span>
          </p>
        </div>
      </header>

      <section className="invoice-doc-billto">
        <p className="invoice-doc-kicker">Bill to</p>
        <p className="font-medium">{customer.name}</p>
        {customer.contact ? <p className="text-sm text-muted-foreground">{customer.contact}</p> : null}
        {customer.address ? <p className="text-sm text-muted-foreground">{customer.address}</p> : null}
        {customer.email ? <p className="text-sm text-muted-foreground">{customer.email}</p> : null}
      </section>

      <table className="invoice-doc-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="num">Qty</th>
            <th className="num">Unit</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.description}</td>
              <td className="num">{line.quantity}</td>
              <td className="num">{formatMoney(line.unitPrice, settings.currency)}</td>
              <td className="num">{formatMoney(Math.round(line.quantity * line.unitPrice), settings.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-doc-totals">
        <div>
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(sub, settings.currency)}</span>
        </div>
        {settings.taxEnabled ? (
          <div>
            <span className="text-muted-foreground">Tax {invoice.taxRate}%</span>
            <span className="tabular-nums">{formatMoney(tax, settings.currency)}</span>
          </div>
        ) : null}
        <div className="invoice-doc-total">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total, settings.currency)}</span>
        </div>
        {paid > 0 ? (
          <div className="text-credit">
            <span>Paid</span>
            <span className="tabular-nums">{formatMoney(paid, settings.currency)}</span>
          </div>
        ) : null}
        <div className="invoice-doc-total">
          <span>Balance due</span>
          <span className="tabular-nums">{formatMoney(Math.max(0, total - paid), settings.currency)}</span>
        </div>
      </div>

      {invoice.notes ? (
        <p className="invoice-doc-notes">
          <span className="font-medium text-foreground">Notes. </span>
          {invoice.notes}
        </p>
      ) : null}

      {customer.terms ? <p className="invoice-doc-notes">Terms: {customer.terms}</p> : null}
    </article>
  );
}
