import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as ArrowLeft, C as GripVertical, D as Download, F as Building2, I as BookOpen, L as BookMarked, M as Check, N as CalendarRange, P as CalendarDays, R as Banknote, S as Handshake, T as FileSpreadsheet, _ as Moon, a as Trash2, b as LayoutDashboard, c as Settings, d as Receipt, g as NotebookPen, h as PanelLeftClose, j as ChevronDown, l as Search, m as PanelLeftOpen, n as Wallet, o as Sun, p as Plus, r as Users, t as X, u as ScrollText, v as Minus, y as Menu } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as useShallow } from "../_libs/zustand.mjs";
import { $ as receiptRows, A as downloadText, C as checkRegisterRows, D as customerRows, E as customerOpenBalance, F as formatMoney, G as methodRefLabel, H as invoiceTotal, M as filterCashLines, P as formatDate, R as invoiceBalance, S as cashRegisterRows, U as ledgerRows, W as methodNeedsReference, Z as parseAmountToCents, _ as billRows, a as EMPTY_VENDOR, at as totalCash, ct as trialBalanceRows, dt as vendorOpenBalance, f as addDaysIso, ft as vendorRows, g as billBalance, h as bankRows, ht as workspaceBackupPayload, i as EMPTY_CUSTOMER, j as exportCsv, lt as useFinanceData, m as bankBookBalance, nt as titleCase$1, o as KIND_LABEL, p as backupPayload, rt as todayIso, s as PAYMENT_METHODS, t as Button, u as TYPE_FILTERS, ut as useFinanceStore, w as cn, x as cashRegisterLines, z as invoiceRows } from "./store-zEGD4c48.mjs";
import { d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useTheme, r as applyTheme } from "./router-WCYpLEBA.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { a as DialogOverlay$1, c as DialogTrigger, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as Root2, i as Portal2, n as Item2, o as Separator2, r as Label2, s as Trigger, t as Content2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { a as SelectItemIndicator, c as SelectTrigger$1, i as SelectItem$1, l as SelectValue$1, n as SelectContent$1, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select$1, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { i as Trigger$1, n as List, r as Root2$1, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-Dw047gD3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sheet = Dialog$1;
var SheetTrigger = DialogTrigger;
function SheetContent({ className, children, side = "left", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, { className: "fixed inset-0 z-50 bg-foreground/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed z-50 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground", side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 rounded-md p-2 text-muted-foreground hover:bg-accent",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
		className: cn("fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=closed]:animate-out", className),
		...props
	});
}
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg max-h-screen -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-card p-6 text-card-foreground elevation", "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 flex flex-col gap-1", className),
		...props
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("font-display text-xl font-medium tracking-tight", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		className: cn("text-sm text-muted-foreground", className),
		...props
	});
}
function DialogFooter({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
		...props
	});
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		sideOffset,
		className: cn("z-50 min-w-44 overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground elevation", className),
		...props
	}) });
}
function DropdownMenuItem({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
		className: cn("flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-accent", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
		...props
	});
}
function DropdownMenuLabel({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
		className: cn("px-3 py-2 text-xs font-medium text-muted-foreground", className),
		...props
	});
}
function DropdownMenuSeparator({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
		className: cn("-mx-1 my-1 h-px bg-border", className),
		...props
	});
}
function Input({ className, type, ref, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		type,
		className: cn("flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[box-shadow,border-color] duration-150", "placeholder:text-muted-foreground", "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30", "disabled:cursor-not-allowed disabled:opacity-50", "file:border-0 file:bg-transparent file:text-sm file:font-medium", className),
		...props
	});
}
function CompanySwitcher() {
	const { order, companies, activeId, switchCompany, addCompany } = useFinanceStore(useShallow((s) => ({
		order: s.companyOrder,
		companies: s.companies,
		activeId: s.activeCompanyId,
		switchCompany: s.switchCompany,
		addCompany: s.addCompany
	})));
	const [open, setOpen] = (0, import_react.useState)(false);
	const name = companies[activeId]?.settings.companyName ?? "Company";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex min-h-11 min-w-0 max-w-full items-center gap-1 rounded-md text-left hover:bg-accent",
			"aria-label": "Switch company",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm font-medium",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-muted-foreground",
					children: formatDate(todayIso())
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted-foreground" })]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "start",
		className: "min-w-56",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: "Companies" }),
			order.map((id) => {
				const label = companies[id]?.settings.companyName ?? "Company";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
					onClick: () => switchCompany(id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: cn("size-4", id === activeId ? "opacity-100" : "opacity-0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 truncate",
						children: [label, id === "co-pacific-harbor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: " · sample"
						}) : null]
					})]
				}, id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => setOpen(true),
				children: "New company"
			})
		]
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewCompanyDialog, {
		open,
		onClose: () => setOpen(false),
		onCreate: addCompany
	})] });
}
function NewCompanyDialog({ open, onClose, onCreate }) {
	const [name, setName] = (0, import_react.useState)("");
	function create() {
		if (onCreate(name)) toast.success("Blank books. Add a bank to begin.");
		setName("");
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "New company" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Starts a blank set of books. Pacific Harbor Trading stays as the sample you can switch back to." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: name,
				onChange: (e) => setName(e.target.value),
				placeholder: "Company name",
				"aria-label": "Company name",
				onKeyDown: (e) => {
					if (e.key === "Enter") create();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: onClose,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: create,
				disabled: !name.trim(),
				children: "Create"
			})] })
		] })
	});
}
function stamp() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function saveCsv(filename, rows) {
	exportCsv(filename, rows);
	toast.success("Downloaded CSV.");
}
function ExportMenu({ data }) {
	const workspace = useFinanceStore(useShallow((s) => ({
		companies: s.companies,
		companyOrder: s.companyOrder,
		activeCompanyId: s.activeCompanyId
	})));
	const day = stamp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Export"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: "Spreadsheets" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`ledger-${day}.csv`, ledgerRows(data)),
				children: "General ledger CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`trial-balance-${day}.csv`, trialBalanceRows(data)),
				children: "Trial balance CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`bank-register-${day}.csv`, cashRegisterRows(data)),
				children: "Bank register CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`checks-${day}.csv`, checkRegisterRows(data)),
				children: "Check register CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`invoices-${day}.csv`, invoiceRows(data)),
				children: "Invoices CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`customers-${day}.csv`, customerRows(data)),
				children: "Customers CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`vendors-${day}.csv`, vendorRows(data)),
				children: "Vendors CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`receipts-${day}.csv`, receiptRows(data)),
				children: "Receipts CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`bills-${day}.csv`, billRows(data)),
				children: "Bills CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => saveCsv(`banks-${day}.csv`, bankRows(data)),
				children: "Banks CSV"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: "Backup" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => {
					downloadText(`finance-manager-${day}.json`, workspaceBackupPayload(workspace), "application/json");
					toast.success("Downloaded backup.");
				},
				children: "All companies JSON"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				onClick: () => {
					downloadText(`finance-manager-company-${day}.json`, backupPayload(data), "application/json");
					toast.success("Downloaded this company.");
				},
				children: "This company JSON"
			})
		]
	})] });
}
function CsvButton({ filename, rows, label = "CSV" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		onClick: () => saveCsv(filename, rows),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), label]
	});
}
function Money({ amount, currency, signed = false, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("tabular-nums tracking-tight", signed ? amount < 0 ? "text-debit" : amount > 0 ? "text-credit" : "" : amount < 0 ? "text-debit" : "", className),
		children: formatMoney(amount, currency)
	});
}
var Select = Select$1;
var SelectValue = SelectValue$1;
function SelectTrigger({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
		className: cn("flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm outline-none", "focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted-foreground" })
		})]
	});
}
function SelectContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, {
		className: cn("z-50 max-h-72 min-w-40 overflow-hidden rounded-xl bg-popover text-popover-foreground elevation", className),
		position: "popper",
		sideOffset: 6,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: "p-1",
			children
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
		className: cn("relative flex w-full cursor-pointer items-center rounded-md py-2 pr-8 pl-3 text-sm outline-none", "focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, {
			className: "absolute right-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
		})]
	});
}
function openTxn(kind, id) {
	useFinanceStore.getState().openTxn(kind, id);
}
function openProps(kind, id, opts) {
	const click = Boolean(opts?.click);
	return {
		"data-open": "true",
		tabIndex: 0,
		title: click ? "Tap to open and edit" : "Double-click or press Enter to open",
		onClick: click ? (e) => {
			e.preventDefault();
			openTxn(kind, id);
		} : void 0,
		onDoubleClick: click ? void 0 : (e) => {
			e.preventDefault();
			openTxn(kind, id);
		},
		onKeyDown: (e) => {
			if (e.key !== "Enter" || e.currentTarget !== e.target) return;
			e.preventDefault();
			openTxn(kind, id);
		}
	};
}
function stopOpen(e) {
	e.stopPropagation();
}
function targetFromCashLine(line, data) {
	if (!line.sourceId || line.kind === "opening") return null;
	if (line.kind === "check") return {
		kind: "check",
		id: line.sourceId
	};
	if (line.kind === "receipt" || line.kind === "payment") return {
		kind: "receipt",
		id: line.sourceId
	};
	if (line.kind === "bill-payment") {
		const bill = data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId));
		return bill ? {
			kind: "bill",
			id: bill.id
		} : null;
	}
	return {
		kind: "journal",
		id: line.sourceId
	};
}
function openCashLine(line, data) {
	const target = targetFromCashLine(line, data);
	if (target) openTxn(target.kind, target.id);
}
/** Modifier chord for Find — Ctrl on Windows/Linux, ⌘ on Apple. */
function isApplePlatform() {
	if (typeof navigator === "undefined") return false;
	const platform = navigator.platform || "";
	const ua = navigator.userAgent || "";
	return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(ua);
}
function findShortcutLabel() {
	return isApplePlatform() ? "⌘K" : "Ctrl+K";
}
function FindTransaction({ open, onClose }) {
	const data = useFinanceData();
	const inputRef = (0, import_react.useRef)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("all");
	const [bankId, setBankId] = (0, import_react.useState)("all");
	(0, import_react.useEffect)(() => {
		if (open) {
			setQuery("");
			const id = window.setTimeout(() => inputRef.current?.focus(), 40);
			return () => window.clearTimeout(id);
		}
	}, [open]);
	const raw = (0, import_react.useMemo)(() => cashRegisterLines(data).filter((l) => l.kind !== "opening"), [data]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim();
		const byFields = filterCashLines(raw, {
			name: q,
			number: q,
			amount: q,
			type,
			bankId: bankId === "all" ? "" : bankId
		});
		if (!q) return byFields;
		const lower = q.toLowerCase().replace(/^#/, "");
		return raw.filter((line) => {
			if (type !== "all" && line.kind !== type) return false;
			if (bankId !== "all" && line.bankId !== bankId) return false;
			const bank = data.banks.find((b) => b.id === line.bankId)?.nickname ?? "";
			const hay = `${line.party} ${line.memo} ${line.number} ${KIND_LABEL[line.kind]} ${bank} ${line.date}`.toLowerCase();
			const cents = line.payment || line.deposit;
			return hay.includes(lower) || String(cents / 100).includes(lower.replace(/,/g, "")) || byFields.includes(line);
		});
	}, [
		raw,
		query,
		type,
		bankId,
		data.banks
	]);
	const results = query.trim() || type !== "all" || bankId !== "all" ? filtered : [...raw].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 12);
	function openLine(line) {
		openCashLine(line, data);
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-xl p-0 gap-0 overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
					className: "sr-only",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Find transaction" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Search checks, receipts, and payments." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 border-b border-border py-3 pr-12 pl-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						ref: inputRef,
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Find a payee, number, amount…",
						"aria-label": "Find transaction",
						className: "h-10 min-h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: type,
						onValueChange: (v) => setType(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 min-h-9",
							"aria-label": "Type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Type" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: TYPE_FILTERS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: opt.value,
							children: opt.label
						}, opt.value)) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: bankId,
						onValueChange: setBankId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 min-h-9",
							"aria-label": "Bank",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Bank" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "Any bank"
						}), data.banks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: b.id,
							children: b.nickname
						}, b.id))] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-80 overflow-y-auto border-t border-border",
					children: [results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-center text-sm text-muted-foreground",
						children: "No matching transactions."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: results.map((line) => {
						const bank = data.banks.find((b) => b.id === line.bankId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex w-full min-h-11 items-center gap-3 px-4 py-2 text-left hover:bg-accent",
							onClick: () => openLine(line),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-24 shrink-0 text-xs text-muted-foreground",
									children: formatDate(line.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate font-medium",
										children: line.party
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block truncate text-xs text-muted-foreground",
										children: [
											KIND_LABEL[line.kind],
											" ",
											line.number,
											" ",
											bank ? `· ${bank.nickname}` : ""
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 text-sm",
									children: line.payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: line.payment,
										currency: data.settings.currency,
										className: "text-debit"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
										amount: line.deposit,
										currency: data.settings.currency,
										className: "text-credit"
									})
								})
							]
						}) }, line.id);
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "px-4 py-2 text-xs text-muted-foreground",
						children: [query.trim() || type !== "all" || bankId !== "all" ? `${results.length} found` : "Recent", " · click to open"]
					})]
				})
			]
		})
	});
}
function FindButton({ onClick }) {
	const [chord, setChord] = (0, import_react.useState)("Ctrl+K");
	(0, import_react.useEffect)(() => {
		setChord(findShortcutLabel());
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		size: "icon",
		className: "sm:hidden",
		"aria-label": "Find transaction",
		onClick,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "hidden h-11 min-h-11 min-w-48 items-center gap-2 rounded-xl bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-left",
				children: "Find"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
				className: "rounded-sm bg-card px-1.5 py-0.5 text-xs font-medium",
				children: chord
			})
		]
	})] });
}
function ConfirmDelete({ open, title, body, confirmLabel = "Delete", requirePhrase, onClose, onConfirm }) {
	const [phrase, setPhrase] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (open) setPhrase("");
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: body })] }),
			requirePhrase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Type ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground",
							children: requirePhrase
						}),
						" to confirm."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: phrase,
					onChange: (e) => setPhrase(e.target.value),
					placeholder: requirePhrase,
					autoComplete: "off"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: onClose,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "destructive",
				disabled: !(!requirePhrase || phrase === requirePhrase),
				onClick: onConfirm,
				children: confirmLabel
			})] })
		] })
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		className: cn("text-sm font-medium text-foreground leading-none", className),
		...props
	});
}
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor,
			children: label
		}), children]
	});
}
function ShopTick({ checked, indeterminate, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "checkbox",
		"aria-checked": indeterminate ? "mixed" : checked,
		"aria-label": label,
		onClick: (e) => {
			e.stopPropagation();
			onChange(!checked);
		},
		onDoubleClick: (e) => e.stopPropagation(),
		className: cn("relative inline-flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors duration-150", "after:absolute after:top-1/2 after:left-1/2 after:size-9 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-xs", checked || Boolean(indeterminate) ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary/60"),
		children: indeterminate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3 stroke-[3]" }) : checked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 stroke-[3]" }) : null
	});
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-secondary text-secondary-foreground",
		pending: "bg-warning/10 text-warning",
		cleared: "bg-credit/10 text-credit",
		voided: "bg-muted text-muted-foreground",
		bounced: "bg-destructive/10 text-destructive",
		paid: "bg-credit/10 text-credit",
		sent: "bg-primary/10 text-primary",
		partial: "bg-warning/10 text-warning",
		draft: "bg-muted text-muted-foreground",
		overdue: "bg-destructive/10 text-destructive",
		internal: "bg-muted text-muted-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function titleCase(value) {
	return value.split(/[\s_-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}
function CheckBadge({ status }) {
	const label = {
		pending: "Pending",
		cleared: "Cleared",
		voided: "Voided",
		bounced: "Bounced"
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: status,
		children: label
	});
}
function InvoiceBadge({ status, overdue }) {
	if (overdue && (status === "sent" || status === "partial" || status === "draft")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "overdue",
		children: "Overdue"
	});
	const label = {
		draft: "Draft",
		sent: "Open",
		partial: "Partial",
		paid: "Paid",
		void: "Void"
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: status === "void" ? "voided" : status,
		children: label
	});
}
function BillBadge({ status, overdue }) {
	if (overdue && (status === "open" || status === "partial")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "overdue",
		children: "Overdue"
	});
	const label = {
		open: "Open",
		partial: "Partial",
		paid: "Paid",
		void: "Void"
	}[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: status === "open" ? "sent" : status === "void" ? "voided" : status,
		children: label
	});
}
function ReceiptBadge({ status, kind, method }) {
	if (status === "void") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "voided",
		children: "Void"
	});
	if (method === "check") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "cleared",
		children: "Check"
	});
	if (method === "card") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "sent",
		children: "Card"
	});
	if (method === "echeck") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "sent",
		children: "E-Check"
	});
	if (kind === "cash-sale") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "paid",
		children: "Cash Sale"
	});
	if (kind === "payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "sent",
		children: "On Account"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "cleared",
		children: "Posted"
	});
}
function StatusLabel({ status }) {
	if (!status) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: titleCase(status) });
}
function CustomerPayment({ receiptId, invoiceId, customerId: seedCustomerId, onClose, onBack }) {
	const data = useFinanceData();
	const updateReceipt = useFinanceStore((s) => s.updateReceipt);
	const applyCustomerPayments = useFinanceStore((s) => s.applyCustomerPayments);
	const voidReceipt = useFinanceStore((s) => s.voidReceipt);
	const removeReceipt = useFinanceStore((s) => s.removeReceipt);
	const receipt = receiptId ? data.receipts.find((r) => r.id === receiptId) : void 0;
	const seedInvoice = invoiceId ? data.invoices.find((i) => i.id === invoiceId) : void 0;
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [cardOpen, setCardOpen] = (0, import_react.useState)(false);
	const [card, setCard] = (0, import_react.useState)({
		number: "",
		exp: "",
		name: "",
		cvc: ""
	});
	const [form, setForm] = (0, import_react.useState)({
		customerId: "",
		receivedFrom: "",
		amount: "",
		date: todayIso(),
		bankId: data.banks.find((b) => !b.archived)?.id ?? "",
		method: "cash",
		checkNumber: "",
		memo: ""
	});
	const [applied, setApplied] = (0, import_react.useState)({});
	const [picked, setPicked] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (receiptId && !receipt) {
			onClose();
			return;
		}
		if (invoiceId && !seedInvoice) onClose();
	}, [
		receiptId,
		receipt,
		invoiceId,
		seedInvoice,
		onClose
	]);
	(0, import_react.useEffect)(() => {
		if (receipt) {
			setForm({
				customerId: receipt.customerId ?? "",
				receivedFrom: receipt.receivedFrom,
				amount: String(receipt.amount / 100),
				date: receipt.date,
				bankId: receipt.bankId,
				method: receipt.method,
				checkNumber: receipt.checkNumber,
				memo: receipt.memo
			});
			if (receipt.invoiceId) {
				setPicked([receipt.invoiceId]);
				setApplied({ [receipt.invoiceId]: String(receipt.amount / 100) });
			}
			return;
		}
		if (seedInvoice) {
			const due = invoiceBalance(data, seedInvoice.id);
			const customer = data.customers.find((c) => c.id === seedInvoice.customerId);
			setForm({
				customerId: seedInvoice.customerId,
				receivedFrom: customer?.name ?? seedInvoice.number,
				amount: String(due / 100),
				date: todayIso(),
				bankId: data.banks.find((b) => !b.archived)?.id ?? "",
				method: "cash",
				checkNumber: "",
				memo: `Payment ${seedInvoice.number}`
			});
			setPicked([seedInvoice.id]);
			setApplied({ [seedInvoice.id]: String(due / 100) });
			return;
		}
		if (seedCustomerId) {
			const customer = data.customers.find((c) => c.id === seedCustomerId);
			if (!customer) return;
			const invoices = data.invoices.filter((inv) => inv.customerId === seedCustomerId && (inv.status === "sent" || inv.status === "partial"));
			const dueMap = {};
			const ids = [];
			let total = 0;
			for (const inv of invoices) {
				const due = invoiceBalance(data, inv.id);
				if (due <= 0) continue;
				dueMap[inv.id] = String(due / 100);
				ids.push(inv.id);
				total += due;
			}
			setForm({
				customerId: seedCustomerId,
				receivedFrom: customer.name,
				amount: total ? String(total / 100) : "",
				date: todayIso(),
				bankId: data.banks.find((b) => !b.archived)?.id ?? "",
				method: "cash",
				checkNumber: "",
				memo: ""
			});
			setPicked(ids);
			setApplied(dueMap);
		}
	}, [
		receipt?.id,
		seedInvoice?.id,
		seedCustomerId
	]);
	const customerId = form.customerId;
	const customer = data.customers.find((c) => c.id === customerId);
	const openInvoices = (0, import_react.useMemo)(() => {
		return data.invoices.filter((inv) => {
			if (inv.status === "void" || inv.status === "draft") return false;
			if (customerId && inv.customerId !== customerId) return false;
			const due = invoiceBalance(data, inv.id);
			if (receipt?.invoiceId === inv.id) return true;
			return due > 0;
		}).sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
	}, [
		data,
		customerId,
		receipt
	]);
	const locked = receipt?.status === "void";
	const balance = customerId ? customerOpenBalance(data, customerId) : 0;
	const appliedTotal = picked.reduce((sum, id) => sum + (parseAmountToCents(applied[id] ?? "0") || 0), 0);
	const payAmount = parseAmountToCents(form.amount) || 0;
	const saleLines = receipt?.kind === "cash-sale" ? receipt.lines : [];
	function setMethod(method) {
		setForm((prev) => ({
			...prev,
			method
		}));
		if (method === "card") setCardOpen(true);
	}
	function chooseCustomer(id) {
		const next = data.customers.find((c) => c.id === id);
		setForm((prev) => ({
			...prev,
			customerId: id,
			receivedFrom: next?.name ?? prev.receivedFrom
		}));
		const invoices = data.invoices.filter((inv) => inv.customerId === id && (inv.status === "sent" || inv.status === "partial"));
		const dueMap = {};
		const ids = [];
		let left = parseAmountToCents(form.amount) || 0;
		for (const inv of invoices) {
			const due = invoiceBalance(data, inv.id);
			if (due <= 0 || left <= 0) continue;
			const take = Math.min(due, left);
			dueMap[inv.id] = String(take / 100);
			ids.push(inv.id);
			left -= take;
		}
		setApplied(dueMap);
		setPicked(ids);
	}
	function autoApply() {
		let left = parseAmountToCents(form.amount) || 0;
		const next = {};
		const ids = [];
		for (const inv of openInvoices) {
			const due = invoiceBalance(data, inv.id);
			if (due <= 0 || left <= 0) continue;
			const take = Math.min(due, left);
			next[inv.id] = String(take / 100);
			ids.push(inv.id);
			left -= take;
		}
		setApplied(next);
		setPicked(ids);
	}
	function toggleInvoice(id, on) {
		if (!openInvoices.find((i) => i.id === id)) return;
		if (!on) {
			setPicked((prev) => prev.filter((x) => x !== id));
			return;
		}
		const due = invoiceBalance(data, id);
		setPicked((prev) => prev.includes(id) ? prev : [...prev, id]);
		setApplied((prev) => ({
			...prev,
			[id]: prev[id] || String(due / 100)
		}));
	}
	function finishCard() {
		const digits = card.number.replace(/\D/g, "");
		if (digits.length < 4) {
			toast.error("Enter the card number, or tap Swipe card.");
			return;
		}
		const last4 = digits.slice(-4);
		setForm((prev) => ({
			...prev,
			method: "card",
			checkNumber: last4
		}));
		setCardOpen(false);
		toast.success(`Card •••• ${last4} ready.`);
	}
	function save() {
		if (locked) return;
		try {
			if (form.method === "card" && !form.checkNumber) {
				setCardOpen(true);
				return;
			}
			if (methodNeedsReference(form.method) && !form.checkNumber.trim()) throw new Error(`Enter the ${methodRefLabel(form.method).toLowerCase()}.`);
			if (receipt) {
				updateReceipt(receipt.id, {
					date: form.date,
					receivedFrom: form.receivedFrom,
					amount: payAmount || receipt.amount,
					memo: form.memo,
					method: form.method,
					checkNumber: form.checkNumber,
					bankId: form.bankId
				});
				const extra = picked.filter((id) => id !== receipt.invoiceId).map((id) => ({
					invoiceId: id,
					amount: parseAmountToCents(applied[id] ?? "0") || 0
				})).filter((a) => a.amount > 0);
				if (extra.length) applyCustomerPayments({
					date: form.date,
					bankId: form.bankId,
					memo: form.memo,
					method: form.method,
					checkNumber: form.checkNumber,
					applications: extra
				});
				toast.success("Payment saved.");
				onClose();
				return;
			}
			const applications = picked.map((id) => ({
				invoiceId: id,
				amount: parseAmountToCents(applied[id] ?? "0") || 0
			})).filter((a) => a.amount > 0);
			if (applications.length === 0) throw new Error("Tick at least one invoice to apply this payment.");
			applyCustomerPayments({
				date: form.date,
				bankId: form.bankId,
				memo: form.memo,
				method: form.method,
				checkNumber: form.checkNumber,
				applications
			});
			toast.success("Payment recorded.");
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save payment.");
		}
	}
	if (receiptId && !receipt) return null;
	if (invoiceId && !seedInvoice) return null;
	if (cardOpen) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xl font-medium tracking-tight",
				children: "Process credit card"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Card details stay on this screen. Only the last four digits are kept on the books."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-2xl font-medium tabular-nums",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
				amount: payAmount || appliedTotal,
				currency: data.settings.currency
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					onClick: () => setCard({
						number: "4242424242424242",
						exp: "12/28",
						name: form.receivedFrom || customer?.name || "",
						cvc: ""
					}),
					children: "Swipe card"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Card number",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: card.number,
						inputMode: "numeric",
						autoComplete: "off",
						placeholder: "•••• •••• •••• ••••",
						onChange: (e) => setCard({
							...card,
							number: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Expiration",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: card.exp,
							placeholder: "MM/YY",
							onChange: (e) => setCard({
								...card,
								exp: e.target.value
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Security code",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: card.cvc,
							inputMode: "numeric",
							autoComplete: "off",
							placeholder: "CVC",
							onChange: (e) => setCard({
								...card,
								cvc: e.target.value
							})
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Name on card",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: card.name,
						onChange: (e) => setCard({
							...card,
							name: e.target.value
						})
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setCardOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: finishCard,
				children: "Process payment"
			})]
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-medium tracking-tight",
				children: "Customer payment"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: receipt ? receipt.number : "Apply cash, check, or card to open invoices."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-left sm:text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Customer balance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: balance,
					currency: data.settings.currency,
					className: "text-lg font-medium"
				})]
			})]
		}),
		receipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBadge, {
			status: receipt.status,
			kind: receipt.kind,
			method: form.method
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-[1fr_auto]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Received from",
						children: data.customers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: customerId || "walkin",
							onValueChange: (v) => v === "walkin" ? setForm({
								...form,
								customerId: ""
							}) : chooseCustomer(v),
							disabled: locked,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Customer" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "walkin",
								children: form.receivedFrom || "Walk-in"
							}), data.customers.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c.id,
								children: c.name
							}, c.id))] })]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.receivedFrom,
							disabled: locked,
							onChange: (e) => setForm({
								...form,
								receivedFrom: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Payment amount",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.amount,
							disabled: locked,
							inputMode: "decimal",
							onChange: (e) => setForm({
								...form,
								amount: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Date",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: form.date,
							disabled: locked,
							onChange: (e) => setForm({
								...form,
								date: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: methodRefLabel(form.method),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.checkNumber,
							disabled: locked,
							placeholder: form.method === "card" ? "Last 4" : "Optional",
							onChange: (e) => setForm({
								...form,
								checkNumber: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Deposit to",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: form.bankId,
							onValueChange: (v) => setForm({
								...form,
								bankId: v
							}),
							disabled: locked,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: b.id,
								children: b.nickname
							}, b.id)) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Memo",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.memo,
							disabled: locked,
							onChange: (e) => setForm({
								...form,
								memo: e.target.value
							})
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-1 lg:w-36",
				children: PAYMENT_METHODS.map((opt) => {
					const Icon = opt.icon;
					const on = form.method === opt.value;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: locked,
						onClick: () => setMethod(opt.value),
						className: cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-medium transition-colors", on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), opt.short]
					}, opt.value);
				})
			})]
		}),
		saleLines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 overflow-hidden rounded-xl bg-muted/50",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "w-full text-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: saleLines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/60 last:border-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2",
							children: line.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular-nums",
							children: line.quantity
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: Math.round(line.quantity * line.unitPrice),
								currency: data.settings.currency
							})
						})
					]
				}, line.id)) })
			})
		}) : null,
		openInvoices.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Open invoices"
					}), locked ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "ghost",
						onClick: autoApply,
						children: "Auto apply"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-xl bg-muted/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-10 px-3 py-2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left font-medium",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left font-medium",
									children: "Number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right font-medium",
									children: "Orig."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right font-medium",
									children: "Due"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right font-medium",
									children: "Payment"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: openInvoices.map((inv) => {
							const due = invoiceBalance(data, inv.id);
							const orig = invoiceTotal(data, inv.id);
							const on = picked.includes(inv.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border/60",
								"data-selected": on ? "true" : void 0,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopTick, {
											checked: on,
											onChange: (next) => toggleInvoice(inv.id, next),
											label: `Apply to ${inv.number}`
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: formatDate(inv.date)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-medium",
										children: inv.number
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
											amount: orig,
											currency: data.settings.currency
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
											amount: due,
											currency: data.settings.currency
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-right",
										children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "ml-auto h-9 min-h-9 w-28 text-right",
											value: applied[inv.id] ?? "",
											disabled: locked,
											inputMode: "decimal",
											onChange: (e) => setApplied((prev) => ({
												...prev,
												[inv.id]: e.target.value
											}))
										}) : "—"
									})
								]
							}, inv.id);
						}) })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-right text-sm text-muted-foreground",
					children: [
						"Applied ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: appliedTotal,
							currency: data.settings.currency
						}),
						payAmount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							" · ",
							"Entered ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: payAmount,
								currency: data.settings.currency
							})
						] }) : null
					]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted-foreground",
			children: "No open invoices for this customer."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "mt-6 flex-wrap gap-2",
			children: [
				onBack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: onBack,
					children: "Back"
				}) : null,
				locked ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: save,
					children: receipt ? "Save" : "Process payment"
				}),
				receipt?.status === "posted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => {
						voidReceipt(receipt.id);
						toast.success("Payment voided.");
					},
					children: "Void"
				}) : null,
				receipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setDeleting(true),
					children: "Delete"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: onClose,
					children: "Close"
				})
			]
		}),
		receipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete this payment?",
			body: "Removes the ticket from the books so you can enter it again.",
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeReceipt(receipt.id);
					toast.success("Payment deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		}) : null
	] });
}
function compareValues(a, b) {
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b), void 0, {
		numeric: true,
		sensitivity: "base"
	});
}
function sortEntries(items, key, dir, getters) {
	const get = getters[key];
	if (!get) return items;
	const copy = [...items];
	copy.sort((a, b) => {
		const cmp = compareValues(get(a), get(b));
		return dir === "asc" ? cmp : -cmp;
	});
	return copy;
}
function useEntrySort(items, defaultKey, getters, defaultDir = "asc") {
	const [key, setKey] = (0, import_react.useState)(defaultKey);
	const [dir, setDir] = (0, import_react.useState)(defaultDir);
	function toggle(column) {
		if (key === column) setDir((d) => d === "asc" ? "desc" : "asc");
		else {
			setKey(column);
			setDir(column === "order" || column === "date" || column === "name" ? "asc" : defaultDir);
		}
	}
	function set(column, nextDir) {
		setKey(column);
		setDir(nextDir ?? (column === "order" || column === "date" || column === "name" ? "asc" : defaultDir));
	}
	return {
		sorted: (0, import_react.useMemo)(() => sortEntries(items, key, dir, getters), [
			items,
			key,
			dir,
			getters
		]),
		key,
		dir,
		toggle,
		set
	};
}
function moveId(ids, fromId, toId) {
	if (fromId === toId) return ids;
	if (ids.indexOf(fromId) < 0) return ids;
	const next = ids.filter((id) => id !== fromId);
	const to = next.indexOf(toId);
	if (to < 0) return ids;
	next.splice(to, 0, fromId);
	return next;
}
function reorderList(list, from, to) {
	if (from === to || from < 0 || to < 0) return list;
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}
function EntryLines({ lines, onChange, dragEnabled }) {
	function patch(index, next) {
		onChange(lines.map((line, i) => i === index ? {
			...line,
			...next
		} : line));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "Lines"
			}),
			lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("grid gap-2 sm:grid-cols-[auto_1fr_80px_110px_auto]", dragEnabled && "items-center"),
				draggable: dragEnabled,
				onDragStart: (e) => {
					e.dataTransfer.setData("text/plain", String(index));
					e.dataTransfer.effectAllowed = "move";
				},
				onDragOver: (e) => e.preventDefault(),
				onDrop: (e) => {
					e.preventDefault();
					const from = Number(e.dataTransfer.getData("text/plain"));
					if (Number.isFinite(from)) onChange(reorderList(lines, from, index));
				},
				children: [
					dragEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden cursor-grab text-muted-foreground sm:flex",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "size-4" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden sm:block" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Description",
						value: line.description,
						onChange: (e) => patch(index, { description: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Qty",
						value: line.quantity,
						onChange: (e) => patch(index, { quantity: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Unit price",
						value: line.unitPrice,
						onChange: (e) => patch(index, { unitPrice: e.target.value })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "icon",
						variant: "ghost",
						className: "size-11",
						"aria-label": "Remove line",
						disabled: lines.length <= 1,
						onClick: () => onChange(lines.filter((_, i) => i !== index)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})
				]
			}, index)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "ghost",
				size: "sm",
				className: "self-start",
				onClick: () => onChange([...lines, {
					description: "",
					quantity: "1",
					unitPrice: ""
				}]),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "Add line"]
			})
		]
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-[box-shadow,border-color] duration-150", "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
function PartyFields({ form, setForm, extra }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Company / name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.name,
					onChange: (e) => setForm({
						...form,
						name: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Contact",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.contact,
					onChange: (e) => setForm({
						...form,
						contact: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Email",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "email",
						value: form.email,
						onChange: (e) => setForm({
							...form,
							email: e.target.value
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Phone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.phone,
						onChange: (e) => setForm({
							...form,
							phone: e.target.value
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Address",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.address,
					onChange: (e) => setForm({
						...form,
						address: e.target.value
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Terms",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.terms,
					onChange: (e) => setForm({
						...form,
						terms: e.target.value
					})
				})
			}),
			extra,
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
	});
}
function CustomerCreateDialog({ customerId, kind, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyInvoiceDialog, {
			customerId,
			open: kind === "invoice",
			onClose
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: kind === "receive",
			onOpenChange: (o) => !o && onClose(),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "sr-only",
					children: "Receive payment"
				}), kind === "receive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerPayment, {
					customerId,
					onClose
				}) : null]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyCashSaleDialog, {
			customerId,
			open: kind === "cash-sale",
			onClose
		})
	] });
}
function VendorCreateDialog({ vendorId, kind, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBillDialog, {
		vendorId,
		open: kind === "bill",
		onClose
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyCheckDialog, {
		vendorId,
		open: kind === "check",
		onClose
	})] });
}
function PartyInvoiceDialog({ customerId, open, onClose }) {
	const data = useFinanceData();
	const createInvoice = useFinanceStore((s) => s.createInvoice);
	const customer = data.customers.find((c) => c.id === customerId);
	const [form, setForm] = (0, import_react.useState)({
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
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setForm({
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
	}, [open, data.settings.defaultTaxRate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Invoice ", customer?.name ?? "customer"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts accounts receivable and income when you save." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
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
							dragEnabled: data.settings.dragDropEnabled
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
								customerId,
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
							onClose();
							toast.success("Invoice posted.");
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not create invoice.");
						}
					},
					children: "Save invoice"
				}) })
			]
		})
	});
}
function PartyCashSaleDialog({ customerId, open, onClose }) {
	const data = useFinanceData();
	const createCashSale = useFinanceStore((s) => s.createCashSale);
	const customer = data.customers.find((c) => c.id === customerId);
	const defaultBank = data.banks.find((b) => !b.archived)?.id ?? "";
	const [form, setForm] = (0, import_react.useState)({
		date: todayIso(),
		bankId: defaultBank,
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
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setForm({
			date: todayIso(),
			bankId: defaultBank,
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
	}, [
		open,
		defaultBank,
		data.settings.defaultTaxRate
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Cash sale — ", customer?.name ?? "customer"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Debits the bank and credits income. Does not change the open balance." })] }),
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
							}), methodNeedsReference(form.method) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: methodRefLabel(form.method),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.checkNumber,
									onChange: (e) => setForm({
										...form,
										checkNumber: e.target.value
									})
								})
							}) : null]
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
							dragEnabled: data.settings.dragDropEnabled
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Memo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
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
							createCashSale({
								date: form.date,
								bankId: form.bankId,
								customerId,
								receivedFrom: customer?.name ?? "",
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
							onClose();
							toast.success("Cash sale posted.");
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not post sale.");
						}
					},
					children: "Save sale"
				}) })
			]
		})
	});
}
function PartyBillDialog({ vendorId, open, onClose }) {
	const data = useFinanceData();
	const createBill = useFinanceStore((s) => s.createBill);
	const vendor = data.vendors.find((v) => v.id === vendorId);
	const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
	const defaultExpense = expenseAccounts[0]?.id ?? "";
	const [form, setForm] = (0, import_react.useState)({
		date: todayIso(),
		dueDate: addDaysIso(todayIso(), 15),
		amount: "",
		accountId: defaultExpense,
		memo: "",
		reference: ""
	});
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setForm({
			date: todayIso(),
			dueDate: addDaysIso(todayIso(), 15),
			amount: "",
			accountId: defaultExpense,
			memo: "",
			reference: ""
		});
	}, [open, defaultExpense]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Bill from ", vendor?.name ?? "vendor"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts expense and accounts payable when you save." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4",
				children: [
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
							vendorId,
							date: form.date,
							dueDate: form.dueDate,
							amount: parseAmountToCents(form.amount),
							accountId: form.accountId,
							memo: form.memo,
							reference: form.reference
						});
						onClose();
						toast.success("Bill posted.");
					} catch (err) {
						toast.error(err instanceof Error ? err.message : "Could not create bill.");
					}
				},
				children: "Save bill"
			}) })
		] })
	});
}
function PartyCheckDialog({ vendorId, open, onClose }) {
	const data = useFinanceData();
	const issueCheck = useFinanceStore((s) => s.issueCheck);
	const vendor = data.vendors.find((v) => v.id === vendorId);
	const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
	const defaultBank = data.banks.find((b) => !b.archived)?.id ?? "";
	const defaultExpense = expenseAccounts[0]?.id ?? "";
	const [form, setForm] = (0, import_react.useState)({
		bankId: defaultBank,
		checkNumber: "",
		issueDate: todayIso(),
		postDate: todayIso(),
		amount: "",
		memo: "",
		accountId: defaultExpense
	});
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setForm({
			bankId: defaultBank,
			checkNumber: "",
			issueDate: todayIso(),
			postDate: todayIso(),
			amount: "",
			memo: "",
			accountId: defaultExpense
		});
	}, [
		open,
		defaultBank,
		defaultExpense
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Check to ", vendor?.name ?? "vendor"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Posts the expense immediately. Status stays pending until you clear it." })] }),
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
							payee: vendor?.name ?? "",
							issueDate: form.issueDate,
							postDate: form.postDate,
							amount: parseAmountToCents(form.amount),
							memo: form.memo,
							accountId: form.accountId,
							vendorId
						});
						onClose();
						toast.success("Check issued.");
					} catch (err) {
						toast.error(err instanceof Error ? err.message : "Could not issue check.");
					}
				},
				children: "Issue check"
			}) })
		] })
	});
}
var Tabs = Root2$1;
function TabsList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
		className: cn("inline-flex h-11 items-center gap-1 rounded-xl bg-muted p-1", className),
		...props
	});
}
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger$1, {
		className: cn("inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground", "transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:elevation", className),
		...props
	});
}
function TabsContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
		className: cn("mt-4 outline-none", className),
		...props
	});
}
function withRunningBalance(rows) {
	const chrono = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.rank - b.rank || a.number.localeCompare(b.number) || a.id.localeCompare(b.id));
	let running = 0;
	return [...chrono.map((row) => {
		running += row.signed;
		const { signed: _signed, rank: _rank, ...rest } = row;
		return {
			...rest,
			balance: running
		};
	})].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number) || b.id.localeCompare(a.id));
}
function customerHistory(data, customerId) {
	const today = todayIso();
	const rows = [];
	for (const invoice of data.invoices) {
		if (invoice.customerId !== customerId) continue;
		const total = invoiceTotal(data, invoice.id);
		const open = invoiceBalance(data, invoice.id);
		const voided = invoice.status === "void";
		rows.push({
			id: invoice.id,
			openKind: "invoice",
			date: invoice.date,
			type: "Invoice",
			number: invoice.number,
			memo: invoice.notes,
			amount: total,
			open,
			balance: 0,
			signed: voided ? 0 : total,
			rank: 0,
			invoiceStatus: invoice.status,
			overdue: open > 0 && invoice.dueDate < today && invoice.status !== "void" && invoice.status !== "paid"
		});
	}
	for (const receipt of data.receipts) {
		if (receipt.customerId !== customerId) continue;
		const cash = receipt.kind === "cash-sale";
		const voided = receipt.status === "void";
		rows.push({
			id: receipt.id,
			openKind: "receipt",
			date: receipt.date,
			type: cash ? "Cash Sale" : "Payment",
			number: receipt.number,
			memo: receipt.memo,
			amount: receipt.amount,
			open: 0,
			balance: 0,
			signed: voided || cash ? 0 : -receipt.amount,
			rank: cash ? 1 : 2,
			receiptStatus: receipt.status,
			receiptKind: receipt.kind,
			receiptMethod: receipt.method
		});
	}
	return withRunningBalance(rows);
}
function vendorHistory(data, vendorId) {
	const today = todayIso();
	const rows = [];
	for (const bill of data.bills) {
		if (bill.vendorId !== vendorId) continue;
		const open = billBalance(bill);
		const voided = bill.status === "void";
		rows.push({
			id: bill.id,
			openKind: "bill",
			date: bill.date,
			type: "Bill",
			number: bill.number,
			memo: bill.memo,
			amount: bill.amount,
			open,
			balance: 0,
			signed: voided ? 0 : bill.amount,
			rank: 0,
			billStatus: bill.status,
			overdue: open > 0 && bill.dueDate < today && bill.status !== "void" && bill.status !== "paid"
		});
	}
	for (const check of data.checks) {
		if (check.vendorId !== vendorId) continue;
		const dead = check.status === "voided" || check.status === "bounced";
		rows.push({
			id: check.id,
			openKind: "check",
			date: check.issueDate,
			type: "Check",
			number: `#${check.checkNumber}`,
			memo: check.memo,
			amount: check.amount,
			open: 0,
			balance: 0,
			signed: dead ? 0 : -check.amount,
			rank: 1,
			checkStatus: check.status
		});
	}
	return withRunningBalance(rows);
}
function filterCustomerHistory(rows, filter) {
	if (filter === "all") return rows;
	if (filter === "invoice") return rows.filter((r) => r.openKind === "invoice");
	if (filter === "cash-sale") return rows.filter((r) => r.receiptKind === "cash-sale");
	return rows.filter((r) => r.openKind === "receipt" && r.receiptKind !== "cash-sale");
}
function filterVendorHistory(rows, filter) {
	if (filter === "all") return rows;
	if (filter === "bill") return rows.filter((r) => r.openKind === "bill");
	return rows.filter((r) => r.openKind === "check");
}
function partyHistoryRows(txns) {
	return txns.map((row) => ({
		Date: row.date,
		Type: row.type,
		Number: row.number,
		Memo: row.memo,
		Amount: row.amount / 100,
		Open: row.open / 100,
		Balance: row.balance / 100,
		Status: titleCase$1(row.invoiceStatus ?? row.billStatus ?? row.checkStatus ?? row.receiptStatus ?? "")
	}));
}
function PartyTxnTable({ rows, currency, empty }) {
	if (rows.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-4 py-8 text-center text-sm text-muted-foreground",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "party-txn-table overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "No." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Memo" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "num",
					children: "Amount"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "num",
					children: "Open"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "num",
					children: "Balance"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "cursor-pointer",
				...openProps(row.openKind, row.id, { click: true }),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "whitespace-nowrap",
						children: formatDate(row.date)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.type }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "whitespace-nowrap",
						children: row.number
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "text-muted-foreground",
						children: row.memo || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "num",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: row.amount,
							currency,
							className: row.openKind === "receipt" || row.openKind === "check" ? "text-credit" : void 0
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "num",
						children: row.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: row.open,
							currency
						}) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "num",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: row.balance,
							currency
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxnBadge, { row }) })
				]
			}, `${row.openKind}-${row.id}`)) })]
		})
	});
}
function TxnBadge({ row }) {
	if (row.openKind === "invoice" && row.invoiceStatus) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBadge, {
		status: row.invoiceStatus,
		overdue: row.overdue
	});
	if (row.openKind === "bill" && row.billStatus) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillBadge, {
		status: row.billStatus,
		overdue: row.overdue
	});
	if (row.openKind === "check" && row.checkStatus) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: row.checkStatus });
	if (row.openKind === "receipt" && row.receiptStatus) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBadge, {
		status: row.receiptStatus,
		kind: row.receiptKind === "cash-sale" ? "cash-sale" : "payment",
		method: row.receiptMethod
	});
	return null;
}
function FilterPills({ options, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-3 flex flex-wrap gap-1 no-print",
		role: "group",
		"aria-label": "Transaction type",
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			size: "sm",
			variant: value === opt.id ? "default" : "ghost",
			"aria-pressed": value === opt.id,
			onClick: () => onChange(opt.id),
			children: opt.label
		}, opt.id))
	});
}
function CustomerCenter() {
	const data = useFinanceData();
	const addCustomer = useFinanceStore((s) => s.addCustomer);
	const updateCustomer = useFinanceStore((s) => s.updateCustomer);
	const removeCustomer = useFinanceStore((s) => s.removeCustomer);
	const [query, setQuery] = (0, import_react.useState)("");
	const [selectedId, setSelectedId] = (0, import_react.useState)(data.customers[0]?.id ?? null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)(EMPTY_CUSTOMER);
	const [txnFilter, setTxnFilter] = (0, import_react.useState)("all");
	const [createKind, setCreateKind] = (0, import_react.useState)(null);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return [...data.customers].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).filter((c) => !q ? true : [
			c.name,
			c.contact,
			c.email,
			c.phone
		].join(" ").toLowerCase().includes(q));
	}, [data.customers, query]);
	(0, import_react.useEffect)(() => {
		if (selectedId && filtered.some((c) => c.id === selectedId)) return;
		setSelectedId(filtered[0]?.id ?? null);
	}, [filtered, selectedId]);
	const selected = data.customers.find((c) => c.id === selectedId) ?? null;
	const visible = filterCustomerHistory(selected ? customerHistory(data, selected.id) : [], txnFilter);
	const open = selected ? customerOpenBalance(data, selected.id) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartySplit, {
		kindLabel: "customer",
		search: query,
		onSearch: setQuery,
		searchPlaceholder: "Search name, contact, or email",
		addLabel: "Add customer",
		onAdd: () => {
			setForm({
				...EMPTY_CUSTOMER,
				sortOrder: data.customers.length
			});
			setCreating(true);
		},
		creating,
		onCloseCreate: () => setCreating(false),
		createTitle: "New customer",
		createFields: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm
		}),
		onSaveCreate: () => {
			if (!form.name.trim()) return toast.error("Customer name is required.");
			addCustomer(form);
			const list = useFinanceStore.getState().companies[useFinanceStore.getState().activeCompanyId]?.customers ?? [];
			setSelectedId(list[list.length - 1]?.id ?? null);
			setCreating(false);
			toast.success("Customer added.");
		},
		list: filtered.map((c) => ({
			id: c.id,
			title: c.name,
			subtitle: c.contact || c.email || "—",
			balance: customerOpenBalance(data, c.id)
		})),
		selectedId,
		onSelect: (id) => {
			setSelectedId(id);
			setTxnFilter("all");
		},
		emptyList: "No customers yet.",
		currency: data.settings.currency,
		detail: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyDetail, {
			name: selected.name,
			open,
			currency: data.settings.currency,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					children: ["New", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
				align: "end",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onClick: () => setCreateKind("invoice"),
						children: "Invoice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onClick: () => setCreateKind("receive"),
						children: "Receive payment"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onClick: () => setCreateKind("cash-sale"),
						children: "Cash sale"
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: `${selected.name}-transactions.csv`,
				rows: partyHistoryRows(visible)
			})] }),
			filterBar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPills, {
				value: txnFilter,
				onChange: setTxnFilter,
				options: [
					{
						id: "all",
						label: "All"
					},
					{
						id: "invoice",
						label: "Invoices"
					},
					{
						id: "payment",
						label: "Payments"
					},
					{
						id: "cash-sale",
						label: "Cash sales"
					}
				]
			}),
			history: visible,
			emptyHistory: "No invoices, payments, or cash sales yet. Use New to invoice or receive.",
			details: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerDetails, {
				customer: selected,
				onSave: (next) => {
					updateCustomer(selected.id, next);
					toast.success("Customer updated.");
				},
				onDelete: () => {
					removeCustomer(selected.id);
					setSelectedId(null);
					toast.success("Customer deleted.");
				}
			})
		}, selected.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-6 py-16 text-center text-sm text-muted-foreground",
			children: "Pick a customer to see every transaction."
		}),
		extra: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerCreateDialog, {
			customerId: selected.id,
			kind: createKind,
			onClose: () => setCreateKind(null)
		}) : null
	});
}
function VendorCenter() {
	const data = useFinanceData();
	const addVendor = useFinanceStore((s) => s.addVendor);
	const updateVendor = useFinanceStore((s) => s.updateVendor);
	const removeVendor = useFinanceStore((s) => s.removeVendor);
	const [query, setQuery] = (0, import_react.useState)("");
	const [selectedId, setSelectedId] = (0, import_react.useState)(data.vendors[0]?.id ?? null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)(EMPTY_VENDOR);
	const [txnFilter, setTxnFilter] = (0, import_react.useState)("all");
	const [createKind, setCreateKind] = (0, import_react.useState)(null);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return [...data.vendors].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).filter((v) => !q ? true : [
			v.name,
			v.contact,
			v.email,
			v.phone
		].join(" ").toLowerCase().includes(q));
	}, [data.vendors, query]);
	(0, import_react.useEffect)(() => {
		if (selectedId && filtered.some((v) => v.id === selectedId)) return;
		setSelectedId(filtered[0]?.id ?? null);
	}, [filtered, selectedId]);
	const selected = data.vendors.find((v) => v.id === selectedId) ?? null;
	const visible = filterVendorHistory(selected ? vendorHistory(data, selected.id) : [], txnFilter);
	const open = selected ? vendorOpenBalance(data, selected.id) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartySplit, {
		kindLabel: "vendor",
		search: query,
		onSearch: setQuery,
		searchPlaceholder: "Search name, contact, or email",
		addLabel: "Add vendor",
		onAdd: () => {
			setForm({
				...EMPTY_VENDOR,
				sortOrder: data.vendors.length
			});
			setCreating(true);
		},
		creating,
		onCloseCreate: () => setCreating(false),
		createTitle: "New vendor",
		createFields: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm,
			extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Their account #",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.accountNumber,
					onChange: (e) => setForm({
						...form,
						accountNumber: e.target.value
					})
				})
			})
		}),
		onSaveCreate: () => {
			if (!form.name.trim()) return toast.error("Vendor name is required.");
			addVendor(form);
			const list = useFinanceStore.getState().companies[useFinanceStore.getState().activeCompanyId]?.vendors ?? [];
			setSelectedId(list[list.length - 1]?.id ?? null);
			setCreating(false);
			toast.success("Vendor added.");
		},
		list: filtered.map((v) => ({
			id: v.id,
			title: v.name,
			subtitle: v.contact || v.accountNumber || "—",
			balance: vendorOpenBalance(data, v.id)
		})),
		selectedId,
		onSelect: (id) => {
			setSelectedId(id);
			setTxnFilter("all");
		},
		emptyList: "No vendors yet.",
		currency: data.settings.currency,
		detail: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyDetail, {
			name: selected.name,
			open,
			currency: data.settings.currency,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					children: ["New", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
				align: "end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
					onClick: () => setCreateKind("bill"),
					children: "Bill"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
					onClick: () => setCreateKind("check"),
					children: "Write check"
				})]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: `${selected.name}-transactions.csv`,
				rows: partyHistoryRows(visible)
			})] }),
			filterBar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPills, {
				value: txnFilter,
				onChange: setTxnFilter,
				options: [
					{
						id: "all",
						label: "All"
					},
					{
						id: "bill",
						label: "Bills"
					},
					{
						id: "check",
						label: "Checks"
					}
				]
			}),
			history: visible,
			emptyHistory: "No bills or checks yet. Use New to enter a bill or write a check.",
			details: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorDetails, {
				vendor: selected,
				onSave: (next) => {
					updateVendor(selected.id, next);
					toast.success("Vendor updated.");
				},
				onDelete: () => {
					removeVendor(selected.id);
					setSelectedId(null);
					toast.success("Vendor deleted.");
				}
			})
		}, selected.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-6 py-16 text-center text-sm text-muted-foreground",
			children: "Pick a vendor to see every transaction."
		}),
		extra: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorCreateDialog, {
			vendorId: selected.id,
			kind: createKind,
			onClose: () => setCreateKind(null)
		}) : null
	});
}
function PartySplit({ kindLabel, search, onSearch, searchPlaceholder, addLabel, onAdd, creating, onCloseCreate, createTitle, createFields, onSaveCreate, list, selectedId, onSelect, emptyList, currency, detail, extra }) {
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex flex-col gap-2 sm:flex-row sm:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: search,
				onChange: (e) => onSearch(e.target.value),
				placeholder: searchPlaceholder,
				className: "max-w-md no-print",
				"aria-label": `Search ${kindLabel}s`
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "no-print w-fit sm:ml-auto",
				onClick: onAdd,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), addLabel]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "party-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: cn("rounded-3xl bg-card elevation", mobileOpen && "max-lg:hidden"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "listbox",
					"aria-label": `${kindLabel}s`,
					className: "divide-y divide-border",
					children: list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-center text-sm text-muted-foreground",
						children: emptyList
					}) : list.map((item) => {
						const on = item.id === selectedId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "option",
							"aria-selected": on,
							className: cn("flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left", on && "bg-primary/10"),
							onClick: () => {
								onSelect(item.id);
								setMobileOpen(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-medium",
									children: item.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-xs text-muted-foreground",
									children: item.subtitle
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: item.balance,
								currency,
								className: "shrink-0 text-sm"
							})]
						}, item.id);
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: cn("rounded-3xl bg-card elevation", !mobileOpen && "max-lg:hidden"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:hidden no-print border-b border-border px-3 py-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => setMobileOpen(false),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {}),
							"All ",
							kindLabel,
							"s"
						]
					})
				}), detail]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: creating,
			onOpenChange: (o) => !o && onCloseCreate(),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: createTitle }) }),
				createFields,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: onSaveCreate,
					children: "Save"
				}) })
			] })
		}),
		extra
	] });
}
function PartyDetail({ name, open, currency, actions, filterBar, history, emptyHistory, details }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-medium tracking-tight",
				children: name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: ["Open balance ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: open,
					currency,
					className: "inline font-medium text-foreground"
				})]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2 no-print",
				children: actions
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "transactions",
			className: "px-5 pb-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "no-print",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "transactions",
						children: "Transactions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "details",
						children: "Details"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "transactions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-xs text-muted-foreground no-print",
							children: "Tap a line to open and edit it."
						}),
						filterBar,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyTxnTable, {
							rows: history,
							currency,
							empty: emptyHistory
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "details",
					children: details
				})
			]
		})]
	});
}
function CustomerDetails({ customer, onSave, onDelete }) {
	const [form, setForm] = (0, import_react.useState)(EMPTY_CUSTOMER);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const { id: _id, ...rest } = customer;
		setForm(rest);
	}, [customer]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!form.name.trim()) return toast.error("Customer name is required.");
					onSave(form);
				},
				children: "Save"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setDeleting(true),
				children: "Delete"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete customer?",
			body: `${customer.name} will be removed. This is blocked if invoices or receipts still point here.`,
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					onDelete();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function VendorDetails({ vendor, onSave, onDelete }) {
	const [form, setForm] = (0, import_react.useState)(EMPTY_VENDOR);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const { id: _id, ...rest } = vendor;
		setForm(rest);
	}, [vendor]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm,
			extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Their account #",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "edit-vendor-account",
					value: form.accountNumber,
					onChange: (e) => setForm({
						...form,
						accountNumber: e.target.value
					})
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!form.name.trim()) return toast.error("Vendor name is required.");
					onSave(form);
				},
				children: "Save"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setDeleting(true),
				children: "Delete"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete vendor?",
			body: `${vendor.name} will be removed. This is blocked if bills still point here.`,
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					onDelete();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function RecordSheet() {
	const target = useFinanceStore((s) => s.openRecord);
	const closeTxn = useFinanceStore((s) => s.closeTxn);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const open = Boolean(target);
	(0, import_react.useEffect)(() => {
		closeTxn();
	}, [pathname, closeTxn]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && closeTxn(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: cn("max-w-2xl", (target?.kind === "receipt" || target?.kind === "invoice") && "max-w-3xl", (target?.kind === "customer" || target?.kind === "vendor") && "max-w-4xl"),
			children: target ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordBody, {
				kind: target.kind,
				id: target.id,
				onClose: closeTxn
			}) : null
		})
	});
}
function RecordBody({ kind, id, onClose }) {
	if (kind === "invoice") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBody, {
		id,
		onClose
	});
	if (kind === "bill") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillBody, {
		id,
		onClose
	});
	if (kind === "receipt") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBody, {
		id,
		onClose
	});
	if (kind === "check") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBody, {
		id,
		onClose
	});
	if (kind === "customer") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerBody, {
		id,
		onClose
	});
	if (kind === "vendor") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorBody, {
		id,
		onClose
	});
	if (kind === "bank") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankBody, {
		id,
		onClose
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(JournalBody, {
		id,
		onClose
	});
}
function InvoiceBody({ id, onClose }) {
	const data = useFinanceData();
	const invoice = data.invoices.find((i) => i.id === id);
	const updateInvoiceRecord = useFinanceStore((s) => s.updateInvoiceRecord);
	const voidInvoice = useFinanceStore((s) => s.voidInvoice);
	const removeInvoice = useFinanceStore((s) => s.removeInvoice);
	const [paying, setPaying] = (0, import_react.useState)(false);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [edit, setEdit] = (0, import_react.useState)({
		date: "",
		dueDate: "",
		notes: "",
		taxRate: "",
		lines: []
	});
	(0, import_react.useEffect)(() => {
		if (!invoice) {
			onClose();
			return;
		}
		setEdit({
			date: invoice.date,
			dueDate: invoice.dueDate,
			notes: invoice.notes,
			taxRate: String(invoice.taxRate),
			lines: invoice.lines.map((line) => ({
				description: line.description,
				quantity: String(line.quantity),
				unitPrice: String(line.unitPrice / 100)
			}))
		});
	}, [invoice, onClose]);
	if (!invoice) return null;
	const customer = data.customers.find((c) => c.id === invoice.customerId);
	const total = invoiceTotal(data, invoice.id);
	const due = invoiceBalance(data, invoice.id);
	const overdue = due > 0 && invoice.dueDate < todayIso() && invoice.status !== "void" && invoice.status !== "paid";
	if (paying) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerPayment, {
		invoiceId: id,
		onClose,
		onBack: () => setPaying(false)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: invoice.number }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
			customer?.name ?? "Customer",
			" · ",
			formatDate(invoice.date)
		] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBadge, {
				status: invoice.status,
				overdue
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm text-muted-foreground",
				children: ["Due ", formatDate(invoice.dueDate)]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Invoice date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: edit.date,
						disabled: invoice.status === "void",
						onChange: (e) => setEdit({
							...edit,
							date: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Due date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: edit.dueDate,
						disabled: invoice.status === "void",
						onChange: (e) => setEdit({
							...edit,
							dueDate: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Notes",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: edit.notes,
						disabled: invoice.status === "void",
						onChange: (e) => setEdit({
							...edit,
							notes: e.target.value
						})
					})
				}),
				data.settings.taxEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Tax %",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: edit.taxRate,
						disabled: invoice.status === "void",
						inputMode: "decimal",
						onChange: (e) => setEdit({
							...edit,
							taxRate: e.target.value
						})
					})
				}) : null
			]
		}),
		invoice.status === "void" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-full text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: invoice.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border/70",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2",
						children: line.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 text-right tabular-nums",
						children: line.quantity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: line.unitPrice,
							currency: data.settings.currency
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: Math.round(line.quantity * line.unitPrice),
							currency: data.settings.currency
						})
					})
				]
			}, line.id)) })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryLines, {
			lines: edit.lines,
			onChange: (lines) => setEdit({
				...edit,
				lines
			}),
			dragEnabled: data.settings.dragDropEnabled
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-3 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "Total",
					value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: total,
						currency: data.settings.currency
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "Balance",
					value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: due,
						currency: data.settings.currency
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "Payments",
					value: String(invoice.payments.length)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [
				invoice.status === "void" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						try {
							updateInvoiceRecord(invoice.id, {
								date: edit.date,
								dueDate: edit.dueDate,
								notes: edit.notes,
								taxRate: data.settings.taxEnabled ? Number(edit.taxRate) || 0 : invoice.taxRate,
								lines: edit.lines.map((line) => ({
									description: line.description,
									quantity: Number(line.quantity) || 0,
									unitPrice: parseAmountToCents(line.unitPrice)
								}))
							});
							toast.success("Invoice updated.");
							onClose();
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not save.");
						}
					},
					children: "Save"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/print/$invoiceId",
						params: { invoiceId: invoice.id },
						onClick: onClose,
						children: "Print"
					})
				}),
				due > 0 && invoice.status !== "void" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setPaying((v) => !v),
					children: "Collect"
				}) : null,
				invoice.status !== "void" && invoice.status !== "paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => {
						voidInvoice(invoice.id);
						toast.success("Invoice voided.");
					},
					children: "Void"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setDeleting(true),
					children: "Delete"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete invoice?",
			body: "Removes this invoice and its ledger lines so you can enter it again.",
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeInvoice(invoice.id);
					toast.success("Invoice deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function BillBody({ id, onClose }) {
	const data = useFinanceData();
	const bill = data.bills.find((b) => b.id === id);
	const payBill = useFinanceStore((s) => s.payBill);
	const updateBillRecord = useFinanceStore((s) => s.updateBillRecord);
	const voidBill = useFinanceStore((s) => s.voidBill);
	const removeBill = useFinanceStore((s) => s.removeBill);
	const [paying, setPaying] = (0, import_react.useState)(false);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [edit, setEdit] = (0, import_react.useState)({
		date: "",
		dueDate: "",
		amount: "",
		memo: ""
	});
	const [payForm, setPayForm] = (0, import_react.useState)({
		amount: "",
		date: todayIso(),
		bankId: data.banks[0]?.id ?? ""
	});
	(0, import_react.useEffect)(() => {
		if (!bill) {
			onClose();
			return;
		}
		setEdit({
			date: bill.date,
			dueDate: bill.dueDate,
			amount: String(bill.amount / 100),
			memo: bill.memo
		});
	}, [bill, onClose]);
	if (!bill) return null;
	const vendor = data.vendors.find((v) => v.id === bill.vendorId);
	const due = billBalance(bill);
	const overdue = due > 0 && bill.dueDate < todayIso() && bill.status !== "void" && bill.status !== "paid";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: bill.number }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
			vendor?.name ?? "Vendor",
			" · ",
			formatDate(bill.date)
		] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillBadge, {
				status: bill.status,
				overdue
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm text-muted-foreground",
				children: ["Due ", formatDate(bill.dueDate)]
			})]
		}),
		bill.memo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: bill.memo
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Bill date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: edit.date,
						disabled: bill.status === "void",
						onChange: (e) => setEdit({
							...edit,
							date: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Due date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: edit.dueDate,
						disabled: bill.status === "void",
						onChange: (e) => setEdit({
							...edit,
							dueDate: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Amount",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: edit.amount,
						disabled: bill.status === "void",
						inputMode: "decimal",
						onChange: (e) => setEdit({
							...edit,
							amount: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Memo",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: edit.memo,
						disabled: bill.status === "void",
						onChange: (e) => setEdit({
							...edit,
							memo: e.target.value
						})
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
				label: "Amount",
				value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: bill.amount,
					currency: data.settings.currency
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
				label: "Balance",
				value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: due,
					currency: data.settings.currency
				})
			})]
		}),
		paying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 rounded-xl bg-muted/70 p-4 sm:grid-cols-2",
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
					label: "Amount",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: payForm.amount,
						onChange: (e) => setPayForm({
							...payForm,
							amount: e.target.value
						}),
						inputMode: "decimal",
						placeholder: String(due / 100)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "sm:col-span-2",
					onClick: () => {
						try {
							payBill({
								billId: bill.id,
								date: payForm.date,
								amount: parseAmountToCents(payForm.amount) || due,
								bankId: payForm.bankId
							});
							setPaying(false);
							toast.success("Bill paid.");
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not pay bill.");
						}
					},
					children: "Record payment"
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [
				bill.status === "void" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						try {
							updateBillRecord(bill.id, {
								date: edit.date,
								dueDate: edit.dueDate,
								amount: parseAmountToCents(edit.amount),
								memo: edit.memo
							});
							toast.success("Bill updated.");
							onClose();
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not save.");
						}
					},
					children: "Save"
				}),
				due > 0 && bill.status !== "void" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setPaying((v) => !v),
					children: "Pay"
				}) : null,
				bill.status !== "void" && bill.status !== "paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => {
						voidBill(bill.id);
						toast.success("Bill voided.");
					},
					children: "Void"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setDeleting(true),
					children: "Delete"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete bill?",
			body: "Removes this bill and its ledger lines so you can enter it again.",
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeBill(bill.id);
					toast.success("Bill deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function ReceiptBody({ id, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerPayment, {
		receiptId: id,
		onClose
	});
}
function CheckBody({ id, onClose }) {
	const data = useFinanceData();
	const check = data.checks.find((c) => c.id === id);
	const updateCheck = useFinanceStore((s) => s.updateCheck);
	const setCheckStatus = useFinanceStore((s) => s.setCheckStatus);
	const removeCheck = useFinanceStore((s) => s.removeCheck);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		payee: "",
		amount: "",
		issueDate: "",
		postDate: "",
		memo: "",
		checkNumber: "",
		accountId: "",
		bankId: ""
	});
	(0, import_react.useEffect)(() => {
		if (!check) {
			onClose();
			return;
		}
		setForm({
			payee: check.payee,
			amount: String(check.amount / 100),
			issueDate: check.issueDate,
			postDate: check.postDate,
			memo: check.memo,
			checkNumber: check.checkNumber,
			accountId: check.accountId,
			bankId: check.bankId
		});
	}, [check, onClose]);
	if (!check) return null;
	const bank = data.banks.find((b) => b.id === check.bankId);
	const locked = check.status === "voided" || check.status === "bounced";
	const expenseAccounts = data.accounts.filter((a) => a.type === "expense");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Write check #", check.checkNumber] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [bank?.nickname ?? "Bank", " · Edit payee, dates, and amount."] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: check.status }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Check number",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.checkNumber,
						disabled: locked,
						onChange: (e) => setForm({
							...form,
							checkNumber: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Payee",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.payee,
						disabled: locked,
						onChange: (e) => setForm({
							...form,
							payee: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Bank",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: form.bankId,
						onValueChange: (v) => setForm({
							...form,
							bankId: v
						}),
						disabled: locked,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select bank" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: b.id,
							children: b.nickname
						}, b.id)) })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Amount",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.amount,
						disabled: locked,
						inputMode: "decimal",
						onChange: (e) => setForm({
							...form,
							amount: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Expense account",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: form.accountId,
						onValueChange: (v) => setForm({
							...form,
							accountId: v
						}),
						disabled: locked,
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
					label: "Issued",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: form.issueDate,
						disabled: locked,
						onChange: (e) => setForm({
							...form,
							issueDate: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Post date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: form.postDate,
						disabled: locked,
						onChange: (e) => setForm({
							...form,
							postDate: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Memo",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.memo,
						disabled: locked,
						onChange: (e) => setForm({
							...form,
							memo: e.target.value
						})
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [
				locked ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						try {
							updateCheck(check.id, {
								payee: form.payee,
								amount: parseAmountToCents(form.amount),
								issueDate: form.issueDate,
								postDate: form.postDate,
								memo: form.memo,
								checkNumber: form.checkNumber,
								accountId: form.accountId,
								bankId: form.bankId
							});
							toast.success("Check updated.");
							onClose();
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "Could not save.");
						}
					},
					children: "Save"
				}),
				check.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setCheckStatus(check.id, "cleared"),
						children: "Clear"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => {
							setCheckStatus(check.id, "voided");
							toast.success("Check voided.");
						},
						children: "Void"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => {
							setCheckStatus(check.id, "bounced");
							toast.success("Marked bounced.");
						},
						children: "Bounce"
					})
				] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => setDeleting(true),
					children: "Delete"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete check?",
			body: "Removes this check and takes it off the ledger so you can issue it again.",
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeCheck(check.id);
					toast.success("Check deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function CustomerBody({ id, onClose }) {
	const data = useFinanceData();
	const customer = data.customers.find((c) => c.id === id);
	const updateCustomer = useFinanceStore((s) => s.updateCustomer);
	const removeCustomer = useFinanceStore((s) => s.removeCustomer);
	const [form, setForm] = (0, import_react.useState)(EMPTY_CUSTOMER);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!customer) {
			onClose();
			return;
		}
		const { id: _id, ...rest } = customer;
		setForm(rest);
	}, [customer, onClose]);
	if (!customer) return null;
	const history = customerHistory(data, customer.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: customer.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
			"Open balance",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
				amount: customerOpenBalance(data, customer.id),
				currency: data.settings.currency,
				className: "inline"
			}),
			" · ",
			history.length,
			" ",
			history.length === 1 ? "transaction" : "transactions"
		] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Tap a line to open and edit it."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyTxnTable, {
			rows: history,
			currency: data.settings.currency,
			empty: "No invoices, payments, or cash sales yet."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!form.name.trim()) return toast.error("Customer name is required.");
					updateCustomer(customer.id, form);
					toast.success("Customer updated.");
					onClose();
				},
				children: "Save"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setDeleting(true),
				children: "Delete"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete customer?",
			body: `${customer.name} will be removed. This is blocked if invoices or receipts still point here.`,
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeCustomer(customer.id);
					toast.success("Customer deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function VendorBody({ id, onClose }) {
	const data = useFinanceData();
	const vendor = data.vendors.find((v) => v.id === id);
	const updateVendor = useFinanceStore((s) => s.updateVendor);
	const removeVendor = useFinanceStore((s) => s.removeVendor);
	const [form, setForm] = (0, import_react.useState)(EMPTY_VENDOR);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!vendor) {
			onClose();
			return;
		}
		const { id: _id, ...rest } = vendor;
		setForm(rest);
	}, [vendor, onClose]);
	if (!vendor) return null;
	const history = vendorHistory(data, vendor.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: vendor.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
			"Open balance",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
				amount: vendorOpenBalance(data, vendor.id),
				currency: data.settings.currency,
				className: "inline"
			}),
			" · ",
			history.length,
			" ",
			history.length === 1 ? "transaction" : "transactions"
		] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Tap a line to open and edit it."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyTxnTable, {
			rows: history,
			currency: data.settings.currency,
			empty: "No bills or checks yet."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyFields, {
			form,
			setForm,
			extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Their account #",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.accountNumber,
					onChange: (e) => setForm({
						...form,
						accountNumber: e.target.value
					})
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!form.name.trim()) return toast.error("Vendor name is required.");
					updateVendor(vendor.id, form);
					toast.success("Vendor updated.");
					onClose();
				},
				children: "Save"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setDeleting(true),
				children: "Delete"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete vendor?",
			body: `${vendor.name} will be removed. This is blocked if bills still point here.`,
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeVendor(vendor.id);
					toast.success("Vendor deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function BankBody({ id, onClose }) {
	const data = useFinanceData();
	const bank = data.banks.find((b) => b.id === id);
	const updateBank = useFinanceStore((s) => s.updateBank);
	const removeBank = useFinanceStore((s) => s.removeBank);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		nickname: "",
		accountNumber: ""
	});
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!bank) {
			onClose();
			return;
		}
		setForm({
			name: bank.name,
			nickname: bank.nickname,
			accountNumber: bank.accountNumber
		});
	}, [bank, onClose]);
	if (!bank) return null;
	const book = bankBookBalance(data, bank.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: bank.nickname }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: ["Book balance ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
			amount: book,
			currency: data.settings.currency,
			className: "inline"
		})] })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Bank name",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.name,
						onChange: (e) => setForm({
							...form,
							name: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Nickname",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.nickname,
						onChange: (e) => setForm({
							...form,
							nickname: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Account number",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.accountNumber,
						onChange: (e) => setForm({
							...form,
							accountNumber: e.target.value
						})
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
			className: "flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!form.name.trim()) return toast.error("Name the bank.");
					updateBank(bank.id, {
						name: form.name.trim(),
						nickname: form.nickname.trim() || form.name.trim(),
						accountNumber: form.accountNumber.trim() || "—"
					});
					toast.success("Bank updated.");
					onClose();
				},
				children: "Save"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setDeleting(true),
				children: "Delete"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
			open: deleting,
			title: "Delete bank?",
			body: "Removes this account if it has no checks, receipts, or other activity. Opening balance is reversed.",
			onClose: () => setDeleting(false),
			onConfirm: () => {
				try {
					removeBank(bank.id);
					toast.success("Bank deleted.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not delete.");
					setDeleting(false);
				}
			}
		})
	] });
}
function JournalBody({ id, onClose }) {
	const data = useFinanceData();
	const entry = data.journals.find((j) => j.id === id);
	const updateJournalEntry = useFinanceStore((s) => s.updateJournalEntry);
	const [form, setForm] = (0, import_react.useState)({
		date: "",
		description: "",
		amount: ""
	});
	(0, import_react.useEffect)(() => {
		if (!entry) {
			onClose();
			return;
		}
		setForm({
			date: entry.date,
			description: entry.description,
			amount: String(entry.lines.reduce((s, l) => s + l.debit, 0) / 100)
		});
	}, [entry, onClose]);
	if (!entry) return null;
	const canEdit = entry.sourceType === "deposit" || entry.sourceType === "expense" || entry.sourceType === "transfer";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: entry.description }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
			formatDate(entry.date),
			" · ",
			entry.sourceType
		] })] }),
		canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Date",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: form.date,
						onChange: (e) => setForm({
							...form,
							date: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Amount",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.amount,
						inputMode: "decimal",
						onChange: (e) => setForm({
							...form,
							amount: e.target.value
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Description",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: form.description,
						onChange: (e) => setForm({
							...form,
							description: e.target.value
						})
					})
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-full text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: entry.lines.map((line) => {
				const account = data.accounts.find((a) => a.id === line.accountId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/70",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2 text-muted-foreground",
							children: account ? `${account.code} ${account.name}` : line.accountId
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2 text-right",
							children: line.debit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: line.debit,
								currency: data.settings.currency
							}) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-2 text-right",
							children: line.credit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
								amount: line.credit,
								currency: data.settings.currency
							}) : "—"
						})
					]
				}, line.id);
			}) })
		}),
		canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: () => {
				try {
					updateJournalEntry(entry.id, {
						date: form.date,
						description: form.description,
						amount: parseAmountToCents(form.amount)
					});
					toast.success("Entry updated.");
					onClose();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Could not save.");
				}
			},
			children: "Save"
		}) }) : null
	] });
}
function Meta({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "eyebrow",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 font-medium",
		children: value
	})] });
}
var OPTIONS = [{
	id: "light",
	label: "Light"
}, {
	id: "dark",
	label: "Dark"
}];
function ThemeToggle({ compact = false }) {
	const { resolved, setTheme } = useTheme();
	const dark = resolved === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: compact ? "icon" : "default",
		"aria-label": dark ? "Switch to light" : "Switch to dark",
		title: dark ? "Light" : "Dark",
		onClick: () => setTheme(dark ? "light" : "dark"),
		children: [dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: dark ? "Dark" : "Light"
		})]
	});
}
function AppearancePicker() {
	const { theme, setTheme } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-2",
		children: OPTIONS.map((opt) => {
			const on = theme === opt.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTheme(opt.id),
				className: cn("flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium", on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"),
				children: opt.label
			}, opt.id);
		})
	});
}
var APP_VERSION_LABEL = `v2.0`;
var NAV = [
	{
		label: "Treasury",
		items: [
			{
				to: "/",
				label: "Desk",
				icon: LayoutDashboard
			},
			{
				to: "/register",
				label: "Register",
				icon: BookMarked
			},
			{
				to: "/calendar",
				label: "Calendar",
				icon: CalendarDays
			},
			{
				to: "/banks",
				label: "Banks",
				icon: Building2
			},
			{
				to: "/receipts",
				label: "Receipts",
				icon: Banknote
			},
			{
				to: "/checks",
				label: "Checks",
				icon: NotebookPen
			}
		]
	},
	{
		label: "Receivables",
		items: [{
			to: "/customers",
			label: "Customers",
			icon: Users
		}, {
			to: "/invoices",
			label: "Invoices",
			icon: Receipt
		}]
	},
	{
		label: "Payables",
		items: [{
			to: "/vendors",
			label: "Vendors",
			icon: Handshake
		}, {
			to: "/bills",
			label: "Bills",
			icon: ScrollText
		}]
	},
	{
		label: "Planning",
		items: [{
			to: "/forecast",
			label: "Forecast",
			icon: CalendarRange
		}]
	},
	{
		label: "Books",
		items: [{
			to: "/ledger",
			label: "Ledger",
			icon: BookOpen
		}, {
			to: "/reports",
			label: "Reports",
			icon: FileSpreadsheet
		}]
	}
];
var FLAT_NAV = [...NAV.flatMap((group) => group.items), {
	to: "/settings",
	label: "Settings",
	icon: Settings
}];
var SIDEBAR_KEY = "finance-manager-sidebar";
function readRail() {
	try {
		return localStorage.getItem(SIDEBAR_KEY) === "rail";
	} catch {
		return false;
	}
}
function NavLinks({ rail, onNavigate }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: cn("flex flex-1 flex-col gap-6 py-4", rail ? "px-2" : "px-3"),
		children: NAV.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-1",
			children: [rail ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase",
				children: group.label
			}), group.items.map((item) => {
				const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					title: item.label,
					"aria-label": item.label,
					onClick: onNavigate,
					className: cn("flex min-h-11 items-center rounded-xl text-sm", rail ? "justify-center px-0" : "gap-3 px-3", active ? "bg-card text-foreground elevation" : "text-muted-foreground hover:bg-accent hover:text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 shrink-0" }), rail ? null : item.label]
				}, item.to);
			})]
		}, group.label))
	});
}
function SidebarBody({ rail, onToggleRail, onNavigate }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("flex items-center gap-2 py-5", rail ? "justify-center px-2" : "px-5"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
				title: `Finance Manager ${APP_VERSION_LABEL}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" })
			}), rail ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg leading-none font-medium tracking-tight",
					children: "Finance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground",
					children: ["Manager", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-md bg-muted px-1.5 py-px font-medium tracking-wide text-[0.65rem] tabular-nums text-muted-foreground",
						children: APP_VERSION_LABEL
					})]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLinks, {
			rail,
			onNavigate
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("mt-auto flex flex-col gap-1 p-3", rail && "items-center p-2"),
			children: [onToggleRail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onToggleRail,
				title: rail ? "Expand menu" : "Collapse menu",
				"aria-label": rail ? "Expand menu" : "Collapse menu",
				"aria-pressed": rail,
				className: cn("flex min-h-11 items-center rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground", rail ? "size-11 justify-center" : "gap-3 px-3"),
				children: [rail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeftOpen, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeftClose, { className: "size-4" }), rail ? null : "Collapse"]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/settings",
				title: "Settings",
				"aria-label": "Settings",
				onClick: onNavigate,
				className: cn("flex min-h-11 items-center rounded-xl text-sm", rail ? "size-11 justify-center" : "gap-3 px-3", pathname.startsWith("/settings") ? "bg-card text-foreground elevation" : "text-muted-foreground hover:bg-accent hover:text-foreground"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4 shrink-0" }), rail ? null : "Settings"]
			})]
		})
	] });
}
function ThemeSync() {
	const { theme, resolved } = useTheme();
	(0, import_react.useLayoutEffect)(() => {
		applyTheme(theme);
	}, [theme, resolved]);
	return null;
}
function MobileNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex min-w-0 max-w-full gap-1 overflow-x-auto px-3 pb-3 md:hidden",
		children: FLAT_NAV.map((item) => {
			const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
			const Icon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				className: cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm", active ? "bg-card elevation" : "text-muted-foreground"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.to);
		})
	});
}
function AppShell({ title, description, actions, align = "start", compact = false, wide = false, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [findOpen, setFindOpen] = (0, import_react.useState)(false);
	const [rail, setRail] = (0, import_react.useState)(false);
	const hydrate = useFinanceStore((s) => s.hydrate);
	const data = useFinanceData();
	const { resolved } = useTheme();
	(0, import_react.useLayoutEffect)(() => {
		setRail(readRail());
	}, []);
	(0, import_react.useEffect)(() => {
		Promise.resolve(useFinanceStore.persist.rehydrate()).finally(() => hydrate());
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setFindOpen(true);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	function toggleRail() {
		setRail((on) => {
			const next = !on;
			try {
				localStorage.setItem(SIDEBAR_KEY, next ? "rail" : "full");
			} catch {}
			return next;
		});
	}
	const cash = totalCash(data);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSync, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: cn("no-print sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar transition-[width] duration-200 ease-out md:flex", rail ? "w-16" : "w-60"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarBody, {
					rail,
					onToggleRail: toggleRail
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "app-workspace flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "no-print sticky top-0 z-30 min-w-0 overflow-x-hidden border-b border-border bg-background/90 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 px-4 py-3 md:px-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
								open,
								onOpenChange: setOpen,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "icon",
										className: "md:hidden",
										"aria-label": "Open menu",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
									side: "left",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarBody, { onNavigate: () => setOpen(false) })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-w-0 flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanySwitcher, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden text-right sm:block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "Book cash"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
									amount: cash,
									currency: data.settings.currency,
									className: "text-sm font-medium"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindButton, { onClick: () => setFindOpen(true) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, { compact: true }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportMenu, { data })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNav, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: cn("mx-auto w-full min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8", wide ? "max-w-none" : "max-w-6xl"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("no-print flex flex-col gap-3", compact ? "mb-3" : "mb-6", align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: cn("font-display font-medium tracking-tight", compact ? "text-2xl whitespace-nowrap md:text-3xl" : "text-3xl md:text-4xl"),
							children: title
						}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("mt-1 text-sm text-muted-foreground", align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"),
							children: description
						}) : null] }), actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("flex flex-wrap gap-2", align === "center" && "justify-center"),
							children: actions
						}) : null]
					}), children]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				className: "no-print",
				position: "bottom-right",
				theme: resolved,
				richColors: false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordSheet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindTransaction, {
				open: findOpen,
				onClose: () => setFindOpen(false)
			})
		]
	});
}
//#endregion
export { SelectItem as A, VendorCenter as B, InvoiceBadge as C, ReceiptBadge as D, NewCompanyDialog as E, Tabs as F, useEntrySort as G, openCashLine as H, TabsContent as I, TabsList as L, SelectValue as M, ShopTick as N, Select as O, StatusLabel as P, TabsTrigger as R, Input as S, Money as T, openProps as U, moveId as V, stopOpen as W, DropdownMenuItem as _, CheckBadge as a, ExportMenu as b, CustomerCenter as c, DialogDescription as d, DialogFooter as f, DropdownMenuContent as g, DropdownMenu as h, BillBadge as i, SelectTrigger as j, SelectContent as k, Dialog as l, DialogTitle as m, AppearancePicker as n, ConfirmDelete as o, DialogHeader as p, Badge as r, CsvButton as s, AppShell as t, DialogContent as u, DropdownMenuTrigger as v, Label as w, Field as x, EntryLines as y, Textarea as z };
