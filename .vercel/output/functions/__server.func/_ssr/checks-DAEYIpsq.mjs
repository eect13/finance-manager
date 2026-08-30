import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { p as Plus } from "../_libs/lucide-react.mjs";
import { C as checkRegisterRows, P as formatDate, Z as parseAmountToCents, lt as useFinanceData, rt as todayIso, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, G as useEntrySort, M as SelectValue, O as Select, S as Input, T as Money, U as openProps, W as stopOpen, _ as DropdownMenuItem, a as CheckBadge, d as DialogDescription, f as DialogFooter, g as DropdownMenuContent, h as DropdownMenu, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, s as CsvButton, t as AppShell, u as DialogContent, v as DropdownMenuTrigger, x as Field } from "./app-shell-Dw047gD3.mjs";
import { t as SortHeader } from "./sort-header-BR4Tb6bQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checks-DAEYIpsq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChecksPage() {
	const data = useFinanceData();
	const issueCheck = useFinanceStore((s) => s.issueCheck);
	const setCheckStatus = useFinanceStore((s) => s.setCheckStatus);
	const removeCheck = useFinanceStore((s) => s.removeCheck);
	const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [bankFilter, setBankFilter] = (0, import_react.useState)("all");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		bankId: "",
		checkNumber: "",
		payee: "",
		vendorId: "",
		issueDate: todayIso(),
		postDate: todayIso(),
		amount: "",
		memo: "",
		accountId: expenseAccounts[0]?.id ?? ""
	});
	const filtered = (0, import_react.useMemo)(() => {
		return data.checks.filter((c) => bankFilter === "all" ? true : c.bankId === bankFilter).filter((c) => statusFilter === "all" ? true : c.status === statusFilter);
	}, [
		data.checks,
		bankFilter,
		statusFilter
	]);
	const getters = (0, import_react.useMemo)(() => ({
		number: (c) => c.checkNumber,
		payee: (c) => c.payee,
		bank: (c) => data.banks.find((b) => b.id === c.bankId)?.nickname ?? "",
		issued: (c) => c.issueDate,
		post: (c) => c.postDate,
		amount: (c) => c.amount,
		status: (c) => c.status
	}), [data.banks]);
	const sort = useEntrySort(filtered, "issued", getters, "desc");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Check register",
		description: "Issue, post-date, clear, void, or bounce. Pending checks stay visible until they hit the bank.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "check-register.csv",
			rows: checkRegisterRows(data)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => setOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Issue check"]
		})] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: bankFilter,
					onValueChange: setBankFilter,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "sm:w-48",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All banks" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All banks"
					}), data.banks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: b.id,
						children: b.nickname
					}, b.id))] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: statusFilter,
					onValueChange: setStatusFilter,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "sm:w-48",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All statuses" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All statuses"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "pending",
							children: "Pending"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "cleared",
							children: "Cleared"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "voided",
							children: "Voided"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "bounced",
							children: "Bounced"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-3xl bg-card elevation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-3xl text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Check",
								column: "number",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Payee",
								column: "payee",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Bank",
								column: "bank",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Issued",
								column: "issued",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Post",
								column: "post",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Amount",
								column: "amount",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle,
								align: "right"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Status",
								column: "status",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sort.sorted.map((check) => {
						const bank = data.banks.find((b) => b.id === check.bankId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/70 last:border-0",
							...openProps("check", check.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3 tabular-nums font-medium",
									children: ["#", check.checkNumber]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: check.payee }), check.memo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: check.memo
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-muted-foreground",
									children: bank?.nickname
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(check.issueDate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(check.postDate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: check.amount,
										currency: data.settings.currency
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: check.status })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									onDoubleClick: stopOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap justify-end gap-1",
										children: [check.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "outline",
												children: "Update"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
											align: "end",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
													onClick: () => setCheckStatus(check.id, "cleared"),
													children: "Clear"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
													onClick: () => {
														setCheckStatus(check.id, "voided");
														toast.success("Check voided and reversed.");
													},
													children: "Void"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
													onClick: () => {
														setCheckStatus(check.id, "bounced");
														toast.success("Marked bounced and reversed.");
													},
													children: "Bounce"
												})
											]
										})] }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setDeleting(check),
											children: "Delete"
										})]
									})
								})
							]
						}, check.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Issue a check" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts the expense immediately. Status stays pending until you clear it." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bank",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.bankId,
									onValueChange: (v) => setForm({
										...form,
										bankId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.nickname
									}, b.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Check number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.checkNumber,
										onChange: (e) => setForm({
											...form,
											checkNumber: e.target.value
										}),
										placeholder: "Auto if blank"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Amount",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.amount,
										onChange: (e) => setForm({
											...form,
											amount: e.target.value
										}),
										inputMode: "decimal"
									})
								})]
							}),
							data.vendors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Vendor (optional)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.vendorId || "none",
									onValueChange: (v) => {
										if (v === "none") {
											setForm({
												...form,
												vendorId: "",
												payee: form.payee
											});
											return;
										}
										const vendor = data.vendors.find((x) => x.id === v);
										setForm({
											...form,
											vendorId: v,
											payee: vendor?.name ?? form.payee
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Type a payee or pick a vendor" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "none",
										children: "No vendor"
									}), data.vendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: v.id,
										children: v.name
									}, v.id))] })]
								})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Payee",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.payee,
									onChange: (e) => setForm({
										...form,
										payee: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Issue date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.issueDate,
										onChange: (e) => setForm({
											...form,
											issueDate: e.target.value
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Post date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: form.postDate,
										onChange: (e) => setForm({
											...form,
											postDate: e.target.value
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Charge to",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.accountId,
									onValueChange: (v) => setForm({
										...form,
										accountId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: expenseAccounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: a.id,
										children: [
											a.code,
											" ",
											a.name
										]
									}, a.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Memo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.memo,
									onChange: (e) => setForm({
										...form,
										memo: e.target.value
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							try {
								issueCheck({
									bankId: form.bankId,
									checkNumber: form.checkNumber,
									payee: form.payee,
									issueDate: form.issueDate,
									postDate: form.postDate,
									amount: parseAmountToCents(form.amount),
									memo: form.memo,
									accountId: form.accountId,
									vendorId: form.vendorId || void 0
								});
								setOpen(false);
								toast.success("Check issued.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not issue check.");
							}
						},
						children: "Issue check"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: Boolean(deleting),
				title: "Delete check?",
				body: "Removes this check and takes it off the ledger so you can issue it again.",
				onClose: () => setDeleting(null),
				onConfirm: () => {
					if (!deleting) return;
					try {
						removeCheck(deleting.id);
						toast.success("Check deleted.");
						setDeleting(null);
					} catch (err) {
						toast.error(err instanceof Error ? err.message : "Could not delete.");
						setDeleting(null);
					}
				}
			})
		]
	});
}
//#endregion
export { ChecksPage as component };
