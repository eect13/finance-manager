import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { p as Plus } from "../_libs/lucide-react.mjs";
import { $ as receiptRows, P as formatDate, R as invoiceBalance, Z as parseAmountToCents, f as addDaysIso, lt as useFinanceData, rt as todayIso, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, D as ReceiptBadge, G as useEntrySort, M as SelectValue, O as Select, S as Input, T as Money, U as openProps, W as stopOpen, d as DialogDescription, f as DialogFooter, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, s as CsvButton, t as AppShell, u as DialogContent, x as Field, y as EntryLines, z as Textarea } from "./app-shell-Dw047gD3.mjs";
import { n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
import { t as DragHandle } from "./drag-handle-DR58GmIZ.mjs";
import { t as SortHeader } from "./sort-header-BR4Tb6bQ.mjs";
import { t as useRowDrag } from "./use-row-drag-A8173dLk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/receipts-CGhjpZPO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReceiptsPage() {
	const data = useFinanceData();
	const createCashSale = useFinanceStore((s) => s.createCashSale);
	const recordInvoicePayment = useFinanceStore((s) => s.recordInvoicePayment);
	const voidReceipt = useFinanceStore((s) => s.voidReceipt);
	const removeReceipt = useFinanceStore((s) => s.removeReceipt);
	const reorderReceipts = useFinanceStore((s) => s.reorderReceipts);
	const dragEnabled = data.settings.dragDropEnabled;
	const today = todayIso();
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [kind, setKind] = (0, import_react.useState)("cash-sale");
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		date: today,
		bankId: "",
		customerId: "",
		receivedFrom: "",
		invoiceId: "",
		amount: "",
		notes: "",
		taxRate: String(data.settings.defaultTaxRate),
		method: "cash",
		checkNumber: "",
		lines: [{
			description: "",
			quantity: "1",
			unitPrice: ""
		}]
	});
	const getters = (0, import_react.useMemo)(() => ({
		order: (r) => r.sortOrder,
		number: (r) => r.number,
		date: (r) => r.date,
		from: (r) => r.receivedFrom,
		kind: (r) => r.kind,
		amount: (r) => r.amount,
		status: (r) => r.status
	}), []);
	const sort = useEntrySort(data.receipts, dragEnabled ? "order" : "date", getters, "desc");
	const dragOn = dragEnabled && sort.key === "order";
	const drag = useRowDrag(dragOn, sort.sorted.map((r) => r.id), reorderReceipts);
	const posted = data.receipts.filter((r) => r.status === "posted");
	const todaySales = posted.filter((r) => r.kind === "cash-sale" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
	const todayChecks = posted.filter((r) => r.method === "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
	const todayOnAccount = posted.filter((r) => r.kind === "payment" && r.method !== "check" && r.date === today).reduce((s, r) => s + r.amount, 0);
	const openInvoices = data.invoices.filter((i) => i.status === "sent" || i.status === "partial");
	const customerInvoices = openInvoices.filter((i) => !form.customerId || i.customerId === form.customerId);
	function openCreate(nextKind, method = "cash") {
		setKind(nextKind);
		setForm({
			date: today,
			bankId: data.banks.find((b) => !b.archived)?.id ?? "",
			customerId: "",
			receivedFrom: "",
			invoiceId: "",
			amount: "",
			notes: "",
			taxRate: String(data.settings.defaultTaxRate),
			method,
			checkNumber: "",
			lines: [{
				description: "",
				quantity: "1",
				unitPrice: ""
			}]
		});
		setCreateOpen(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Receipts",
		description: "Cash, customer checks, and money on account. Delete a ticket to take it off the books if you mistyped it.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: "receipts.csv",
				rows: receiptRows(data)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => openCreate("payment"),
				disabled: openInvoices.length === 0,
				children: "On account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => openCreate("payment", "check"),
				disabled: openInvoices.length === 0,
				children: "Check payment"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => openCreate("cash-sale"),
				disabled: data.banks.length === 0,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Cash sale"]
			})
		] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-4 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Cash sales today",
						value: todaySales,
						currency: data.settings.currency
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Checks today",
						value: todayChecks,
						currency: data.settings.currency
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "On account today",
						value: todayOnAccount,
						currency: data.settings.currency
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-3xl bg-card elevation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-4xl text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-muted-foreground",
						children: [
							dragEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Order",
								column: "order",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Number",
								column: "number",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Date",
								column: "date",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Received from",
								column: "from",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Kind",
								column: "kind",
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
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sort.sorted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: dragEnabled ? 8 : 7,
						className: "px-4 py-8 text-center text-muted-foreground",
						children: "No receipts yet."
					}) }) : sort.sorted.map((receipt) => {
						const bank = data.banks.find((b) => b.id === receipt.bankId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/70 last:border-0",
							...drag.bind(receipt.id),
							...openProps("receipt", receipt.id),
							children: [
								dragEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DragHandle, { enabled: dragOn })
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-medium",
									children: receipt.number
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(receipt.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: receipt.receivedFrom }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [bank?.nickname, receipt.checkNumber ? ` · Chk ${receipt.checkNumber}` : ""]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBadge, {
										status: receipt.status,
										kind: receipt.kind,
										method: receipt.method
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: receipt.amount,
										currency: data.settings.currency
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 capitalize text-muted-foreground",
									children: receipt.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									onDoubleClick: stopOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1",
										children: [receipt.status === "posted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => {
												voidReceipt(receipt.id);
												toast.success("Receipt voided.");
											},
											children: "Void"
										}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => setDeleting(receipt),
											children: "Delete"
										})]
									})
								})
							]
						}, receipt.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted-foreground",
				children: "Void keeps a cancelled stub. Delete takes the ticket off the ledger so you can re-enter it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: createOpen,
				onOpenChange: setCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: kind === "cash-sale" ? form.method === "check" ? "Cash sale by check" : "Cash sale" : form.method === "check" ? "Check payment" : "Receive on account" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: kind === "cash-sale" ? "Walk-in or named customer. Debits the bank, credits income." : "Apply money to an open invoice. Debits the bank, credits receivables." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Date",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: form.date,
											onChange: (e) => setForm({
												...form,
												date: e.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Deposit to",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: form.bankId,
											onValueChange: (v) => setForm({
												...form,
												bankId: v
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: b.id,
												children: b.nickname
											}, b.id)) })]
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Customer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.customerId || "none",
										onValueChange: (v) => setForm({
											...form,
											customerId: v === "none" ? "" : v,
											invoiceId: ""
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Optional" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "none",
											children: kind === "cash-sale" ? "Walk-in" : "Choose customer"
										}), data.customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c.id,
											children: c.name
										}, c.id))] })]
									})
								}),
								kind === "cash-sale" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Received from",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.receivedFrom,
											onChange: (e) => setForm({
												...form,
												receivedFrom: e.target.value
											}),
											placeholder: "Walk-in name if no customer"
										})
									}),
									data.settings.taxEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Tax %",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.taxRate,
											onChange: (e) => setForm({
												...form,
												taxRate: e.target.value
											}),
											inputMode: "decimal"
										})
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryLines, {
										lines: form.lines,
										onChange: (lines) => setForm({
											...form,
											lines
										}),
										dragEnabled
									})
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Invoice",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.invoiceId,
										onValueChange: (v) => setForm({
											...form,
											invoiceId: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Open invoice" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: customerInvoices.map((inv) => {
											const customer = data.customers.find((c) => c.id === inv.customerId);
											const due = invoiceBalance(data, inv.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
												value: inv.id,
												children: [
													inv.number,
													" · ",
													customer?.name,
													" · due ",
													addDaysIso(inv.dueDate, 0),
													" · ",
													due / 100
												]
											}, inv.id);
										}) })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Amount",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.amount,
										onChange: (e) => setForm({
											...form,
											amount: e.target.value
										}),
										inputMode: "decimal",
										placeholder: form.invoiceId ? String(invoiceBalance(data, form.invoiceId) / 100) : "0.00"
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Tender",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: form.method,
											onValueChange: (v) => setForm({
												...form,
												method: v
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "cash",
													children: "Cash"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "check",
													children: "Check"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "card",
													children: "Credit / Debit"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "echeck",
													children: "e-Check"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "other",
													children: "Other"
												})
											] })]
										})
									}), form.method === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Check number",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.checkNumber,
											onChange: (e) => setForm({
												...form,
												checkNumber: e.target.value
											}),
											placeholder: "1044"
										})
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Memo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										value: form.notes,
										onChange: (e) => setForm({
											...form,
											notes: e.target.value
										})
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								try {
									if (kind === "cash-sale") {
										createCashSale({
											date: form.date,
											bankId: form.bankId,
											customerId: form.customerId || void 0,
											receivedFrom: form.receivedFrom,
											notes: form.notes,
											taxRate: data.settings.taxEnabled ? Number(form.taxRate) || 0 : 0,
											method: form.method,
											checkNumber: form.checkNumber,
											lines: form.lines.map((l) => ({
												description: l.description,
												quantity: Number(l.quantity) || 0,
												unitPrice: parseAmountToCents(l.unitPrice)
											}))
										});
										toast.success(form.method === "check" ? "Check receipt posted." : "Cash sale posted.");
									} else {
										if (!form.invoiceId) throw new Error("Choose an invoice.");
										recordInvoicePayment({
											invoiceId: form.invoiceId,
											date: form.date,
											amount: parseAmountToCents(form.amount) || invoiceBalance(data, form.invoiceId),
											bankId: form.bankId,
											memo: form.notes,
											method: form.method,
											checkNumber: form.checkNumber
										});
										toast.success(form.method === "check" ? "Check payment posted." : "Receipt posted.");
									}
									setCreateOpen(false);
								} catch (err) {
									toast.error(err instanceof Error ? err.message : "Could not post receipt.");
								}
							},
							children: "Post receipt"
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: Boolean(deleting),
				title: "Delete receipt?",
				body: "Removes this ticket and takes it off the ledger so you can enter it again.",
				onClose: () => setDeleting(null),
				onConfirm: () => {
					if (!deleting) return;
					try {
						removeReceipt(deleting.id);
						toast.success("Receipt deleted.");
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
function Stat({ label, value, currency }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "eyebrow",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
			amount: value,
			currency,
			className: "mt-2 text-2xl font-medium"
		})]
	}) });
}
//#endregion
export { ReceiptsPage as component };
