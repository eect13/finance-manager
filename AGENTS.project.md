# Finance Manager — standing product constraints

This conversation belongs to a Grok project. Project files at `/workspace/artifacts` persist across conversations.

## Always in force

- **Named bugs ship this turn.** Otherwise list first, then do what the user picks.
- **No gold-plating.** Do not touch unrelated code. Do not rewrite Register virtualizer internals or print layout. Do not swap `@tanstack/react-virtual`. Never Write entire `src/styles.css` (append or targeted StrReplace only).
- **No cell merging.** List columns are independent stored px (sheet-style). No leftover dump into Name/Customer/Payee. No last-col `col-fill` / `col-flex { width:100% }`.
- **Customers/Vendors Name header stays positioned** (`sticky` freeze-top, `left: auto` — not a left freeze pane). Never `position: static` on that `th` (absolute handle flies to the page edge).
- **Resize handles:** desktop List only (768px+). Hidden on phone — no drag, no tap auto-fit. Do not hide on `(pointer: coarse)` at desk width (hybrid Windows laptops still have a mouse). Do not `position: static` Name `th`.
- **Ticks:** `.register-tick` stays `z-index: 0`. Never Tailwind `z-10` — that paints boxes over sticky DATE/TYPE headers on Register phone List. Sticky thead is z-index 8 with opaque `--color-table-header`. Check cells use `.col-check` and clip overflow. Select-all on phone lives in the toolbar, not the thead.
- **Row height:** no row-resize. Column width only, and only on desk.
- **Register phone List** matches Reconcile: never put `list-card` and `list-grid` on the same node. Do not rewrite Register virtualizer internals.
- **View column chips:** Register-style hide on invoices, bills, receipts, checks, banks, employees, ledger (journal + accounts), party dir/history, reconcile, reports aging/TB/P&L. Actions and Reconcile check stay on. At least one chip-col remains. CSS `[data-hide-{id}] [data-col="{id}"]` plus zeroed `<col>` width.
- **Table titles match Banks:** thead is a bottom rule only — no vertical inset borders on column titles.
- **Reconcile List** matches Register: one virt, `cardMode = phoneLayout === "grid"` (never `narrow || grid`), estimate 52 on phone List / 168 on Grid. Workspace is the Y scroller (`listScrollElement` + `scrollMargin` so the proof board is not empty pad). Never put `list-card` and `list-grid` on the same node (that caps max-height and becomes a nested Y scroller). Measure effect must not depend on virt identity.
- **Layout default:** Grid under 768px (`isNarrowUi`), List on desk — even on a coarse/touch laptop. Use `defaultListLayout()` / `readPhoneLayout(key)`. Saved localStorage wins. Register/Reconcile desk table only when `!isNarrowUi()` and layout is List. Keep `isPhoneUi()` for ⋯ / safe-area chrome.
- **Actions last col:** `ActionsHeader` only — no sort, no filter, no align menu. Title and row actions (Delete / Collect / Pay) are centered like other titles. First-col titles stay sortable.
- **Grid + List type scale:** every Grid card (DocCards, Banks, party dir, Register/Reconcile) and every list table inherit `--list-type` (View type size, default 12px). Do not rem-lock Grid titles/amounts (`text-xl`, `min-height: 8.5rem`) or pin phone tables to `0.72rem`. Titles/amounts use em of `--list-type`.
- **Plain table paper:** `--color-table` / `--color-table-header` / `--color-table-divider`. No emoji. Hide Book cash from header. Reports aging stacked. Grid cards use the same paper (no raised elevation).
- **Stacking:** unlayered CSS (Tailwind `z-[80]` / `z-[200]` lose to `.dialog-sheet { z-index: 60 }`). Confirm overlay 70 / sheet 80. `[data-party-list] { z-index: 90; pointer-events: auto }`. Radix popper wrapper z-index 120.
- **Confirm:** dimmer-click does not dismiss when a phrase is required (Cancel / X still close). One Settings confirm for blank / reload / restore / remove.
- **Desktop = Tauri 2.** Windows one-click must work when the unzip folder has parentheses. Taskbar and shortcut are the navy opaque tile. No auth. Preview `0.0.0.0:8080`.
- **Git:** Eric Emerson Tan `<eric@local>`. Push `origin main`. Do not stage `.grok/`, `attachments/`, `screenshots/`.
