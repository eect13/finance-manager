import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useShallow } from "../_libs/zustand.mjs";
import { A as downloadText, ht as workspaceBackupPayload, lt as useFinanceData, n as CURRENCIES, p as backupPayload, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, E as NewCompanyDialog, M as SelectValue, O as Select, S as Input, j as SelectTrigger, k as SelectContent, n as AppearancePicker, o as ConfirmDelete, t as AppShell, x as Field } from "./app-shell-Dw047gD3.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-4bGA0e1Q.mjs";
import { t as Switch } from "./switch-Du7ZaScO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-DWRJPUzY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	if (bytes < 1024) return `${Math.round(bytes)} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
	return `${(bytes / 1073741824).toFixed(1)} GB`;
}
function jsonSize(value) {
	try {
		return new Blob([JSON.stringify(value)]).size;
	} catch {
		return 0;
	}
}
function countEntries(data) {
	const invoices = data.invoices.length;
	const bills = data.bills.length;
	const receipts = data.receipts.length;
	const checks = data.checks.length;
	const journals = data.journals.length;
	return {
		invoices,
		bills,
		receipts,
		checks,
		journals,
		customers: data.customers.length,
		vendors: data.vendors.length,
		total: invoices + bills + receipts + checks + journals
	};
}
async function browserStorage() {
	try {
		const estimate = await navigator.storage?.estimate?.();
		return {
			usage: estimate?.usage ?? 0,
			quota: estimate?.quota ?? 0
		};
	} catch {
		return {
			usage: 0,
			quota: 0
		};
	}
}
function SettingsPage() {
	const data = useFinanceData();
	const settings = data.settings;
	const updateSettings = useFinanceStore((s) => s.updateSettings);
	const resetDemo = useFinanceStore((s) => s.resetDemo);
	const startFresh = useFinanceStore((s) => s.startFresh);
	const importBackup = useFinanceStore((s) => s.importBackup);
	const fileRef = (0, import_react.useRef)(null);
	const { order, companies, activeId, switchCompany, addCompany, removeCompany } = useFinanceStore(useShallow((s) => ({
		order: s.companyOrder,
		companies: s.companies,
		activeId: s.activeCompanyId,
		switchCompany: s.switchCompany,
		addCompany: s.addCompany,
		removeCompany: s.removeCompany
	})));
	const [newOpen, setNewOpen] = (0, import_react.useState)(false);
	const [dropId, setDropId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		function scrollToHash() {
			if (window.location.hash !== "#storage") return;
			document.getElementById("storage")?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}
		scrollToHash();
		window.addEventListener("hashchange", scrollToHash);
		return () => window.removeEventListener("hashchange", scrollToHash);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Settings",
		description: "Company identity, appearance, currency, list order, backup, and storage for the books.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Company" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Printed on invoices and the register for the company you are in." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: settings.companyName,
									onChange: (e) => updateSettings({ companyName: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Address",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: settings.companyAddress,
									onChange: (e) => updateSettings({ companyAddress: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Phone",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: settings.companyPhone,
										onChange: (e) => updateSettings({ companyPhone: e.target.value })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Email",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "email",
										value: settings.companyEmail,
										onChange: (e) => updateSettings({ companyEmail: e.target.value })
									})
								})]
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Appearance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Light or dark. Saved in this browser, not in the company file." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppearancePicker, {}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Companies" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Each company has its own banks and books. Pacific Harbor Trading stays as the default sample." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "grid gap-2",
						children: [order.map((id) => {
							const label = companies[id]?.settings.companyName ?? "Company";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-h-11 items-center gap-2 rounded-xl bg-muted/70 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "min-w-0 flex-1 text-left text-sm font-medium",
									onClick: () => switchCompany(id),
									children: [
										label,
										id === "co-pacific-harbor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 font-normal text-muted-foreground",
											children: "sample"
										}) : null,
										id === activeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 font-normal text-muted-foreground",
											children: "· open"
										}) : null
									]
								}), order.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setDropId(id),
									children: "Remove"
								}) : null]
							}, id);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "w-fit",
							onClick: () => setNewOpen(true),
							children: "New company"
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Money" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "One home currency for now. Multi-currency can slot in later without rewriting the ledger." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Currency",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: settings.currency,
									onValueChange: (v) => updateSettings({ currency: v }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: CURRENCIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: c.code,
										children: [
											c.code,
											" — ",
											c.label
										]
									}, c.code)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "Sales tax on invoices"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Adds a tax line. Default rate is Philippine VAT."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: settings.taxEnabled,
									onCheckedChange: (v) => updateSettings({ taxEnabled: v })
								})]
							}),
							settings.taxEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Default tax %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: String(settings.defaultTaxRate),
									onChange: (e) => updateSettings({ defaultTaxRate: Number(e.target.value) || 0 }),
									inputMode: "decimal"
								})
							}) : null
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Entry lists" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Sort by clicking column headers on every register. Drag-and-drop is optional and off by default." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-4 rounded-xl bg-muted/70 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Allow drag-and-drop reordering"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Grab the handle on customers, vendors, bills, receipts, and invoice lines. The bank register has its own Drag rows toggle."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: settings.dragDropEnabled,
							onCheckedChange: (v) => updateSettings({ dragDropEnabled: v })
						})]
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Backup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Download all companies as one JSON file, or just this company. Restore accepts either. Books live in this browser (IndexedDB), not a shared server. Watch space under Storage." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									downloadText(`finance-manager-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, workspaceBackupPayload({
										companies,
										companyOrder: order,
										activeCompanyId: activeId
									}), "application/json");
									toast.success("Downloaded backup.");
								},
								children: "Download books"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									downloadText(`finance-manager-company-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, backupPayload(data), "application/json");
									toast.success("Downloaded this company.");
								},
								children: "This company"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => fileRef.current?.click(),
								children: "Restore backup"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: "application/json",
								className: "hidden",
								onChange: async (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									if (!file) return;
									try {
										const kind = importBackup(await file.text());
										toast.success(kind === "workspace" ? "All companies restored." : "This company restored.");
									} catch (err) {
										toast.error(err instanceof Error ? err.message : "Could not restore.");
									}
								}
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "lg:col-span-2 scroll-mt-6",
						id: "storage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Storage" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Books live in this browser as IndexedDB (with a localStorage fallback). That is the right place — entries are unlimited. Watch usage here. When it fills, download a backup, purge closed years, or start a new company." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoragePanel, {}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "lg:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Sample data" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Pacific Harbor Trading is the default sample. Reload it anytime. Start blank clears the company you are in, not the others." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									startFresh();
									toast.success("Blank books. Add a bank to begin.");
								},
								children: "Start blank"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									resetDemo();
									toast.success("Pacific Harbor sample is open.");
								},
								children: "Reload sample"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewCompanyDialog, {
				open: newOpen,
				onClose: () => setNewOpen(false),
				onCreate: addCompany
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: dropId !== null,
				title: "Remove this company?",
				body: "Deletes its banks and books from this browser. Other companies stay.",
				confirmLabel: "Remove",
				requirePhrase: order.length > 1 ? "DELETE" : void 0,
				onClose: () => setDropId(null),
				onConfirm: () => {
					if (dropId) removeCompany(dropId);
					setDropId(null);
					toast.success("Company removed.");
				}
			})
		]
	});
}
function StoragePanel() {
	const data = useFinanceData();
	const companies = useFinanceStore((s) => s.companies);
	const purgeClosedThrough = useFinanceStore((s) => s.purgeClosedThrough);
	const counts = countEntries(data);
	const companyBytes = (0, import_react.useMemo)(() => jsonSize(data), [data]);
	const allBytes = (0, import_react.useMemo)(() => jsonSize(companies), [companies]);
	const [browser, setBrowser] = (0, import_react.useState)({
		usage: 0,
		quota: 0
	});
	const [through, setThrough] = (0, import_react.useState)(`${(/* @__PURE__ */ new Date()).getFullYear() - 1}-12-31`);
	const [purging, setPurging] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		browserStorage().then((next) => {
			if (alive) setBrowser(next);
		});
		return () => {
			alive = false;
		};
	}, [allBytes]);
	const quota = browser.quota;
	const used = Math.max(browser.usage, allBytes);
	const pct = quota > 0 ? Math.min(100, Math.round(used / quota * 100)) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex flex-wrap items-end justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: quota > 0 ? `${formatBytes(used)} of ${formatBytes(quota)} in this browser` : formatBytes(used)
				}), quota > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs tabular-nums text-muted-foreground",
					children: [pct, "% used"]
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 overflow-hidden rounded-full bg-muted",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-full bg-primary",
					style: { width: `${pct}%` }
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "This company",
						value: formatBytes(companyBytes),
						hint: `${counts.total} entries`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "All companies",
						value: formatBytes(allBytes),
						hint: `${Object.keys(companies).length} files`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Documents",
						value: String(counts.invoices + counts.bills + counts.receipts + counts.checks),
						hint: `${counts.invoices} invoices · ${counts.bills} bills · ${counts.receipts} receipts · ${counts.checks} checks`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Parties",
						value: String(counts.customers + counts.vendors),
						hint: `${counts.customers} customers · ${counts.vendors} vendors`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 rounded-2xl bg-muted/70 p-4 sm:flex-row sm:flex-wrap sm:items-end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Purge closed activity through",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: through,
								onChange: (e) => setThrough(e.target.value)
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setPurging(true),
						disabled: !through,
						children: "Purge closed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "w-full text-xs text-muted-foreground",
						children: "Removes paid, void, and cleared documents on or before that date. Open invoices, bills, and pending checks stay. A condensed journal keeps balances the same. Download a backup first."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: purging,
				title: "Purge closed activity?",
				body: `Deletes paid, void, and cleared entries through ${through}. Open items stay. Balances stay the same. This cannot be undone unless you restore a backup.`,
				confirmLabel: "Purge",
				requirePhrase: "PURGE",
				onClose: () => setPurging(false),
				onConfirm: () => {
					try {
						const n = purgeClosedThrough(through);
						toast.success(`Removed ${n} closed ${n === 1 ? "entry" : "entries"}.`);
						setPurging(false);
					} catch (err) {
						toast.error(err instanceof Error ? err.message : "Could not purge.");
						setPurging(false);
					}
				}
			})
		]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-muted/70 px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-lg font-medium tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
