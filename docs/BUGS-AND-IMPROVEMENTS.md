# Finance Manager — bugs & improvements (v3.63)

Re-verified in code 2026-09-08. Updated for v3.63.10.

## Fixed in v3.63.10

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Start blank / Reload sample had no confirm | One Settings confirm: blank, reload, restore, remove |
| 2 | Med | Confirm dimmer-click dismissed even with DELETE phrase | Overlay / Escape do not dismiss when a phrase is required |
| 3 | Med | Tailwind `z-[200]` menus lost to unlayered `.dialog-sheet` | Unlayered `[data-radix-popper-content-wrapper] { z-index: 120 }` |
| 4 | Low | Tax % / printed tax hid when Settings tax was off | Show when `taxEnabled` or the document already has a rate |
| 5 | Low | Settings mounted two ConfirmDeletes (Remove + Restore) | One `booksConfirm` state |
| 6 | Low | Hybrid coarse laptops took the phone Register/Reconcile branch | Desk table from 768px (`isNarrowUi`); `isPhoneUi` stays for ⋯ |
| 7 | Low | Bulk delete could include a closed-period line | `assertOpenPeriod` on `removeCashLine`; toast is unique deletes |
| 9 | Low | Grid cards were raised tiles vs List paper | `.item-card` uses `--color-table` hairline |

## Fixed in v3.63.9

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Register desk opened in Grid because `readPhoneLayout(..., "grid")` ignored desk | Shared `defaultListLayout()` — Grid on phone, List on desk. Saved View still wins |
| 2 | Low | Banks Actions reused sort-header cluster (looked like a sort/filter control) | `ActionsHeader` is a label + resize only; first col (Nickname) stays sortable |
| 3 | Low | `useListView` painted the device default then swapped after reading localStorage | Sync read on first paint (same pattern as column widths) |

## Fixed in v3.63.8

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | Customers/Vendors Name header was `position: static`, so the absolute resize handle sat at the page edge — could not drag or auto-fit Name | Name `th` is freeze-top `sticky` with `left: auto`; handle stays on Name\|Contact |
| 2 | Med | `(pointer: coarse)` hid resize handles on hybrid laptops | Handles show from 768px up; drag is mouse/pen, touch double-taps to fit |
| 3 | Low | Party directory titles had vertical inset borders; Banks titles are a bottom rule only | Thead matches Banks |
| 4 | Med | Reconcile List virtualizer used `gridRef.current` while Grid was showing (null scroller), so rows were missing until a later re-render | Live scroll node + workspace fallback; desk default is List |

## Fixed in v3.63.7

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | List auto-fit dumped leftover window into a flex col (Name/Customer/Payee) so widths jumped on refresh | Content-only auto-fit; table width is the sum of columns |
| 2 | Med | `col-flex { width:100% }` and `th.col-flex { width:auto }` made drag/auto-fit a no-op and stole width from neighbors | Every list col is `col-fit` with stored px; no leftover absorber |
| 3 | Low | Last column hid its resize handle and stretched (`col-fill`) | Handle stays; last col is a normal px column |
| 4 | Med | Opening a List re-measured every column (clipped cell width as a floor) so auto-fit grew and refresh jumped | Saved px on first paint; double-click measures text/widgets only |

## Fixed in v3.63.6

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Name/Contact resize handle and auto-fit did nothing (sticky Name, `width: auto`, `min-width: 7em/8em !important`, table `max-width: 100%`) | Fit cols honor stored px; table grows and scrolls; auto-fit measures text, not the ellipsis box |
| 2 | Low | Party directory (and leftover list chrome) was not the same plain `--color-table` paper | One paper token; no sticky Name, no muted header, no edge fade |
| 3 | Med | Desk row Actions folded Collect/Pay/Delete into ⋯ even with side-scroll | Desk always shows labels; ⋯ is phone-only |

## Fixed in v3.63.5

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Customers/Vendors hid Contact/Email/Phone and crushed Name into one strip; width drag did nothing | Keep every directory column; Name/Contact are fit + resize; pane scrolls |
| 2 | Med | Status badges (`0.7rem`) and Actions buttons (`h-9`) ignored View type size | em sizing on badges and row action buttons; Status/Actions min-width in em |

## Fixed in v3.63.4

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Posting banks/accounts were closed Selects — could not Quick Add a new bank like QuickBooks | `BankCombo` / `AccountCombo` (type-ahead + Quick Add) on Register Post, Receipts, Checks, Bills, Employees, Banks Record/Transfer, record sheet, party sheets |
| 2 | Med | Cash sale disabled when the company had no banks | Button enabled; type the bank name and Quick Add |
| 4 | Med | Quick Add list sat under the Post footer (Tailwind z-[200] lost to unlayered `.dialog-sheet`) | Unlayered `[data-party-list] { z-index: 90 }` |

## Fixed in v3.63.3

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | Root `deploy.bat` was LF-only; GitHub zip double-click on Windows failed | `.gitattributes` `*.bat eol=crlf`; bats rewritten ASCII CRLF |
| 2 | High | `cd /d "%~dp0"` + unzip folder `finance-manager-main (1)` / trailing `\` quote trap | `cd /d "%~dp0."` and two-step cd; no `%CD%` inside `( )` blocks |
| 3 | Med | Android pack on a clean unzip missed npm deps, cargo on PATH, and `aarch64-linux-android` | packer `npm install`, prepend `~/.cargo/bin`, `rustup target add` |
| 4 | Low | `apk.bat` required Microsoft JDK 17 only and hardcoded `C:\Users\Eric\finance-manager-v362` | Bat only cds + runs packer; packer already finds Temurin/Microsoft 17 |
| 5 | Low | README was a 3.62.x changelog dump; `desk.png` was a phone shot | Slim README + recaptured gallery |

## Fixed in v3.63.2

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | ConfirmDelete overlay was z-80 (Tailwind) while `.dialog-sheet` stayed unlayered z-60, so Remove/Purge/Close could not be clicked | Unlayered overlay 70 / sheet 80 |

## Fixed in v3.63.1

- Android one-click pack works after clean sync.

## Fixed in v3.63.0

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Low | Reports / Forecast / Recurring cream ring around white cells | One `--color-table` paper |
| 2 | Low | Date header leftover 7% navy wash still in stylesheet | Removed; headers use `--color-table-header` |
| 3 | Low | Post Delete confirm same z as Post | Confirm `z-[80]` |
| 4 | Low | Field labels almost never wired | Auto `htmlFor` + first-control id / click-to-focus |
| 5 | Low | Only Register/Reconcile virtualized | Receipts/Invoices/Bills/Checks/Ledger/Employees use same virtualizer (Register internals untouched) |
| 6 | Low | Taxed cash-sale Register edit left `receipt.lines` stale | Proportional rescale to new net |
| 7 | Low | README said All dates “through today” | Copy matches `to: ""` (open end) |
| 8 | Low | 280ms persist could drop last keystroke on hard close | `beforeunload` flush |
| 9 | Low | Dual IDB copies wrote every persist | Skip identical backup JSON; Restore last local copy stays |
| 10 | Low | `npm test` ran leftover auth-gate, not finance tests | Finance tests included; unused sign-in-gate files dropped |
| 11 | Low | Forecast / Recurring Actions had sort chrome | `ActionsHeader` with resize |
| 12 | Low | PartyCombo clipped in overflow sheets | Portaled list |
| 13 | Low | Print paper cream | White print paper |
| 14 | Product | Bills had no input VAT | Taxed bills: expense net + Input VAT + AP gross; Reports → VAT |
| 15 | Product | Hourly pay ignored hours; no withholding | Hours × rate; optional withholding to 2210 |

# Finance Manager — bugs & improvements (v3.62)

Re-verified in code 2026-09-05 (Asia/Manila). Updated for v3.62.47. UI direction: gestalt / professional ledger — cream paper, navy ink, real chrome — not an overly-minimal white sheet.

## Fixed in v3.62.47

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med (UX) | Register showed Void badge only for receipts; void lived on the record sheet | Shared Pending/Cleared/Void menu (recon + void) on Register, Receipts, payment record |
| 2 | Med | `voidReceipt` left recon cleared and allowed void on reconciled lines | Block reconciled / finished-statement; force recon pending; normalize heals void+cleared |
| 3 | Med | Reconcile select-all replaced the whole tick set (filter wiped other ticks) | Merge add/remove against filtered keys; select-all toast |
| 4 | Low | Desk reconcile tick cell lacked pointer stop; locked ShopTick still fired | `onPointerDown` stop; locked early-return |

## Fixed in v3.62.46

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | Med | Checks → Clear set `status` without `recon` — Register still showed Pending | `setCheckStatus` syncs recon; normalize heals legacy rows |
| 2 | Med (UX) | Bounce/Void only when pending; cleared checks had no Pending/Void/Bounce | Shared menu on Register, Checks ⋯, and check record |
| 3 | Low (UX) | Phone Register List status was display-only | Tappable status chip (same as Grid/desk) |

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
| A | Low–med | Register “All dates” | `datePresetRange("all")` sets `from` = prior Jan 1 and **`to` = ""** (open-ended). README now matches. | Copy fixed (v3.63.0) |
| B | Low | Register column sort vs running balance | Running Bal stays passbook values mapped onto rows. **Passbook** sort restores arrangement; **Balance** / other columns reorder display only. | Improved (v3.62.45) |
| C | Low–med | VAT model | Input VAT on taxed bills + Reports → VAT. | Fixed (v3.63.0) |
| D | Low | `ensureOutputVat` | Now `ensureSystemAccounts` (2200 / 1300 / 2210). Lookups still use `code`. | Improved (v3.63.0) |
| E | Low | Debounced persist (~280ms) | `beforeunload` + `pagehide` / `visibilitychange` flush. Crash can still drop a beat. | Improved (v3.63.0) |
| F | Low | `patchJournalAmount` | Still used for check / payment receipt / untaxed bill / deposit / expense / transfer (2-line). **Do not** use for multi-line VAT. | Still open (safe for 2-line) |
| G | Med (product) | Thin payroll | Hours × rate and optional withholding shipped. No 13th month / statutory PH engine. | Improved (v3.63.0) |
| H | — | Android APK | Solo path improved in v3.59 (JDK 17, NDK resolve, symlink fallback, auto-sign). Still needs SDK+NDK on the machine. | Improved (env) |

## New findings (confirmed) — not yet fixed or deferred

| # | Severity | Area | Notes |
| --- | --- | --- | --- |
| I | Low | Cash-sale line drift | Register amount edit on a taxed cash sale rebuilds the journal and rescales `receipt.lines`. | Fixed (v3.63.0) |
| J | Low | a11y labels | Field auto-wires `htmlFor` and first-control id; Select still uses click-to-focus. | Improved (v3.63.0) |
| K | Low | Tax % visibility | Edit/print show Tax % when the document has a rate even if Settings tax is off. New docs still seed 0. | Fixed (v3.63.10) |
| L | Info | Dead / unused | `src/lib/multiplayer/p2p.ts` exported but unused by app routes (multi-device still aspirational). |
| M | Low | `removeCashLines` | All-or-nothing; `assertOpenPeriod` on each line; toast is unique deletes. | Fixed (v3.63.10) |
| N | Low | Register virtualizer | Uses `getWorkspaceScrollElement()` (`main[data-workspace-scroll]`). Full AppShell ref still optional. |
| O | Low | Nested dialogs | Post **Delete** opens `ConfirmDelete` (both Dialog z-50). Sibling order puts confirm on top today; a dedicated higher z on confirm would be safer than relying on DOM order. |
| P | Info | `actions.ts` | Still `@ts-nocheck` restored from production build — types live via `typeof` in store. Prefer small surgical fixes over a rewrite. |
| Q | Low | List virtualization | Receipts/Invoices/Bills/Checks/Ledger/Employees use `useListVirtualizer` with live scroll + workspace fallback. | Improved (v3.63.10) |
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
