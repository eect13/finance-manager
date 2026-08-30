import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { F as formatMoney, J as openPayables, P as formatDate, Q as pendingChecksTotal, R as invoiceBalance, Y as openReceivables, at as totalCash, g as billBalance, lt as useFinanceData } from "./store-zEGD4c48.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as InvoiceBadge, T as Money, U as openProps, a as CheckBadge, i as BillBadge, t as AppShell } from "./app-shell-Dw047gD3.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
import { n as projectedCash, t as cashForecast } from "./forecast-D62WrP3J.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BWO7ugEC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Desk() {
	const data = useFinanceData();
	const { settings, banks, accounts, customers, vendors, invoices, bills, checks, journals } = data;
	const [chartReady, setChartReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setChartReady(true), []);
	const book = totalCash(data);
	const inBank = book + pendingChecksTotal(data);
	const receivables = openReceivables(data);
	const payables = openPayables(data);
	const projected = projectedCash(data);
	const chart = (0, import_react.useMemo)(() => cashForecast(data, 90), [
		data.settings,
		data.checks,
		data.invoices,
		data.bills,
		data.budgetItems,
		data.journals
	]).filter((_, i) => i % 3 === 0).map((p) => ({
		date: p.date.slice(5),
		cash: p.cash / 100
	}));
	const overdue = invoices.filter((i) => {
		if (i.status === "paid" || i.status === "void") return false;
		return i.dueDate < (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) && invoiceBalance(data, i.id) > 0;
	});
	const pendingList = [...checks].filter((c) => c.status === "pending").sort((a, b) => a.postDate.localeCompare(b.postDate));
	const openBills = [...bills].filter((b) => b.status === "open" || b.status === "partial").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Treasury desk",
		description: "Cash across banks, money still to collect, and bills still to pay. Double-click a line to open it.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "desk-stats",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "In the bank (est.)",
						hint: "Book cash plus pending checks",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: inBank,
							currency: settings.currency,
							className: "text-2xl font-medium"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Book cash",
						hint: "After issued checks",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: book,
							currency: settings.currency,
							className: "text-2xl font-medium"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "To collect",
						hint: "Open invoices",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: receivables,
							currency: settings.currency,
							className: "text-2xl font-medium"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "To pay",
						hint: "Open vendor bills",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: payables,
							currency: settings.currency,
							className: "text-2xl font-medium"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "desk-split mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Ninety-day cash" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Starts from bank estimate, then applies pending checks, invoice due dates, bills, and monthly budgets. Projected after AR and AP: ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: projected,
							currency: settings.currency,
							className: "inline"
						}),
						"."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64",
					children: chartReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: chart,
							margin: {
								top: 8,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
									id: "cashFill",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "var(--color-primary)",
										stopOpacity: .18
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "var(--color-primary)",
										stopOpacity: .02
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "date",
									tick: {
										fontSize: 11,
										fill: "var(--color-muted-foreground)"
									},
									axisLine: false,
									tickLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									tick: {
										fontSize: 11,
										fill: "var(--color-muted-foreground)"
									},
									axisLine: false,
									tickLine: false,
									width: 64,
									tickFormatter: (v) => new Intl.NumberFormat("en-PH", { notation: "compact" }).format(v)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									formatter: (value) => formatMoney(Number(value) * 100, settings.currency),
									contentStyle: {
										background: "var(--color-card)",
										border: "1px solid var(--color-border)",
										borderRadius: 12,
										fontSize: 12
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "cash",
									stroke: "var(--color-primary)",
									fill: "url(#cashFill)",
									strokeWidth: 1.75
								})
							]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-xl bg-muted" })
				}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Banks" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "flex flex-col gap-3",
					children: banks.filter((b) => !b.archived).map((bank) => {
						const balance = accounts.find((a) => a.id === bank.accountId) ? journals.reduce((sum, j) => {
							for (const line of j.lines) if (line.accountId === bank.accountId) sum += line.debit - line.credit;
							return sum;
						}, 0) : 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							...openProps("bank", bank.id),
							className: "flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: bank.nickname
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									bank.name,
									" · ",
									bank.accountNumber
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: balance,
								currency: settings.currency,
								className: "text-sm font-medium"
							})]
						}, bank.id);
					})
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "desk-trio mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Pending checks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/checks",
							className: "text-sm text-muted-foreground hover:text-foreground",
							children: "Checks"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "flex flex-col gap-3",
						children: pendingList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No outstanding checks."
						}) : pendingList.slice(0, 5).map((check) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3 rounded-xl px-1 py-1",
							...openProps("check", check.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: check.payee
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"#",
									check.checkNumber,
									" · posts ",
									formatDate(check.postDate)
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
									amount: check.amount,
									currency: settings.currency,
									className: "text-sm"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: check.status })]
							})]
						}, check.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Overdue invoices" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/invoices",
							className: "text-sm text-muted-foreground hover:text-foreground",
							children: "All invoices"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "flex flex-col gap-3",
						children: overdue.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Nothing overdue. Good books."
						}) : overdue.map((inv) => {
							const customer = customers.find((c) => c.id === inv.customerId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 rounded-xl px-1 py-1",
								...openProps("invoice", inv.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: customer?.name ?? inv.number
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										inv.number,
										" · due ",
										formatDate(inv.dueDate)
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: invoiceBalance(data, inv.id),
										currency: settings.currency,
										className: "text-sm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBadge, {
										status: inv.status,
										overdue: true
									})]
								})]
							}, inv.id);
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Open bills" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/bills",
							className: "text-sm text-muted-foreground hover:text-foreground",
							children: "All bills"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "flex flex-col gap-3",
						children: openBills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No vendor bills waiting."
						}) : openBills.slice(0, 5).map((bill) => {
							const vendor = vendors.find((v) => v.id === bill.vendorId);
							const overdueBill = bill.dueDate < (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 rounded-xl px-1 py-1",
								...openProps("bill", bill.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: vendor?.name ?? bill.number
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										bill.number,
										" · due ",
										formatDate(bill.dueDate)
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: billBalance(bill),
										currency: settings.currency,
										className: "text-sm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillBadge, {
										status: bill.status,
										overdue: overdueBill
									})]
								})]
							}, bill.id);
						})
					})] })
				]
			})
		]
	});
}
function Stat({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			})
		]
	}) });
}
//#endregion
export { Desk as component };
