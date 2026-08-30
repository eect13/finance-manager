import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as GripVertical } from "../_libs/lucide-react.mjs";
import { w as cn } from "./store-zEGD4c48.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/drag-handle-DR58GmIZ.js
var import_jsx_runtime = require_jsx_runtime();
function DragHandle({ enabled, className }) {
	if (!enabled) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex cursor-grab text-muted-foreground active:cursor-grabbing", className),
		"aria-label": "Drag to reorder",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "size-4" })
	});
}
//#endregion
export { DragHandle as t };
