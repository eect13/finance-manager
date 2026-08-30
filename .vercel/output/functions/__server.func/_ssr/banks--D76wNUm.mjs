import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { V as ArrowLeftRight, p as Plus, x as Landmark } from "../_libs/lucide-react.mjs";
import { Q as pendingChecksTotal, Z as parseAmountToCents, h as bankRows, lt as useFinanceData, m as bankBookBalance, rt as todayIso, t as Button, ut as useFinanceStore } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, M as SelectValue, O as Select, S as Input, T as Money, U as openProps, W as stopOpen, d as DialogDescription, f as DialogFooter, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, s as CsvButton, t as AppShell, u as DialogContent, x as Field } from "./app-shell-Dw047gD3.mjs";
import { n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/banks--D76wNUm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BanksPage() {
	const data = useFinanceData();
	const { settings, banks, accounts } = data;
	const addBank = useFinanceStore((s) => s.addBank);
	const addDeposit = useFinanceStore((s) => s.addDeposit);
	const addExpense = useFinanceStore((s) => s.addExpense);
	const transferBanks = useFinanceStore((s) => s.transferBanks);
	const removeBank = useFinanceStore((s) => s.removeBank);
	const [dialog, setDialog] = (0, import_react.useState)(null);
	const [deletingId, setDeletingId] = (0, import_react.useState)(null);
	const [bankForm, setBankForm] = (0, import_react.useState)({
		name: "",
		nickname: "",
		accountNumber: "",
		opening: ""
	});
	const [moneyForm, setMoneyForm] = (0, import_react.useState)({
		bankId: "",
		kind: "deposit",
		amount: "",
		date: todayIso(),
		memo: "",
		accountId: ""
	});
	const [transferForm, setTransferForm] = (0, import_react.useState)({
		fromId: "",
		toId: "",
		amount: "",
		date: todayIso(),
		memo: ""
	});
	const expenseAccounts = accounts.filter((a) => a.type === "expense");
	const incomeAccounts = accounts.filter((a) => a.type === "income");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Banks",
		description: "Balances across every account. Double-click a card to edit. Delete is blocked while the bank still has activity.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: "banks.csv",
				rows: bankRows(data)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				onClick: () => setDialog("transfer"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, {}), "Transfer"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setDialog("money"),
				children: "Record"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => setDialog("bank"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Add bank"]
			})
		] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: banks.filter((b) => !b.archived).map((bank) => {
					const book = bankBookBalance(data, bank.id);
					const pending = pendingChecksTotal(data, bank.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						...openProps("bank", bank.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "eyebrow",
											children: bank.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-display mt-1 text-2xl font-medium tracking-tight",
											children: bank.nickname
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted-foreground",
											children: bank.accountNumber
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex size-10 items-center justify-center rounded-lg bg-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "size-4" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-6 eyebrow",
									children: "Book balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
									amount: book,
									currency: settings.currency,
									className: "text-2xl font-medium"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Pending checks"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: pending,
										currency: settings.currency
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Still in bank (est.)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: book + pending,
										currency: settings.currency
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 flex justify-end gap-1",
									onDoubleClick: stopOpen,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => setDeletingId(bank.id),
										children: "Delete"
									})
								})
							]
						})
					}, bank.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: dialog === "bank",
				onOpenChange: (o) => !o && setDialog(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add a bank" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Creates a cash account and posts the opening balance to equity." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bank name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: bankForm.name,
									onChange: (e) => setBankForm({
										...bankForm,
										name: e.target.value
									}),
									placeholder: "BDO Unibank"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Nickname",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: bankForm.nickname,
									onChange: (e) => setBankForm({
										...bankForm,
										nickname: e.target.value
									}),
									placeholder: "Operating"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Account number",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: bankForm.accountNumber,
									onChange: (e) => setBankForm({
										...bankForm,
										accountNumber: e.target.value
									}),
									placeholder: "•••• 1234"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: `Opening balance (${settings.currency})`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: bankForm.opening,
									onChange: (e) => setBankForm({
										...bankForm,
										opening: e.target.value
									}),
									inputMode: "decimal",
									placeholder: "0.00"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (!bankForm.name.trim()) return toast.error("Name the bank.");
							addBank({
								name: bankForm.name.trim(),
								nickname: bankForm.nickname.trim() || bankForm.name.trim(),
								accountNumber: bankForm.accountNumber.trim() || "—",
								openingBalance: parseAmountToCents(bankForm.opening)
							});
							setBankForm({
								name: "",
								nickname: "",
								accountNumber: "",
								opening: ""
							});
							setDialog(null);
							toast.success("Bank added.");
						},
						children: "Save bank"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: dialog === "money",
				onOpenChange: (o) => !o && setDialog(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Record money in or out" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Online transfers, cash deposits, and expenses that are not checks." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Bank",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: moneyForm.bankId,
									onValueChange: (v) => setMoneyForm({
										...moneyForm,
										bankId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.nickname
									}, b.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: moneyForm.kind,
									onValueChange: (v) => setMoneyForm({
										...moneyForm,
										kind: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "deposit",
										children: "Deposit / money in"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "expense",
										children: "Expense / money out"
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Date",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: moneyForm.date,
									onChange: (e) => setMoneyForm({
										...moneyForm,
										date: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Amount",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: moneyForm.amount,
									onChange: (e) => setMoneyForm({
										...moneyForm,
										amount: e.target.value
									}),
									inputMode: "decimal"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Account",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: moneyForm.accountId,
									onValueChange: (v) => setMoneyForm({
										...moneyForm,
										accountId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose account" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: (moneyForm.kind === "deposit" ? incomeAccounts : expenseAccounts).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
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
									value: moneyForm.memo,
									onChange: (e) => setMoneyForm({
										...moneyForm,
										memo: e.target.value
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							const amount = parseAmountToCents(moneyForm.amount);
							if (!moneyForm.bankId || amount <= 0) return toast.error("Bank and amount are required.");
							try {
								if (moneyForm.kind === "deposit") addDeposit({
									bankId: moneyForm.bankId,
									date: moneyForm.date,
									amount,
									memo: moneyForm.memo,
									accountId: moneyForm.accountId || void 0
								});
								else {
									if (!moneyForm.accountId) return toast.error("Pick an expense account.");
									addExpense({
										bankId: moneyForm.bankId,
										date: moneyForm.date,
										amount,
										memo: moneyForm.memo,
										accountId: moneyForm.accountId
									});
								}
								setDialog(null);
								toast.success("Posted to the books.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not post.");
							}
						},
						children: "Post"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: dialog === "transfer",
				onOpenChange: (o) => !o && setDialog(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Transfer between banks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Moves cash on the books. No income or expense." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "From",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: transferForm.fromId,
									onValueChange: (v) => setTransferForm({
										...transferForm,
										fromId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Source bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.nickname
									}, b.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "To",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: transferForm.toId,
									onValueChange: (v) => setTransferForm({
										...transferForm,
										toId: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Destination bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.nickname
									}, b.id)) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Date",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: transferForm.date,
									onChange: (e) => setTransferForm({
										...transferForm,
										date: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Amount",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: transferForm.amount,
									onChange: (e) => setTransferForm({
										...transferForm,
										amount: e.target.value
									}),
									inputMode: "decimal"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Memo",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: transferForm.memo,
									onChange: (e) => setTransferForm({
										...transferForm,
										memo: e.target.value
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							try {
								transferBanks({
									fromId: transferForm.fromId,
									toId: transferForm.toId,
									date: transferForm.date,
									amount: parseAmountToCents(transferForm.amount),
									memo: transferForm.memo
								});
								setDialog(null);
								toast.success("Transfer posted.");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Could not transfer.");
							}
						},
						children: "Transfer"
					}) })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: Boolean(deletingId),
				title: "Delete bank?",
				body: "Removes this account if it has no checks, receipts, or other activity. Opening balance is reversed.",
				onClose: () => setDeletingId(null),
				onConfirm: () => {
					if (!deletingId) return;
					try {
						removeBank(deletingId);
						toast.success("Bank deleted.");
						setDeletingId(null);
					} catch (err) {
						toast.error(err instanceof Error ? err.message : "Could not delete.");
						setDeletingId(null);
					}
				}
			})
		]
	});
}
//#endregion
export { BanksPage as component };
