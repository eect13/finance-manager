# Finance Manager — bugs & improvements (v3.60)

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
| 6 | Med | APK launcher showed wrong blue/yellow circles | Brand navy icons from `src-tauri/icons/android` synced into `gen/.../res` on each APK pack; Eric must rebuild APK |

## Fixed in v3.58 (code review)

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | Editing a **taxed cash sale** via Register/`updateReceipt` used `patchJournalAmount`, which set every journal line to the full amount (bank debit = total, sales credit = total, VAT credit = total → unbalanced) | Rebuild bank / Sales / Output VAT lines (same pattern as invoice edit) |
| 2 | Medium | `removeEmployee` ignored paycheck history and left orphan `Employee payee (<id>)` vendors | Block delete when linked vendor has live checks; remove unused linked payee vendor when safe |
| 3 | Low | Invoices list had no empty-state row (unlike bills/receipts/employees) | Empty / no-match message |
| 4 | Low | `DropdownMenuContent` stayed at `z-50` while Select/Popover use `z-[200]` (regression risk inside overlays) | Raised Export (and other) menus to `z-[200]` |

## Fixed in v3.56–3.57

| # | Severity | Issue | Fix |
| --- | --- | --- | --- |
| 1 | High | Company backup omitted `employees` | Export tables + file version 14 |
| 2 | High | Editing taxed invoice unbalanced journal (`patchJournalAmount` set every line to full total) | Rebuild AR / Sales / Output VAT lines on invoice edit |
| 3 | High | Toggling Settings `taxEnabled` rewrote historical invoice totals | Totals use stored `taxRate > 0`, not live toggle |
| 4 | High | Create with explicit `taxRate` ignored tax when Settings tax off | Apply tax when `taxRate > 0` on create/cash sale |
| 5 | Medium | `payEmployee` matched vendors by display name (could hit “Staff payroll”) | Link vendor via `Employee payee (<id>)` notes marker |
| 6 | Medium | `removeVendor` ignored checks | Block delete when non-void checks reference vendor |
| 7 | Medium | Blank employee rename allowed | Reject empty name; sync linked payee vendor on rename |
| 8 | Low | Tauri package version lagged app | Aligned to app version |
| — | — | Local dates, purge/register, In/Out balance, select z-index, scrollbars, Options, Employees UI | Shipped in 3.55–3.56 |

## Still open (known) — re-verified in code 2026-09-04

| # | Severity | Area | Notes | Status |
| --- | --- | --- | --- | --- |
| A | Low–med | Register “All dates” | `datePresetRange("all")` sets `from` = prior Jan 1 and **`to` = ""** (open-ended). Not all-time; README says “through today” but code does not cap at today. Label can still confuse. | Still open (by design for memory) |
| B | Low | Register column sort vs running balance | Balance is computed chronologically then mapped onto sorted rows; sorting by payee looks “wrong” but is intentional. | Still open |
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
| J | Low | a11y labels | `Field` supports `htmlFor` but almost no call sites pass it (~150 Fields, ~3 `htmlFor`). Selects/combos often lack a programmatic name beyond visible text. |
| K | Low | Tax % visibility | Invoice/receipt Tax % fields hide when Settings tax is off, even if the document still carries historical `taxRate > 0` (totals remain correct). Matches “Settings seeds new docs” but can surprise editors. |
| L | Info | Dead / unused | `src/lib/multiplayer/p2p.ts` exported but unused by app routes (multi-device still aspirational). |

## Areas of improvement

1. **IndexedDB / size** — Cap audit further; optional purge of closed detail; avoid dual full backup copies; chunked multi-company blobs.
2. **List virtualization** — Extend register’s `@tanstack/react-virtual` to invoices/bills/receipts/checks/ledger/employees when lists grow.
3. **Code-split** — Lazy TanStack routes + Vite `manualChunks` for reports/close/reconcile/seed.
4. **Tauri / Android** — Validate WebView IDB persistence; share/save company JSON; cold-start via splits. Solo APK path improved in v3.59 (JDK17/NDK/symlink/auto-sign); still needs SDK+NDK installed.
5. **Payroll depth** — Pay periods, withholdings, link checks to `employeeId`, batch pay run, block delete when pay history exists (partially done for employee delete).
6. **Multi-device** — Explicit company-file exchange / LWW or CRDT; no naive full-state overwrite. P2P stub exists unused.
7. **Purchase VAT** — Input VAT on bills + VAT payable/receivable reports.
8. **Invoice edit UX** — Surface tax as document field clearly so Settings toggle never feels like it rewrites history (partially: Tax % on create/edit when tax enabled).
9. **“All dates” copy** — Align README (“through today”) with code (`to: ""`) or cap `dateTo` at `todayIso()`.
10. **Field `htmlFor` / input ids** — Wire labels for keyboard and screen-reader focus.

## Review notes (UI / quality snapshot)

- **Options vs Settings**: Nav + page title say **Options**; route remains `/settings`. Consistent and intentional.
- **Employees**: Search, status/pay-type filters, sort options, and empty states are in good shape.
- **Register**: Virtualized; In/Out filter does not recompute running balance incorrectly (balance from full window, rows filtered). Thin scrollbars on `.list-card.list-grid` present.
- **Select stacking**: Select/Popover at `z-[200]`; Dialog/Sheet at `z-50` — selects inside dialogs work. Dropdown menus now match.
- **Local dates**: `todayIso()` uses local `getFullYear/Month/Date` (not UTC `toISOString` slice) — correct for PH/local books.
- **Backup version**: `COMPANY_FILE_VERSION = 14` and store persist `version: 14`; `employees` in export tables — prior high bug remains fixed.
- **actions.ts** is `@ts-nocheck` restored from production build — types live via `typeof` in store; prefer small surgical fixes over large rewrites.
