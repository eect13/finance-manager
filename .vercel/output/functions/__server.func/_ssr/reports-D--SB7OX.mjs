import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { L as incomeStatement, ct as trialBalanceRows, lt as useFinanceData, st as trialBalance, t as Button } from "./store-zEGD4c48.mjs";
import { T as Money, b as ExportMenu, s as CsvButton, t as AppShell } from "./app-shell-Dw047gD3.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-D--SB7OX.js
var import_jsx_runtime = require_jsx_runtime();
function ReportsPage() {
	const data = useFinanceData();
	const settings = data.settings;
	const tb = trialBalance(data);
	const pl = incomeStatement(data);
	const debit = tb.reduce((s, r) => s + r.debit, 0);
	const credit = tb.reduce((s, r) => s + r.credit, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Reports",
		description: "Trial balance and profit & loss, ready for Excel, Google Sheets, or a PDF print.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: "trial-balance.csv",
				rows: trialBalanceRows(data)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportMenu, { data }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => window.print(),
				children: "Print / PDF"
			})
		] }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Trial balance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"Debits ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: debit,
						currency: settings.currency
					}),
					" · Credits",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: credit,
						currency: settings.currency
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "text-left text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "pb-2 font-medium",
							children: "Account"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "pb-2 text-right font-medium",
							children: "Debit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "pb-2 text-right font-medium",
							children: "Credit"
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: tb.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border/70",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: row.account.code
								}),
								" ",
								row.account.name
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2 text-right",
							children: row.debit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: row.debit,
								currency: settings.currency
							}) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2 text-right",
							children: row.credit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: row.credit,
								currency: settings.currency
							}) : "—"
						})
					]
				}, row.account.id)) })]
			}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Profit and loss" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Income minus expenses for all posted activity."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-col gap-2 text-sm",
				children: [pl.byAccount.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: row.account.code
						}),
						" ",
						row.account.name
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: row.account.type === "expense" ? -row.amount : row.amount,
						currency: settings.currency,
						signed: true
					})]
				}, row.account.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between border-t border-border pt-3 font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net income" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: pl.net,
						currency: settings.currency,
						signed: true
					})]
				})]
			})] })]
		})
	});
}
//#endregion
export { ReportsPage as component };
