import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { P as formatDate, U as ledgerRows, d as accountBalance, lt as useFinanceData, st as trialBalance } from "./store-zEGD4c48.mjs";
import { F as Tabs, G as useEntrySort, I as TabsContent, L as TabsList, R as TabsTrigger, T as Money, U as openProps, s as CsvButton, t as AppShell } from "./app-shell-Dw047gD3.mjs";
import { t as useWindowVirtualizer } from "../_libs/@tanstack/react-virtual+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ledger-9a-8EjQX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LedgerPage() {
	const data = useFinanceData();
	const { settings, accounts, journals } = data;
	const tb = trialBalance(data);
	const getters = (0, import_react.useMemo)(() => ({
		date: (e) => e.date,
		description: (e) => e.description,
		source: (e) => e.sourceType
	}), []);
	const sort = useEntrySort(journals, "date", getters, "desc");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "General ledger",
		description: "Every movement is double-entry. This is the view you hand an accountant.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "general-ledger.csv",
			rows: ledgerRows(data)
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "journal",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "journal",
					children: "Journal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "accounts",
					children: "Chart of accounts"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "journal",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex flex-wrap gap-2",
						children: [
							["date", "Date"],
							["description", "Description"],
							["source", "Source"]
						].map(([column, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => sort.toggle(column),
							className: "inline-flex min-h-11 items-center rounded-full bg-muted px-3 text-sm text-foreground",
							children: [label, sort.key === column ? sort.dir === "asc" ? " ↑" : " ↓" : ""]
						}, column))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JournalList, {
						entries: sort.sorted,
						accounts,
						currency: settings.currency
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "accounts",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto rounded-3xl bg-card elevation",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-xl text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-left text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-3 font-medium",
										children: "Code"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-3 font-medium",
										children: "Account"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-3 font-medium",
										children: "Type"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-3 text-right font-medium",
										children: "Balance"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: accounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/70 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 tabular-nums",
										children: account.code
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3",
										children: account.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 capitalize text-muted-foreground",
										children: account.type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
											amount: accountBalance(data, account.id),
											currency: settings.currency
										})
									})
								]
							}, account.id)) })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: [
							"Trial balance debit ",
							tb.reduce((s, r) => s + r.debit, 0) / 100,
							" / credit",
							" ",
							tb.reduce((s, r) => s + r.credit, 0) / 100,
							" (in ",
							settings.currency,
							" units)."
						]
					})]
				})
			]
		})
	});
}
function JournalList({ entries, accounts, currency }) {
	const wrapRef = (0, import_react.useRef)(null);
	const [margin, setMargin] = (0, import_react.useState)(0);
	(0, import_react.useLayoutEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		function measure() {
			const node = wrapRef.current;
			if (!node) return;
			const next = Math.round(node.getBoundingClientRect().top + window.scrollY);
			setMargin((m) => m === next ? m : next);
		}
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);
	const virtualizer = useWindowVirtualizer({
		count: entries.length,
		estimateSize: () => 152,
		overscan: 8,
		scrollMargin: margin,
		getItemKey: (index) => entries[index]?.id ?? index
	});
	if (entries.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-8 text-center text-sm text-muted-foreground",
		children: "No journal entries yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "relative",
		style: { height: virtualizer.getTotalSize() },
		children: virtualizer.getVirtualItems().map((item) => {
			const entry = entries[item.index];
			if (!entry) return null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				"data-index": item.index,
				ref: virtualizer.measureElement,
				className: "absolute top-0 right-0 left-0 pb-3",
				style: { transform: `translateY(${item.start - margin}px)` },
				...openProps("journal", entry.id),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl bg-card p-5 elevation",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: entry.description
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								formatDate(entry.date),
								" · ",
								entry.sourceType
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
						className: "mt-3 w-full text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: entry.lines.map((line) => {
							const account = accounts.find((a) => a.id === line.accountId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5 text-muted-foreground",
									children: account ? `${account.code} ${account.name}` : line.accountId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5 text-right tabular-nums",
									children: line.debit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: line.debit,
										currency
									}) : ""
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-1.5 text-right tabular-nums text-muted-foreground",
									children: line.credit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: line.credit,
										currency
									}) : ""
								})
							] }, line.id);
						}) })
					})]
				})
			}, entry.id);
		})
	});
}
//#endregion
export { LedgerPage as component };
