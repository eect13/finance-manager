import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { f as Printer } from "../_libs/lucide-react.mjs";
import { B as invoiceSubtotal, F as formatMoney, H as invoiceTotal, P as formatDate, V as invoiceTax, lt as useFinanceData, t as Button } from "./store-zEGD4c48.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./router-WCYpLEBA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print._invoiceId-BYtYWDho.js
var import_jsx_runtime = require_jsx_runtime();
function InvoiceDocument({ invoice, customer, settings }) {
	const sub = invoiceSubtotal(invoice.lines);
	const tax = invoiceTax(sub, invoice.taxRate, settings.taxEnabled);
	const total = invoiceTotal({
		settings,
		invoices: [invoice],
		banks: [],
		accounts: [],
		customers: [],
		checks: [],
		journals: [],
		budgetItems: [],
		nextNumbers: {
			invoice: 0,
			check: {},
			receipt: 1,
			bill: 1
		},
		vendors: [],
		bills: [],
		receipts: []
	}, invoice.id);
	const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto w-full max-w-3xl bg-card p-8 text-card-foreground md:p-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "Invoice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-1 text-3xl font-medium tracking-tight",
						children: invoice.number
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm font-medium",
						children: settings.companyName
					}),
					settings.companyAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: settings.companyAddress
					}) : null,
					settings.companyEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: settings.companyEmail
					}) : null,
					settings.companyPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: settings.companyPhone
					}) : null
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm sm:text-right",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "Date "
						}), formatDate(invoice.date)] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "Due "
						}), formatDate(invoice.dueDate)] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 capitalize",
							children: invoice.status === "sent" ? "Open" : invoice.status
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "Bill to"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-medium",
						children: customer.name
					}),
					customer.contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: customer.contact
					}) : null,
					customer.address ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: customer.address
					}) : null,
					customer.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: customer.email
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "mt-8 w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border text-left text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 font-medium",
							children: "Description"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 text-right font-medium",
							children: "Qty"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 text-right font-medium",
							children: "Unit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 text-right font-medium",
							children: "Amount"
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: invoice.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/70",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3",
							children: line.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-right tabular-nums",
							children: line.quantity
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-right tabular-nums",
							children: formatMoney(line.unitPrice, settings.currency)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-right tabular-nums",
							children: formatMoney(Math.round(line.quantity * line.unitPrice), settings.currency)
						})
					]
				}, line.id)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 ml-auto w-full max-w-xs space-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "Subtotal"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(sub, settings.currency)
						})]
					}),
					settings.taxEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [
								"Tax ",
								invoice.taxRate,
								"%"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(tax, settings.currency)
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between border-t border-border pt-2 text-base font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(total, settings.currency)
						})]
					}),
					paid > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-credit",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paid" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(paid, settings.currency)
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Balance due" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatMoney(Math.max(0, total - paid), settings.currency)
						})]
					})
				]
			}),
			invoice.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-10 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-foreground",
					children: "Notes. "
				}), invoice.notes]
			}) : null,
			customer.terms ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted-foreground",
				children: ["Terms: ", customer.terms]
			}) : null
		]
	});
}
function PrintInvoice() {
	const { invoiceId } = Route.useParams();
	const { invoices, customers, settings } = useFinanceData();
	const invoice = invoices.find((i) => i.id === invoiceId);
	const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : void 0;
	if (!invoice || !customer) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Invoice not found." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/invoices",
			className: "mt-4 inline-block text-sm underline",
			children: "Back to invoices"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-background py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print mx-auto mb-6 flex max-w-3xl items-center justify-between px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/invoices",
					children: "Back"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => window.print(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print / save PDF"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceDocument, {
			invoice,
			customer,
			settings
		})]
	});
}
//#endregion
export { PrintInvoice as component };
