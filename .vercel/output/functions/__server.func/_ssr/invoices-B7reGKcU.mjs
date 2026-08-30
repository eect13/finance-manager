import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { p as Plus } from "../_libs/lucide-react.mjs";
import { H as invoiceTotal, P as formatDate, R as invoiceBalance, Z as parseAmountToCents, f as addDaysIso, lt as useFinanceData, rt as todayIso, t as Button, ut as useFinanceStore, z as invoiceRows } from "./store-zEGD4c48.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, C as InvoiceBadge, G as useEntrySort, M as SelectValue, O as Select, S as Input, T as Money, U as openProps, W as stopOpen, d as DialogDescription, f as DialogFooter, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, s as CsvButton, t as AppShell, u as DialogContent, x as Field, y as EntryLines, z as Textarea } from "./app-shell-Dw047gD3.mjs";
import { t as SortHeader } from "./sort-header-BR4Tb6bQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/invoices-B7reGKcU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InvoicesPage() {
	const data = useFinanceData();
	const createInvoice = useFinanceStore((s) => s.createInvoice);
	const recordInvoicePayment = useFinanceStore((s) => s.recordInvoicePayment);
	const voidInvoice = useFinanceStore((s) => s.voidInvoice);
	const removeInvoice = useFinanceStore((s) => s.removeInvoice);
	const dragEnabled = data.settings.dragDropEnabled;
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [payId, setPayId] = (0, import_react.useState)(null);
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const [payForm, setPayForm] = (0, import_react.useState)({
		amount: "",
		date: todayIso(),
		bankId: "",
		method: "cash",
		checkNumber: ""
	});
	const [form, setForm] = (0, import_react.useState)({
		customerId: "",
		date: todayIso(),
		dueDate: addDaysIso(todayIso(), 30),
		notes: "",
		taxRate: String(data.settings.defaultTaxRate),
		lines: [{
			description: "",
			quantity: "1",
			unitPrice: ""
		}]
	});
	const today = todayIso();
	const getters = (0, import_react.useMemo)(() => ({
		number: (inv) => inv.number,
		customer: (inv) => data.customers.find((c) => c.id === inv.customerId)?.name ?? "",
		date: (inv) => inv.date,
		due: (inv) => inv.dueDate,
		total: (inv) => invoiceTotal(data, inv.id),
		balance: (inv) => invoiceBalance(data, inv.id),
		status: (inv) => inv.status
	}), [data]);
	const sort = useEntrySort(data.invoices, "date", getters, "desc");
	const paying = data.invoices.find((i) => i.id === payId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Invoices",
		description: "Bill customers, collect into a bank, and print a clean invoice for paper or PDF.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "invoices.csv",
			rows: invoiceRows(data)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => setCreateOpen(true),
			disabled: data.customers.length === 0,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "New invoice"]
		})] }),
		children: [
			data.customers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-sm text-muted-foreground",
				children: "Add a customer before you invoice."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-3xl bg-card elevation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-4xl text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Number",
								column: "number",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Customer",
								column: "customer",
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
								label: "Due",
								column: "due",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Total",
								column: "total",
								sortKey: sort.key,
								dir: sort.dir,
								onToggle: sort.toggle,
								align: "right"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Balance",
								column: "balance",
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
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sort.sorted.map((inv) => {
						const customer = data.customers.find((c) => c.id === inv.customerId);
						const due = invoiceBalance(data, inv.id);
						const overdue = due > 0 && inv.dueDate < today && inv.status !== "void" && inv.status !== "paid";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/70 last:border-0",
							...openProps("invoice", inv.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-medium",
									children: inv.number
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: customer?.name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(inv.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(inv.dueDate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: invoiceTotal(data, inv.id),
										currency: data.settings.currency
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: due,
										currency: data.settings.currency
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBadge, {
										status: inv.status,
										overdue
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									onDoubleClick: stopOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap justify-end gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "outline",
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
													to: "/print/$invoiceId",
													params: { invoiceId: inv.id },
													children: "Print"
												})
											}),
											due > 0 && inv.status !== "void" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "outline",
												onClick: () => {
													setPayId(inv.id);
													setPayForm({
														amount: String(due / 100),
														date: todayIso(),
														bankId: data.banks[0]?.id ?? "",
														method: "cash",
														checkNumber: ""
													});
												},
												children: "Collect"
											}) : null,
											inv.status !== "void" && inv.status !== "paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												onClick: () => {
													voidInvoice(inv.id);
													toast.success("Invoice voided.");
												},
												children: "Void"
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												onClick: () => setDeleting(inv),
												children: "Delete"
											})
										]
									})
								})
							]
						}, inv.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: createOpen,
				onOpenChange: setCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New invoice" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts accounts receivable and income when you save." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Customer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: form.customerId,
										onValueChange: (v) => setForm({
											...form,
											customerId: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose customer" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c.id,
											children: c.name
										}, c.id)) })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Invoice date",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: form.date,
											onChange: (e) => setForm({
												...form,
												date: e.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Due date",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: form.dueDate,
											onChange: (e) => setForm({
												...form,
												dueDate: e.target.value
											})
										})
									})]
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
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Notes",
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
									createInvoice({
										customerId: form.customerId,
										date: form.date,
										dueDate: form.dueDate,
										notes: form.notes,
										taxRate: data.settings.taxEnabled ? Number(form.taxRate) || 0 : 0,
										lines: form.lines.map((l) => ({
											description: l.description,
											quantity: Number(l.quantity) || 0,
											unitPrice: parseAmountToCents(l.unitPrice)
										}))
									});
									setCreateOpen(false);
									toast.success("Invoice posted.");
								} catch (err) {
									toast.error(err instanceof Error ? err.message : "Could not create invoice.");
								}
							},
							children: "Save invoice"
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(paying),
				onOpenChange: (o) => !o && setPayId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Collect payment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: paying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						paying.number,
						" · balance",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: invoiceBalance(data, paying.id),
							currency: data.settings.currency
						})
					] }) : null })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bank",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: payForm.bankId,
									onValueChange: (v) => setPayForm({
										...payForm,
										bankId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.nickname
									}, b.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Date",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: payForm.date,
									onChange: (e) => setPayForm({
										...payForm,
										date: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Amount",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: payForm.amount,
									onChange: (e) => setPayForm({
										...payForm,
										amount: e.target.value
									}),
									inputMode: "decimal"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Tender",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: payForm.method,
										onValueChange: (v) => setPayForm({
											...payForm,
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
								}), payForm.method === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Check number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: payForm.checkNumber,
										onChange: (e) => setPayForm({
											...payForm,
											checkNumber: e.target.value
										}),
										placeholder: "1044"
									})
								}) : null]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (!payId) return;
							try {
								recordInvoicePayment({
									invoiceId: payId,
									date: payForm.date,
									amount: parseAmountToCents(payForm.amount),
									bankId: payForm.bankId,
									method: payForm.method,
									checkNumber: payForm.checkNumber
								});
								setPayId(null);
								toast.success("Payment recorded.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not record payment.");
							}
						},
						children: "Record payment"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: Boolean(deleting),
				title: "Delete invoice?",
				body: "Removes this invoice, its payments, and the ledger lines so you can enter it again.",
				onClose: () => setDeleting(null),
				onConfirm: () => {
					if (!deleting) return;
					try {
						removeInvoice(deleting.id);
						toast.success("Invoice deleted.");
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
export { InvoicesPage as component };
