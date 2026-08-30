import { i as __toESM } from "../_runtime.mjs";
import { l as require_react_dom, u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { A as ChevronLeft, V as ArrowLeftRight, f as Printer, j as ChevronDown, k as ChevronRight, s as SlidersHorizontal, w as Funnel } from "../_libs/lucide-react.mjs";
import { I as formatShortDate, M as filterCashLines, N as filterDirection, O as datePresetRange, P as formatDate, S as cashRegisterRows, X as openingForBanks, Z as parseAmountToCents, c as REGISTER_COLS, et as rescheduleKind, it as toggleRegisterCol, k as deletableLines, l as REGISTER_COL_CLASS, lt as useFinanceData, mt as withRunningBalance, o as KIND_LABEL, ot as totals, pt as withOpening, q as movableLines, r as DEFAULT_REGISTER_COLS, rt as todayIso, t as Button, u as TYPE_FILTERS, ut as useFinanceStore, v as boardDates, w as cn, y as cashBook } from "./store-zEGD4c48.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, D as ReceiptBadge, G as useEntrySort, H as openCashLine, M as SelectValue, N as ShopTick, O as Select, P as StatusLabel, S as Input, T as Money, W as stopOpen, a as CheckBadge, d as DialogDescription, f as DialogFooter, j as SelectTrigger, k as SelectContent, l as Dialog, m as DialogTitle, o as ConfirmDelete, p as DialogHeader, r as Badge, s as CsvButton, t as AppShell, u as DialogContent, w as Label } from "./app-shell-Dw047gD3.mjs";
import { t as DragHandle } from "./drag-handle-DR58GmIZ.mjs";
import { t as SortHeader } from "./sort-header-BR4Tb6bQ.mjs";
import { t as useWindowVirtualizer } from "../_libs/@tanstack/react-virtual+[...].mjs";
import { t as Switch } from "./switch-Du7ZaScO.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/radix-ui__react-popover.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register-Bo65rkjY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function ColumnChips({ cols, onToggle, onShowAll, compact = false }) {
	const allOn = REGISTER_COLS.filter((col) => cols[col.id]).length === REGISTER_COLS.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
				children: "Columns"
			}), onShowAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-xs font-medium text-muted-foreground disabled:opacity-40",
				disabled: allOn,
				onClick: onShowAll,
				children: "Show all"
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-1",
			role: "group",
			"aria-label": "Register columns",
			children: [REGISTER_COLS.map((col) => {
				const on = cols[col.id];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": on,
					"aria-label": `${on ? "Hide" : "Show"} ${col.label}`,
					className: cn("inline-flex items-center rounded-full px-3 text-sm font-medium", compact ? "h-9 min-h-9" : "h-10 min-h-10", on ? "bg-background text-foreground elevation" : "bg-muted text-muted-foreground"),
					onClick: () => onToggle(col.id),
					children: col.label
				}, col.id);
			}), compact && onShowAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "inline-flex h-9 min-h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground disabled:opacity-40",
				disabled: allOn,
				onClick: onShowAll,
				children: "Show all"
			}) : null]
		}),
		compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted-foreground",
			children: "Hide columns to fit more of the book on screen. Last balance stays in the totals row."
		})
	] });
}
var ROWS = {
	portrait: 16,
	landscape: 12
};
function chunkPages(items, size) {
	if (items.length === 0) return [[]];
	const pages = [];
	for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
	return pages;
}
function PrintStatus({ line }) {
	if (line.kind === "check") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: line.status });
	if (line.kind === "receipt" || line.kind === "payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBadge, {
		status: line.status,
		kind: line.kind === "receipt" ? "cash-sale" : "payment",
		method: line.method
	});
	if (line.kind === "transfer") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "internal",
		children: "Internal"
	});
	if (!line.status) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusLabel, { status: line.status });
}
function RegisterPrintPreview({ open, onClose, companyName, companyAddress, companyPhone, companyEmail, bankLabel, lines, banks, currency, fontSize, cols, onColsChange, onToggleCol }) {
	const [scope, setScope] = (0, import_react.useState)("all");
	const [orient, setOrient] = (0, import_react.useState)("portrait");
	const [page, setPage] = (0, import_react.useState)(0);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [printReady, setPrintReady] = (0, import_react.useState)(false);
	const pages = (0, import_react.useMemo)(() => chunkPages(lines, ROWS[orient]), [lines, orient]);
	const pageCount = pages.length;
	const current = Math.min(page, pageCount - 1);
	const grandOut = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
	const grandIn = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
	const grandLast = lines.at(-1)?.balance ?? 0;
	const printIndexes = scope === "one" ? [current] : pages.map((_, i) => i);
	const shownCount = REGISTER_COLS.filter((c) => cols[c.id]).length;
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		document.body.classList.add("printing-preview");
		document.body.dataset.printScope = scope;
		document.body.dataset.printOrient = orient;
		const style = document.createElement("style");
		style.setAttribute("data-register-print-page", "true");
		style.textContent = `@page { size: ${orient}; margin: 0.45in; }`;
		document.head.appendChild(style);
		return () => {
			document.body.classList.remove("printing-preview");
			delete document.body.dataset.printScope;
			delete document.body.dataset.printOrient;
			style.remove();
		};
	}, [
		open,
		scope,
		orient
	]);
	(0, import_react.useEffect)(() => {
		if (open) setPage(0);
	}, [
		open,
		lines.length,
		orient
	]);
	(0, import_react.useLayoutEffect)(() => {
		if (!printReady) return;
		const id = requestAnimationFrame(() => {
			window.print();
			setPrintReady(false);
		});
		return () => cancelAnimationFrame(id);
	}, [printReady]);
	function toggleCol(id) {
		if (onToggleCol) onToggleCol(id);
		else onColsChange(toggleRegisterCol(cols, id));
	}
	function printNow() {
		document.body.dataset.printScope = scope;
		document.body.dataset.printOrient = orient;
		setPrintReady(true);
	}
	const sheetProps = {
		companyName,
		companyAddress: companyAddress ?? "",
		companyPhone: companyPhone ?? "",
		companyEmail: companyEmail ?? "",
		bankLabel,
		pageCount,
		banks,
		currency,
		fontSize: fontSize ?? 12,
		grandOut,
		grandIn,
		grandLast,
		scope,
		orient,
		cols
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "print-preview-dialog no-print flex max-w-5xl flex-col overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
					className: "shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Print preview" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "One paper-shaped page on screen. Hide columns, then Print / Save PDF — the browser dialog is how you save a PDF." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex shrink-0 flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row sm:items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								label: "Print range",
								value: scope,
								onChange: setScope,
								options: [{
									id: "one",
									label: "This page"
								}, {
									id: "all",
									label: "All pages"
								}]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								label: "Page orientation",
								value: orient,
								onChange: setOrient,
								options: [{
									id: "portrait",
									label: "Portrait"
								}, {
									id: "landscape",
									label: "Landscape"
								}]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 sm:ml-auto",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										size: "sm",
										className: "min-h-10 min-w-10",
										disabled: current <= 0,
										onClick: () => setPage((p) => Math.max(0, p - 1)),
										"aria-label": "Previous page",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-16 text-center text-sm tabular-nums",
										children: [
											current + 1,
											" / ",
											pageCount
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										size: "sm",
										className: "min-h-10 min-w-10",
										disabled: current >= pageCount - 1,
										onClick: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
										"aria-label": "Next page",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColumnChips, {
						cols,
						onToggle: toggleCol,
						onShowAll: () => onColsChange({ ...DEFAULT_REGISTER_COLS })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "print-pdf-stage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
						className: "print-preview-figure",
						"data-preview-page": current,
						"data-current": "true",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintPage, {
							current: true,
							page: current + 1,
							lines: pages[current] ?? [],
							...sheetProps
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
							className: "print-preview-caption",
							children: [
								"Page ",
								current + 1,
								" of ",
								pageCount,
								scope === "all" ? " · printing every page" : " · printing this page"
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "mt-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: onClose,
						children: "Close"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: printNow,
						disabled: shownCount === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print / Save PDF"]
					})]
				})
			]
		})
	}), mounted && open && printReady ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-root",
		"data-orient": orient,
		"aria-hidden": "true",
		children: printIndexes.map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintPage, {
			current: index === current,
			page: index + 1,
			lines: pages[index] ?? [],
			...sheetProps
		}, index))
	}), document.body) : null] });
}
function Seg({ label, value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inline-flex w-fit rounded-xl bg-muted p-1",
		role: "group",
		"aria-label": label,
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": value === opt.id,
			className: cn("inline-flex h-10 min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground", value === opt.id && "bg-card text-foreground elevation"),
			onClick: () => onChange(opt.id),
			children: opt.label
		}, opt.id))
	});
}
function PrintPage({ current, companyName, companyAddress, companyPhone, companyEmail, bankLabel, page, pageCount, lines, banks, currency, fontSize, grandOut, grandIn, grandLast, scope, orient, cols }) {
	const outTotal = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
	const inTotal = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
	const lastBalance = lines.at(-1)?.balance ?? 0;
	const showGrand = scope === "all" && page === pageCount;
	const visible = REGISTER_COLS.filter((c) => cols[c.id]);
	const lead = visible.findIndex((c) => c.id === "payment" || c.id === "deposit" || c.id === "balance");
	const labelSpan = lead === -1 ? visible.length : lead;
	const contact = [companyPhone, companyEmail].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "print-sheet",
		"data-current": current ? "true" : void 0,
		"data-orient": orient,
		style: { ["--register-font"]: `${fontSize}px` },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "register-print-head",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "print-company",
					children: companyName
				}),
				companyAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: companyAddress }) : null,
				contact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: contact }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Bank Register" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					bankLabel,
					" · ",
					formatDate(todayIso()),
					" · Page ",
					page,
					" of ",
					pageCount
				] })
			]
		}), lines.length === 0 || visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "print-sheet-empty",
			children: "Nothing to print for these filters."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "register-print-table",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: visible.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: REGISTER_COL_CLASS[col.id],
					children: col.label
				}, col.id)) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lines.map((line) => {
					const bank = banks.find((b) => b.id === line.bankId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: visible.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: REGISTER_COL_CLASS[col.id],
						children: renderCell(col.id, line, bank?.nickname ?? "", currency)
					}, col.id)) }, line.id);
				}) }),
				cols.payment || cols.deposit || cols.balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: visible.map((col, i) => {
					if (labelSpan > 0 && i === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: labelSpan,
						children: showGrand ? "Totals" : "This page"
					}, "label");
					if (labelSpan > 0 && i < labelSpan) return null;
					if (col.id === "payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `${REGISTER_COL_CLASS.payment} num`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: showGrand ? grandOut : outTotal,
							currency,
							className: "text-debit"
						})
					}, col.id);
					if (col.id === "deposit") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `${REGISTER_COL_CLASS.deposit} num`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: showGrand ? grandIn : inTotal,
							currency,
							className: "text-credit"
						})
					}, col.id);
					if (col.id === "balance") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `${REGISTER_COL_CLASS.balance} num`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
							amount: showGrand ? grandLast : lastBalance,
							currency
						})
					}, col.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: REGISTER_COL_CLASS[col.id] }, col.id);
				}) }) }) : null
			]
		})]
	});
}
function renderCell(id, line, bank, currency) {
	if (id === "date") return line.kind === "opening" && !line.date ? "Opening" : formatDate(line.date);
	if (id === "type") return KIND_LABEL[line.kind];
	if (id === "number") return line.number || "—";
	if (id === "payee") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-medium",
		children: line.party
	});
	if (id === "memo") return line.memo || "—";
	if (id === "bank") return bank || "—";
	if (id === "payment") return line.payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
		amount: line.payment,
		currency,
		className: "text-debit"
	}) : "—";
	if (id === "deposit") return line.deposit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
		amount: line.deposit,
		currency,
		className: "text-credit"
	}) : "—";
	if (id === "balance") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
		amount: line.balance,
		currency
	});
	if (id === "status") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintStatus, { line });
	return null;
}
var POST_KEY = "finance-manager-post";
function RegisterPost({ defaultBankId }) {
	const data = useFinanceData();
	const issueCheck = useFinanceStore((s) => s.issueCheck);
	const createCashSale = useFinanceStore((s) => s.createCashSale);
	const transferBanks = useFinanceStore((s) => s.transferBanks);
	const banks = data.banks.filter((b) => !b.archived);
	const expense = data.accounts.find((a) => a.code === "5900") ?? data.accounts.find((a) => a.type === "expense");
	const fallbackBank = defaultBankId && banks.some((b) => b.id === defaultBankId) ? defaultBankId : banks[0]?.id ?? "";
	const payeeRef = (0, import_react.useRef)(null);
	const amountRef = (0, import_react.useRef)(null);
	const [kind, setKind] = (0, import_react.useState)("check");
	const [payee, setPayee] = (0, import_react.useState)("");
	const [bankId, setBankId] = (0, import_react.useState)(fallbackBank);
	const [toBankId, setToBankId] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)(todayIso());
	const [open, setOpen] = (0, import_react.useState)(true);
	(0, import_react.useLayoutEffect)(() => {
		try {
			setOpen(localStorage.getItem(POST_KEY) !== "off");
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (fallbackBank) setBankId(fallbackBank);
	}, [fallbackBank]);
	const fromId = bankId || fallbackBank;
	const toId = toBankId && toBankId !== fromId ? toBankId : banks.find((b) => b.id !== fromId)?.id ?? "";
	const payees = [...data.customers.map((c) => c.name), ...data.vendors.map((v) => v.name)].filter((name, i, all) => name && all.indexOf(name) === i);
	function toggle() {
		setOpen((on) => {
			const next = !on;
			try {
				localStorage.setItem(POST_KEY, next ? "on" : "off");
			} catch {}
			return next;
		});
	}
	function chooseKind(next) {
		setKind(next);
		if (next === "transfer") {
			const dest = banks.find((b) => b.id !== fromId)?.id ?? "";
			setToBankId(dest);
		}
	}
	function chooseFrom(id) {
		setBankId(id);
		if (kind === "transfer" && id === toBankId) setToBankId(banks.find((b) => b.id !== id)?.id ?? "");
	}
	function snapFocus() {
		requestAnimationFrame(() => {
			if (kind === "transfer") amountRef.current?.focus();
			else payeeRef.current?.focus();
		});
	}
	function post() {
		const dest = fromId;
		if (!dest) {
			toast.error("Select which bank this hits.");
			return;
		}
		const cents = parseAmountToCents(amount);
		if (cents <= 0) {
			toast.error("Enter an amount.");
			amountRef.current?.focus();
			return;
		}
		try {
			if (kind === "transfer") {
				if (banks.length < 2) throw new Error("Add another bank first.");
				if (!toId || toId === dest) throw new Error("Pick a different bank to receive it.");
				const fromName = banks.find((b) => b.id === dest)?.nickname ?? "bank";
				const toName = banks.find((b) => b.id === toId)?.nickname ?? "bank";
				transferBanks({
					fromId: dest,
					toId,
					date,
					amount: cents,
					memo: ""
				});
				toast.success(`Transferred ${fromName} → ${toName}.`);
				setAmount("");
				snapFocus();
				return;
			}
			const name = payee.trim();
			if (!name) {
				toast.error("Enter a payee.");
				payeeRef.current?.focus();
				return;
			}
			if (kind === "check") {
				if (!expense) throw new Error("No expense account on the books.");
				const vendor = data.vendors.find((v) => v.name.toLowerCase() === name.toLowerCase());
				issueCheck({
					bankId: dest,
					payee: name,
					issueDate: date,
					postDate: date,
					amount: cents,
					memo: "Posted from register",
					accountId: expense.id,
					vendorId: vendor?.id
				});
				toast.success(`Check posted to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`);
			} else {
				createCashSale({
					date,
					bankId: dest,
					receivedFrom: name,
					customerId: data.customers.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id,
					lines: [{
						description: "Cash received",
						quantity: 1,
						unitPrice: cents
					}],
					notes: "Posted from register",
					method: "cash"
				});
				toast.success(`Receipt deposited to ${banks.find((b) => b.id === dest)?.nickname ?? "bank"}.`);
			}
			setPayee("");
			setAmount("");
			snapFocus();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not post.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "register-post-well no-print",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "flex min-h-10 w-full items-center gap-2 px-1 text-left",
			"aria-expanded": open,
			"aria-label": open ? "Hide post" : "Add entry",
			onClick: toggle,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "eyebrow",
					children: "Post"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto text-sm font-medium",
					children: open ? "Hide" : "Add entry"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 text-muted-foreground transition-transform duration-150", open && "rotate-180") })
			]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
			className: "mt-2",
			onSubmit: (e) => {
				e.preventDefault();
				post();
			},
			onKeyDown: (e) => {
				if (e.key !== "Escape") return;
				if (e.target?.closest("[data-radix-select-content]")) return;
				e.preventDefault();
				setPayee("");
				setAmount("");
				snapFocus();
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "register-post-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "register-post-context",
						role: "group",
						"aria-label": "Date and bank",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							"aria-label": "Date",
							className: "register-post-date h-9 min-h-9"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: fromId,
							onValueChange: chooseFrom,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "h-9 min-h-9",
								"aria-label": kind === "transfer" ? "From bank" : "Bank",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: kind === "transfer" ? "From" : "Bank" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: b.id,
								children: b.nickname
							}, b.id)) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "register-post-vars",
						role: "group",
						"aria-label": "Entry",
						children: [
							kind === "transfer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: toId,
								onValueChange: setToBankId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "register-post-payee h-9 min-h-9 w-full",
									"aria-label": "To bank",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "To" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.filter((b) => b.id !== fromId).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: b.id,
									children: b.nickname
								}, b.id)) })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								ref: payeeRef,
								value: payee,
								onChange: (e) => setPayee(e.target.value),
								placeholder: kind === "check" ? "Payee" : "Received from",
								"aria-label": "Payee",
								list: "register-payees",
								autoComplete: "off",
								className: "register-post-payee h-9 min-h-9"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "register-payees",
								children: payees.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: name }, name))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								ref: amountRef,
								value: amount,
								onChange: (e) => setAmount(e.target.value),
								placeholder: "Amount",
								inputMode: "decimal",
								"aria-label": "Amount",
								className: "register-post-amount h-9 min-h-9"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: kind,
								onValueChange: (v) => chooseKind(v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-9 min-h-9",
									"aria-label": "Entry type",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "check",
										children: "Check"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "receipt",
										children: "Receive"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "transfer",
										children: "Transfer"
									})
								] })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						className: "register-post-submit h-9 min-h-9",
						children: "Post"
					})
				]
			})
		}) : null]
	});
}
function holdingBank(banks) {
	return banks.find((b) => /safe|undeposit|hold|petty/i.test(`${b.nickname} ${b.name}`));
}
function operatingBank(banks, exceptId) {
	const rest = banks.filter((b) => b.id !== exceptId);
	return rest.find((b) => /operat|checking/i.test(`${b.nickname} ${b.name}`)) ?? rest[0];
}
function RegisterSwap({ banks, lines, selectedIds, preferFromId, onSelectIds, onMoved }) {
	const reassignCashBanks = useFinanceStore((s) => s.reassignCashBanks);
	const live = (0, import_react.useMemo)(() => banks.filter((b) => !b.archived), [banks]);
	const holdId = holdingBank(live)?.id ?? live[0]?.id ?? "";
	const seedFrom = preferFromId && live.some((b) => b.id === preferFromId) ? preferFromId : holdId;
	const [fromId, setFromId] = (0, import_react.useState)(seedFrom);
	const [toId, setToId] = (0, import_react.useState)(() => operatingBank(live, seedFrom)?.id ?? "");
	const selectedBankIds = (0, import_react.useMemo)(() => {
		const set = new Set(selectedIds);
		return [...new Set(lines.filter((l) => set.has(l.id) && l.reassignable).map((l) => l.bankId))];
	}, [lines, selectedIds]);
	(0, import_react.useEffect)(() => {
		if (selectedBankIds.length === 1 && selectedBankIds[0]) {
			setFromId(selectedBankIds[0]);
			return;
		}
		if (preferFromId && live.some((b) => b.id === preferFromId)) {
			setFromId(preferFromId);
			return;
		}
		if (!fromId && holdId) setFromId(holdId);
	}, [
		preferFromId,
		holdId,
		fromId,
		live,
		selectedBankIds
	]);
	(0, import_react.useEffect)(() => {
		if (toId && toId !== fromId && live.some((b) => b.id === toId)) return;
		const next = operatingBank(live, fromId);
		if (next) setToId(next.id);
	}, [
		fromId,
		toId,
		live
	]);
	const onFrom = (0, import_react.useMemo)(() => lines.filter((l) => l.reassignable && l.bankId === fromId && l.bankId !== toId), [
		lines,
		fromId,
		toId
	]);
	const picked = (0, import_react.useMemo)(() => {
		if (selectedIds.length === 0) return onFrom;
		const set = new Set(selectedIds);
		return lines.filter((l) => l.reassignable && set.has(l.id) && l.bankId !== toId);
	}, [
		lines,
		selectedIds,
		toId,
		onFrom
	]);
	const usingSelection = selectedIds.length > 0;
	const fromName = live.find((b) => b.id === fromId)?.nickname ?? "bank";
	const toName = live.find((b) => b.id === toId)?.nickname ?? "bank";
	const allFromOn = onFrom.length > 0 && onFrom.every((l) => selectedIds.includes(l.id));
	const someFromOn = onFrom.some((l) => selectedIds.includes(l.id)) && !allFromOn;
	const count = picked.length;
	const ready = Boolean(fromId && toId && fromId !== toId && count > 0);
	function toggleFrom(on) {
		const fromSet = new Set(onFrom.map((l) => l.id));
		if (on) {
			onSelectIds([.../* @__PURE__ */ new Set([...selectedIds, ...fromSet])]);
			return;
		}
		onSelectIds(selectedIds.filter((id) => !fromSet.has(id)));
	}
	function run() {
		if (!ready) return;
		try {
			reassignCashBanks(picked.map((l) => ({
				kind: l.kind,
				sourceId: l.sourceId,
				fromBankId: l.bankId
			})), toId);
			toast.success(count === 1 ? `${picked[0].party} moved to ${toName}.` : `${count} lines moved to ${toName}.`);
			onMoved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not swap bank.");
		}
	}
	if (live.length < 2) return null;
	if (selectedIds.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "no-print flex flex-col gap-2 rounded-xl bg-card p-2 elevation sm:flex-row sm:flex-wrap sm:items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopTick, {
				checked: allFromOn,
				indeterminate: someFromOn,
				onChange: toggleFrom,
				label: `Select all on ${fromName}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase",
				children: "Move"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: fromId,
				onValueChange: setFromId,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "h-9 min-h-9 sm:w-40",
					"aria-label": "From bank",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "From bank" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: live.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: b.id,
					children: b.nickname
				}, b.id)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden px-1 text-muted-foreground sm:inline",
				"aria-hidden": true,
				children: "→"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: toId,
				onValueChange: setToId,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "h-9 min-h-9 sm:w-40",
					"aria-label": "To bank",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "To bank" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: live.filter((b) => b.id !== fromId).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: b.id,
					children: b.nickname
				}, b.id)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: usingSelection ? `${selectedIds.length} selected` : count === 0 ? `None on ${fromName}` : `All ${count} on ${fromName}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "w-fit shrink-0 sm:ml-auto",
				size: "sm",
				disabled: !ready,
				onClick: run,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, {}), count === 0 ? `Nothing to move` : usingSelection ? `Move ${count} to ${toName}` : `Move all ${count} to ${toName}`]
			})
		]
	});
}
var Popover = Root2;
var PopoverTrigger = Trigger;
function PopoverContent({ className, align = "end", sideOffset = 6, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		align,
		sideOffset,
		className: cn("z-50 w-72 overflow-y-auto rounded-xl bg-popover p-3 text-popover-foreground elevation outline-none", className),
		...props
	}) });
}
var UI_KEY = "finance-manager-register-ui";
var YEAR_RANGE = datePresetRange("year");
var SORT_OPTIONS = [
	{
		value: "date:asc",
		label: "Date · oldest"
	},
	{
		value: "date:desc",
		label: "Date · newest"
	},
	{
		value: "type:asc",
		label: "Type"
	},
	{
		value: "number:asc",
		label: "Number"
	},
	{
		value: "payee:asc",
		label: "Payee A–Z"
	},
	{
		value: "payee:desc",
		label: "Payee Z–A"
	},
	{
		value: "memo:asc",
		label: "Memo"
	},
	{
		value: "bank:asc",
		label: "Bank"
	},
	{
		value: "payment:desc",
		label: "Payment"
	},
	{
		value: "deposit:desc",
		label: "Deposit"
	}
];
function RegisterPage() {
	const data = useFinanceData();
	const rescheduleCashLine = useFinanceStore((s) => s.rescheduleCashLine);
	const removeCashLines = useFinanceStore((s) => s.removeCashLines);
	const reassignCashBank = useFinanceStore((s) => s.reassignCashBank);
	const updateSettings = useFinanceStore((s) => s.updateSettings);
	const patch = useFinanceStore((s) => s.patch);
	const [bankFilter, setBankFilter] = (0, import_react.useState)("all");
	const [direction, setDirection] = (0, import_react.useState)("all");
	const [nameFilter, setNameFilter] = (0, import_react.useState)("");
	const [typeFilter, setTypeFilter] = (0, import_react.useState)("all");
	const [datePreset, setDatePreset] = (0, import_react.useState)("year");
	const [dateFrom, setDateFrom] = (0, import_react.useState)(YEAR_RANGE.from);
	const [dateTo, setDateTo] = (0, import_react.useState)(YEAR_RANGE.to);
	const [uiReady, setUiReady] = (0, import_react.useState)(false);
	const [dragOn, setDragOn] = (0, import_react.useState)(false);
	const [extraDates, setExtraDates] = (0, import_react.useState)([]);
	const [dragging, setDragging] = (0, import_react.useState)(null);
	const [overDate, setOverDate] = (0, import_react.useState)(null);
	const [overRow, setOverRow] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [allowDelete, setAllowDelete] = (0, import_react.useState)(false);
	const [printOpen, setPrintOpen] = (0, import_react.useState)(false);
	const fontSize = data.settings.registerFontSize ?? 12;
	const cols = data.settings.registerColumns ?? DEFAULT_REGISTER_COLS;
	const dataRef = (0, import_react.useRef)(data);
	dataRef.current = data;
	const banksRef = (0, import_react.useRef)(data.banks);
	banksRef.current = data.banks;
	(0, import_react.useLayoutEffect)(() => {
		try {
			const raw = localStorage.getItem(UI_KEY);
			if (raw) {
				const saved = JSON.parse(raw);
				if (saved.bankFilter) setBankFilter(saved.bankFilter);
				if (saved.datePreset === "month" || saved.datePreset === "year") {
					const range = datePresetRange(saved.datePreset);
					setDatePreset(saved.datePreset);
					setDateFrom(range.from);
					setDateTo(range.to);
				} else if (saved.datePreset === "all") {
					setDatePreset("all");
					setDateFrom("");
					setDateTo("");
				} else if (saved.datePreset === "custom") {
					setDatePreset("custom");
					setDateFrom(saved.dateFrom ?? "");
					setDateTo(saved.dateTo ?? "");
				}
			}
		} catch {}
		setUiReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!uiReady) return;
		try {
			localStorage.setItem(UI_KEY, JSON.stringify({
				bankFilter,
				datePreset,
				dateFrom,
				dateTo
			}));
		} catch {}
	}, [
		uiReady,
		bankFilter,
		datePreset,
		dateFrom,
		dateTo
	]);
	function applyPreset(preset) {
		setDatePreset(preset);
		if (preset === "month" || preset === "year") {
			const range = datePresetRange(preset);
			setDateFrom(range.from);
			setDateTo(range.to);
			return;
		}
		if (preset === "all") {
			setDateFrom("");
			setDateTo("");
		}
	}
	function setRegisterCols(mutate) {
		patch((d) => ({
			...d,
			settings: {
				...d.settings,
				registerColumns: mutate(d.settings.registerColumns ?? DEFAULT_REGISTER_COLS)
			}
		}));
	}
	const bankId = bankFilter === "all" ? void 0 : bankFilter;
	const book = (0, import_react.useMemo)(() => cashBook(data, bankId, {
		dateFrom,
		dateTo
	}), [
		data,
		bankId,
		dateFrom,
		dateTo
	]);
	const opening = book.opening;
	const raw = book.lines;
	const directed = (0, import_react.useMemo)(() => filterDirection(raw, direction), [raw, direction]);
	const filtered = (0, import_react.useMemo)(() => filterCashLines(directed, {
		name: nameFilter,
		type: typeFilter
	}), [
		directed,
		nameFilter,
		typeFilter
	]);
	const searching = Boolean(nameFilter.trim() || typeFilter !== "all");
	const bankOpen = (0, import_react.useMemo)(() => openingForBanks(data, bankId), [data, bankId]);
	const asOf = (0, import_react.useMemo)(() => dateFrom ? {
		date: dateFrom,
		forward: opening !== bankOpen
	} : void 0, [
		dateFrom,
		opening,
		bankOpen
	]);
	const tableSource = (0, import_react.useMemo)(() => searching ? filtered : withOpening(filtered, opening, asOf), [
		searching,
		filtered,
		opening,
		asOf
	]);
	const windowed = (0, import_react.useMemo)(() => withOpening(raw, opening, asOf), [
		raw,
		opening,
		asOf
	]);
	const windowBalanced = (0, import_react.useMemo)(() => withRunningBalance(windowed), [windowed]);
	const balanced = (0, import_react.useMemo)(() => withRunningBalance(tableSource), [tableSource]);
	const stats = (0, import_react.useMemo)(() => totals(raw), [raw]);
	const ending = windowBalanced.at(-1)?.balance ?? opening;
	const dates = (0, import_react.useMemo)(() => boardDates(filtered, extraDates), [filtered, extraDates]);
	const deletable = (0, import_react.useMemo)(() => deletableLines(balanced), [balanced]);
	const movable = (0, import_react.useMemo)(() => movableLines(balanced), [balanced]);
	const keepIds = (0, import_react.useMemo)(() => {
		const ids = /* @__PURE__ */ new Set();
		for (const line of movable) ids.add(line.id);
		for (const line of deletable) ids.add(line.id);
		return ids;
	}, [movable, deletable]);
	const selectedIds = (0, import_react.useMemo)(() => selected.filter((id) => keepIds.has(id)), [selected, keepIds]);
	const selectedOn = (0, import_react.useMemo)(() => new Set(selectedIds), [selectedIds]);
	const allOn = movable.length > 0 && movable.every((l) => selectedOn.has(l.id));
	const someOn = selectedIds.length > 0 && !allOn;
	const openingRow = (0, import_react.useMemo)(() => balanced.find((l) => l.kind === "opening"), [balanced]);
	const dataRows = (0, import_react.useMemo)(() => balanced.filter((l) => l.kind !== "opening"), [balanced]);
	const getters = (0, import_react.useMemo)(() => ({
		date: (l) => l.date,
		type: (l) => KIND_LABEL[l.kind],
		number: (l) => l.number,
		payee: (l) => l.party,
		memo: (l) => l.memo,
		bank: (l) => data.banks.find((b) => b.id === l.bankId)?.nickname ?? "",
		payment: (l) => l.payment,
		deposit: (l) => l.deposit
	}), [data.banks]);
	const sort = useEntrySort(dataRows, "date", getters, "asc");
	const display = (0, import_react.useMemo)(() => openingRow && !searching ? [openingRow, ...sort.sorted] : sort.sorted, [
		openingRow,
		searching,
		sort.sorted
	]);
	const liveBanks = data.banks.filter((b) => !b.archived);
	const bankLabel = bankFilter === "all" ? "All banks" : data.banks.find((b) => b.id === bankFilter)?.nickname ?? "";
	(0, import_react.useEffect)(() => {
		if (bankFilter === "all") return;
		if (!data.banks.some((b) => !b.archived && b.id === bankFilter)) setBankFilter("all");
	}, [bankFilter, data.banks]);
	const moveLine = (0, import_react.useCallback)((line, date) => {
		const kind = rescheduleKind(line.kind);
		if (!kind || !line.reschedulable) return;
		if (line.date === date) return;
		try {
			rescheduleCashLine({
				kind,
				sourceId: line.sourceId,
				date
			});
			toast.success(`${line.number || KIND_LABEL[line.kind]} moved to ${formatDate(date)}.`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not move.");
		}
	}, [rescheduleCashLine]);
	const swapBank = (0, import_react.useCallback)((line, nextBankId) => {
		if (!line.reassignable || line.bankId === nextBankId) return;
		const dest = banksRef.current.find((b) => b.id === nextBankId);
		try {
			reassignCashBank({
				kind: line.kind,
				sourceId: line.sourceId,
				bankId: nextBankId,
				fromBankId: line.bankId
			});
			toast.success(`${line.party} moved to ${dest?.nickname ?? "bank"}.`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not swap bank.");
		}
	}, [reassignCashBank]);
	const parseDrag = (0, import_react.useCallback)((e) => {
		try {
			const rawId = e.dataTransfer.getData("text/plain");
			return filtered.find((l) => l.id === rawId) ?? null;
		} catch {
			return null;
		}
	}, [filtered]);
	const toggleOne = (0, import_react.useCallback)((id) => {
		setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	}, []);
	function toggleAll(on) {
		setSelected(on ? movable.map((l) => l.id) : []);
	}
	const handleOpen = (0, import_react.useCallback)((line) => {
		openCashLine(line, dataRef.current);
	}, []);
	const handleDragStart = (0, import_react.useCallback)((id) => setDragging(id), []);
	const handleDragEnd = (0, import_react.useCallback)(() => {
		setDragging(null);
		setOverDate(null);
		setOverRow(null);
	}, []);
	const handleDropRow = (0, import_react.useCallback)((target, e) => {
		const line = parseDrag(e);
		setOverRow(null);
		setDragging(null);
		if (line && target.kind !== "opening") moveLine(line, target.date);
	}, [parseDrag, moveLine]);
	function targets(ids) {
		return deletable.filter((l) => ids.includes(l.id)).map((l) => ({
			kind: l.kind,
			sourceId: l.sourceId
		}));
	}
	function runDelete(mode) {
		const ids = mode === "all" ? deletable.map((l) => l.id) : selectedIds;
		if (ids.length === 0) return;
		try {
			removeCashLines(targets(ids));
			toast.success(ids.length === 1 ? "Entry deleted." : `${ids.length} entries deleted.`);
			setSelected([]);
			setAllowDelete(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not delete.");
		} finally {
			setConfirm(null);
		}
	}
	const deleteCount = confirm === "all" ? deletable.length : selectedIds.length;
	const requireDeletePhrase = confirm === "all" || deleteCount > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Bank register",
		description: "Inflows and outflows across every bank. Park receipts in safekeeping, then move them when they land.",
		align: "center",
		compact: true,
		wide: true,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
				filename: "bank-register.csv",
				rows: cashRegisterRows(data, bankId)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				onClick: () => setPrintOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "ghost",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/checks",
					children: "Issue check"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "ghost",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/receipts",
					children: "Receive"
				})
			})
		] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "register-print-head print-only",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: data.settings.companyName }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Bank Register" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						bankLabel,
						" · ",
						formatDate(todayIso())
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "register-summary no-print mb-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-2xl bg-card px-3 py-2 text-center text-xs elevation",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["In ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: stats.inflow,
						currency: data.settings.currency,
						className: "text-credit font-medium"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Out ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: stats.outflow,
						currency: data.settings.currency,
						className: "text-debit font-medium"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Last balance ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: ending,
						currency: data.settings.currency,
						className: "font-medium"
					})] }),
					dateFrom || dateTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: [
							dateFrom ? formatShortDate(dateFrom) : "…",
							" – ",
							dateTo ? formatShortDate(dateTo) : "…"
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "register-view no-print mb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "register-toolbar",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: nameFilter,
							onChange: (e) => setNameFilter(e.target.value),
							placeholder: "Payee, number, memo",
							"aria-label": "Search register",
							className: "register-toolbar-search h-9 min-h-9"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterFilters, {
							typeFilter,
							direction,
							datePreset,
							dateFrom,
							dateTo,
							sortValue: `${sort.key}:${sort.dir}`,
							onType: setTypeFilter,
							onDirection: setDirection,
							onPreset: applyPreset,
							onDateFrom: (v) => {
								setDatePreset("custom");
								setDateFrom(v);
							},
							onDateTo: (v) => {
								setDatePreset("custom");
								setDateTo(v);
							},
							onSort: (v) => {
								const [key, dir] = v.split(":");
								sort.set(key, dir === "desc" ? "desc" : "asc");
							},
							onClear: () => {
								setTypeFilter("all");
								setDirection("all");
								applyPreset("year");
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewOptions, {
							fontSize,
							allowDelete,
							dragOn,
							cols,
							hiddenCount: REGISTER_COLS.filter((col) => !cols[col.id]).length,
							onFontSize: (n) => updateSettings({ registerFontSize: n }),
							onAllowDelete: setAllowDelete,
							onDragOn: setDragOn,
							onToggleCol: (id) => setRegisterCols((current) => toggleRegisterCol(current, id)),
							onShowAllCols: () => setRegisterCols(() => ({ ...DEFAULT_REGISTER_COLS }))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: [
						movable.length,
						" ",
						movable.length === 1 ? "entry" : "entries",
						searching ? " match these filters" : "",
						selectedIds.length ? ` · ${selectedIds.length} selected` : " · tick a line to move banks",
						allowDelete ? " · delete unlocked" : ""
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "register-bank-tabs no-print mb-3 min-w-0",
				role: "tablist",
				"aria-label": "Bank",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": bankFilter === "all",
					className: cn(bankFilter === "all" && "is-on"),
					onClick: () => setBankFilter("all"),
					children: "All banks"
				}), liveBanks.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": bankFilter === b.id,
					className: cn(bankFilter === b.id && "is-on"),
					onClick: () => setBankFilter(b.id),
					children: b.nickname
				}, b.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "no-print mb-3",
				"aria-label": "Post",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterPost, { defaultBankId: bankId })
			}),
			dragOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateChips, {
				dates,
				overDate,
				onOverDate: setOverDate,
				onDropDate: (date, e) => {
					const line = parseDrag(e);
					setOverDate(null);
					setDragging(null);
					if (line) moveLine(line, date);
				},
				onAddDate: (date) => setExtraDates((prev) => prev.includes(date) ? prev : [...prev, date])
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: { ["--register-font"]: `${fontSize}px` },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterTable, {
					lines: display,
					currency: data.settings.currency,
					banks: data.banks,
					cols,
					lastBalance: display.at(-1)?.balance ?? ending,
					selected: selectedOn,
					allOn,
					someOn,
					dragOn,
					dragging,
					overRow,
					sortKey: sort.key,
					sortDir: sort.dir,
					onSort: sort.toggle,
					onToggle: toggleOne,
					onToggleAll: toggleAll,
					onOpen: handleOpen,
					onSwap: swapBank,
					onDragStart: handleDragStart,
					onDragEnd: handleDragEnd,
					onOverRow: setOverRow,
					onDropRow: handleDropRow
				})
			}),
			selectedIds.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "register-select-bar no-print mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-5xl flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterSwap, {
						banks: data.banks,
						lines: filtered,
						selectedIds,
						preferFromId: bankId,
						onSelectIds: setSelected,
						onMoved: () => setSelected([])
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm font-medium",
								children: [selectedIds.length, " selected"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => setSelected([]),
								children: "Clear"
							}),
							allowDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "destructive",
								onClick: () => setConfirm("selected"),
								children: "Delete"
							}) : null
						]
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterPrintPreview, {
				open: printOpen,
				onClose: () => setPrintOpen(false),
				companyName: data.settings.companyName,
				companyAddress: data.settings.companyAddress,
				companyPhone: data.settings.companyPhone,
				companyEmail: data.settings.companyEmail,
				bankLabel,
				lines: display,
				banks: data.banks,
				currency: data.settings.currency,
				fontSize,
				cols,
				onColsChange: (next) => setRegisterCols(() => next),
				onToggleCol: (id) => setRegisterCols((current) => toggleRegisterCol(current, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDelete, {
				open: confirm !== null,
				title: confirm === "all" ? "Delete all visible entries?" : "Delete selected entries?",
				body: confirm === "all" ? `Permanently removes ${deletable.length} ${deletable.length === 1 ? "line" : "lines"} from the books. Opening balance stays.` : `Permanently removes ${selectedIds.length} ${selectedIds.length === 1 ? "line" : "lines"} from the books.`,
				confirmLabel: "Delete",
				requirePhrase: requireDeletePhrase ? "DELETE" : void 0,
				onClose: () => setConfirm(null),
				onConfirm: () => confirm && runDelete(confirm)
			})
		]
	});
}
function RegisterFilters({ typeFilter, direction, datePreset, dateFrom, dateTo, sortValue, onType, onDirection, onPreset, onDateFrom, onDateTo, onSort, onClear }) {
	const active = [
		typeFilter !== "all",
		direction !== "all",
		datePreset !== "year"
	].filter(Boolean).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: "h-9 min-h-9 justify-start",
			"aria-label": "Filters",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, {}),
				"Filters",
				active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground",
					children: active
				}) : null
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
		className: "w-80",
		align: "end",
		onPointerDownOutside: (e) => {
			if (e.target?.closest("[data-radix-select-content]")) e.preventDefault();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
			children: "Filters"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-1",
					role: "group",
					"aria-label": "Date range",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: datePreset === "month" ? "default" : "outline",
							"aria-label": "This month",
							"aria-pressed": datePreset === "month",
							onClick: () => onPreset("month"),
							children: "Month"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: datePreset === "year" ? "default" : "outline",
							"aria-label": "This year",
							"aria-pressed": datePreset === "year",
							onClick: () => onPreset("year"),
							children: "Year"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: datePreset === "all" ? "default" : "outline",
							"aria-label": "All dates",
							"aria-pressed": datePreset === "all",
							onClick: () => onPreset("all"),
							children: "All dates"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: typeFilter,
					onValueChange: (v) => onType(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "h-9 min-h-9",
						"aria-label": "Filter by type",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Type" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: TYPE_FILTERS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: opt.value,
						children: opt.label
					}, opt.value)) })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: direction,
					onValueChange: (v) => onDirection(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "h-9 min-h-9",
						"aria-label": "Direction",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "In and out"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "in",
							children: "Incoming only"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "out",
							children: "Outgoing only"
						})
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: dateFrom,
						onChange: (e) => onDateFrom(e.target.value),
						"aria-label": "From date",
						className: "h-9 min-h-9"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: dateTo,
						onChange: (e) => onDateTo(e.target.value),
						"aria-label": "To date",
						className: "h-9 min-h-9"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: sortValue,
					onValueChange: onSort,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "h-9 min-h-9",
						"aria-label": "Sort register",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Sort" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: SORT_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
						value: opt.value,
						children: ["Sort · ", opt.label]
					}, opt.value)) })]
				}),
				active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-left text-xs font-medium text-muted-foreground",
					onClick: onClear,
					children: "Back to this year"
				}) : null
			]
		})]
	})] });
}
function ViewOptions({ fontSize, allowDelete, dragOn, cols, hiddenCount, onFontSize, onAllowDelete, onDragOn, onToggleCol, onShowAllCols }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: "h-9 min-h-9 justify-start",
			"aria-label": "View options",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {}),
				"View",
				hiddenCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.65rem] font-medium",
					children: hiddenCount
				}) : null
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
		className: "w-80",
		align: "end",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColumnChips, {
				cols,
				onToggle: onToggleCol,
				onShowAll: onShowAllCols
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 mb-3 flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-medium text-muted-foreground",
					children: [
						"Type size ",
						fontSize,
						"px"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 10,
					max: 18,
					step: 1,
					value: fontSize,
					"aria-label": "Register font size",
					className: "w-full accent-primary",
					onChange: (e) => onFontSize(Number(e.target.value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-10 items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "allow-delete",
					className: "text-sm",
					children: "Allow delete"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					id: "allow-delete",
					checked: allowDelete,
					onCheckedChange: onAllowDelete
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-10 items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "drag-dates",
					className: "text-sm",
					children: "Drag rows"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					id: "drag-dates",
					checked: dragOn,
					onCheckedChange: onDragOn
				})]
			})
		]
	})] });
}
function DateChips({ dates, overDate, onOverDate, onDropDate, onAddDate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "no-print mb-2 flex min-w-0 items-center gap-1 overflow-x-auto pb-1",
		children: [dates.map((date) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onDragOver: (e) => {
				e.preventDefault();
				onOverDate(date);
			},
			onDragLeave: () => onOverDate(null),
			onDrop: (e) => {
				e.preventDefault();
				onDropDate(date, e);
			},
			"data-drop": overDate === date ? "true" : void 0,
			className: "inline-flex h-8 shrink-0 items-center rounded-full bg-card px-3 text-xs elevation",
			children: formatShortDate(date)
		}, date)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-muted px-3 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: "Add date"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "date",
				className: "h-7 w-32 border-0 bg-transparent px-1 shadow-none",
				onChange: (e) => {
					if (e.target.value) onAddDate(e.target.value);
				}
			})]
		})]
	});
}
function RegisterTable({ lines, currency, banks, cols, lastBalance, selected, allOn, someOn, dragOn, dragging, overRow, sortKey, sortDir, onSort, onToggle, onToggleAll, onOpen, onSwap, onDragStart, onDragEnd, onOverRow, onDropRow }) {
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
		count: lines.length,
		estimateSize: () => 44,
		overscan: 12,
		scrollMargin: margin,
		getItemKey: (index) => lines[index]?.id ?? index
	});
	const { outTotal, inTotal } = (0, import_react.useMemo)(() => {
		let out = 0;
		let inn = 0;
		for (const line of lines) {
			if (line.kind === "opening") continue;
			out += line.payment;
			inn += line.deposit;
		}
		return {
			outTotal: out,
			inTotal: inn
		};
	}, [lines]);
	if (lines.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground elevation",
		children: "No activity matches these filters."
	});
	const vItems = virtualizer.getVirtualItems();
	const first = vItems[0];
	const last = vItems[vItems.length - 1];
	const padTop = first ? Math.max(0, first.start - margin) : 0;
	const padBottom = last ? Math.max(0, virtualizer.getTotalSize() - last.end) : 0;
	const firstLabel = REGISTER_COLS.find((col) => cols[col.id] && col.id !== "payment" && col.id !== "deposit" && col.id !== "balance")?.id;
	const hidden = REGISTER_COLS.filter((col) => !cols[col.id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: cn("register-matrix min-w-0 overflow-x-auto rounded-2xl bg-card elevation", hidden.map((col) => `hide-${col.id}`)),
		...Object.fromEntries(hidden.map((col) => [`data-hide-${col.id}`, "true"])),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "col-check no-print",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopTick, {
						checked: allOn,
						indeterminate: someOn,
						onChange: onToggleAll,
						label: "Select all"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Date",
					column: "date",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-date"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Type",
					column: "type",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-type"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "No.",
					column: "number",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-num"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Payee",
					column: "payee",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-payee"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Memo",
					column: "memo",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-memo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Bank",
					column: "bank",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					className: "col-bank"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Payment",
					column: "payment",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					align: "right",
					className: "col-money col-payment"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
					compact: true,
					label: "Deposit",
					column: "deposit",
					sortKey,
					dir: sortDir,
					onToggle: onSort,
					align: "right",
					className: "col-money col-deposit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "col-money col-balance py-2 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase",
					children: "Balance"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "col-status py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
					children: "Status"
				})
			] }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
				padTop > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 11,
						style: {
							height: padTop,
							padding: 0,
							border: 0
						}
					})
				}) : null,
				vItems.map((item) => {
					const line = lines[item.index];
					if (!line) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegisterRow, {
						index: item.index,
						line,
						currency,
						banks,
						isOn: selected.has(line.id),
						dragOn,
						dragging: dragging === line.id,
						over: overRow === line.id,
						measureRef: virtualizer.measureElement,
						onToggle,
						onOpen,
						onSwap,
						onDragStart,
						onDragEnd,
						onOverRow,
						onDropRow
					}, line.id);
				}),
				padBottom > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 11,
						style: {
							height: padBottom,
							padding: 0,
							border: 0
						}
					})
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "col-check no-print" }), REGISTER_COLS.map((col) => {
				if (!cols[col.id]) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: REGISTER_COL_CLASS[col.id] }, col.id);
				if (col.id === firstLabel) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: `${REGISTER_COL_CLASS[col.id]} font-medium`,
					children: "Totals"
				}, col.id);
				if (col.id === "payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "col-money col-payment",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: outTotal,
						currency,
						className: "text-debit"
					})
				}, col.id);
				if (col.id === "deposit") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "col-money col-deposit",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: inTotal,
						currency,
						className: "text-credit"
					})
				}, col.id);
				if (col.id === "balance") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "col-money col-balance",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: lastBalance,
						currency
					})
				}, col.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: REGISTER_COL_CLASS[col.id] }, col.id);
			})] }) })
		] })
	});
}
function sameLine(a, b) {
	return a.id === b.id && a.date === b.date && a.kind === b.kind && a.number === b.number && a.party === b.party && a.memo === b.memo && a.bankId === b.bankId && a.payment === b.payment && a.deposit === b.deposit && a.balance === b.balance && a.status === b.status && a.method === b.method && a.reassignable === b.reassignable && a.reschedulable === b.reschedulable;
}
function sameBanks(a, b) {
	return a.length === b.length && a.every((bank, i) => bank.id === b[i]?.id && bank.nickname === b[i]?.nickname);
}
var RegisterRow = (0, import_react.memo)(function RegisterRow({ index, line, currency, banks, isOn, dragOn, dragging, over, measureRef, onToggle, onOpen, onSwap, onDragStart, onDragEnd, onOverRow, onDropRow }) {
	const bank = banks.find((b) => b.id === line.bankId);
	const isOpening = line.kind === "opening";
	const canDrag = dragOn && line.reschedulable;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		ref: measureRef,
		"data-index": index,
		draggable: canDrag,
		"data-open": isOpening ? void 0 : "true",
		"data-selected": isOn ? "true" : void 0,
		"data-dragging": dragging ? "true" : void 0,
		"data-drop": over ? "true" : void 0,
		tabIndex: isOpening ? void 0 : 0,
		title: isOpening ? void 0 : "Double-click to open",
		onDoubleClick: () => onOpen(line),
		onKeyDown: (e) => {
			if (e.key === "Enter" && e.currentTarget === e.target) onOpen(line);
		},
		onDragStart: (e) => {
			if (!canDrag) {
				e.preventDefault();
				return;
			}
			e.dataTransfer.setData("text/plain", line.id);
			e.dataTransfer.effectAllowed = "move";
			onDragStart(line.id);
		},
		onDragEnd,
		onDragOver: (e) => {
			if (!dragOn || isOpening) return;
			e.preventDefault();
			onOverRow(line.id);
		},
		onDragLeave: () => onOverRow(null),
		onDrop: (e) => {
			if (!dragOn || isOpening) return;
			e.preventDefault();
			onDropRow(line, e);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-check no-print",
				children: isOpening ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopTick, {
					checked: isOn,
					onChange: () => onToggle(line.id),
					label: `Select ${line.party}`
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-date",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1",
					children: [canDrag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DragHandle, {
						enabled: true,
						className: "no-print"
					}) : null, isOpening && !line.date ? "Opening" : formatDate(line.date)]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-type",
				children: KIND_LABEL[line.kind]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-num",
				children: line.number || "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-payee",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: line.party
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-memo",
				children: line.memo
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-bank",
				onClick: stopOpen,
				onDoubleClick: stopOpen,
				onPointerDown: stopOpen,
				children: isOpening || !line.reassignable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: bank?.nickname ?? "—" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "print-only",
					children: bank?.nickname ?? "—"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: line.bankId,
					onValueChange: (v) => onSwap(line, v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "register-bank-select no-print h-auto min-h-0 w-auto border-0 bg-transparent px-1 text-[length:1em] shadow-none",
						"aria-label": `Bank for ${line.party}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Bank" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: b.id,
						children: b.nickname
					}, b.id)) })]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-money col-payment",
				children: line.payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: line.payment,
					currency,
					className: "text-debit"
				}) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-money col-deposit",
				children: line.deposit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: line.deposit,
					currency,
					className: "text-credit"
				}) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-money col-balance",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: line.balance,
					currency
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "col-status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineStatus, { line })
			})
		]
	});
}, (prev, next) => {
	return prev.index === next.index && prev.isOn === next.isOn && prev.dragOn === next.dragOn && prev.dragging === next.dragging && prev.over === next.over && prev.currency === next.currency && prev.onToggle === next.onToggle && prev.onOpen === next.onOpen && prev.onSwap === next.onSwap && prev.onDragStart === next.onDragStart && prev.onDragEnd === next.onDragEnd && prev.onOverRow === next.onOverRow && prev.onDropRow === next.onDropRow && prev.measureRef === next.measureRef && sameBanks(prev.banks, next.banks) && sameLine(prev.line, next.line);
});
function LineStatus({ line }) {
	if (line.kind === "check") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckBadge, { status: line.status });
	if (line.kind === "receipt" || line.kind === "payment") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBadge, {
		status: line.status,
		kind: line.kind === "receipt" ? "cash-sale" : "payment",
		method: line.method
	});
	if (line.kind === "transfer") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "internal",
		children: "Internal"
	});
	if (!line.status) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusLabel, { status: line.status });
}
//#endregion
export { RegisterPage as component };
