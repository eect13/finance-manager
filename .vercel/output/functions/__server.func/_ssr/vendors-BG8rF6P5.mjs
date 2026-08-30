import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { f as Printer } from "../_libs/lucide-react.mjs";
import { dt as vendorOpenBalance, ft as vendorRows, lt as useFinanceData, t as Button } from "./store-zEGD4c48.mjs";
import { B as VendorCenter, T as Money, s as CsvButton, t as AppShell } from "./app-shell-Dw047gD3.mjs";
import { n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vendors-BG8rF6P5.js
var import_jsx_runtime = require_jsx_runtime();
function VendorsPage() {
	const data = useFinanceData();
	const totalOpen = data.vendors.reduce((sum, v) => sum + vendorOpenBalance(data, v.id), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Vendors",
		description: "Pick a vendor to see every bill and check. Tap a line to edit it, or use New to enter a bill or write a check without leaving this page.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "vendors.csv",
			rows: vendorRows(data)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			onClick: () => window.print(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {}), "Print"]
		})] }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mb-4 grid gap-3 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Total open"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Money, {
					amount: totalOpen,
					currency: data.settings.currency,
					className: "mt-2 text-2xl font-medium"
				})]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Vendors"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-2xl font-medium tabular-nums",
					children: data.vendors.length
				})]
			}) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VendorCenter, {})]
	});
}
//#endregion
export { VendorsPage as component };
