import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { p as Plus } from "../_libs/lucide-react.mjs";
import { F as formatMoney, P as formatDate, Q as pendingChecksTotal, T as currentMonth, Y as openReceivables, Z as parseAmountToCents, at as totalCash, lt as useFinanceData, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, M as SelectValue, O as Select, S as Input, T as Money, d as DialogDescription, f as DialogFooter, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, p as DialogHeader, t as AppShell, u as DialogContent, x as Field } from "./app-shell-Dw047gD3.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
import { n as projectedCash, t as cashForecast } from "./forecast-D62WrP3J.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/forecast-BZjXwX5G.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ForecastPage() {
	const data = useFinanceData();
	const { settings, budgetItems } = data;
	const upsertBudget = useFinanceStore((s) => s.upsertBudget);
	const removeBudget = useFinanceStore((s) => s.removeBudget);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		kind: "outflow",
		amount: "",
		startMonth: currentMonth()
	});
	(0, import_react.useEffect)(() => setReady(true), []);
	const points = (0, import_react.useMemo)(() => cashForecast(data, 90), [
		data.settings,
		data.checks,
		data.invoices,
		data.bills,
		data.budgetItems,
		data.journals
	]);
	const chart = points.map((p) => ({
		date: formatDate(p.date),
		label: p.date.slice(5),
		cash: p.cash / 100,
		inflows: p.inflows / 100,
		outflows: p.outflows / 100
	}));
	const end = points[points.length - 1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Cash forecast",
		description: "Rolling ninety days: bank estimate, pending checks, invoice due dates, then monthly budget items.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => setOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Budget item"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "Book cash"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: totalCash(data),
							currency: settings.currency,
							className: "mt-2 text-2xl font-medium"
						})]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "eyebrow",
								children: "Now + open invoices"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: projectedCash(data),
								currency: settings.currency,
								className: "mt-2 text-2xl font-medium"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									"Collect ",
									formatMoney(openReceivables(data), settings.currency),
									" · pending checks",
									" ",
									formatMoney(pendingChecksTotal(data), settings.currency)
								]
							})
						]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "In 90 days"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: end?.cash ?? 0,
							currency: settings.currency,
							className: "mt-2 text-2xl font-medium"
						})]
					}) })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Projection" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-72",
					children: ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
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
									id: "forecastFill",
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
									dataKey: "label",
									tick: {
										fontSize: 11,
										fill: "var(--color-muted-foreground)"
									},
									axisLine: false,
									tickLine: false,
									interval: 13
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
									fill: "url(#forecastFill)",
									strokeWidth: 1.75
								})
							]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-xl bg-muted" })
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Monthly budget" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Applied on the first of each future month. Keep rent and payroll here so the forecast stays honest."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "flex flex-col gap-3",
					children: budgetItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No recurring items yet."
					}) : budgetItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 rounded-xl bg-muted/70 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: item.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								item.kind === "inflow" ? "Inflow" : "Outflow",
								" · from ",
								item.startMonth
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: item.kind === "outflow" ? -item.amount : item.amount,
								currency: settings.currency,
								signed: true,
								className: "text-sm font-medium"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => removeBudget(item.id),
								children: "Remove"
							})]
						})]
					}, item.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Budget item" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Repeats every month from the start month onward." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.name,
									onChange: (e) => setForm({
										...form,
										name: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Direction",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.kind,
									onValueChange: (v) => setForm({
										...form,
										kind: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "outflow",
										children: "Money out"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "inflow",
										children: "Money in"
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Monthly amount",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.amount,
									onChange: (e) => setForm({
										...form,
										amount: e.target.value
									}),
									inputMode: "decimal"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Start month",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "month",
									value: form.startMonth,
									onChange: (e) => setForm({
										...form,
										startMonth: e.target.value
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (!form.name.trim()) return toast.error("Name the item.");
							upsertBudget({
								name: form.name.trim(),
								kind: form.kind,
								amount: parseAmountToCents(form.amount),
								cadence: "monthly",
								startMonth: form.startMonth
							});
							setOpen(false);
							toast.success("Budget item saved.");
						},
						children: "Save"
					}) })
				] })
			})
		]
	});
}
//#endregion
export { ForecastPage as component };
