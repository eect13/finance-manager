# Finance Manager — bugs & improvements (v3.62)

Re-verified in code 2026-09-05 (Asia/Manila). Updated for v3.62.45. UI direction: gestalt / professional ledger — cream paper, navy ink, real chrome — not an overly-minimal white sheet.

## Fixed in v3.62.45

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med (UX) | Phone Move could not reach far dates without scroll-then-re-drag | Edge auto-scroll on `[data-workspace-scroll]` while dragging |
| 2 | Low | Reconcile uncleared ignored same-day `registerOrder` | `unclearedLines` uses `compareCashLines` (passbook order) |
| 3 | Low | Deleted lines left orphan `registerOrder` keys | `pruneRegisterOrder` on delete; arrange renumber drops orphans |
| 4 | Med (UX) | Arranging one transfer leg split the pair in All-banks | Transfer legs move as a block (preserve relative out/in order) |
| 5 | Low | Desk Move drop highlight flickered across child nodes | `onDragLeave` ignores leave-to-descendant (`relatedTarget`) |
| 6 | Low | Register had no Balance column sort / passbook restore | SortHeader + filters: **Balance** asc/desc and **Passbook** (default) |
| 7 | Low | Virtualizer scroll parent lookup fragile | Shared `getWorkspaceScrollElement()` helper |

## Fixed in v3.62

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med (UX) | Register delete was behind View → **Allow delete**, and ticks were behind a **Move** arming button | Tick column always on. Bulk **Delete** when a selection is live. No Allow-delete switch. No Move mode button. Bank reassign still on the selection bar. Drag dates remain View → Drag rows |
| 2 | Med (UX) | Post/Edit had Save/Close only — deleting the open line meant leaving the dialog, arming Move, unlocking delete | **Delete** in Post/Edit for the current line. Blocked when reconciled (opening is never opened here) |
| 3 | Med | Close **Open AR / AP / Trial balance** painted over the Close-through calendar | Calendar already portaled; it used invalid `hsl(var(--popover))` (transparent) and lost the stacking fight. Opaque `var(--color-popover)` fill, `z-index: 5000`. Close summary is sticky at **z-4** (below header z-20 and the picker) |
| 4 | Low | Voided (unreconciled) lines showed a lock in the tick cell because ticks required `reassignable` | Ticks lock only for **Reconciled**. Voided lines can be selected for delete |
| 5 | Low | DateInput calendar day/header colors used the same invalid `hsl(var(--*))` tokens | Switched to `var(--color-*)` so selected/today/hover match the theme |

## Fixed in v3.61

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Low | Register recon badges were single-letter C / R | Full words: Cleared, Reconciled, Pending (print too) |
| 2 | Low | Amounts without thousand separators; blank currency looked raw | Default separators; Options → Display / Formatting |
| 3 | Low | Check # missing on register Post/Edit | Create/edit loads and saves `checkNumber`; cash-sale No. read-only |
| 4 | Med | DateInput calendar buried under dialogs | Portal + placement above/below |

## Fixed in v3.60

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | DateInput chevron orphaned below bottom-left of every date field | Wrapper `relative w-full`; calendar button `absolute inset-y-0 right-0`; `.date-cal-pop` styles |

## Fixed in v3.59

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Low | Undo/redo toasts were generic | Labels on history entries; toast and menu peek show the action |
| 2 | Low–med | Tax setup was currency-only | Country tax packs + optional “Also update home currency”; **No currency** (`__none__` → `""`) |
| 3 | Med (env) | Android solo APK path fragile (JDK/NDK) | `pack-android.mjs` / `apk.bat`: JDK 17 preference, NDK resolve, symlink fallback, auto-sign |
| 4 | Med | Android status bar overlapped header | `viewport-fit=cover` + `env(safe-area-inset-top)` on `.app-header-bar` (coarse-pointer fallback) |
| 5 | Low | “Double-click” copy ignored touch | Treasury desk / lists: “Double-tap or double-click” |
| 6 | Med | APK launcher showed wrong blue/yellow circles | Brand navy icons from `src-tauri/icons/android` synced into `gen/.../res` on each APK pack |

## Fixed in v3.58 (code review)

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | Editing a **taxed cash sale** via Register/`updateReceipt` used `patchJournalAmount`, which set every journal line to the full amount | Rebuild bank / Sales / Output VAT lines |
| 2 | Medium | `removeEmployee` ignored paycheck history and left orphan `Employee payee (<id>)` vendors | Block delete when linked vendor has live checks; remove unused linked payee vendor when safe |
| 3 | Low | Invoices list had no empty-state row | Empty / no-match message |
| 4 | Low | `DropdownMenuContent` stayed at `z-50` while Select/Popover use `z-[200]` | Raised Export (and other) menus to `z-[200]` |

## Still open (known) — re-verified in code 2026-09-05

| # | Severity | Area | Notes | Status |
| --- | --- | --- | --- | --- |
| A | Low–med | Register “All dates” | `datePresetRange("all")` sets `from` = prior Jan 1 and **`to` = ""** (open-ended). Not all-time; README still says “through today” in one place but the window does not cap at `todayIso()`. | Still open (by design for memory) |
| B | Low | Register column sort vs running balance | Running Bal stays passbook values mapped onto rows. **Passbook** sort restores arrangement; **Balance** / other columns reorder display only. | Improved (v3.62.45) |
| C | Low–med | VAT model | Output VAT only (`createBill` is expense↔AP, no input VAT). | Still open (product) |
| D | Low | `ensureOutputVat` | Still hardcodes `acct-2200` when inserting code 2200 (`normalize.ts`). Lookups elsewhere use `code === "2200"`. | Still open |
| E | Low | Debounced persist (~280ms) | `pagehide` / `visibilitychange` flush exist; hard kill/crash can still drop last keystrokes. | Still open |
| F | Low | `patchJournalAmount` | Still used for check / payment receipt / bill / deposit / expense / transfer (2-line). **Do not** use for multi-line VAT (invoice + taxed cash sale now rebuild). | Still open (safe for 2-line) |
| G | Med (product) | Thin payroll | No hours×rate run, withholdings, 13th month, or `employeeId` on check records; pay is `issueCheck` via linked vendor. | Still open |
| H | — | Android APK | Solo path improved in v3.59 (JDK 17, NDK resolve, symlink fallback, auto-sign). Still needs SDK+NDK on the machine. | Improved (env) |

## New findings (confirmed) — not yet fixed or deferred

| # | Severity | Area | Notes |
| --- | --- | --- | --- |
| I | Low | Cash-sale line drift | Register amount edit on a taxed cash sale rebuilds the journal from gross amount + stored `taxRate`; `receipt.lines` are not rescaled, so line subtotals can diverge from `receipt.amount`. Full line editor would be the proper UX. |
| J | Low | a11y labels | `Field` supports `htmlFor` but almost no call sites pass it (~155 Field tags, ~5 `htmlFor`). Selects/combos often lack a programmatic name beyond visible text. |
| K | Low | Tax % visibility | Invoice/receipt Tax % fields hide when Settings tax is off, even if the document still carries historical `taxRate > 0` (totals remain correct). Matches “Settings seeds new docs” but can surprise editors. |
| L | Info | Dead / unused | `src/lib/multiplayer/p2p.ts` exported but unused by app routes (multi-device still aspirational). |
| M | Low | `removeCashLines` | Per-line failures are swallowed (`catch {}`). If a closed-period line is mixed into a bulk delete, the toast can still say N deleted while some remain. Return the actual deleted count. |
| N | Low | Register virtualizer | Uses `getWorkspaceScrollElement()` (`main[data-workspace-scroll]`). Full AppShell ref still optional. |
| O | Low | Nested dialogs | Post **Delete** opens `ConfirmDelete` (both Dialog z-50). Sibling order puts confirm on top today; a dedicated higher z on confirm would be safer than relying on DOM order. |
| P | Info | `actions.ts` | Still `@ts-nocheck` restored from production build — types live via `typeof` in store. Prefer small surgical fixes over a rewrite. |
| Q | Low | List virtualization | Only the register uses `@tanstack/react-virtual`. Invoices/bills/receipts/checks/ledger/employees paint every row. Fine at sample size (~1k docs); will hitch on fat files. |
| R | Low | Party combo stacking | `party-combo` list is `absolute z-50` (not portaled). Fine inside dialogs; would clip inside `overflow: hidden` sheets. |

## Areas of improvement

1. **IndexedDB / size** — Cap audit further; optional purge of closed detail; avoid dual full backup copies; chunked multi-company blobs.
2. **List virtualization** — Extend register’s `@tanstack/react-virtual` to invoices/bills/receipts/checks/ledger/employees when lists grow.
3. **Code-split** — Lazy TanStack routes + Vite `manualChunks` for reports/close/reconcile/seed.
4. **Tauri / Android** — Validate WebView IDB persistence; share/save company JSON; cold-start via splits. Solo APK path improved in v3.59; still needs SDK+NDK installed.
5. **Payroll depth** — Pay periods, withholdings, link checks to `employeeId`, batch pay run, block delete when pay history exists (partially done for employee delete).
6. **Multi-device** — Explicit company-file exchange / LWW or CRDT; no naive full-state overwrite. P2P stub exists unused.
7. **Purchase VAT** — Input VAT on bills + VAT payable/receivable reports.
8. **Invoice edit UX** — Surface tax as document field clearly so Settings toggle never feels like it rewrites history (partially: Tax % on create/edit when tax enabled).
9. **“All dates” copy** — Align README (“through today”) with code (`to: ""`) or cap `dateTo` at `todayIso()`.
10. **Field `htmlFor` / input ids** — Wire labels for keyboard and screen-reader focus.
11. **Gestalt chrome** — Keep sticky summaries, elevation, and navy/cream ledger language. Avoid flattening Close/Register into a single un-grouped sheet. Close sticky + register selection bar are the right density.
12. **Bulk delete honesty** — Surface how many lines `removeCashLines` actually removed; don’t toast the requested count when some were blocked.
13. **Date picker in every sticky header** — Pattern is now: portal to `document.body`, opaque popover, z ≥ 5000, page chrome ≤ 20.

## Review notes (UI / quality snapshot)

- **Options vs Settings**: Nav + page title say **Options**; route remains `/settings`. Consistent and intentional.
- **Employees**: Search, status/pay-type filters, sort options, and empty states are in good shape.
- **Register**: Virtualized; In/Out filter does not recompute running balance incorrectly (balance from full window, rows filtered). Thin scrollbars on `.list-card.list-grid` present. Tick column is a first-class select, not a hidden mode.
- **Select stacking**: Select/Popover at `z-[200]`; Dialog/Sheet at `z-50` — selects inside dialogs work. Date calendar at **5000** so Close sticky and dialogs cannot cover it.
- **Local dates**: `todayIso()` uses local `getFullYear/Month/Date` (not UTC `toISOString` slice) — correct for PH/local books.
- **Backup version**: `COMPANY_FILE_VERSION = 14` and store persist `version: 14`; `employees` in export tables — prior high bug remains fixed.
- **actions.ts** is `@ts-nocheck` restored from production build — types live via `typeof` in store; prefer small surgical fixes over large rewrites.
- **Close sticky**: professional summary strip (date + AR + AP + TB) with page-background so the checklist can scroll underneath. Calendar is a floating control, not a child of that strip’s stacking context.
