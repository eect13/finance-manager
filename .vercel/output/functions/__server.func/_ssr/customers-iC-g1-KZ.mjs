import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { f as Printer } from "../_libs/lucide-react.mjs";
import { D as customerRows, E as customerOpenBalance, lt as useFinanceData, t as Button } from "./store-zEGD4c48.mjs";
import { T as Money, c as CustomerCenter, s as CsvButton, t as AppShell } from "./app-shell-Dw047gD3.mjs";
import { n as CardContent, t as Card } from "./card-4bGA0e1Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customers-iC-g1-KZ.js
var import_jsx_runtime = require_jsx_runtime();
function CustomersPage() {
	const data = useFinanceData();
	const totalOpen = data.customers.reduce((sum, c) => sum + customerOpenBalance(data, c.id), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Customers",
		description: "Pick a customer to see every invoice, payment, and cash sale. Tap a line to edit it, or use New to invoice and receive without leaving this page.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvButton, {
			filename: "customers.csv",
			rows: customerRows(data)
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
					children: "Customers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-2xl font-medium tabular-nums",
					children: data.customers.length
				})]
			}) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerCenter, {})]
	});
}
//#endregion
export { CustomersPage as component };
