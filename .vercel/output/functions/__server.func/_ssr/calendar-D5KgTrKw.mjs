import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { A as ChevronLeft, k as ChevronRight, l as Search } from "../_libs/lucide-react.mjs";
import { K as monthLabel, M as filterCashLines, P as formatDate, T as currentMonth, b as cashCalendar, et as rescheduleKind, lt as useFinanceData, o as KIND_LABEL, rt as todayIso, t as Button, tt as shiftMonth, u as TYPE_FILTERS, ut as useFinanceStore, w as cn, x as cashRegisterLines } from "./store-zEGD4c48.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as SelectItem, H as openCashLine, M as SelectValue, O as Select, S as Input, T as Money, j as SelectTrigger, k as SelectContent, t as AppShell } from "./app-shell-Dw047gD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-D5KgTrKw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKDAYS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
var PILL_CAP = 3;
function CashCalendar() {
	const data = useFinanceData();
	const rescheduleCashLine = useFinanceStore((s) => s.rescheduleCashLine);
	const [month, setMonth] = (0, import_react.useState)(currentMonth());
	const [picked, setPicked] = (0, import_react.useState)(todayIso());
	const [query, setQuery] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("all");
	const [bankId, setBankId] = (0, import_react.useState)("all");
	const [dragging, setDragging] = (0, import_react.useState)(null);
	const [overDate, setOverDate] = (0, import_react.useState)(null);
	const raw = (0, import_react.useMemo)(() => cashRegisterLines(data, bankId === "all" ? void 0 : bankId), [data, bankId]);
	const lines = (0, import_react.useMemo)(() => filterCashLines(raw, {
		type,
		name: query
	}).filter((l) => l.kind !== "opening"), [
		raw,
		type,
		query
	]);
	const days = (0, import_react.useMemo)(() => cashCalendar(lines, month), [lines, month]);
	const selected = days.find((d) => d.date === picked) ?? null;
	function moveLine(line, date) {
		const kind = rescheduleKind(line.kind);
		if (!kind || !line.reschedulable) return;
		if (line.date === date) return;
		try {
			rescheduleCashLine({
				kind,
				sourceId: line.sourceId,
				date
			});
			setPicked(date);
			toast.success(`${line.party} moved to ${formatDate(date)}.`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not move.");
		}
	}
	function parseDrag(e) {
		try {
			const id = e.dataTransfer.getData("text/plain");
			return lines.find((l) => l.id === id) ?? null;
		} catch {
			return null;
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => setMonth(currentMonth()),
						children: "Today"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Previous month",
						onClick: () => setMonth((m) => shiftMonth(m, -1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "min-w-44 text-center font-display text-2xl font-medium tracking-tight",
						children: monthLabel(month)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Next month",
						onClick: () => setMonth((m) => shiftMonth(m, 1)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative sm:col-span-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Filter payee",
							"aria-label": "Filter calendar",
							className: "h-9 min-h-9 pl-9"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: type,
						onValueChange: (v) => setType(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 min-h-9",
							"aria-label": "Filter by type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: TYPE_FILTERS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: opt.value,
							children: opt.label
						}, opt.value)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: bankId,
						onValueChange: setBankId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9 min-h-9",
							"aria-label": "Filter by bank",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All banks"
						}), data.banks.filter((b) => !b.archived).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: b.id,
							children: b.nickname
						}, b.id))] })]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "notion-cal min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "notion-cal-weekdays",
					children: WEEKDAYS.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sm:hidden",
						children: day.slice(0, 1)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: day
					})] }, day))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "notion-cal-days",
					children: days.map((day) => {
						const extra = Math.max(0, day.lines.length - PILL_CAP);
						const shown = day.lines.slice(0, PILL_CAP);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "button",
							tabIndex: 0,
							"data-outside": day.inMonth ? void 0 : "true",
							"data-today": day.today ? "true" : void 0,
							"data-active": picked === day.date ? "true" : void 0,
							"data-drop": overDate === day.date ? "true" : void 0,
							className: "notion-cal-day",
							onClick: () => setPicked(day.date),
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setPicked(day.date);
								}
							},
							onDragOver: (e) => {
								e.preventDefault();
								setOverDate(day.date);
							},
							onDragLeave: () => setOverDate(null),
							onDrop: (e) => {
								e.preventDefault();
								const line = parseDrag(e);
								setOverDate(null);
								setDragging(null);
								if (line) moveLine(line, day.date);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-1 flex items-center justify-between gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "notion-cal-num",
									children: Number(day.date.slice(8))
								}), day.count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "notion-cal-count sm:hidden",
									children: day.count
								}) : null]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden min-h-0 flex-1 flex-col gap-0.5 sm:flex",
								children: [shown.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventPill, {
									line,
									dragging: dragging === line.id,
									onOpen: () => openCashLine(line, data),
									onDragStart: () => setDragging(line.id),
									onDragEnd: () => {
										setDragging(null);
										setOverDate(null);
									}
								}, line.id)), extra > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "px-1 text-left text-xs font-medium text-muted-foreground",
									children: [
										"+",
										extra,
										" more"
									]
								}) : null]
							})]
						}, day.date);
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPanel, {
				date: selected?.date ?? picked,
				lines: selected?.lines ?? [],
				currency: data.settings.currency,
				banks: data.banks,
				onOpen: (line) => openCashLine(line, data)
			})]
		})]
	});
}
function EventPill({ line, dragging, onOpen, onDragStart, onDragEnd }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		draggable: line.reschedulable,
		"data-dir": line.deposit > 0 ? "in" : "out",
		"data-dragging": dragging ? "true" : void 0,
		className: "notion-cal-pill",
		title: `${line.party} · ${KIND_LABEL[line.kind]}`,
		onClick: (e) => {
			e.stopPropagation();
			onOpen();
		},
		onDragStart: (e) => {
			if (!line.reschedulable) {
				e.preventDefault();
				return;
			}
			e.stopPropagation();
			e.dataTransfer.setData("text/plain", line.id);
			e.dataTransfer.effectAllowed = "move";
			onDragStart();
		},
		onDragEnd,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 flex-1 truncate",
			children: line.party
		})
	});
}
function DayPanel({ date, lines, currency, banks, onOpen }) {
	if (!date) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground elevation",
		children: "Select a day to see its cash."
	});
	const inflow = lines.reduce((s, l) => s + l.deposit, 0);
	const outflow = lines.reduce((s, l) => s + l.payment, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-card elevation lg:sticky lg:top-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: formatDate(date)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: [
					lines.length === 0 ? "No cash this day" : `${lines.length} ${lines.length === 1 ? "entry" : "entries"}`,
					inflow ? " · in " : "",
					inflow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: inflow,
						currency,
						className: "inline text-credit"
					}) : null,
					outflow ? " · out " : "",
					outflow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: outflow,
						currency,
						className: "inline text-debit"
					}) : null
				]
			})]
		}), lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 py-5 text-center text-sm text-muted-foreground",
			children: "Empty day. Drag a card here to reschedule."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: lines.map((line) => {
			const bank = banks.find((b) => b.id === line.bankId);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full min-h-11 items-center gap-3 px-4 py-2 text-left hover:bg-accent",
				onClick: () => onOpen(line),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("inline-block size-2 shrink-0 rounded-full", line.deposit > 0 ? "bg-credit" : "bg-debit") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-medium",
							children: line.party
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block truncate text-xs text-muted-foreground",
							children: [
								KIND_LABEL[line.kind],
								line.number ? ` ${line.number}` : "",
								bank ? ` · ${bank.nickname}` : ""
							]
						})]
					}),
					line.payment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: line.payment,
						currency,
						className: "text-debit"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
						amount: line.deposit,
						currency,
						className: "text-credit"
					})
				]
			}) }, line.id);
		}) })]
	});
}
function CalendarPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Calendar",
		description: "Cash as a month board. Click a card to open it. Drag a card onto another day to reschedule.",
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CashCalendar, {})
	});
}
//#endregion
export { CalendarPage as component };
