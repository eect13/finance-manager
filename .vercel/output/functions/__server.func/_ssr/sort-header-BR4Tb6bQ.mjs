import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { H as ArrowDown, z as ArrowUp } from "../_libs/lucide-react.mjs";
import { w as cn } from "./store-zEGD4c48.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sort-header-BR4Tb6bQ.js
var import_jsx_runtime = require_jsx_runtime();
function SortHeader({ label, column, sortKey, dir, onToggle, align = "left", compact = false, className }) {
	const active = sortKey === column;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("font-medium", compact ? "py-2" : "px-4 py-3", compact && align !== "right" && "px-2", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onToggle(column),
			className: cn("inline-flex items-center gap-1 font-medium", compact ? "min-h-8 whitespace-nowrap text-xs tracking-wide uppercase" : "min-h-11 text-sm", align === "right" && "w-full flex-row-reverse justify-start", active ? "text-foreground" : "text-muted-foreground hover:text-foreground"),
			children: [label, active ? dir === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-3.5" }) : compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3.5" })]
		})
	});
}
//#endregion
export { SortHeader as t };
