import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime, r as Slot } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { E as Ellipsis, O as CreditCard, R as Banknote, g as NotebookPen, x as Landmark } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as create, n as createJSONStorage, r as persist, t as useShallow } from "../_libs/zustand.mjs";
import { a as eachDayOfInterval, c as startOfWeek, i as startOfMonth, l as addMonths, n as format, o as endOfMonth, r as endOfWeek, s as isValid, t as parseISO, u as addDays } from "../_libs/date-fns.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
			outline: "border border-border bg-card text-foreground hover:bg-accent",
			ghost: "text-foreground hover:bg-accent",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-11 min-h-11 px-4",
			sm: "h-9 min-h-9 px-3 text-sm",
			lg: "h-12 min-h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function newId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
function normalBalance(type) {
	return type === "asset" || type === "expense" ? "debit" : "credit";
}
function accountBalance(data, accountId) {
	const account = data.accounts.find((a) => a.id === accountId);
	if (!account) return 0;
	let debit = 0;
	let credit = 0;
	for (const entry of data.journals) for (const line of entry.lines) {
		if (line.accountId !== accountId) continue;
		debit += line.debit;
		credit += line.credit;
	}
	return normalBalance(account.type) === "debit" ? debit - credit : credit - debit;
}
function bankBookBalance(data, bankId) {
	const bank = data.banks.find((b) => b.id === bankId);
	if (!bank) return 0;
	return accountBalance(data, bank.accountId);
}
function totalCash(data) {
	return data.banks.filter((b) => !b.archived).reduce((sum, b) => sum + bankBookBalance(data, b.id), 0);
}
function pendingChecksTotal(data, bankId) {
	return data.checks.filter((c) => c.status === "pending" && (!bankId || c.bankId === bankId)).reduce((sum, c) => sum + c.amount, 0);
}
function invoiceSubtotal(lines) {
	return lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice), 0);
}
function invoiceTax(subtotal, taxRate, taxEnabled) {
	if (!taxEnabled || taxRate <= 0) return 0;
	return Math.round(subtotal * taxRate / 100);
}
function invoiceTotal(data, invoiceId) {
	const invoice = data.invoices.find((i) => i.id === invoiceId);
	if (!invoice) return 0;
	const sub = invoiceSubtotal(invoice.lines);
	return sub + invoiceTax(sub, invoice.taxRate, data.settings.taxEnabled);
}
function invoicePaid(invoice) {
	return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
}
function invoiceBalance(data, invoiceId) {
	const invoice = data.invoices.find((i) => i.id === invoiceId);
	if (!invoice || invoice.status === "void") return 0;
	return Math.max(0, invoiceTotal(data, invoiceId) - invoicePaid(invoice));
}
function openReceivables(data) {
	return data.invoices.filter((i) => i.status === "sent" || i.status === "partial" || i.status === "draft").reduce((sum, i) => sum + invoiceBalance(data, i.id), 0);
}
function billPaid(bill) {
	return bill.payments.reduce((sum, p) => sum + p.amount, 0);
}
function billBalance(bill) {
	if (bill.status === "void") return 0;
	return Math.max(0, bill.amount - billPaid(bill));
}
function openPayables(data) {
	return (data.bills ?? []).filter((b) => b.status === "open" || b.status === "partial").reduce((sum, b) => sum + billBalance(b), 0);
}
function customerOpenBalance(data, customerId) {
	return data.invoices.filter((i) => i.customerId === customerId).reduce((sum, i) => sum + invoiceBalance(data, i.id), 0);
}
function vendorOpenBalance(data, vendorId) {
	return (data.bills ?? []).filter((b) => b.vendorId === vendorId).reduce((sum, b) => sum + billBalance(b), 0);
}
function receiptTotal(lines, taxRate, taxEnabled) {
	const sub = invoiceSubtotal(lines);
	return sub + invoiceTax(sub, taxRate, taxEnabled);
}
function line(accountId, debit, credit, memo = "") {
	return {
		id: newId(),
		accountId,
		debit,
		credit,
		memo
	};
}
function makeJournal(input) {
	const lines = input.lines.map((l) => line(l.accountId, l.debit, l.credit, l.memo ?? ""));
	const debit = lines.reduce((s, l) => s + l.debit, 0);
	const credit = lines.reduce((s, l) => s + l.credit, 0);
	if (debit !== credit) throw new Error(`Unbalanced journal: debit ${debit} credit ${credit}`);
	return {
		id: newId(),
		date: input.date,
		description: input.description,
		sourceType: input.sourceType,
		sourceId: input.sourceId,
		lines
	};
}
function reverseJournal(entry, date, reason) {
	return makeJournal({
		date,
		description: `Reversal: ${reason}`,
		sourceType: "reversal",
		sourceId: entry.id,
		lines: entry.lines.map((l) => ({
			accountId: l.accountId,
			debit: l.credit,
			credit: l.debit,
			memo: l.memo
		}))
	});
}
function trialBalance(data) {
	return data.accounts.map((account) => {
		const balance = accountBalance(data, account.id);
		const debitNormal = normalBalance(account.type) === "debit";
		return {
			account,
			debit: debitNormal && balance > 0 ? balance : !debitNormal && balance < 0 ? -balance : 0,
			credit: !debitNormal && balance > 0 ? balance : debitNormal && balance < 0 ? -balance : 0,
			balance
		};
	}).filter((row) => row.balance !== 0 || row.account.system);
}
function incomeStatement(data) {
	const byAccount = data.accounts.filter((a) => a.type === "income" || a.type === "expense").map((account) => ({
		account,
		amount: accountBalance(data, account.id)
	})).filter((row) => row.amount !== 0);
	const income = byAccount.filter((r) => r.account.type === "income").reduce((s, r) => s + r.amount, 0);
	const expense = byAccount.filter((r) => r.account.type === "expense").reduce((s, r) => s + r.amount, 0);
	return {
		income,
		expense,
		net: income - expense,
		byAccount
	};
}
function formatMoney(amount, currency = "PHP") {
	try {
		return new Intl.NumberFormat("en-PH", {
			style: "currency",
			currency,
			maximumFractionDigits: currency === "JPY" ? 0 : 2
		}).format(amount / 100);
	} catch {
		return `${(amount / 100).toFixed(2)} ${currency}`;
	}
}
function formatDate(iso) {
	if (!iso) return "—";
	const date = parseISO(iso);
	if (!isValid(date)) return iso;
	return format(date, "MMM d, yyyy");
}
function formatShortDate(iso) {
	if (!iso) return "—";
	const date = parseISO(iso);
	if (!isValid(date)) return iso;
	return format(date, "MMM d");
}
function todayIso() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function currentMonth() {
	return todayIso().slice(0, 7);
}
function addDaysIso(iso, days) {
	const date = parseISO(iso);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}
function parseAmountToCents(raw) {
	const cleaned = raw.replace(/,/g, "").trim();
	if (!cleaned) return 0;
	const n = Number(cleaned);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n * 100);
}
function titleCase(value) {
	return String(value ?? "").split(/[\s_-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}
var PAYMENT_METHODS = [
	{
		value: "cash",
		label: "Cash",
		short: "Cash",
		icon: Banknote
	},
	{
		value: "check",
		label: "Check",
		short: "Check",
		icon: NotebookPen
	},
	{
		value: "card",
		label: "Credit / Debit",
		short: "Card",
		icon: CreditCard
	},
	{
		value: "echeck",
		label: "e-Check",
		short: "e-Check",
		icon: Landmark
	},
	{
		value: "other",
		label: "More",
		short: "Other",
		icon: Ellipsis
	}
];
function methodLabel(method) {
	return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? "Cash";
}
function methodNeedsReference(method) {
	return method === "check" || method === "echeck" || method === "card";
}
function methodRefLabel(method) {
	if (method === "check") return "Check #";
	if (method === "echeck") return "e-Check #";
	if (method === "card") return "Card last 4";
	return "Reference #";
}
function parseMethod(value) {
	if (value === "check" || value === "card" || value === "echeck" || value === "other") return value;
	return "cash";
}
function addBank(data, input) {
	const bankId = newId();
	const accountId = newId();
	const codeBase = 1e3 + data.banks.length * 10;
	const bank = {
		id: bankId,
		name: input.name,
		nickname: input.nickname || input.name,
		accountNumber: input.accountNumber,
		openingBalance: input.openingBalance,
		accountId,
		archived: false
	};
	const equity = data.accounts.find((a) => a.code === "3000");
	if (!equity) throw new Error("Opening equity account missing");
	const journals = [...data.journals];
	if (input.openingBalance !== 0) journals.push(makeJournal({
		date: input.date ?? todayIso(),
		description: `Opening balance — ${bank.nickname}`,
		sourceType: "opening",
		sourceId: bankId,
		lines: [{
			accountId,
			debit: Math.max(0, input.openingBalance),
			credit: Math.max(0, -input.openingBalance)
		}, {
			accountId: equity.id,
			debit: Math.max(0, -input.openingBalance),
			credit: Math.max(0, input.openingBalance)
		}]
	}));
	return {
		...data,
		banks: [...data.banks, bank],
		accounts: [...data.accounts, {
			id: accountId,
			code: String(codeBase),
			name: `Cash — ${bank.nickname}`,
			type: "asset",
			bankId,
			system: true
		}],
		journals,
		nextNumbers: {
			...data.nextNumbers,
			check: {
				...data.nextNumbers.check,
				[bankId]: 1
			}
		}
	};
}
function updateBank(data, id, patch) {
	return {
		...data,
		banks: data.banks.map((b) => b.id === id ? {
			...b,
			...patch
		} : b)
	};
}
function removeBank(data, id) {
	const bank = data.banks.find((b) => b.id === id);
	if (!bank) throw new Error("Bank not found");
	if (data.checks.some((c) => c.bankId === id)) throw new Error("This bank still has checks. Delete those first.");
	if (data.receipts.some((r) => r.bankId === id && r.status !== "void")) throw new Error("This bank still has receipts. Delete those first.");
	if (data.invoices.some((i) => i.payments.some((p) => p.bankId === id))) throw new Error("This bank collected invoice payments. Delete those receipts first.");
	if (data.bills.some((b) => b.payments.some((p) => p.bankId === id))) throw new Error("This bank paid vendor bills. Delete those payments first.");
	if (data.journals.filter((j) => j.lines.some((l) => l.accountId === bank.accountId) && j.sourceType !== "opening").length > 0) throw new Error("This bank still has ledger activity.");
	const { [id]: _removed, ...checkNumbers } = data.nextNumbers.check;
	return {
		...data,
		banks: data.banks.filter((b) => b.id !== id),
		accounts: data.accounts.filter((a) => a.id !== bank.accountId && a.bankId !== id),
		journals: data.journals.filter((j) => !j.lines.some((l) => l.accountId === bank.accountId)),
		nextNumbers: {
			...data.nextNumbers,
			check: checkNumbers
		}
	};
}
function addCustomer(data, input) {
	const sortOrder = data.customers.length;
	return {
		...data,
		customers: [...data.customers, {
			...input,
			id: newId(),
			sortOrder: input.sortOrder ?? sortOrder
		}]
	};
}
function updateCustomer(data, id, patch) {
	return {
		...data,
		customers: data.customers.map((c) => c.id === id ? {
			...c,
			...patch
		} : c)
	};
}
function removeCustomer(data, id) {
	if (data.invoices.some((i) => i.customerId === id && i.status !== "void")) throw new Error("This customer has invoices. Keep the record for the books.");
	if (data.receipts.some((r) => r.customerId === id && r.status !== "void")) throw new Error("This customer has receipts. Keep the record for the books.");
	return {
		...data,
		customers: data.customers.filter((c) => c.id !== id)
	};
}
function reorderCustomers(data, ids) {
	return {
		...data,
		customers: applyOrder(data.customers, ids)
	};
}
function addVendor(data, input) {
	const sortOrder = data.vendors.length;
	return {
		...data,
		vendors: [...data.vendors, {
			...input,
			id: newId(),
			sortOrder: input.sortOrder ?? sortOrder
		}]
	};
}
function updateVendor(data, id, patch) {
	return {
		...data,
		vendors: data.vendors.map((v) => v.id === id ? {
			...v,
			...patch
		} : v)
	};
}
function removeVendor(data, id) {
	if (data.bills.some((b) => b.vendorId === id && b.status !== "void")) throw new Error("This vendor has bills. Keep the record for the books.");
	return {
		...data,
		vendors: data.vendors.filter((v) => v.id !== id)
	};
}
function reorderVendors(data, ids) {
	return {
		...data,
		vendors: applyOrder(data.vendors, ids)
	};
}
function applyOrder(items, ids) {
	const map = new Map(items.map((item) => [item.id, item]));
	const ordered = [];
	for (const id of ids) {
		const item = map.get(id);
		if (item) {
			ordered.push({
				...item,
				sortOrder: ordered.length
			});
			map.delete(id);
		}
	}
	for (const item of map.values()) ordered.push({
		...item,
		sortOrder: ordered.length
	});
	return ordered;
}
function issueCheck(data, input) {
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	if (input.amount <= 0) throw new Error("Amount must be greater than zero");
	const next = data.nextNumbers.check[bank.id] ?? 1;
	const checkNumber = input.checkNumber?.trim() || String(next).padStart(4, "0");
	const id = newId();
	const journal = makeJournal({
		date: input.issueDate,
		description: `Check ${checkNumber} — ${input.payee}`,
		sourceType: "check",
		sourceId: id,
		lines: [{
			accountId: input.accountId,
			debit: input.amount,
			credit: 0,
			memo: input.memo
		}, {
			accountId: bank.accountId,
			debit: 0,
			credit: input.amount
		}]
	});
	return {
		...data,
		checks: [...data.checks, {
			id,
			bankId: bank.id,
			checkNumber,
			payee: input.payee,
			issueDate: input.issueDate,
			postDate: input.postDate || input.issueDate,
			amount: input.amount,
			status: "pending",
			memo: input.memo,
			accountId: input.accountId,
			journalId: journal.id,
			vendorId: input.vendorId
		}],
		journals: [...data.journals, journal],
		nextNumbers: {
			...data.nextNumbers,
			check: {
				...data.nextNumbers.check,
				[bank.id]: next + 1
			}
		}
	};
}
function setCheckStatus(data, id, status, date = todayIso()) {
	const check = data.checks.find((c) => c.id === id);
	if (!check) throw new Error("Check not found");
	if (check.status === status) return data;
	if (status === "voided" || status === "bounced") {
		if (check.status === "voided" || check.status === "bounced") return data;
		const original = data.journals.find((j) => j.id === check.journalId);
		if (!original) throw new Error("Original journal missing");
		const reversal = reverseJournal(original, date, `Check ${check.checkNumber} ${status}`);
		return {
			...data,
			checks: data.checks.map((c) => c.id === id ? {
				...c,
				status,
				reversalJournalId: reversal.id
			} : c),
			journals: [...data.journals, reversal]
		};
	}
	return {
		...data,
		checks: data.checks.map((c) => c.id === id ? {
			...c,
			status
		} : c)
	};
}
function removeCheck(data, id) {
	const check = data.checks.find((c) => c.id === id);
	if (!check) throw new Error("Check not found");
	return dropJournalsAndReversals({
		...data,
		checks: data.checks.filter((c) => c.id !== id)
	}, [check.journalId, check.reversalJournalId]);
}
function createInvoice(data, input) {
	const customer = data.customers.find((c) => c.id === input.customerId);
	if (!customer) throw new Error("Customer not found");
	const lines = input.lines.filter((l) => l.description.trim() && l.quantity > 0).map((l) => ({
		...l,
		id: newId(),
		unitPrice: Math.round(l.unitPrice)
	}));
	if (lines.length === 0) throw new Error("Add at least one line");
	const id = newId();
	const number = `INV-${input.date.slice(0, 4)}-${String(data.nextNumbers.invoice).padStart(3, "0")}`;
	const taxRate = input.taxRate ?? (data.settings.taxEnabled ? data.settings.defaultTaxRate : 0);
	const sub = invoiceSubtotal(lines);
	const total = sub + invoiceTax(sub, taxRate, data.settings.taxEnabled);
	const status = input.status ?? "sent";
	let journalId;
	const journals = [...data.journals];
	if (status === "sent" && total > 0) {
		const ar = data.accounts.find((a) => a.code === "1200");
		const sales = data.accounts.find((a) => a.code === "4000");
		if (!ar || !sales) throw new Error("AR or income account missing");
		const journal = makeJournal({
			date: input.date,
			description: `Invoice ${number} — ${customer.name}`,
			sourceType: "invoice",
			sourceId: id,
			lines: [{
				accountId: ar.id,
				debit: total,
				credit: 0
			}, {
				accountId: sales.id,
				debit: 0,
				credit: total
			}]
		});
		journals.push(journal);
		journalId = journal.id;
	}
	return {
		...data,
		invoices: [...data.invoices, {
			id,
			number,
			customerId: customer.id,
			date: input.date,
			dueDate: input.dueDate,
			lines,
			taxRate,
			status,
			notes: input.notes,
			payments: [],
			journalId
		}],
		journals,
		nextNumbers: {
			...data.nextNumbers,
			invoice: data.nextNumbers.invoice + 1
		}
	};
}
function nextReceiptNumber(data, date) {
	return `RCPT-${date.slice(0, 4)}-${String(data.nextNumbers.receipt).padStart(3, "0")}`;
}
function recordInvoicePayment(data, input) {
	const invoice = data.invoices.find((i) => i.id === input.invoiceId);
	if (!invoice) throw new Error("Invoice not found");
	if (invoice.status === "void" || invoice.status === "paid") throw new Error("Invoice cannot accept payment");
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	const method = input.method ?? "cash";
	const checkNumber = input.checkNumber?.trim() ?? "";
	if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
	const due = invoiceBalance(data, invoice.id);
	const amount = Math.min(input.amount, due);
	if (amount <= 0) throw new Error("Nothing left to collect");
	const ar = data.accounts.find((a) => a.code === "1200");
	if (!ar) throw new Error("AR account missing");
	const customer = data.customers.find((c) => c.id === invoice.customerId);
	const paymentId = newId();
	const receiptId = newId();
	const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
	const journal = makeJournal({
		date: input.date,
		description: `${checkBit}Payment ${invoice.number} — ${customer?.name ?? ""}`.trim(),
		sourceType: "payment",
		sourceId: paymentId,
		lines: [{
			accountId: bank.accountId,
			debit: amount,
			credit: 0
		}, {
			accountId: ar.id,
			debit: 0,
			credit: amount
		}]
	});
	const payments = [...invoice.payments, {
		id: paymentId,
		date: input.date,
		amount,
		bankId: bank.id,
		journalId: journal.id
	}];
	const status = payments.reduce((s, p) => s + p.amount, 0) >= invoiceTotal({
		...data,
		invoices: data.invoices.map((i) => i.id === invoice.id ? {
			...invoice,
			payments
		} : i)
	}, invoice.id) ? "paid" : "partial";
	const receipt = {
		id: receiptId,
		number: nextReceiptNumber(data, input.date),
		date: input.date,
		kind: "payment",
		method,
		checkNumber,
		customerId: invoice.customerId,
		receivedFrom: customer?.name ?? invoice.number,
		bankId: bank.id,
		lines: [],
		invoiceId: invoice.id,
		paymentId,
		amount,
		taxRate: 0,
		status: "posted",
		memo: input.memo || `Payment ${invoice.number}`,
		journalId: journal.id,
		sortOrder: data.receipts.length
	};
	return {
		...data,
		invoices: data.invoices.map((i) => i.id === invoice.id ? {
			...invoice,
			payments,
			status
		} : i),
		receipts: [...data.receipts, receipt],
		journals: [...data.journals, journal],
		nextNumbers: {
			...data.nextNumbers,
			receipt: data.nextNumbers.receipt + 1
		}
	};
}
function applyCustomerPayments(data, input) {
	let next = data;
	for (const app of input.applications) {
		if (app.amount <= 0) continue;
		next = recordInvoicePayment(next, {
			invoiceId: app.invoiceId,
			date: input.date,
			amount: app.amount,
			bankId: input.bankId,
			memo: input.memo,
			method: input.method,
			checkNumber: input.checkNumber
		});
	}
	return next;
}
function voidInvoice(data, id, date = todayIso()) {
	const invoice = data.invoices.find((i) => i.id === id);
	if (!invoice) throw new Error("Invoice not found");
	if (invoice.status === "void") return data;
	const journals = [...data.journals];
	if (invoice.journalId) {
		const original = data.journals.find((j) => j.id === invoice.journalId);
		if (original) journals.push(reverseJournal(original, date, `Void ${invoice.number}`));
	}
	for (const payment of invoice.payments) {
		const original = data.journals.find((j) => j.id === payment.journalId);
		if (original) journals.push(reverseJournal(original, date, `Void payment ${invoice.number}`));
	}
	return {
		...data,
		invoices: data.invoices.map((i) => i.id === id ? {
			...i,
			status: "void"
		} : i),
		receipts: data.receipts.map((r) => r.invoiceId === id && r.status === "posted" ? {
			...r,
			status: "void"
		} : r),
		journals
	};
}
function removeInvoice(data, id) {
	const invoice = data.invoices.find((i) => i.id === id);
	if (!invoice) throw new Error("Invoice not found");
	const related = data.receipts.filter((r) => r.invoiceId === id);
	const ids = [
		invoice.journalId,
		...invoice.payments.map((p) => p.journalId),
		...related.flatMap((r) => [r.journalId, r.reversalJournalId])
	];
	return dropJournalsAndReversals({
		...data,
		invoices: data.invoices.filter((i) => i.id !== id),
		receipts: data.receipts.filter((r) => r.invoiceId !== id)
	}, ids);
}
function createCashSale(data, input) {
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	const method = input.method ?? "cash";
	const checkNumber = input.checkNumber?.trim() ?? "";
	if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
	const lines = input.lines.filter((l) => l.description.trim() && l.quantity > 0).map((l) => ({
		...l,
		id: newId(),
		unitPrice: Math.round(l.unitPrice)
	}));
	if (lines.length === 0) throw new Error("Add at least one line");
	const taxRate = input.taxRate ?? (data.settings.taxEnabled ? data.settings.defaultTaxRate : 0);
	const amount = receiptTotal(lines, taxRate, data.settings.taxEnabled);
	if (amount <= 0) throw new Error("Amount must be greater than zero");
	const sales = data.accounts.find((a) => a.code === "4000");
	if (!sales) throw new Error("Income account missing");
	const id = newId();
	const number = nextReceiptNumber(data, input.date);
	const receivedFrom = input.receivedFrom.trim() || data.customers.find((c) => c.id === input.customerId)?.name || "Walk-in";
	const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
	const journal = makeJournal({
		date: input.date,
		description: `${checkBit}Receipt ${number} — ${receivedFrom}`.trim(),
		sourceType: "receipt",
		sourceId: id,
		lines: [{
			accountId: bank.accountId,
			debit: amount,
			credit: 0
		}, {
			accountId: sales.id,
			debit: 0,
			credit: amount
		}]
	});
	const receipt = {
		id,
		number,
		date: input.date,
		kind: "cash-sale",
		method,
		checkNumber,
		customerId: input.customerId,
		receivedFrom,
		bankId: bank.id,
		lines,
		amount,
		taxRate,
		status: "posted",
		memo: input.notes,
		journalId: journal.id,
		sortOrder: data.receipts.length
	};
	return {
		...data,
		receipts: [...data.receipts, receipt],
		journals: [...data.journals, journal],
		nextNumbers: {
			...data.nextNumbers,
			receipt: data.nextNumbers.receipt + 1
		}
	};
}
function voidReceipt(data, id, date = todayIso()) {
	const receipt = data.receipts.find((r) => r.id === id);
	if (!receipt) throw new Error("Receipt not found");
	if (receipt.status === "void") return data;
	const original = data.journals.find((j) => j.id === receipt.journalId);
	if (!original) throw new Error("Original journal missing");
	const reversal = reverseJournal(original, date, `Void ${receipt.number}`);
	let invoices = data.invoices;
	if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) invoices = data.invoices.map((invoice) => {
		if (invoice.id !== receipt.invoiceId) return invoice;
		const payments = invoice.payments.filter((p) => p.id !== receipt.paymentId);
		const paid = payments.reduce((s, p) => s + p.amount, 0);
		const total = invoiceTotal({
			...data,
			invoices: data.invoices.map((i) => i.id === invoice.id ? {
				...invoice,
				payments
			} : i)
		}, invoice.id);
		const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
		return {
			...invoice,
			payments,
			status: invoice.status === "void" ? invoice.status : status
		};
	});
	return {
		...data,
		invoices,
		receipts: data.receipts.map((r) => r.id === id ? {
			...r,
			status: "void",
			reversalJournalId: reversal.id
		} : r),
		journals: [...data.journals, reversal]
	};
}
function removeReceipt(data, id) {
	const receipt = data.receipts.find((r) => r.id === id);
	if (!receipt) throw new Error("Receipt not found");
	let invoices = data.invoices;
	if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) invoices = invoices.map((invoice) => {
		if (invoice.id !== receipt.invoiceId) return invoice;
		const payments = invoice.payments.filter((p) => p.id !== receipt.paymentId);
		if (invoice.status === "void") return {
			...invoice,
			payments
		};
		const paid = payments.reduce((s, p) => s + p.amount, 0);
		const total = invoiceTotal({
			...data,
			invoices: data.invoices.map((i) => i.id === invoice.id ? {
				...invoice,
				payments
			} : i)
		}, invoice.id);
		const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
		return {
			...invoice,
			payments,
			status
		};
	});
	return dropJournalsAndReversals({
		...data,
		invoices,
		receipts: data.receipts.filter((r) => r.id !== id)
	}, [receipt.journalId, receipt.reversalJournalId]);
}
function reorderReceipts(data, ids) {
	return {
		...data,
		receipts: applyOrder(data.receipts, ids)
	};
}
function createBill(data, input) {
	const vendor = data.vendors.find((v) => v.id === input.vendorId);
	if (!vendor) throw new Error("Vendor not found");
	if (input.amount <= 0) throw new Error("Amount must be greater than zero");
	const expense = data.accounts.find((a) => a.id === input.accountId);
	const ap = data.accounts.find((a) => a.code === "2000");
	if (!expense || !ap) throw new Error("Expense or AP account missing");
	const id = newId();
	const number = `BILL-${input.date.slice(0, 4)}-${String(data.nextNumbers.bill).padStart(3, "0")}`;
	const journal = makeJournal({
		date: input.date,
		description: `Bill ${number} — ${vendor.name}`,
		sourceType: "bill",
		sourceId: id,
		lines: [{
			accountId: expense.id,
			debit: input.amount,
			credit: 0,
			memo: input.memo
		}, {
			accountId: ap.id,
			debit: 0,
			credit: input.amount
		}]
	});
	const bill = {
		id,
		number,
		vendorId: vendor.id,
		date: input.date,
		dueDate: input.dueDate,
		amount: input.amount,
		accountId: expense.id,
		status: "open",
		memo: input.memo,
		reference: input.reference,
		payments: [],
		journalId: journal.id,
		sortOrder: data.bills.length
	};
	return {
		...data,
		bills: [...data.bills, bill],
		journals: [...data.journals, journal],
		nextNumbers: {
			...data.nextNumbers,
			bill: data.nextNumbers.bill + 1
		}
	};
}
function payBill(data, input) {
	const bill = data.bills.find((b) => b.id === input.billId);
	if (!bill) throw new Error("Bill not found");
	if (bill.status === "void" || bill.status === "paid") throw new Error("Bill cannot accept payment");
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	const due = billBalance(bill);
	const amount = Math.min(input.amount, due);
	if (amount <= 0) throw new Error("Nothing left to pay");
	const ap = data.accounts.find((a) => a.code === "2000");
	if (!ap) throw new Error("AP account missing");
	const vendor = data.vendors.find((v) => v.id === bill.vendorId);
	const paymentId = newId();
	const journal = makeJournal({
		date: input.date,
		description: `Payment ${bill.number} — ${vendor?.name ?? ""}`,
		sourceType: "bill-payment",
		sourceId: paymentId,
		lines: [{
			accountId: ap.id,
			debit: amount,
			credit: 0
		}, {
			accountId: bank.accountId,
			debit: 0,
			credit: amount
		}]
	});
	const payments = [...bill.payments, {
		id: paymentId,
		date: input.date,
		amount,
		bankId: bank.id,
		journalId: journal.id
	}];
	const status = payments.reduce((s, p) => s + p.amount, 0) >= bill.amount ? "paid" : "partial";
	return {
		...data,
		bills: data.bills.map((b) => b.id === bill.id ? {
			...bill,
			payments,
			status
		} : b),
		journals: [...data.journals, journal]
	};
}
function voidBill(data, id, date = todayIso()) {
	const bill = data.bills.find((b) => b.id === id);
	if (!bill) throw new Error("Bill not found");
	if (bill.status === "void") return data;
	const journals = [...data.journals];
	if (bill.journalId) {
		const original = data.journals.find((j) => j.id === bill.journalId);
		if (original) journals.push(reverseJournal(original, date, `Void ${bill.number}`));
	}
	for (const payment of bill.payments) {
		const original = data.journals.find((j) => j.id === payment.journalId);
		if (original) journals.push(reverseJournal(original, date, `Void payment ${bill.number}`));
	}
	return {
		...data,
		bills: data.bills.map((b) => b.id === id ? {
			...b,
			status: "void"
		} : b),
		journals
	};
}
function removeBill(data, id) {
	const bill = data.bills.find((b) => b.id === id);
	if (!bill) throw new Error("Bill not found");
	const ids = [bill.journalId, ...bill.payments.map((p) => p.journalId)];
	return dropJournalsAndReversals({
		...data,
		bills: data.bills.filter((b) => b.id !== id)
	}, ids);
}
function removeBillPayment(data, paymentId) {
	const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
	if (!bill) throw new Error("Vendor payment not found");
	const pay = bill.payments.find((p) => p.id === paymentId);
	if (!pay) throw new Error("Vendor payment not found");
	const payments = bill.payments.filter((p) => p.id !== paymentId);
	const paid = payments.reduce((s, p) => s + p.amount, 0);
	const status = paid <= 0 ? "open" : paid >= bill.amount ? "paid" : "partial";
	return dropJournalsAndReversals({
		...data,
		bills: data.bills.map((b) => b.id === bill.id ? {
			...bill,
			payments,
			status
		} : b)
	}, [pay.journalId]);
}
function removeCashLine(data, line) {
	if (!line.sourceId || line.kind === "opening") throw new Error("This line cannot be deleted.");
	if (line.kind === "check") return removeCheck(data, line.sourceId);
	if (line.kind === "receipt" || line.kind === "payment") return removeReceipt(data, line.sourceId);
	if (line.kind === "bill-payment") return removeBillPayment(data, line.sourceId);
	if (line.kind === "deposit" || line.kind === "expense" || line.kind === "transfer") return dropJournalsAndReversals(data, [line.sourceId]);
	throw new Error("This line cannot be deleted.");
}
function removeCashLines(data, lines) {
	let next = data;
	let deleted = 0;
	for (const line of lines) try {
		next = removeCashLine(next, line);
		deleted += 1;
	} catch {}
	if (deleted === 0) throw new Error("Could not delete those entries.");
	return next;
}
function reorderBills(data, ids) {
	return {
		...data,
		bills: applyOrder(data.bills, ids)
	};
}
function addDeposit(data, input) {
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	const income = input.accountId ? data.accounts.find((a) => a.id === input.accountId) : data.accounts.find((a) => a.code === "4000");
	if (!income) throw new Error("Income account missing");
	const journal = makeJournal({
		date: input.date,
		description: input.memo || `Deposit — ${bank.nickname}`,
		sourceType: "deposit",
		sourceId: bank.id,
		lines: [{
			accountId: bank.accountId,
			debit: input.amount,
			credit: 0
		}, {
			accountId: income.id,
			debit: 0,
			credit: input.amount
		}]
	});
	return {
		...data,
		journals: [...data.journals, journal]
	};
}
function addExpense(data, input) {
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank) throw new Error("Bank not found");
	const journal = makeJournal({
		date: input.date,
		description: input.memo || `Expense — ${bank.nickname}`,
		sourceType: "expense",
		sourceId: bank.id,
		lines: [{
			accountId: input.accountId,
			debit: input.amount,
			credit: 0
		}, {
			accountId: bank.accountId,
			debit: 0,
			credit: input.amount
		}]
	});
	return {
		...data,
		journals: [...data.journals, journal]
	};
}
function transferBanks(data, input) {
	if (input.fromId === input.toId) throw new Error("Pick two different banks");
	const from = data.banks.find((b) => b.id === input.fromId);
	const to = data.banks.find((b) => b.id === input.toId);
	if (!from || !to) throw new Error("Bank not found");
	const journal = makeJournal({
		date: input.date,
		description: input.memo || `Transfer ${from.nickname} → ${to.nickname}`,
		sourceType: "transfer",
		lines: [{
			accountId: to.accountId,
			debit: input.amount,
			credit: 0
		}, {
			accountId: from.accountId,
			debit: 0,
			credit: input.amount
		}]
	});
	return {
		...data,
		journals: [...data.journals, journal]
	};
}
function upsertBudget(data, item) {
	if (item.id) return {
		...data,
		budgetItems: data.budgetItems.map((b) => b.id === item.id ? {
			...b,
			...item,
			id: item.id
		} : b)
	};
	return {
		...data,
		budgetItems: [...data.budgetItems, {
			...item,
			id: newId()
		}]
	};
}
function removeBudget(data, id) {
	return {
		...data,
		budgetItems: data.budgetItems.filter((b) => b.id !== id)
	};
}
function rescheduleCashLine(data, input) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Pick a valid date.");
	if (input.kind === "check") return rescheduleCheck(data, input.sourceId, input.date);
	if (input.kind === "receipt") return rescheduleReceipt(data, input.sourceId, input.date);
	return rescheduleBillPayment(data, input.sourceId, input.date);
}
function setJournalDate(data, journalId, date) {
	return {
		...data,
		journals: data.journals.map((j) => j.id === journalId ? {
			...j,
			date
		} : j)
	};
}
function rescheduleCheck(data, id, date) {
	const check = data.checks.find((c) => c.id === id);
	if (!check) throw new Error("Check not found");
	if (check.status === "voided" || check.status === "bounced") throw new Error("Voided checks stay on their original date.");
	if (check.issueDate === date) return data;
	const postDate = check.postDate < date ? date : check.postDate;
	const next = setJournalDate(data, check.journalId, date);
	return {
		...next,
		checks: next.checks.map((c) => c.id === id ? {
			...c,
			issueDate: date,
			postDate
		} : c)
	};
}
function rescheduleReceipt(data, id, date) {
	const receipt = data.receipts.find((r) => r.id === id);
	if (!receipt) throw new Error("Receipt not found");
	if (receipt.status === "void") throw new Error("Voided receipts stay on their original date.");
	if (receipt.date === date) return data;
	let next = setJournalDate(data, receipt.journalId, date);
	if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) next = {
		...next,
		invoices: next.invoices.map((invoice) => {
			if (invoice.id !== receipt.invoiceId) return invoice;
			return {
				...invoice,
				payments: invoice.payments.map((p) => p.id === receipt.paymentId ? {
					...p,
					date
				} : p)
			};
		})
	};
	return {
		...next,
		receipts: next.receipts.map((r) => r.id === id ? {
			...r,
			date
		} : r)
	};
}
function rescheduleBillPayment(data, paymentId, date) {
	const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
	if (!bill) throw new Error("Payment not found");
	const payment = bill.payments.find((p) => p.id === paymentId);
	if (!payment) throw new Error("Payment not found");
	if (payment.date === date) return data;
	const next = setJournalDate(data, payment.journalId, date);
	return {
		...next,
		bills: next.bills.map((b) => b.id === bill.id ? {
			...b,
			payments: b.payments.map((p) => p.id === paymentId ? {
				...p,
				date
			} : p)
		} : b)
	};
}
function dropJournalsAndReversals(data, ids) {
	const drop = new Set(ids.filter((id) => Boolean(id)));
	if (drop.size === 0) return data;
	for (const journal of data.journals) if (journal.sourceType === "reversal" && journal.sourceId && drop.has(journal.sourceId)) drop.add(journal.id);
	return {
		...data,
		journals: data.journals.filter((j) => !drop.has(j.id))
	};
}
function patchJournalAmount(data, journalId, input) {
	return {
		...data,
		journals: data.journals.map((journal) => {
			if (journal.id !== journalId) return journal;
			const amount = input.amount;
			const lines = journal.lines.map((line) => {
				const isDebit = line.debit > 0 && line.credit === 0;
				const nextAmount = typeof amount === "number" ? amount : isDebit ? line.debit : line.credit;
				if (isDebit) return {
					...line,
					accountId: input.debitAccountId ?? line.accountId,
					debit: nextAmount,
					credit: 0,
					memo: input.memo ?? line.memo
				};
				return {
					...line,
					accountId: input.creditAccountId ?? line.accountId,
					debit: 0,
					credit: nextAmount,
					memo: input.memo ?? line.memo
				};
			});
			return {
				...journal,
				date: input.date ?? journal.date,
				description: input.description ?? journal.description,
				lines
			};
		})
	};
}
function updateCheck(data, id, patch) {
	const check = data.checks.find((c) => c.id === id);
	if (!check) throw new Error("Check not found");
	if (check.status === "voided" || check.status === "bounced") throw new Error("Voided checks cannot be edited. Delete them to re-enter.");
	const payee = (patch.payee ?? check.payee).trim();
	const amount = patch.amount ?? check.amount;
	const issueDate = patch.issueDate ?? check.issueDate;
	const postDate = patch.postDate ?? check.postDate;
	const memo = patch.memo ?? check.memo;
	const checkNumber = (patch.checkNumber ?? check.checkNumber).trim() || check.checkNumber;
	const accountId = patch.accountId ?? check.accountId;
	const bankId = patch.bankId ?? check.bankId;
	if (!payee) throw new Error("Payee is required.");
	if (amount <= 0) throw new Error("Amount must be greater than zero");
	const bank = data.banks.find((b) => b.id === bankId);
	if (!bank) throw new Error("Bank not found");
	const next = patchJournalAmount(data, check.journalId, {
		date: issueDate,
		description: `Check ${checkNumber} — ${payee}`,
		amount,
		memo,
		debitAccountId: accountId,
		creditAccountId: bank.accountId
	});
	return {
		...next,
		checks: next.checks.map((c) => c.id === id ? {
			...c,
			payee,
			amount,
			issueDate,
			postDate,
			memo,
			checkNumber,
			accountId,
			bankId
		} : c)
	};
}
function updateReceipt(data, id, patch) {
	const receipt = data.receipts.find((r) => r.id === id);
	if (!receipt) throw new Error("Receipt not found");
	if (receipt.status === "void") throw new Error("Voided receipts cannot be edited. Delete them to re-enter.");
	const date = patch.date ?? receipt.date;
	const receivedFrom = (patch.receivedFrom ?? receipt.receivedFrom).trim();
	const amount = patch.amount ?? receipt.amount;
	const memo = patch.memo ?? receipt.memo;
	const method = patch.method ?? receipt.method;
	const checkNumber = (patch.checkNumber ?? receipt.checkNumber).trim();
	const bankId = patch.bankId ?? receipt.bankId;
	if (!receivedFrom) throw new Error("Received from is required.");
	if (amount <= 0) throw new Error("Amount must be greater than zero");
	if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
	const bank = data.banks.find((b) => b.id === bankId);
	if (!bank) throw new Error("Bank not found");
	let next = data;
	if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) {
		const invoice = data.invoices.find((i) => i.id === receipt.invoiceId);
		if (invoice) {
			const payments = invoice.payments.map((p) => p.id === receipt.paymentId ? {
				...p,
				date,
				amount,
				bankId
			} : p);
			const paid = payments.reduce((s, p) => s + p.amount, 0);
			const total = invoiceTotal(data, invoice.id);
			if (paid > total) throw new Error("Payment exceeds the invoice total.");
			const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
			next = {
				...next,
				invoices: next.invoices.map((i) => i.id === invoice.id ? {
					...invoice,
					payments,
					status: invoice.status === "void" ? invoice.status : status
				} : i)
			};
		}
	}
	const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
	next = patchJournalAmount(next, receipt.journalId, {
		date,
		description: `${checkBit}Receipt ${receipt.number} — ${receivedFrom}`.trim(),
		amount,
		memo,
		debitAccountId: bank.accountId
	});
	return {
		...next,
		receipts: next.receipts.map((r) => r.id === id ? {
			...r,
			date,
			receivedFrom,
			amount,
			memo,
			method,
			checkNumber,
			bankId
		} : r)
	};
}
function updateBillRecord(data, id, patch) {
	const bill = data.bills.find((b) => b.id === id);
	if (!bill) throw new Error("Bill not found");
	if (bill.status === "void") throw new Error("Voided bills cannot be edited.");
	const date = patch.date ?? bill.date;
	const dueDate = patch.dueDate ?? bill.dueDate;
	const amount = patch.amount ?? bill.amount;
	const memo = patch.memo ?? bill.memo;
	const paid = bill.payments.reduce((s, p) => s + p.amount, 0);
	if (amount <= 0) throw new Error("Amount must be greater than zero");
	if (amount < paid) throw new Error("Amount cannot be less than already paid.");
	const status = paid <= 0 ? "open" : paid >= amount ? "paid" : "partial";
	let next = data;
	if (bill.journalId) next = patchJournalAmount(next, bill.journalId, {
		date,
		description: `Bill ${bill.number}${memo ? ` — ${memo}` : ""}`,
		amount,
		memo
	});
	return {
		...next,
		bills: next.bills.map((b) => b.id === id ? {
			...b,
			date,
			dueDate,
			amount,
			memo,
			status
		} : b)
	};
}
function updateJournalEntry(data, id, patch) {
	const journal = data.journals.find((j) => j.id === id);
	if (!journal) throw new Error("Entry not found");
	if (journal.sourceType !== "deposit" && journal.sourceType !== "expense" && journal.sourceType !== "transfer") throw new Error("Open the source document to edit this line.");
	const amount = patch.amount ?? journal.lines.reduce((s, l) => s + l.debit, 0);
	if (amount <= 0) throw new Error("Amount must be greater than zero");
	return patchJournalAmount(data, id, {
		date: patch.date,
		description: patch.description,
		amount
	});
}
function updateInvoiceRecord(data, id, patch) {
	const invoice = data.invoices.find((i) => i.id === id);
	if (!invoice) throw new Error("Invoice not found");
	if (invoice.status === "void") throw new Error("Voided invoices cannot be edited.");
	const date = patch.date ?? invoice.date;
	const dueDate = patch.dueDate ?? invoice.dueDate;
	const notes = patch.notes ?? invoice.notes;
	let lines = invoice.lines;
	if (patch.lines) {
		lines = patch.lines.filter((l) => l.description?.trim() && l.quantity > 0).map((l, i) => ({
			id: l.id || invoice.lines[i]?.id || newId(),
			description: String(l.description).trim(),
			quantity: l.quantity,
			unitPrice: Math.round(l.unitPrice)
		}));
		if (lines.length === 0) throw new Error("Add at least one line");
	}
	const taxRate = patch.taxRate ?? invoice.taxRate;
	const sub = invoiceSubtotal(lines);
	const total = sub + invoiceTax(sub, taxRate, data.settings.taxEnabled);
	const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
	if (total < paid) throw new Error("Total cannot be less than already paid.");
	const status = invoice.status === "draft" ? "draft" : paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
	const customer = data.customers.find((c) => c.id === invoice.customerId);
	let next = data;
	if (invoice.journalId) next = patchJournalAmount(next, invoice.journalId, {
		date,
		description: `Invoice ${invoice.number} — ${customer?.name ?? ""}`.trim(),
		amount: total
	});
	return {
		...next,
		invoices: next.invoices.map((i) => i.id === id ? {
			...i,
			date,
			dueDate,
			notes,
			lines,
			taxRate,
			status
		} : i)
	};
}
function updateSettings(data, patch) {
	return {
		...data,
		settings: {
			...data.settings,
			...patch
		}
	};
}
function reassignCashBank(data, input) {
	if (input.kind === "opening") throw new Error("Opening balance stays on its banks.");
	const bank = data.banks.find((b) => b.id === input.bankId);
	if (!bank || bank.archived) throw new Error("Bank not found");
	if (input.kind === "check") return updateCheck(data, input.sourceId, { bankId: input.bankId });
	if (input.kind === "receipt" || input.kind === "payment") return updateReceipt(data, input.sourceId, { bankId: input.bankId });
	if (input.kind === "bill-payment") return reassignBillPayment(data, input.sourceId, input.bankId);
	if (input.kind === "deposit" || input.kind === "expense" || input.kind === "transfer") return reassignJournalBank(data, input.sourceId, input.bankId, input.fromBankId);
	throw new Error("This line cannot move banks.");
}
function reassignCashBanks(data, lines, bankId) {
	return lines.reduce((acc, line) => reassignCashBank(acc, {
		...line,
		bankId
	}), data);
}
function reassignBillPayment(data, paymentId, bankId) {
	const bank = data.banks.find((b) => b.id === bankId);
	if (!bank) throw new Error("Bank not found");
	const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
	if (!bill) throw new Error("Vendor payment not found");
	const payment = bill.payments.find((p) => p.id === paymentId);
	if (!payment) throw new Error("Vendor payment not found");
	if (payment.bankId === bankId) return data;
	const next = patchJournalAmount(data, payment.journalId, { creditAccountId: bank.accountId });
	return {
		...next,
		bills: next.bills.map((b) => b.id === bill.id ? {
			...b,
			payments: b.payments.map((p) => p.id === paymentId ? {
				...p,
				bankId
			} : p)
		} : b)
	};
}
function reassignJournalBank(data, journalId, toBankId, fromBankId) {
	const journal = data.journals.find((j) => j.id === journalId);
	if (!journal) throw new Error("Entry not found");
	const toBank = data.banks.find((b) => b.id === toBankId);
	if (!toBank) throw new Error("Bank not found");
	const fromBank = fromBankId ? data.banks.find((b) => b.id === fromBankId) : data.banks.find((b) => journal.lines.some((l) => l.accountId === b.accountId));
	if (!fromBank) throw new Error("Source bank not found");
	if (fromBank.id === toBank.id) return data;
	if (!journal.lines.find((l) => l.accountId === fromBank.accountId)) throw new Error("This line is not on that bank.");
	if (journal.lines.some((l) => l.accountId === toBank.accountId)) throw new Error("That bank is already on this transfer. Pick a different account.");
	const description = journal.sourceType === "transfer" ? journal.description.replace(fromBank.nickname, toBank.nickname) : journal.description;
	return {
		...data,
		journals: data.journals.map((j) => {
			if (j.id !== journalId) return j;
			return {
				...j,
				description,
				lines: j.lines.map((l) => l.accountId === fromBank.accountId ? {
					...l,
					accountId: toBank.accountId
				} : l)
			};
		})
	};
}
/** Drop closed documents through a date and post one condensed journal so balances stay put. */
function purgeClosedThrough(data, throughDate) {
	if (!throughDate) throw new Error("Pick a date.");
	const dropInvoices = new Set(data.invoices.filter((i) => (i.status === "paid" || i.status === "void") && i.date <= throughDate).map((i) => i.id));
	const dropReceipts = new Set(data.receipts.filter((r) => {
		if (r.invoiceId && dropInvoices.has(r.invoiceId)) return true;
		if (r.kind === "cash-sale" && r.date <= throughDate) return true;
		if (r.kind === "payment" && r.status === "void" && r.date <= throughDate) return true;
		return false;
	}).map((r) => r.id));
	const dropBills = new Set(data.bills.filter((b) => (b.status === "paid" || b.status === "void") && b.date <= throughDate).map((b) => b.id));
	const dropChecks = new Set(data.checks.filter((c) => c.status !== "pending" && c.issueDate <= throughDate).map((c) => c.id));
	const journalIds = [];
	for (const invoice of data.invoices) {
		if (!dropInvoices.has(invoice.id)) continue;
		journalIds.push(invoice.journalId, ...invoice.payments.map((p) => p.journalId));
	}
	for (const receipt of data.receipts) {
		if (!dropReceipts.has(receipt.id)) continue;
		journalIds.push(receipt.journalId, receipt.reversalJournalId);
	}
	for (const bill of data.bills) {
		if (!dropBills.has(bill.id)) continue;
		journalIds.push(bill.journalId, ...bill.payments.map((p) => p.journalId));
	}
	for (const check of data.checks) {
		if (!dropChecks.has(check.id)) continue;
		journalIds.push(check.journalId, check.reversalJournalId);
	}
	const drop = new Set(journalIds.filter((id) => Boolean(id)));
	for (const journal of data.journals) if (journal.sourceType === "reversal" && journal.sourceId && drop.has(journal.sourceId)) drop.add(journal.id);
	const nets = /* @__PURE__ */ new Map();
	for (const journal of data.journals) {
		if (!drop.has(journal.id)) continue;
		for (const line of journal.lines) nets.set(line.accountId, (nets.get(line.accountId) ?? 0) + line.debit - line.credit);
	}
	const condensedLines = [...nets.entries()].filter(([, net]) => net !== 0).map(([accountId, net]) => net > 0 ? {
		accountId,
		debit: net,
		credit: 0
	} : {
		accountId,
		debit: 0,
		credit: -net
	});
	const removed = dropInvoices.size + dropReceipts.size + dropBills.size + dropChecks.size;
	if (removed === 0) throw new Error("Nothing closed on or before that date.");
	let next = {
		...data,
		invoices: data.invoices.filter((i) => !dropInvoices.has(i.id)),
		receipts: data.receipts.filter((r) => !dropReceipts.has(r.id)),
		bills: data.bills.filter((b) => !dropBills.has(b.id)),
		checks: data.checks.filter((c) => !dropChecks.has(c.id)),
		journals: data.journals.filter((j) => !drop.has(j.id))
	};
	if (condensedLines.length > 0) next = {
		...next,
		journals: [makeJournal({
			date: throughDate,
			description: `Condensed books through ${throughDate}`,
			sourceType: "manual",
			lines: condensedLines
		}), ...next.journals]
	};
	return {
		data: next,
		removed
	};
}
var REGISTER_COLS = [
	{
		id: "date",
		label: "Date"
	},
	{
		id: "type",
		label: "Type"
	},
	{
		id: "number",
		label: "No."
	},
	{
		id: "payee",
		label: "Payee"
	},
	{
		id: "memo",
		label: "Memo"
	},
	{
		id: "bank",
		label: "Bank"
	},
	{
		id: "payment",
		label: "Payment"
	},
	{
		id: "deposit",
		label: "Deposit"
	},
	{
		id: "balance",
		label: "Balance"
	},
	{
		id: "status",
		label: "Status"
	}
];
var DEFAULT_REGISTER_COLS = {
	date: true,
	type: true,
	number: true,
	payee: true,
	memo: true,
	bank: true,
	payment: true,
	deposit: true,
	balance: true,
	status: true
};
var REGISTER_COL_CLASS = {
	date: "col-date",
	type: "col-type",
	number: "col-num",
	payee: "col-payee",
	memo: "col-memo",
	bank: "col-bank",
	payment: "col-money col-payment",
	deposit: "col-money col-deposit",
	balance: "col-money col-balance",
	status: "col-status"
};
function normalizeRegisterCols(raw) {
	const src = raw && typeof raw === "object" ? raw : {};
	const next = { ...DEFAULT_REGISTER_COLS };
	for (const col of REGISTER_COLS) {
		const value = src[col.id];
		if (typeof value === "boolean") next[col.id] = value;
	}
	if (!REGISTER_COLS.some((col) => next[col.id])) return { ...DEFAULT_REGISTER_COLS };
	return next;
}
function toggleRegisterCol(cols, id) {
	const next = {
		...cols,
		[id]: !cols[id]
	};
	if (!REGISTER_COLS.some((col) => next[col.id])) return cols;
	return next;
}
var CURRENCIES = [
	{
		code: "PHP",
		label: "Philippine peso"
	},
	{
		code: "USD",
		label: "US dollar"
	},
	{
		code: "EUR",
		label: "Euro"
	},
	{
		code: "SGD",
		label: "Singapore dollar"
	},
	{
		code: "JPY",
		label: "Japanese yen"
	},
	{
		code: "GBP",
		label: "Pound sterling"
	},
	{
		code: "AUD",
		label: "Australian dollar"
	},
	{
		code: "CAD",
		label: "Canadian dollar"
	},
	{
		code: "HKD",
		label: "Hong Kong dollar"
	},
	{
		code: "CNY",
		label: "Chinese yuan"
	}
];
var EMPTY_CUSTOMER = {
	name: "",
	contact: "",
	email: "",
	phone: "",
	address: "",
	terms: "Net 30",
	notes: "",
	sortOrder: 0
};
var EMPTY_VENDOR = {
	name: "",
	contact: "",
	email: "",
	phone: "",
	address: "",
	terms: "Net 30",
	notes: "",
	accountNumber: "",
	sortOrder: 0
};
var DEFAULT_SETTINGS = {
	companyName: "Your Company",
	companyAddress: "",
	companyPhone: "",
	companyEmail: "",
	currency: "PHP",
	fiscalYearStart: 1,
	taxEnabled: false,
	defaultTaxRate: 12,
	dragDropEnabled: false,
	registerFontSize: 12,
	registerColumns: DEFAULT_REGISTER_COLS
};
function asArray(value) {
	return Array.isArray(value) ? value : [];
}
function normalizeBooks(raw) {
	const p = raw && typeof raw === "object" ? raw : {};
	const merged = {
		...DEFAULT_SETTINGS,
		...p.settings ?? {}
	};
	const font = Number(merged.registerFontSize);
	const settings = {
		...merged,
		registerFontSize: Number.isFinite(font) ? Math.min(18, Math.max(10, Math.round(font))) : 12,
		registerColumns: normalizeRegisterCols(merged.registerColumns)
	};
	const customers = asArray(p.customers).map((c, i) => ({
		...c,
		sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : i
	}));
	const vendors = asArray(p.vendors).map((v, i) => ({
		...v,
		accountNumber: v.accountNumber ?? "",
		sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : i
	}));
	const bills = asArray(p.bills).map((b, i) => ({
		...b,
		payments: Array.isArray(b.payments) ? b.payments : [],
		reference: b.reference ?? "",
		memo: b.memo ?? "",
		sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : i
	}));
	const receipts = asArray(p.receipts).map((r, i) => ({
		...r,
		lines: Array.isArray(r.lines) ? r.lines : [],
		receivedFrom: r.receivedFrom ?? "",
		memo: r.memo ?? "",
		method: parseMethod(r.method),
		checkNumber: r.checkNumber ?? "",
		sortOrder: typeof r.sortOrder === "number" ? r.sortOrder : i
	}));
	const nextNumbers = p.nextNumbers ?? {
		invoice: 1,
		check: {},
		receipt: 1,
		bill: 1
	};
	const banks = ensureSafekeeping(asArray(p.banks), asArray(p.accounts));
	return {
		settings,
		banks: banks.banks,
		accounts: banks.accounts,
		customers,
		vendors,
		invoices: asArray(p.invoices),
		bills,
		receipts,
		checks: asArray(p.checks),
		journals: asArray(p.journals),
		budgetItems: asArray(p.budgetItems),
		nextNumbers: {
			invoice: nextNumbers.invoice ?? 1,
			check: {
				...nextNumbers.check,
				"bank-safe": nextNumbers.check?.["bank-safe"] ?? 1
			},
			receipt: nextNumbers.receipt ?? 1,
			bill: nextNumbers.bill ?? 1
		}
	};
}
var SAFE_BANK = {
	id: "bank-safe",
	name: "Undeposited funds",
	nickname: "Safekeeping",
	accountNumber: "On hand",
	openingBalance: 0,
	accountId: "acct-1030",
	archived: false
};
var SAFE_ACCOUNT = {
	id: "acct-1030",
	code: "1030",
	name: "Cash — Safekeeping",
	type: "asset",
	bankId: "bank-safe",
	system: true
};
function ensureSafekeeping(banks, accounts) {
	if (banks.some((b) => b.id === SAFE_BANK.id || /safekeeping/i.test(b.nickname))) return {
		banks,
		accounts
	};
	return {
		banks: [...banks, SAFE_BANK],
		accounts: accounts.some((a) => a.id === SAFE_ACCOUNT.id) ? accounts : [...accounts, SAFE_ACCOUNT]
	};
}
var KIND_LABEL = {
	opening: "Opening",
	check: "Check",
	receipt: "Cash Sale",
	payment: "Receipt",
	"bill-payment": "Vendor Pay",
	deposit: "Deposit",
	expense: "Expense",
	transfer: "Transfer"
};
function shiftIso(iso, days) {
	return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}
function openingForBanks(data, bankId) {
	return data.banks.filter((b) => !b.archived && (!bankId || b.id === bankId)).reduce((sum, b) => sum + b.openingBalance, 0);
}
function datePresetRange(preset, today = todayIso()) {
	if (preset === "month") {
		const start = `${today.slice(0, 7)}-01`;
		return {
			from: start,
			to: format(endOfMonth(parseISO(start)), "yyyy-MM-dd")
		};
	}
	const y = today.slice(0, 4);
	return {
		from: `${y}-01-01`,
		to: `${y}-12-31`
	};
}
function cashBook(data, bankId, range) {
	const dateFrom = range?.dateFrom?.trim() ?? "";
	const dateTo = range?.dateTo?.trim() ?? "";
	const lines = [];
	let opening = openingForBanks(data, bankId);
	function take(line) {
		if (dateFrom && line.date && line.date < dateFrom) {
			if (line.counts) opening += line.deposit - line.payment;
			return;
		}
		if (dateTo && line.date && line.date > dateTo) return;
		lines.push(line);
	}
	for (const check of data.checks) {
		if (bankId && check.bankId !== bankId) continue;
		const voided = check.status === "voided" || check.status === "bounced";
		take({
			id: `check:${check.id}`,
			kind: "check",
			sourceId: check.id,
			date: check.issueDate,
			number: `#${check.checkNumber}`,
			party: check.payee,
			bankId: check.bankId,
			payment: voided ? 0 : check.amount,
			deposit: 0,
			status: check.status,
			memo: check.memo,
			counts: !voided,
			reschedulable: check.status === "pending" || check.status === "cleared",
			reassignable: !voided
		});
	}
	for (const receipt of data.receipts) {
		if (bankId && receipt.bankId !== bankId) continue;
		const voided = receipt.status === "void";
		take({
			id: `receipt:${receipt.id}`,
			kind: receipt.kind === "payment" ? "payment" : "receipt",
			sourceId: receipt.id,
			date: receipt.date,
			number: receipt.checkNumber ? `Chk ${receipt.checkNumber}` : receipt.number,
			party: receipt.receivedFrom,
			bankId: receipt.bankId,
			payment: 0,
			deposit: voided ? 0 : receipt.amount,
			status: receipt.status,
			memo: receipt.memo,
			counts: !voided,
			reschedulable: receipt.status === "posted",
			reassignable: !voided,
			method: receipt.method
		});
	}
	for (const bill of data.bills) {
		if (bill.status === "void") continue;
		const vendor = data.vendors.find((v) => v.id === bill.vendorId);
		for (const pay of bill.payments) {
			if (bankId && pay.bankId !== bankId) continue;
			take({
				id: `billpay:${pay.id}`,
				kind: "bill-payment",
				sourceId: pay.id,
				date: pay.date,
				number: bill.number,
				party: vendor?.name ?? bill.number,
				bankId: pay.bankId,
				payment: pay.amount,
				deposit: 0,
				status: bill.status,
				memo: bill.memo,
				counts: true,
				reschedulable: true,
				reassignable: true
			});
		}
	}
	for (const journal of data.journals) {
		if (journal.sourceType !== "deposit" && journal.sourceType !== "expense" && journal.sourceType !== "transfer") continue;
		for (const line of journal.lines) {
			const account = data.accounts.find((a) => a.id === line.accountId);
			if (!account?.bankId) continue;
			if (bankId && account.bankId !== bankId) continue;
			const inbound = line.debit > 0;
			const amount = inbound ? line.debit : line.credit;
			take({
				id: `journal:${journal.id}:${account.bankId}`,
				kind: journal.sourceType,
				sourceId: journal.id,
				date: journal.date,
				number: "",
				party: journal.description,
				bankId: account.bankId,
				payment: inbound ? 0 : amount,
				deposit: inbound ? amount : 0,
				status: journal.sourceType === "transfer" ? "internal" : "posted",
				memo: line.memo,
				counts: true,
				reschedulable: false,
				reassignable: true
			});
		}
	}
	lines.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
	return {
		opening,
		lines
	};
}
function cashRegisterLines(data, bankId) {
	return cashBook(data, bankId).lines;
}
function withOpening(lines, opening, asOf) {
	if (opening === 0) return lines;
	return [{
		id: "opening",
		kind: "opening",
		sourceId: "",
		date: asOf?.date ?? "",
		number: "",
		party: asOf?.forward ? "Balance forward" : "Opening balance",
		bankId: "",
		payment: opening < 0 ? -opening : 0,
		deposit: opening > 0 ? opening : 0,
		status: "",
		memo: "",
		counts: true,
		reschedulable: false,
		reassignable: false
	}, ...lines];
}
function withRunningBalance(lines) {
	let balance = 0;
	return lines.map((line) => {
		if (line.counts) balance += line.deposit - line.payment;
		return {
			...line,
			balance
		};
	});
}
function filterDirection(lines, direction) {
	if (direction === "in") return lines.filter((l) => l.kind === "opening" || l.deposit > 0);
	if (direction === "out") return lines.filter((l) => l.kind === "opening" || l.payment > 0);
	return lines;
}
function boardDates(lines, extra) {
	const today = todayIso();
	const set = new Set(extra);
	for (const line of lines) if (line.date) set.add(line.date);
	for (let i = 0; i <= 3; i += 1) set.add(shiftIso(today, i));
	return [...set].sort();
}
function rescheduleKind(kind) {
	if (kind === "check") return "check";
	if (kind === "receipt" || kind === "payment") return "receipt";
	if (kind === "bill-payment") return "bill-payment";
	return null;
}
function totals(lines) {
	const inflow = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
	const outflow = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
	return {
		inflow,
		outflow,
		net: inflow - outflow
	};
}
var TYPE_FILTERS = [
	{
		value: "all",
		label: "All types"
	},
	{
		value: "check",
		label: "Check"
	},
	{
		value: "payment",
		label: "Receipt"
	},
	{
		value: "receipt",
		label: "Cash Sale"
	},
	{
		value: "bill-payment",
		label: "Vendor Pay"
	},
	{
		value: "deposit",
		label: "Deposit"
	},
	{
		value: "expense",
		label: "Expense"
	},
	{
		value: "transfer",
		label: "Transfer"
	}
];
function filterCashLines(lines, q) {
	const name = (q.name ?? "").trim().toLowerCase();
	const number = (q.number ?? "").trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
	const type = q.type && q.type !== "all" ? q.type : "";
	const dateFrom = q.dateFrom?.trim() ?? "";
	const dateTo = q.dateTo?.trim() ?? "";
	const bankId = q.bankId?.trim() ?? "";
	const amountQ = (q.amount ?? "").trim();
	const amountCents = amountQ ? parseAmountToCents(amountQ) : 0;
	return lines.filter((line) => {
		if (line.kind === "opening") return !name && !number && !type && !amountQ;
		if (type && line.kind !== type) return false;
		if (name) {
			const hay = `${line.party} ${line.memo} ${line.number}`.toLowerCase();
			const numHay = line.number.toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
			const numNeedle = name.replace(/^#/, "").replace(/\s+/g, "");
			if (!hay.includes(name) && !numHay.includes(numNeedle)) return false;
		}
		if (number) {
			if (!line.number.toLowerCase().replace(/^#/, "").replace(/\s+/g, "").includes(number)) return false;
		}
		if (dateFrom && line.date && line.date < dateFrom) return false;
		if (dateTo && line.date && line.date > dateTo) return false;
		if (bankId && line.bankId !== bankId) return false;
		if (amountQ) {
			if (![line.payment, line.deposit].filter((v) => v > 0).some((v) => v === amountCents || v === Math.round(Number(amountQ.replace(/,/g, ""))) || String(v / 100).includes(amountQ.replace(/,/g, "")))) return false;
		}
		return true;
	});
}
function deletableLines(lines) {
	return lines.filter((line) => line.kind !== "opening" && Boolean(line.sourceId));
}
function movableLines(lines) {
	return lines.filter((line) => line.reassignable && Boolean(line.sourceId));
}
function monthLabel(month) {
	const date = parseISO(`${month}-01`);
	return format(date, "MMMM yyyy");
}
function shiftMonth(month, delta) {
	return format(addMonths(parseISO(`${month}-01`), delta), "yyyy-MM");
}
function cashCalendar(lines, month) {
	const today = todayIso();
	const monthStart = startOfMonth(parseISO(`${month}-01`));
	const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
	const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });
	const byDate = /* @__PURE__ */ new Map();
	for (const line of lines) {
		if (line.kind === "opening" || !line.date) continue;
		const bucket = byDate.get(line.date) ?? [];
		bucket.push(line);
		byDate.set(line.date, bucket);
	}
	return eachDayOfInterval({
		start: gridStart,
		end: gridEnd
	}).map((day) => {
		const date = format(day, "yyyy-MM-dd");
		const group = byDate.get(date) ?? [];
		const inflow = group.reduce((s, l) => s + l.deposit, 0);
		const outflow = group.reduce((s, l) => s + l.payment, 0);
		return {
			date,
			inMonth: date.startsWith(month),
			today: date === today,
			inflow,
			outflow,
			net: inflow - outflow,
			count: group.length,
			lines: group
		};
	});
}
function escapeCell(value) {
	const text = String(value ?? "");
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
	return text;
}
function toCsv(rows) {
	if (rows.length === 0) return "﻿";
	const headers = Object.keys(rows[0]);
	return `\uFEFF${[headers.join(","), ...rows.map((row) => headers.map((h) => escapeCell(row[h] ?? "")).join(","))].join("\n")}`;
}
function downloadText(filename, content, mime) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
function exportCsv(filename, rows) {
	downloadText(filename, toCsv(rows), "text/csv;charset=utf-8");
}
function ledgerRows(data) {
	const rows = [];
	const sorted = [...data.journals].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
	for (const entry of sorted) for (const line of entry.lines) {
		const account = data.accounts.find((a) => a.id === line.accountId);
		rows.push({
			Date: formatDate(entry.date),
			Description: entry.description,
			Source: titleCase(entry.sourceType),
			Account: account ? `${account.code} ${account.name}` : line.accountId,
			Debit: line.debit / 100,
			Credit: line.credit / 100,
			Memo: line.memo
		});
	}
	return rows;
}
function checkRegisterRows(data) {
	return [...data.checks].sort((a, b) => b.issueDate.localeCompare(a.issueDate)).map((c) => {
		const bank = data.banks.find((b) => b.id === c.bankId);
		return {
			"Check #": c.checkNumber,
			Bank: bank?.nickname ?? "",
			Payee: c.payee,
			"Issue date": formatDate(c.issueDate),
			"Post date": formatDate(c.postDate),
			Amount: c.amount / 100,
			Status: titleCase(c.status),
			Memo: c.memo
		};
	});
}
function invoiceRows(data) {
	return [...data.invoices].sort((a, b) => b.date.localeCompare(a.date)).map((inv) => {
		const customer = data.customers.find((c) => c.id === inv.customerId);
		const total = invoiceTotal(data, inv.id);
		return {
			Number: inv.number,
			Customer: customer?.name ?? "",
			Date: formatDate(inv.date),
			Due: formatDate(inv.dueDate),
			Subtotal: invoiceSubtotal(inv.lines) / 100,
			Tax: invoiceTax(invoiceSubtotal(inv.lines), inv.taxRate, data.settings.taxEnabled) / 100,
			Total: total / 100,
			Balance: invoiceBalance(data, inv.id) / 100,
			Status: titleCase(inv.status)
		};
	});
}
function customerRows(data) {
	return [...data.customers].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map((c) => ({
		Name: c.name,
		Contact: c.contact,
		Email: c.email,
		Phone: c.phone,
		Address: c.address,
		Terms: c.terms,
		"Open balance": customerOpenBalance(data, c.id) / 100,
		Notes: c.notes
	}));
}
function vendorRows(data) {
	return [...data.vendors].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map((v) => ({
		Name: v.name,
		Contact: v.contact,
		Email: v.email,
		Phone: v.phone,
		Address: v.address,
		Terms: v.terms,
		"Account #": v.accountNumber,
		"Open balance": vendorOpenBalance(data, v.id) / 100,
		Notes: v.notes
	}));
}
function receiptRows(data) {
	return [...data.receipts].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)).map((r) => {
		const bank = data.banks.find((b) => b.id === r.bankId);
		return {
			Number: r.number,
			Date: formatDate(r.date),
			Kind: r.kind === "cash-sale" ? "Cash Sale" : "On Account",
			Method: r.method === "echeck" ? "E-Check" : titleCase(r.method),
			"Check #": r.checkNumber || "",
			From: r.receivedFrom,
			Bank: bank?.nickname ?? "",
			Amount: r.amount / 100,
			Status: titleCase(r.status),
			Memo: r.memo
		};
	});
}
function billRows(data) {
	return [...data.bills].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)).map((b) => {
		const vendor = data.vendors.find((v) => v.id === b.vendorId);
		return {
			Number: b.number,
			Vendor: vendor?.name ?? "",
			Date: formatDate(b.date),
			Due: formatDate(b.dueDate),
			Amount: b.amount / 100,
			Balance: billBalance(b) / 100,
			Status: titleCase(b.status),
			Reference: b.reference,
			Memo: b.memo
		};
	});
}
function bankRows(data) {
	return data.banks.map((b) => ({
		Name: b.name,
		Nickname: b.nickname,
		"Account #": b.accountNumber,
		Opening: b.openingBalance / 100,
		"Book balance": accountBalance(data, b.accountId) / 100,
		Archived: b.archived ? "Yes" : "No"
	}));
}
function trialBalanceRows(data) {
	return trialBalance(data).map((row) => ({
		Code: row.account.code,
		Account: row.account.name,
		Type: titleCase(row.account.type),
		Debit: row.debit / 100,
		Credit: row.credit / 100
	}));
}
function cashRegisterRows(data, bankId) {
	const opening = openingForBanks(data, bankId);
	return withRunningBalance(withOpening(cashRegisterLines(data, bankId), opening)).map((line) => {
		const bank = data.banks.find((b) => b.id === line.bankId);
		return {
			Date: line.kind === "opening" ? "Opening" : formatDate(line.date),
			Type: KIND_LABEL[line.kind],
			Number: line.number,
			Payee: line.party,
			Memo: line.memo,
			Bank: bank?.nickname ?? "",
			Payment: line.payment / 100,
			Deposit: line.deposit / 100,
			Balance: line.balance / 100,
			Status: titleCase(line.status)
		};
	});
}
var WORKSPACE_BACKUP_KIND = "finance-manager-backup";
function companyBooksObject(data) {
	return {
		settings: data.settings,
		banks: data.banks,
		accounts: data.accounts,
		customers: data.customers,
		vendors: data.vendors,
		invoices: data.invoices,
		bills: data.bills,
		receipts: data.receipts,
		checks: data.checks,
		journals: data.journals,
		budgetItems: data.budgetItems,
		nextNumbers: data.nextNumbers
	};
}
function backupPayload(data) {
	return JSON.stringify(companyBooksObject(data), null, 2);
}
function workspaceBackupPayload(state) {
	const companies = {};
	for (const [id, data] of Object.entries(state.companies)) companies[id] = companyBooksObject(data);
	return JSON.stringify({
		kind: WORKSPACE_BACKUP_KIND,
		version: 6,
		companies,
		companyOrder: state.companyOrder,
		activeCompanyId: state.activeCompanyId
	}, null, 2);
}
function isWorkspaceShape(raw) {
	if (!raw || typeof raw !== "object") return false;
	const o = raw;
	if (!o.companies || typeof o.companies !== "object" || Array.isArray(o.companies)) return false;
	if (o.kind === "finance-manager-backup") return true;
	return !("settings" in o) && !("banks" in o);
}
function parseBackupFile(raw) {
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("That file is not valid JSON.");
	}
	if (isWorkspaceShape(parsed)) {
		const companies = {};
		for (const [id, books] of Object.entries(parsed.companies)) companies[id] = normalizeBooks(books);
		if (Object.keys(companies).length === 0) throw new Error("Backup has no companies.");
		const order = (Array.isArray(parsed.companyOrder) ? parsed.companyOrder.filter((id) => typeof id === "string") : Object.keys(companies)).filter((id) => companies[id]);
		for (const id of Object.keys(companies)) if (!order.includes(id)) order.push(id);
		return {
			type: "workspace",
			companies,
			companyOrder: order,
			activeCompanyId: typeof parsed.activeCompanyId === "string" && companies[parsed.activeCompanyId] ? parsed.activeCompanyId : order[0]
		};
	}
	return {
		type: "company",
		data: normalizeBooks(parsed)
	};
}
var IDS = {
	bdo: "bank-bdo",
	bpi: "bank-bpi",
	metro: "bank-metro",
	safe: "bank-safe",
	cashBdo: "acct-1000",
	cashBpi: "acct-1010",
	cashMetro: "acct-1020",
	cashSafe: "acct-1030",
	ar: "acct-1200",
	ap: "acct-2000",
	equity: "acct-3000",
	sales: "acct-4000",
	opex: "acct-5000",
	rent: "acct-5200",
	payroll: "acct-5300",
	utilities: "acct-5400",
	fees: "acct-5500",
	misc: "acct-5900",
	custLaguna: "cust-laguna",
	custCebu: "cust-cebu",
	custMetro: "cust-metro",
	custDavao: "cust-davao",
	vendAyala: "vend-ayala",
	vendMeralco: "vend-meralco",
	vendSantos: "vend-santos",
	vendDelta: "vend-delta",
	vendHarbor: "vend-harbor"
};
var SYSTEM_ACCOUNTS = [
	{
		id: IDS.cashBdo,
		code: "1000",
		name: "Cash — BDO Checking",
		type: "asset",
		bankId: IDS.bdo,
		system: true
	},
	{
		id: IDS.cashBpi,
		code: "1010",
		name: "Cash — BPI Savings",
		type: "asset",
		bankId: IDS.bpi,
		system: true
	},
	{
		id: IDS.cashMetro,
		code: "1020",
		name: "Cash — Metrobank Payroll",
		type: "asset",
		bankId: IDS.metro,
		system: true
	},
	{
		id: IDS.cashSafe,
		code: "1030",
		name: "Cash — Safekeeping",
		type: "asset",
		bankId: IDS.safe,
		system: true
	},
	{
		id: IDS.ar,
		code: "1200",
		name: "Accounts Receivable",
		type: "asset",
		system: true
	},
	{
		id: IDS.ap,
		code: "2000",
		name: "Accounts Payable",
		type: "liability",
		system: true
	},
	{
		id: IDS.equity,
		code: "3000",
		name: "Opening Balance Equity",
		type: "equity",
		system: true
	},
	{
		id: IDS.sales,
		code: "4000",
		name: "Sales & Service Income",
		type: "income",
		system: true
	},
	{
		id: IDS.opex,
		code: "5000",
		name: "Operating Expenses",
		type: "expense",
		system: true
	},
	{
		id: IDS.rent,
		code: "5200",
		name: "Rent",
		type: "expense",
		system: true
	},
	{
		id: IDS.payroll,
		code: "5300",
		name: "Payroll",
		type: "expense",
		system: true
	},
	{
		id: IDS.utilities,
		code: "5400",
		name: "Utilities",
		type: "expense",
		system: true
	},
	{
		id: IDS.fees,
		code: "5500",
		name: "Professional Fees",
		type: "expense",
		system: true
	},
	{
		id: IDS.misc,
		code: "5900",
		name: "Miscellaneous",
		type: "expense",
		system: true
	}
];
var SAMPLE_COMPANY_ID = "co-pacific-harbor";
/** Sample books are a live 2026 year as of this date. */
var AS_OF = "2026-08-30";
function P(pesos) {
	return Math.round(pesos * 100);
}
function d(month, day) {
	return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function addDays$1(iso, days) {
	const [y, m, day] = iso.split("-").map(Number);
	const dt = new Date(y, m - 1, day + days);
	return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function monthName(iso) {
	return format(parseISO(iso), "MMMM");
}
function cashAccount(bankId) {
	if (bankId === IDS.bdo) return IDS.cashBdo;
	if (bankId === IDS.bpi) return IDS.cashBpi;
	if (bankId === IDS.metro) return IDS.cashMetro;
	return IDS.cashSafe;
}
function checkStatus(postDate) {
	return postDate <= AS_OF ? "cleared" : "pending";
}
function emptyBooks() {
	return {
		settings: { ...DEFAULT_SETTINGS },
		banks: [],
		accounts: SYSTEM_ACCOUNTS.filter((a) => !a.bankId),
		customers: [],
		vendors: [],
		invoices: [],
		bills: [],
		receipts: [],
		checks: [],
		journals: [],
		budgetItems: [],
		nextNumbers: {
			invoice: 1,
			check: {},
			receipt: 1,
			bill: 1
		}
	};
}
function createSeed() {
	const banks = [
		{
			id: IDS.bdo,
			name: "BDO Unibank",
			nickname: "Operating",
			accountNumber: "•••• 4821",
			openingBalance: P(34e5),
			accountId: IDS.cashBdo,
			archived: false
		},
		{
			id: IDS.bpi,
			name: "Bank of the Philippine Islands",
			nickname: "Reserve",
			accountNumber: "•••• 1190",
			openingBalance: P(486250),
			accountId: IDS.cashBpi,
			archived: false
		},
		{
			id: IDS.metro,
			name: "Metrobank",
			nickname: "Payroll",
			accountNumber: "•••• 7734",
			openingBalance: P(38e4),
			accountId: IDS.cashMetro,
			archived: false
		},
		{
			id: IDS.safe,
			name: "Undeposited funds",
			nickname: "Safekeeping",
			accountNumber: "On hand",
			openingBalance: 0,
			accountId: IDS.cashSafe,
			archived: false
		}
	];
	const customers = [
		{
			id: IDS.custLaguna,
			name: "Laguna Foods Inc.",
			contact: "Rina Velasco",
			email: "ap@lagunafoods.ph",
			phone: "+63 49 555 0188",
			address: "Brgy. Banlic, Cabuyao, Laguna",
			terms: "Net 30",
			notes: "Preferred delivery Tuesday mornings.",
			sortOrder: 0
		},
		{
			id: IDS.custCebu,
			name: "Cebu Marine Supply",
			contact: "Paolo Tan",
			email: "paolo@cebumarine.ph",
			phone: "+63 32 555 4410",
			address: "Mandaue City, Cebu",
			terms: "Net 15",
			notes: "",
			sortOrder: 1
		},
		{
			id: IDS.custMetro,
			name: "Metro Clinic Group",
			contact: "Dr. Elena Cruz",
			email: "billing@metroclinic.ph",
			phone: "+63 2 8888 2200",
			address: "Ortigas Center, Pasig",
			terms: "Net 30",
			notes: "Send statements to billing desk.",
			sortOrder: 2
		},
		{
			id: IDS.custDavao,
			name: "Davao Harvest Co.",
			contact: "Miguel Santos",
			email: "miguel@davaoharvest.ph",
			phone: "+63 82 555 9091",
			address: "Toril, Davao City",
			terms: "Due on receipt",
			notes: "",
			sortOrder: 3
		}
	];
	const vendors = [
		{
			id: IDS.vendAyala,
			name: "Ayala Land",
			contact: "Lease desk",
			email: "ar@ayalaland.com.ph",
			phone: "+63 2 7908 3000",
			address: "Makati CBD",
			terms: "Due on the 5th",
			notes: "Warehouse lease — Harbor Point.",
			accountNumber: "AL-4412",
			sortOrder: 0
		},
		{
			id: IDS.vendMeralco,
			name: "Meralco",
			contact: "Business center",
			email: "business@meralco.com.ph",
			phone: "+63 2 16211",
			address: "Ortigas, Pasig",
			terms: "Due on receipt",
			notes: "",
			accountNumber: "M-773401",
			sortOrder: 1
		},
		{
			id: IDS.vendSantos,
			name: "Santos & Co. CPAs",
			contact: "Atty. Liza Santos",
			email: "liza@santosco.ph",
			phone: "+63 2 8812 4400",
			address: "Salcedo Village, Makati",
			terms: "Net 15",
			notes: "Quarterly review.",
			accountNumber: "SC-2026",
			sortOrder: 2
		},
		{
			id: IDS.vendDelta,
			name: "Delta Freight Lines",
			contact: "Dispatch",
			email: "billing@deltafreight.ph",
			phone: "+63 2 8555 0190",
			address: "Parañaque",
			terms: "Net 30",
			notes: "Southbound hauling.",
			accountNumber: "DFL-2201",
			sortOrder: 3
		},
		{
			id: IDS.vendHarbor,
			name: "Harbor Packaging Co.",
			contact: "Nina Reyes",
			email: "nina@harborpack.ph",
			phone: "+63 2 8800 2291",
			address: "Las Piñas",
			terms: "Net 15",
			notes: "Cartons and tape.",
			accountNumber: "HP-18",
			sortOrder: 4
		}
	];
	const journals = [];
	const invoices = [];
	const bills = [];
	const receipts = [];
	const checks = [];
	const checkNext = {
		[IDS.bdo]: 4401,
		[IDS.bpi]: 2201,
		[IDS.metro]: 1101,
		[IDS.safe]: 1
	};
	let invoiceN = 1;
	let receiptN = 1;
	let billN = 1;
	function post(input, id) {
		const entry = {
			...makeJournal(input),
			id
		};
		journals.push(entry);
		return entry;
	}
	function addCheck(input) {
		const id = `chk-${input.bankId}-${checkNext[input.bankId]}`;
		const checkNumber = String(checkNext[input.bankId]++);
		const journalId = `j-${id}`;
		post({
			date: input.issueDate,
			description: `Check ${checkNumber} — ${input.payee}`,
			sourceType: "check",
			sourceId: id,
			lines: [{
				accountId: input.accountId,
				debit: input.amount,
				credit: 0,
				memo: input.memo
			}, {
				accountId: cashAccount(input.bankId),
				debit: 0,
				credit: input.amount
			}]
		}, journalId);
		checks.push({
			id,
			bankId: input.bankId,
			checkNumber,
			payee: input.payee,
			issueDate: input.issueDate,
			postDate: input.postDate,
			amount: input.amount,
			status: checkStatus(input.postDate),
			memo: input.memo,
			accountId: input.accountId,
			journalId,
			vendorId: input.vendorId
		});
	}
	function addInvoice(input) {
		const n = invoiceN++;
		const id = `inv-${n}`;
		const number = `INV-2026-${String(n).padStart(3, "0")}`;
		const customer = customers.find((c) => c.id === input.customerId);
		const total = input.lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0);
		const journalId = `j-${id}`;
		post({
			date: input.date,
			description: `Invoice ${number} — ${customer?.name ?? ""}`,
			sourceType: "invoice",
			sourceId: id,
			lines: [{
				accountId: IDS.ar,
				debit: total,
				credit: 0
			}, {
				accountId: IDS.sales,
				debit: 0,
				credit: total
			}]
		}, journalId);
		const payments = [];
		let paidCents = 0;
		for (const [i, pay] of (input.paid ?? []).entries()) {
			if (pay.date > AS_OF) continue;
			const paymentId = `pay-${id}-${i + 1}`;
			const payJournal = `j-${paymentId}`;
			const method = pay.method ?? "cash";
			post({
				date: pay.date,
				description: `Payment ${number} — ${customer?.name ?? ""}`,
				sourceType: "payment",
				sourceId: paymentId,
				lines: [{
					accountId: cashAccount(pay.bankId),
					debit: pay.amount,
					credit: 0
				}, {
					accountId: IDS.ar,
					debit: 0,
					credit: pay.amount
				}]
			}, payJournal);
			payments.push({
				id: paymentId,
				date: pay.date,
				amount: pay.amount,
				bankId: pay.bankId,
				journalId: payJournal
			});
			const rcptId = `rcpt-${paymentId}`;
			receipts.push({
				id: rcptId,
				number: `RCPT-2026-${String(receiptN++).padStart(3, "0")}`,
				date: pay.date,
				kind: "payment",
				method,
				checkNumber: pay.checkNumber ?? "",
				customerId: input.customerId,
				receivedFrom: customer?.name ?? "",
				bankId: pay.bankId,
				lines: [],
				invoiceId: id,
				paymentId,
				amount: pay.amount,
				taxRate: 0,
				status: "posted",
				memo: `Payment ${number}`,
				journalId: payJournal,
				sortOrder: receipts.length
			});
			paidCents += pay.amount;
		}
		const status = paidCents <= 0 ? "sent" : paidCents >= total ? "paid" : "partial";
		invoices.push({
			id,
			number,
			customerId: input.customerId,
			date: input.date,
			dueDate: input.dueDate,
			lines: input.lines.map((l, i) => ({
				...l,
				id: `${id}-l${i + 1}`
			})),
			taxRate: 0,
			status,
			notes: input.notes,
			payments,
			journalId
		});
	}
	function addCashSale(input) {
		const id = `rcpt-sale-${receiptN}`;
		const number = `RCPT-2026-${String(receiptN++).padStart(3, "0")}`;
		const journalId = `j-${id}`;
		const method = input.method ?? "cash";
		post({
			date: input.date,
			description: `Receipt ${number} — ${input.receivedFrom}`,
			sourceType: "receipt",
			sourceId: id,
			lines: [{
				accountId: cashAccount(input.bankId),
				debit: input.amount,
				credit: 0
			}, {
				accountId: IDS.sales,
				debit: 0,
				credit: input.amount
			}]
		}, journalId);
		receipts.push({
			id,
			number,
			date: input.date,
			kind: "cash-sale",
			method,
			checkNumber: input.checkNumber ?? "",
			customerId: input.customerId,
			receivedFrom: input.receivedFrom,
			bankId: input.bankId,
			lines: [{
				id: `${id}-l1`,
				description: input.description,
				quantity: 1,
				unitPrice: input.amount
			}],
			amount: input.amount,
			taxRate: 0,
			status: "posted",
			memo: input.memo,
			journalId,
			sortOrder: receipts.length
		});
	}
	function addBill(input) {
		const n = billN++;
		const id = `bill-${n}`;
		const number = `BILL-2026-${String(n).padStart(3, "0")}`;
		const vendor = vendors.find((v) => v.id === input.vendorId);
		const journalId = `j-${id}`;
		post({
			date: input.date,
			description: `Bill ${number} — ${vendor?.name ?? ""}`,
			sourceType: "bill",
			sourceId: id,
			lines: [{
				accountId: input.accountId,
				debit: input.amount,
				credit: 0,
				memo: input.memo
			}, {
				accountId: IDS.ap,
				debit: 0,
				credit: input.amount
			}]
		}, journalId);
		const payments = [];
		let status = "open";
		if (input.paid && input.paid.date <= AS_OF) {
			const paymentId = `bp-${id}`;
			const payJournal = `j-${paymentId}`;
			post({
				date: input.paid.date,
				description: `Payment ${number} — ${vendor?.name ?? ""}`,
				sourceType: "bill-payment",
				sourceId: paymentId,
				lines: [{
					accountId: IDS.ap,
					debit: input.amount,
					credit: 0
				}, {
					accountId: cashAccount(input.paid.bankId),
					debit: 0,
					credit: input.amount
				}]
			}, payJournal);
			payments.push({
				id: paymentId,
				date: input.paid.date,
				amount: input.amount,
				bankId: input.paid.bankId,
				journalId: payJournal
			});
			status = "paid";
		}
		bills.push({
			id,
			number,
			vendorId: input.vendorId,
			date: input.date,
			dueDate: input.dueDate,
			amount: input.amount,
			accountId: input.accountId,
			status,
			memo: input.memo,
			reference: input.reference,
			payments,
			journalId,
			sortOrder: bills.length
		});
	}
	function addTransfer(date, amount, from, to, memo) {
		const id = `xfer-${date}`;
		post({
			date,
			description: memo,
			sourceType: "transfer",
			sourceId: id,
			lines: [{
				accountId: cashAccount(to),
				debit: amount,
				credit: 0
			}, {
				accountId: cashAccount(from),
				debit: 0,
				credit: amount
			}]
		}, `j-${id}`);
	}
	post({
		date: "2026-01-01",
		description: "Opening balances",
		sourceType: "opening",
		sourceId: "opening",
		lines: [
			{
				accountId: IDS.cashBdo,
				debit: P(34e5),
				credit: 0
			},
			{
				accountId: IDS.cashBpi,
				debit: P(486250),
				credit: 0
			},
			{
				accountId: IDS.cashMetro,
				debit: P(38e4),
				credit: 0
			},
			{
				accountId: IDS.equity,
				debit: 0,
				credit: P(4266250)
			}
		]
	}, "j-opening");
	const power = [
		17820,
		16440,
		19100,
		18640,
		21300,
		19880,
		20050,
		18640,
		19220,
		18400,
		17650,
		22100
	];
	const laguna = [
		172800,
		168400,
		191200,
		175e3,
		188600,
		179200,
		194e3,
		186400,
		181500,
		176800,
		198200,
		162400
	];
	for (let m = 1; m <= 12; m++) {
		addCheck({
			bankId: IDS.bdo,
			payee: "Ayala Land — Warehouse rent",
			vendorId: IDS.vendAyala,
			issueDate: d(m, 1),
			postDate: d(m, 5),
			amount: P(85e3),
			memo: `${monthName(d(m, 1))} warehouse`,
			accountId: IDS.rent
		});
		addCheck({
			bankId: IDS.metro,
			payee: `Staff payroll — 1st half ${monthName(d(m, 1))}`,
			issueDate: d(m, 13),
			postDate: d(m, 14),
			amount: P(126400),
			memo: "Semi-monthly payroll",
			accountId: IDS.payroll
		});
		addCheck({
			bankId: IDS.metro,
			payee: `Staff payroll — 2nd half ${monthName(d(m, 1))}`,
			issueDate: d(m, 27),
			postDate: d(m, 28),
			amount: P(126400),
			memo: "Semi-monthly payroll",
			accountId: IDS.payroll
		});
		addCheck({
			bankId: IDS.bdo,
			payee: "Meralco",
			vendorId: IDS.vendMeralco,
			issueDate: d(m, 22),
			postDate: d(m, 28),
			amount: P(power[m - 1]),
			memo: `${monthName(d(m, 1))} warehouse power`,
			accountId: IDS.utilities
		});
	}
	addCheck({
		bankId: IDS.metro,
		payee: "Staff payroll — 13th month",
		issueDate: d(12, 12),
		postDate: d(12, 15),
		amount: P(252800),
		memo: "13th month pay (PD 851)",
		accountId: IDS.payroll
	});
	for (let m = 1; m <= 12; m++) addTransfer(d(m, 8), P(m >= 11 ? 28e4 : 255e3), IDS.bdo, IDS.metro, "Transfer Operating → Payroll");
	addTransfer(d(12, 5), P(26e4), IDS.bdo, IDS.metro, "Transfer Operating → Payroll (13th month)");
	for (let m = 1; m <= 12; m++) {
		const date = d(m, 8);
		const dueDate = addDays$1(date, 30);
		const payDate = addDays$1(date, 22);
		addInvoice({
			customerId: IDS.custLaguna,
			date,
			dueDate,
			lines: [{
				description: `Dry goods — ${monthName(date)} allocation`,
				quantity: 1,
				unitPrice: P(laguna[m - 1])
			}],
			notes: "",
			paid: payDate < AS_OF ? [{
				date: payDate,
				amount: P(laguna[m - 1]),
				bankId: m % 3 === 2 ? IDS.bpi : IDS.bdo,
				method: m % 2 === 0 ? "check" : "cash",
				checkNumber: m % 2 === 0 ? String(1040 + m) : ""
			}] : void 0
		});
	}
	addInvoice({
		customerId: IDS.custCebu,
		date: d(2, 12),
		dueDate: d(2, 27),
		lines: [{
			description: "Marine fittings lot 8",
			quantity: 10,
			unitPrice: P(7460)
		}, {
			description: "Freight to Mandaue",
			quantity: 1,
			unitPrice: P(4e3)
		}],
		notes: "",
		paid: [{
			date: d(2, 28),
			amount: P(78600),
			bankId: IDS.bdo,
			method: "check",
			checkNumber: "2188"
		}]
	});
	addInvoice({
		customerId: IDS.custCebu,
		date: d(4, 22),
		dueDate: d(5, 7),
		lines: [{
			description: "Marine fittings lot 11",
			quantity: 12,
			unitPrice: P(8200)
		}, {
			description: "Freight to Mandaue",
			quantity: 1,
			unitPrice: P(4e3)
		}],
		notes: "",
		paid: [{
			date: d(5, 6),
			amount: P(102400),
			bankId: IDS.bdo,
			method: "card",
			checkNumber: "4412"
		}]
	});
	addInvoice({
		customerId: IDS.custCebu,
		date: d(6, 25),
		dueDate: d(7, 10),
		lines: [{
			description: "Marine fittings lot 13",
			quantity: 9,
			unitPrice: P(9200)
		}, {
			description: "Freight to Mandaue",
			quantity: 1,
			unitPrice: P(9e3)
		}],
		notes: "",
		paid: [{
			date: d(7, 9),
			amount: P(91800),
			bankId: IDS.bpi,
			method: "check",
			checkNumber: "2204"
		}]
	});
	addInvoice({
		customerId: IDS.custCebu,
		date: d(8, 4),
		dueDate: d(8, 19),
		lines: [{
			description: "Marine fittings lot 14",
			quantity: 12,
			unitPrice: P(8750)
		}, {
			description: "Freight to Mandaue",
			quantity: 1,
			unitPrice: P(4200)
		}],
		notes: "Awaiting confirmation of berth schedule."
	});
	addInvoice({
		customerId: IDS.custCebu,
		date: d(10, 8),
		dueDate: d(10, 23),
		lines: [{
			description: "Marine fittings lot 16 (booked)",
			quantity: 11,
			unitPrice: P(8900)
		}, {
			description: "Freight to Mandaue",
			quantity: 1,
			unitPrice: P(4200)
		}],
		notes: "October berth — confirmed."
	});
	addInvoice({
		customerId: IDS.custMetro,
		date: d(1, 10),
		dueDate: d(2, 9),
		lines: [{
			description: "Clinic supplies — Q1 retainer",
			quantity: 1,
			unitPrice: P(96e3)
		}],
		notes: "",
		paid: [{
			date: d(2, 5),
			amount: P(96e3),
			bankId: IDS.bdo,
			method: "check",
			checkNumber: "3301"
		}]
	});
	addInvoice({
		customerId: IDS.custMetro,
		date: d(4, 10),
		dueDate: d(5, 10),
		lines: [{
			description: "Clinic supplies — Q2 retainer",
			quantity: 1,
			unitPrice: P(96e3)
		}],
		notes: "",
		paid: [{
			date: d(5, 8),
			amount: P(96e3),
			bankId: IDS.bdo,
			method: "check",
			checkNumber: "3308"
		}]
	});
	addInvoice({
		customerId: IDS.custMetro,
		date: d(7, 10),
		dueDate: d(8, 9),
		lines: [{
			description: "Clinic supplies — Q3 retainer",
			quantity: 1,
			unitPrice: P(96e3)
		}],
		notes: "",
		paid: [{
			date: d(8, 12),
			amount: P(96e3),
			bankId: IDS.bdo,
			method: "check",
			checkNumber: "3312"
		}]
	});
	addInvoice({
		customerId: IDS.custMetro,
		date: d(10, 10),
		dueDate: d(11, 9),
		lines: [{
			description: "Clinic supplies — Q4 retainer",
			quantity: 1,
			unitPrice: P(96e3)
		}],
		notes: "Send to billing desk."
	});
	addInvoice({
		customerId: IDS.custDavao,
		date: d(3, 20),
		dueDate: d(3, 20),
		lines: [{
			description: "Harvest crates (650 pcs)",
			quantity: 650,
			unitPrice: P(180)
		}, {
			description: "Label printing",
			quantity: 1,
			unitPrice: P(7500)
		}],
		notes: "",
		paid: [{
			date: d(3, 20),
			amount: P(62250),
			bankId: IDS.bpi,
			method: "cash"
		}, {
			date: d(4, 10),
			amount: P(62250),
			bankId: IDS.bpi,
			method: "check",
			checkNumber: "5510"
		}]
	});
	addInvoice({
		customerId: IDS.custDavao,
		date: d(6, 18),
		dueDate: d(6, 18),
		lines: [{
			description: "Harvest crates (800 pcs)",
			quantity: 800,
			unitPrice: P(185)
		}, {
			description: "Label printing",
			quantity: 1,
			unitPrice: P(8e3)
		}],
		notes: "",
		paid: [{
			date: d(7, 8),
			amount: P(156e3),
			bankId: IDS.bpi,
			method: "check",
			checkNumber: "5522"
		}]
	});
	addInvoice({
		customerId: IDS.custDavao,
		date: d(8, 18),
		dueDate: d(9, 2),
		lines: [{
			description: "Harvest crates (500 pcs)",
			quantity: 500,
			unitPrice: P(185)
		}, {
			description: "Label printing",
			quantity: 1,
			unitPrice: P(6800)
		}],
		notes: "50% deposit received.",
		paid: [{
			date: d(8, 18),
			amount: P(49650),
			bankId: IDS.bpi,
			method: "cash"
		}]
	});
	addInvoice({
		customerId: IDS.custDavao,
		date: d(11, 14),
		dueDate: d(11, 14),
		lines: [{
			description: "Harvest crates (720 pcs)",
			quantity: 720,
			unitPrice: P(190)
		}, {
			description: "Label printing",
			quantity: 1,
			unitPrice: P(8400)
		}],
		notes: "Peak harvest window."
	});
	addCashSale({
		date: d(1, 16),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.bdo,
		description: "Counter sale — dry goods",
		amount: P(9800),
		memo: "Same-day cash."
	});
	addCashSale({
		date: d(2, 21),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.bdo,
		description: "Counter sale — hardware",
		amount: P(11200),
		memo: "Same-day cash."
	});
	addCashSale({
		date: d(4, 18),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.safe,
		description: "Counter sale — tape and film",
		amount: P(8450),
		memo: "Held in safekeeping."
	});
	addCashSale({
		date: d(5, 27),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.bdo,
		description: "Counter sale — dry goods",
		amount: P(13100),
		memo: "Same-day cash."
	});
	addCashSale({
		date: d(7, 23),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.bdo,
		description: "Counter sale — mixed",
		amount: P(10600),
		memo: "Same-day cash."
	});
	addCashSale({
		date: d(8, 21),
		receivedFrom: "Walk-in — Harbor stall",
		bankId: IDS.bdo,
		description: "Counter sale — dry goods",
		amount: P(12400),
		memo: "Same-day cash."
	});
	addCashSale({
		date: d(8, 27),
		receivedFrom: "Cebu Marine Supply",
		customerId: IDS.custCebu,
		bankId: IDS.safe,
		description: "Walk-up fittings",
		amount: P(8750),
		method: "check",
		checkNumber: "2208",
		memo: "Paid at the counter."
	});
	addCashSale({
		date: d(12, 19),
		receivedFrom: "Walk-in — Christmas bazaar",
		bankId: IDS.bdo,
		description: "Bazaar counter sale",
		amount: P(24800),
		memo: "Harbor Point Christmas market."
	});
	addBill({
		vendorId: IDS.vendHarbor,
		date: d(2, 18),
		dueDate: d(3, 5),
		amount: P(14200),
		accountId: IDS.opex,
		memo: "Cartons and tape — February",
		reference: "HP-7710",
		paid: {
			date: d(3, 3),
			bankId: IDS.bdo
		}
	});
	addBill({
		vendorId: IDS.vendHarbor,
		date: d(5, 20),
		dueDate: d(6, 4),
		amount: P(16800),
		accountId: IDS.opex,
		memo: "Cartons and tape — May",
		reference: "HP-8022",
		paid: {
			date: d(6, 5),
			bankId: IDS.bdo
		}
	});
	addBill({
		vendorId: IDS.vendHarbor,
		date: d(7, 29),
		dueDate: d(8, 13),
		amount: P(15400),
		accountId: IDS.opex,
		memo: "Cartons and tape — July",
		reference: "HP-8410",
		paid: {
			date: d(8, 14),
			bankId: IDS.bdo
		}
	});
	addBill({
		vendorId: IDS.vendHarbor,
		date: d(8, 24),
		dueDate: d(9, 5),
		amount: P(18500),
		accountId: IDS.opex,
		memo: "Cartons and tape — August",
		reference: "HP-8841"
	});
	addBill({
		vendorId: IDS.vendHarbor,
		date: d(11, 18),
		dueDate: d(12, 3),
		amount: P(21200),
		accountId: IDS.opex,
		memo: "Cartons and tape — peak harvest",
		reference: "HP-9104"
	});
	addBill({
		vendorId: IDS.vendSantos,
		date: d(3, 28),
		dueDate: d(4, 12),
		amount: P(22e3),
		accountId: IDS.fees,
		memo: "Q1 bookkeeping retainer",
		reference: "SC-Q1",
		paid: {
			date: d(4, 12),
			bankId: IDS.bdo
		}
	});
	addBill({
		vendorId: IDS.vendSantos,
		date: d(6, 27),
		dueDate: d(7, 12),
		amount: P(22e3),
		accountId: IDS.fees,
		memo: "Q2 bookkeeping retainer",
		reference: "SC-Q2",
		paid: {
			date: d(7, 11),
			bankId: IDS.bdo
		}
	});
	addBill({
		vendorId: IDS.vendSantos,
		date: d(8, 26),
		dueDate: d(9, 10),
		amount: P(22e3),
		accountId: IDS.fees,
		memo: "Q3 bookkeeping retainer",
		reference: "SC-Q3"
	});
	addBill({
		vendorId: IDS.vendSantos,
		date: d(11, 26),
		dueDate: d(12, 11),
		amount: P(28e3),
		accountId: IDS.fees,
		memo: "Q4 review + year-end pack",
		reference: "SC-Q4"
	});
	addBill({
		vendorId: IDS.vendDelta,
		date: d(3, 21),
		dueDate: d(4, 20),
		amount: P(18400),
		accountId: IDS.opex,
		memo: "Southbound hauling — Davao March",
		reference: "DFL-310",
		paid: {
			date: d(4, 8),
			bankId: IDS.bpi
		}
	});
	addBill({
		vendorId: IDS.vendDelta,
		date: d(6, 19),
		dueDate: d(7, 19),
		amount: P(24800),
		accountId: IDS.opex,
		memo: "Southbound hauling — Davao June",
		reference: "DFL-618",
		paid: {
			date: d(7, 9),
			bankId: IDS.bpi
		}
	});
	addBill({
		vendorId: IDS.vendDelta,
		date: d(8, 19),
		dueDate: d(9, 18),
		amount: P(22150),
		accountId: IDS.opex,
		memo: "Southbound hauling — Davao August",
		reference: "DFL-818"
	});
	addBill({
		vendorId: IDS.vendDelta,
		date: d(11, 15),
		dueDate: d(12, 15),
		amount: P(26400),
		accountId: IDS.opex,
		memo: "Southbound hauling — Davao November",
		reference: "DFL-1114"
	});
	const budgetItems = [
		{
			id: "bud-rent",
			name: "Warehouse rent",
			kind: "outflow",
			amount: P(85e3),
			cadence: "monthly",
			startMonth: "2026-01",
			accountId: IDS.rent
		},
		{
			id: "bud-pay",
			name: "Payroll",
			kind: "outflow",
			amount: P(252800),
			cadence: "monthly",
			startMonth: "2026-01",
			accountId: IDS.payroll
		},
		{
			id: "bud-util",
			name: "Utilities",
			kind: "outflow",
			amount: P(19500),
			cadence: "monthly",
			startMonth: "2026-01",
			accountId: IDS.utilities
		},
		{
			id: "bud-sales",
			name: "Trade sales",
			kind: "inflow",
			amount: P(42e4),
			cadence: "monthly",
			startMonth: "2026-01",
			accountId: IDS.sales
		}
	];
	return {
		settings: {
			...DEFAULT_SETTINGS,
			companyName: "Pacific Harbor Trading",
			companyAddress: "Unit 12, Harbor Point, Las Piñas, Metro Manila",
			companyPhone: "+63 2 8800 4410",
			companyEmail: "treasury@pacificharbor.ph"
		},
		banks,
		accounts: SYSTEM_ACCOUNTS,
		customers,
		vendors,
		invoices,
		bills,
		receipts,
		checks,
		journals,
		budgetItems,
		nextNumbers: {
			invoice: invoiceN,
			check: checkNext,
			receipt: receiptN,
			bill: billN
		}
	};
}
var DB_NAME = "finance-manager";
var STORE = "kv";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("IndexedDB failed"));
	});
}
function idbOp(mode, fn) {
	return openDb().then((db) => new Promise((resolve, reject) => {
		const req = fn(db.transaction(STORE, mode).objectStore(STORE));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("IndexedDB request failed"));
	}));
}
/** IndexedDB first so a year of books can fit; falls back to localStorage for older snapshots. */
var booksStorage = {
	getItem: async (name) => {
		try {
			const value = await idbOp("readonly", (store) => store.get(name));
			if (typeof value === "string") return value;
		} catch {}
		try {
			return localStorage.getItem(name);
		} catch {
			return null;
		}
	},
	setItem: async (name, value) => {
		try {
			await idbOp("readwrite", (store) => store.put(value, name));
			try {
				localStorage.removeItem(name);
			} catch {}
		} catch {
			localStorage.setItem(name, value);
		}
	},
	removeItem: async (name) => {
		try {
			await idbOp("readwrite", (store) => store.delete(name));
		} catch {}
		try {
			localStorage.removeItem(name);
		} catch {}
	}
};
function sliceData(next) {
	return {
		settings: next.settings,
		banks: next.banks,
		accounts: next.accounts,
		customers: next.customers,
		vendors: next.vendors,
		invoices: next.invoices,
		bills: next.bills,
		receipts: next.receipts,
		checks: next.checks,
		journals: next.journals,
		budgetItems: next.budgetItems,
		nextNumbers: next.nextNumbers
	};
}
function packSeed() {
	return {
		companies: { [SAMPLE_COMPANY_ID]: createSeed() },
		companyOrder: [SAMPLE_COMPANY_ID],
		activeCompanyId: SAMPLE_COMPANY_ID
	};
}
function isLegacyBooks(raw) {
	return !!raw && typeof raw === "object" && "settings" in raw && "banks" in raw && !("companies" in raw);
}
function wrapLegacy(raw) {
	const books = normalizeBooks(raw);
	const id = books.settings.companyName === "Pacific Harbor Trading" ? SAMPLE_COMPANY_ID : newId();
	return {
		companies: { [id]: books },
		companyOrder: [id],
		activeCompanyId: id
	};
}
function migrateBooks(persisted, version) {
	if (version < 5 || isLegacyBooks(persisted)) {
		const wrapped = wrapLegacy(persisted);
		if (wrapped.companies["co-pacific-harbor"]) wrapped.companies[SAMPLE_COMPANY_ID] = createSeed();
		return wrapped;
	}
	const p = persisted ?? {};
	const companies = {};
	for (const [id, books] of Object.entries(p.companies ?? {})) companies[id] = normalizeBooks(books);
	if (Object.keys(companies).length === 0) return packSeed();
	const order = (p.companyOrder ?? Object.keys(companies)).filter((id) => companies[id]);
	for (const id of Object.keys(companies)) if (!order.includes(id)) order.push(id);
	if (version < 6 && companies["co-pacific-harbor"]) companies[SAMPLE_COMPANY_ID] = createSeed();
	return {
		companies,
		companyOrder: order,
		activeCompanyId: p.activeCompanyId && companies[p.activeCompanyId] ? p.activeCompanyId : order[0]
	};
}
var packed = packSeed();
var useFinanceStore = create()(persist((set, get) => {
	const apply = (fn) => {
		const s = get();
		const id = s.activeCompanyId;
		const current = s.companies[id] ?? emptyBooks();
		set({ companies: {
			...s.companies,
			[id]: sliceData(fn(current))
		} });
	};
	return {
		...packed,
		hydrated: false,
		hydrate: () => set({ hydrated: true }),
		patch: apply,
		resetDemo: () => {
			const s = get();
			const order = s.companyOrder.includes("co-pacific-harbor") ? s.companyOrder : [...s.companyOrder, SAMPLE_COMPANY_ID];
			set({
				companies: {
					...s.companies,
					[SAMPLE_COMPANY_ID]: createSeed()
				},
				companyOrder: order,
				activeCompanyId: SAMPLE_COMPANY_ID,
				hydrated: true,
				openRecord: null
			});
		},
		startFresh: () => {
			const s = get();
			const name = s.companies[s.activeCompanyId]?.settings.companyName ?? "Your Company";
			const books = emptyBooks();
			books.settings.companyName = name;
			set({
				companies: {
					...s.companies,
					[s.activeCompanyId]: books
				},
				hydrated: true,
				openRecord: null
			});
		},
		importBackup: (raw) => {
			const file = parseBackupFile(raw);
			if (file.type === "workspace") {
				set({
					companies: file.companies,
					companyOrder: file.companyOrder,
					activeCompanyId: file.activeCompanyId,
					hydrated: true,
					openRecord: null
				});
				return "workspace";
			}
			const s = get();
			set({
				companies: {
					...s.companies,
					[s.activeCompanyId]: file.data
				},
				hydrated: true,
				openRecord: null
			});
			return "company";
		},
		addCompany: (name) => {
			const id = newId();
			const books = emptyBooks();
			const trimmed = name.trim() || "Untitled company";
			books.settings.companyName = trimmed;
			const s = get();
			set({
				companies: {
					...s.companies,
					[id]: books
				},
				companyOrder: [...s.companyOrder, id],
				activeCompanyId: id,
				openRecord: null
			});
			return id;
		},
		switchCompany: (id) => {
			const s = get();
			if (!s.companies[id] || id === s.activeCompanyId) return;
			set({
				activeCompanyId: id,
				openRecord: null
			});
		},
		removeCompany: (id) => {
			const s = get();
			if (s.companyOrder.length < 2 || !s.companies[id]) return;
			const { [id]: _, ...rest } = s.companies;
			const order = s.companyOrder.filter((x) => x !== id);
			set({
				companies: rest,
				companyOrder: order,
				activeCompanyId: s.activeCompanyId === id ? order[0] : s.activeCompanyId,
				openRecord: null
			});
		},
		addBank: (input) => apply((d) => addBank(d, input)),
		updateBank: (id, patch) => apply((d) => updateBank(d, id, patch)),
		removeBank: (id) => apply((d) => removeBank(d, id)),
		addCustomer: (input) => apply((d) => addCustomer(d, input)),
		updateCustomer: (id, patch) => apply((d) => updateCustomer(d, id, patch)),
		removeCustomer: (id) => apply((d) => removeCustomer(d, id)),
		reorderCustomers: (ids) => apply((d) => reorderCustomers(d, ids)),
		addVendor: (input) => apply((d) => addVendor(d, input)),
		updateVendor: (id, patch) => apply((d) => updateVendor(d, id, patch)),
		removeVendor: (id) => apply((d) => removeVendor(d, id)),
		reorderVendors: (ids) => apply((d) => reorderVendors(d, ids)),
		issueCheck: (input) => apply((d) => issueCheck(d, input)),
		setCheckStatus: (id, status) => apply((d) => setCheckStatus(d, id, status)),
		removeCheck: (id) => apply((d) => removeCheck(d, id)),
		rescheduleCashLine: (input) => apply((d) => rescheduleCashLine(d, input)),
		createInvoice: (input) => apply((d) => createInvoice(d, input)),
		recordInvoicePayment: (input) => apply((d) => recordInvoicePayment(d, input)),
		applyCustomerPayments: (input) => apply((d) => applyCustomerPayments(d, input)),
		voidInvoice: (id) => apply((d) => voidInvoice(d, id)),
		removeInvoice: (id) => apply((d) => removeInvoice(d, id)),
		createCashSale: (input) => apply((d) => createCashSale(d, input)),
		voidReceipt: (id) => apply((d) => voidReceipt(d, id)),
		removeReceipt: (id) => apply((d) => removeReceipt(d, id)),
		reorderReceipts: (ids) => apply((d) => reorderReceipts(d, ids)),
		createBill: (input) => apply((d) => createBill(d, input)),
		payBill: (input) => apply((d) => payBill(d, input)),
		voidBill: (id) => apply((d) => voidBill(d, id)),
		removeBill: (id) => apply((d) => removeBill(d, id)),
		reorderBills: (ids) => apply((d) => reorderBills(d, ids)),
		removeCashLines: (lines) => apply((d) => removeCashLines(d, lines)),
		addDeposit: (input) => apply((d) => addDeposit(d, input)),
		addExpense: (input) => apply((d) => addExpense(d, input)),
		transferBanks: (input) => apply((d) => transferBanks(d, input)),
		upsertBudget: (item) => apply((d) => upsertBudget(d, item)),
		removeBudget: (id) => apply((d) => removeBudget(d, id)),
		updateSettings: (patch) => apply((d) => updateSettings(d, patch)),
		updateCheck: (id, patch) => apply((d) => updateCheck(d, id, patch)),
		updateReceipt: (id, patch) => apply((d) => updateReceipt(d, id, patch)),
		updateBillRecord: (id, patch) => apply((d) => updateBillRecord(d, id, patch)),
		updateJournalEntry: (id, patch) => apply((d) => updateJournalEntry(d, id, patch)),
		updateInvoiceRecord: (id, patch) => apply((d) => updateInvoiceRecord(d, id, patch)),
		reassignCashBank: (input) => apply((d) => reassignCashBank(d, input)),
		reassignCashBanks: (lines, bankId) => apply((d) => reassignCashBanks(d, lines, bankId)),
		purgeClosedThrough: (throughDate) => {
			const s = get();
			const id = s.activeCompanyId;
			const result = purgeClosedThrough(s.companies[id] ?? emptyBooks(), throughDate);
			set({ companies: {
				...s.companies,
				[id]: sliceData(result.data)
			} });
			return result.removed;
		},
		openRecord: null,
		openTxn: (kind, id) => set({ openRecord: {
			kind,
			id
		} }),
		closeTxn: () => set({ openRecord: null })
	};
}, {
	name: "finance-manager-v1",
	version: 6,
	storage: createJSONStorage(() => booksStorage),
	skipHydration: true,
	migrate: (persisted, version) => migrateBooks(persisted, version),
	partialize: (state) => ({
		companies: state.companies,
		companyOrder: state.companyOrder,
		activeCompanyId: state.activeCompanyId
	})
}));
function useFinanceData() {
	return useFinanceStore(useShallow((s) => sliceData(s.companies[s.activeCompanyId] ?? emptyBooks())));
}
//#endregion
export { receiptRows as $, downloadText as A, invoiceSubtotal as B, checkRegisterRows as C, customerRows as D, customerOpenBalance as E, formatMoney as F, methodRefLabel as G, invoiceTotal as H, formatShortDate as I, openPayables as J, monthLabel as K, incomeStatement as L, filterCashLines as M, filterDirection as N, datePresetRange as O, formatDate as P, pendingChecksTotal as Q, invoiceBalance as R, cashRegisterRows as S, currentMonth as T, ledgerRows as U, invoiceTax as V, methodNeedsReference as W, openingForBanks as X, openReceivables as Y, parseAmountToCents as Z, billRows as _, EMPTY_VENDOR as a, totalCash as at, cashCalendar as b, REGISTER_COLS as c, trialBalanceRows as ct, accountBalance as d, vendorOpenBalance as dt, rescheduleKind as et, addDaysIso as f, vendorRows as ft, billBalance as g, bankRows as h, workspaceBackupPayload as ht, EMPTY_CUSTOMER as i, toggleRegisterCol as it, exportCsv as j, deletableLines as k, REGISTER_COL_CLASS as l, useFinanceData as lt, bankBookBalance as m, withRunningBalance as mt, CURRENCIES as n, titleCase as nt, KIND_LABEL as o, totals as ot, backupPayload as p, withOpening as pt, movableLines as q, DEFAULT_REGISTER_COLS as r, todayIso as rt, PAYMENT_METHODS as s, trialBalance as st, Button as t, shiftMonth as tt, TYPE_FILTERS as u, useFinanceStore as ut, boardDates as v, cn as w, cashRegisterLines as x, cashBook as y, invoiceRows as z };
