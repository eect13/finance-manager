# Finance Manager — standing product constraints

This conversation belongs to a Grok project. Project files at `/workspace/artifacts` persist across conversations.

## Always in force

- **Named bugs ship this turn.** Otherwise list first, then do what the user picks.
- **No gold-plating.** Do not touch unrelated code. Do not rewrite Register virtualizer internals or print layout. Do not swap `@tanstack/react-virtual`. Never Write entire `src/styles.css` (append or targeted StrReplace only).
- **No cell merging.** List columns are independent stored px (sheet-style). No leftover dump into Name/Customer/Payee. No last-col `col-fill` / `col-flex { width:100% }`.
- **Customers/Vendors Name header stays positioned** (`sticky` freeze-top, `left: auto` — not a left freeze pane). Never `position: static` on that `th` (absolute handle flies to the page edge).
- **Resize handles on desk:** hide `.col-resize-handle` only under 768px. Do not hide on `(pointer: coarse)` — hybrid Windows laptops still have a mouse. Drag on mouse/pen; touch double-taps to auto-fit.
- **Table titles match Banks:** thead is a bottom rule only — no vertical inset borders on column titles.
- **Reconcile List** must bind a live scroll element (ListCard ref as state, fallback workspace). Desk default layout is list, same as Banks/Register. Do not leave `getScrollElement: () => gridRef.current` on a ref that is null while Grid is showing.
- **Layout default:** Grid on phone / coarse (`isPhoneUi`), List on desk. Use `defaultListLayout()` / `readPhoneLayout(key)` — never hardcode `"grid"` as the desk fallback. Saved localStorage wins.
- **Actions last col:** `ActionsHeader` only — no sort, no filter, no align menu. First-col titles (Nickname, Number, …) stay sortable. Do not reuse `SortHeader` / `sort-header-main` as a button on Actions.
- **Plain table paper:** `--color-table` / `--color-table-header` / `--color-table-divider`. No emoji. Hide Book cash from header. Reports aging stacked.
- **Stacking:** unlayered CSS (Tailwind `z-[80]` loses to `.dialog-sheet { z-index: 60 }`). Confirm overlay 70 / sheet 80. `[data-party-list] { z-index: 90; pointer-events: auto }`.
- **Desktop = Tauri 2.** Windows one-click must work when the unzip folder has parentheses. Taskbar and shortcut are the navy opaque tile. No auth. Preview `0.0.0.0:8080`.
- **Git:** Eric Emerson Tan `<eric@local>`. Push `origin main`. Do not stage `.grok/`, `attachments/`, `screenshots/`.
