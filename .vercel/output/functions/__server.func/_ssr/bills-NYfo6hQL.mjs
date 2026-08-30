import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { p as Plus } from "../_libs/lucide-react.mjs";
import { P as formatDate, Z as parseAmountToCents, _ as billRows, f as addDaysIso, g as billBalance, lt as useFinanceData, rt as todayIso, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, G as useEntrySort, M as SelectValue, O as Select, S as Input, T as Money, U as openProps, W as stopOpen, d as DialogDescription, f as DialogFooter, i as BillBadge, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, s as CsvButton, t as AppShell, u as DialogContent, x as Field, z as Textarea } from "./app-shell-Dw047gD3.mjs";
import { t as DragHandle } from "./drag-handle-DR58GmIZ.mjs";
import { t as SortHeader } from "./sort-header-BR4Tb6bQ.mjs";
import { t as useRowDrag } from "./use-row-drag-A8173dLk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bills-NYfo6hQL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BillsPage() {
	const data = useFinanceData();
	const createBill = useFinanceStore((s) => s.createBill);
	const payBill = useFinanceStore((s) => s.payBill);
	const voidBill = useFinanceStore((s) => s.voidBill);
	const removeBill = useFinanceStore((s) => s.removeBill);
	const reorderBills = useFinanceStore((s) => s.reorderBills);
	const dragEnabled = data.settings.dragDropEnabled;
	const today = todayIso();
	const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [payId, setPayId] = (0, import_react.useState)(null);
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const [payForm, setPayForm] = (0, import_react.useState)({
		amount: "",
		date: today,
		bankId: ""
	});
	const [form, setForm] = (0, import_react.useState)({
		vendorId: "",
		date: today,
		dueDate: addDaysIso(today, 15),
		amount: "",
		accountId: expenseAccounts[0]?.id ?? "",
		memo: "",
		reference: ""
	});
	const getters = (0, import_react.useMemo)(() => ({
		order: (b) => b.sortOrder,
		number: (b) => b.number,
		vendor: (b) => data.vendors.find((v) => v.id === b.vendorId)?.name ?? "",
		date: (b) => b.date,
		due: (b) => b.dueDate,
		amount: (b) => b.amount,
		balance: (b) => billBalance(b),
		status: (b) => b.status
	}), [data.vendors]);
	const sort = useEntrySort(data.bills, dragEnabled ? "order" : "date", getters, "desc");
	const dragOn = dragEnabled && sort.key === "order";
	const drag = useRowDrag(dragOn, sort.sorted.map((b) => b.id), reorderBills);
	const paying = data.bills.find((b) => b.id === payId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Bills",
		description: "Vendor invoices on accounts payable. Pay from a bank, or void and delete once reversed.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "bills.csv",
			rows: billRows(data)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => setCreateOpen(true),
			disabled: data.vendors.length === 0,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "New bill"]
		})] }),
		children: [
			data.vendors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-sm text-muted-foreground",
				children: "Add a vendor before you enter a bill."
			}) : null,
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
								label: "Vendor",
								column: "vendor",
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
								label: "Amount",
								column: "amount",
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
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sort.sorted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: dragEnabled ? 9 : 8,
						className: "px-4 py-8 text-center text-muted-foreground",
						children: "No bills yet."
					}) }) : sort.sorted.map((bill) => {
						const vendor = data.vendors.find((v) => v.id === bill.vendorId);
						const due = billBalance(bill);
						const overdue = due > 0 && bill.dueDate < today && bill.status !== "void" && bill.status !== "paid";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/70 last:border-0",
							...drag.bind(bill.id),
							...openProps("bill", bill.id),
							children: [
								dragEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DragHandle, { enabled: dragOn })
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 font-medium",
									children: bill.number
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: vendor?.name ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(bill.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 whitespace-nowrap",
									children: formatDate(bill.dueDate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: bill.amount,
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
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillBadge, {
										status: bill.status,
										overdue
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									onDoubleClick: stopOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap justify-end gap-1",
										children: [
											due > 0 && bill.status !== "void" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "outline",
												onClick: () => {
													setPayId(bill.id);
													setPayForm({
														amount: String(due / 100),
														date: today,
														bankId: data.banks[0]?.id ?? ""
													});
												},
												children: "Pay"
											}) : null,
											bill.status !== "void" && bill.status !== "paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												onClick: () => {
													voidBill(bill.id);
													toast.success("Bill voided.");
												},
												children: "Void"
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												size: "sm",
												variant: "ghost",
												onClick: () => setDeleting(bill),
												children: "Delete"
											})
										]
									})
								})
							]
						}, bill.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: createOpen,
				onOpenChange: setCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New bill" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts expense and accounts payable when you save." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Vendor",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.vendorId,
									onValueChange: (v) => setForm({
										...form,
										vendorId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose vendor" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.vendors.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: v.id,
										children: v.name
									}, v.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Bill date",
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Amount",
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
								label: "Reference",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.reference,
									onChange: (e) => setForm({
										...form,
										reference: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Memo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
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
								createBill({
									vendorId: form.vendorId,
									date: form.date,
									dueDate: form.dueDate,
									amount: parseAmountToCents(form.amount),
									accountId: form.accountId,
									memo: form.memo,
									reference: form.reference
								});
								setCreateOpen(false);
								toast.success("Bill posted.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not create bill.");
							}
						},
						children: "Save bill"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(paying),
				onOpenChange: (o) => !o && setPayId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Pay bill" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: paying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						paying.number,
						" · balance",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: billBalance(paying),
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
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (!payId) return;
							try {
								payBill({
									billId: payId,
									date: payForm.date,
									amount: parseAmountToCents(payForm.amount),
									bankId: payForm.bankId
								});
								setPayId(null);
								toast.success("Bill paid.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not pay bill.");
							}
						},
						children: "Record payment"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: Boolean(deleting),
				title: "Delete bill?",
				body: "Removes this bill, its payments, and the ledger lines so you can enter it again.",
				onClose: () => setDeleting(null),
				onConfirm: () => {
					if (!deleting) return;
					try {
						removeBill(deleting.id);
						toast.success("Bill deleted.");
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
export { BillsPage as component };
