import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { V as moveId } from "./app-shell-Dw047gD3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-row-drag-A8173dLk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useRowDrag(enabled, ids, onReorder) {
	const [dragId, setDragId] = (0, import_react.useState)(null);
	const [overId, setOverId] = (0, import_react.useState)(null);
	function bind(id) {
		if (!enabled) return {};
		return {
			draggable: true,
			onDragStart: () => setDragId(id),
			onDragOver: (e) => {
				e.preventDefault();
				setOverId(id);
			},
			onDrop: (e) => {
				e.preventDefault();
				if (dragId) onReorder(moveId(ids, dragId, id));
				setDragId(null);
				setOverId(null);
			},
			onDragEnd: () => {
				setDragId(null);
				setOverId(null);
			},
			"data-over": overId === id && dragId && dragId !== id ? "true" : void 0
		};
	}
	return {
		bind,
		dragId,
		overId
	};
}
//#endregion
export { useRowDrag as t };
