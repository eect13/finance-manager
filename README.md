# Finance Manager v3.62.55

Treasury books in a **desktop window**, and in the browser. Banks, receipts, checks, invoices, bills, **employees**, and a **bank register**.

Pacific Harbor Trading is the default **sample company** — a full 2026 year of trading (rent, payroll, utilities, invoices, bills) plus extra trade so the file sits near **1,000 documents**. Payee is the customer or vendor name; memo is the reason (Ayala Land / Warehouse rent — never one string). Every payee is on file. Listed A–Z. Activity through early September is posted; later months sit pending. Create more companies from the name in the header or from Settings. **Remove sample** (Settings) deletes that file from this browser; **Restore last local copy** puts back the last automatic snapshot, and Reload sample brings the demo back. If it was the only company, a blank file takes its place.

**License:** MIT. **Style:** ledger, light or dark (the treasury mark in the menu and favicon inverts with the theme). **Tags:** finance, accounting, bank register.

No accounts, no server setup. Books stay on this computer (IndexedDB). Settings → Storage asks this browser to **keep the books** (persistent). The GB number there is the browser’s grant — often about 10 GB until persistent, then a large share of free disk. Finance Manager does not cap it. Download a backup. There is no cloud.

The app mark is a **navy tile with cream pillars** — a full opaque square (Windows 11 already rounds the tile; transparent corners were a white plate). Web uses the SVG favicon. Windows uses a **BMP 32-bit** `.ico` (PNG-in-ICO is a white square on the shortcut and the taskbar). After install, **delete any leftover blank shortcut** and pin the new one — Explorer caches the last icon.



## What's new in v3.62.55

- **Desktop Options → Keyboard shortcuts**: documents real hotkeys only — Find (Ctrl/⌘K), Undo/Redo, list ↑/↓ + Enter + Space tick (Register/Reconcile), date-field T/±, print-preview Esc/±/Ctrl0
- **Desktop tooltips**: hover tips on Undo/Redo, Find, theme, zoom; title tips on Export, Filters, View, column ⋮ align
- **Mobile Options**: short Gestures & tips (tap to open, More menu, Move-dates grip, no swipe) — not the desktop shortcut sheet

## What's new in v3.62.54

- **Keyboard row focus (all desk lists)**: click the table/grid, then Up/Down moves a focused row (ring bar — light + dark). Enter opens/edits; Space toggles tick on Register/Reconcile. Shared `useTableKeyboardFocus` — Register, Reconcile, Banks, Checks, Receipts, Invoices, Bills, Employees, Customers/Vendors, Ledger
- **Register check column**: tighter tick spacing to match Reconcile (less padded `.col-check` / ShopTick)
- **Column align options**: header ⋮ menu (or right-click) sets left/center/right per column; persisted. Defaults: text left, money right, status center. Register View still toggles columns on/off

## What's new in v3.62.53

- **Desk list anti-stretch**: `table-layout: fixed` so one name/payee/customer flex column absorbs leftover width; Number/Date/money/status stay compact; Actions hugs content (no huge gap before Collect/⋯). Phone keeps `max-content` + horizontal scroll
- **Row actions**: desk shows ≤2 extras as buttons (Delete, Void, …); ⋯ only when crowded or on phone. Checks/Receipts Delete is on the row (status stays on the Status chip). Banks uses `RowDeleteButton`. Bills Void+Delete promote on desk
- Employees roster uses the same list-grid column model

## What's new in v3.62.52

- **Dark select contrast**: Register Grid/List + Reconcile ticked rows use clearer selected tint (`bg-primary/15` + primary border/ring); ShopTick filled primary when checked; sidebar active item lightly bumped
- **Banks list Delete**: desk row shows a Delete button when that is the only action (no delete-only ⋯)

## What's new in v3.62.51

- **Register open on double-click** (desk Grid + phone Grid/List): single click selects/focuses; double-click opens the record (matrix already did)
- **BAL → Balance** on Grid card money headers and select toolbar
- **Dark mode contrast**: brighter `--color-debit` / `--color-warning` / borders so OUT amounts, Pending badges, and Reconcile Days stay readable
- **Reconcile desk**: virtualizer scrolls the table card (fixes ghost tick overlap + huge empty body); cleaner ShopTick box
- **Checks**: Status chip is toggleable (Pending/Cleared/Bounce/Void); clearer ⋯ menu next to Status
- **Storage / undo**: undo/redo depth raised to 100; Options Storage notes the cap

## What's new in v3.62.50

- **Register desk passbook arrange**: Move dates uses the same pointer grip → ghost → before/after drop as phone (HTML5 `tr` draggable removed — grips were visible but desk arrange felt broken)
- Move dates locks **Passbook** sort (column headers + Filters sort) so same-day reorder is visible
- **Register desk Grid|List** toggle in View (same `finance-manager-register-phone-layout` persistence as phone); List = matrix table, Grid = card stack
- Before/after drop markers + move ghost CSS work on desk too (were phone-media-only)

## What's new in v3.62.49

- **Recon fee/interest scale**: ledger already stored cents correctly (`parseAmountToCents` once). Audit was showing raw cents (`Service charge 10000` for ₱100) — finish/undo/recon-adj audit now uses `formatMoney`
- Amount-integrity tests: pesos string → cents → `addExpense` / recon adj → display
- **apk.bat** rock-solid self-deploy: `pushd` to repo root (paths with spaces), verify `package.json` + packer, force Microsoft JDK 17 via full `java.exe` path + `findstr /C:"17."`, ANDROID_HOME/NDK, clear SUCCESS listing of versioned APK, open Explorer; Desktop launcher → absolute `deploy\android\apk.bat`

## What's new in v3.62.48

- **Transfer recon is per bank leg**: Pending / Cleared / Reconciled on Operating no longer auto-clears Reserve (and vice versa)
- Finish statement / undo / Register status ticks only the selected bank's transfer leg
- Normalize migrates legacy shared `journal.recon` onto both legs (`reconByBank`) so existing books stay intact
- Passbook arrange still moves both legs as a block; edit/delete/reschedule still lock if either leg is reconciled

## What's new in v3.62.47

- **Receipt / payment status** (Register desk + phone Grid/List, Receipts ⋯ + status chip, payment record): Pending / Cleared / Void — same pattern as checks; ledger status stays `posted` | `void`
- `voidReceipt` blocks reconciled lines, clears recon to pending, and normalize heals legacy void+cleared stubs
- **Reconcile ticks**: select-all merges with filtered lists (no longer wipes ticks outside the filter); desk tick cell stops pointer events; locked ShopTick ignores clicks; select-all toasts count

## What's new in v3.62.46

- **Check status menu** (Register desk + phone Grid/List, Checks ⋯, check record): Pending / Cleared / Bounce / Void — not only pending↔cleared
- `setCheckStatus` keeps **status + recon in sync** (Clear from Checks no longer leaves Register showing Pending)
- Normalize heals legacy cleared-without-recon checks on load
- Phone Register **List** status chip is tappable (was display-only vs desk/Grid)

## What's new in v3.62.45

- Phone Move: **edge auto-scroll** while dragging near top/bottom of the workspace — drop far dates without scroll-then-re-drag
- Reconcile uncleared list follows **passbook same-day order** (`compareCashLines` / `registerOrder`)
- Prune orphan `registerOrder` keys on delete; arrange renumber no longer keeps ghosts
- Transfer arrange moves **both legs as a block** (All-banks stays consecutive)
- Desk Move drop highlight: no flicker when the pointer crosses child nodes
- Register sort: **Balance** column (desk + phone List) + **Passbook** option (default) — Bal values stay passbook running totals; Passbook restores arrangement order
- Shared workspace scroll helper for virtualizers; stale swipe-wrapper CSS comment cleaned

## What's new in v3.62.44

- Phone Register + Reconcile: Grid swipe removed (dead `PhoneSwipe` + CSS); actions via card status + select bar Clear/Delete

## What's new in v3.62.43

- Register **passbook arrange**: Move dates drag places a line **before/after** another row — same-day reorder or adopt that row's date; durable `registerOrder` (running Bal follows passbook order)
- Phone: sticky **date chips removed** (row drop covers arrange); hint text updated
- Phone Register + Reconcile: **PhoneSwipe removed** for uniform Grid cards (select bar / status / delete still available); can return later
- Migration: existing books get stable default order (date → createdAt → id) so lines do not jump

## What's new in v3.62.42

- Atomic batch delete: store `set` updater reads **current** books, re-validates all target ids on that snapshot, then removes all or no-ops/throws — closes mid-delete race with undo/other tab (never half-delete); transfer dedupe `kind:sourceId` kept
- Desk Reconcile table rows virtualized with `@tanstack/react-virtual` (sticky header, `measureElement`, pad pattern) matching desk Register — phone List/Grid unchanged

## What's new in v3.62.41

- Phone virtualization: Register **and** Reconcile **List + Grid** use `@tanstack/react-virtual` with `measureElement` (variable card heights), pad pattern, PhoneSwipe + Move dates preserved
- Register batch delete is **atomic**: preflight all ids (locks / missing / transfer dedupe) then one store write — any block aborts with zero deletes and a clear toast
- Residual: mid-apply throw after a successful preflight is still theoretically possible if books mutate underfoot; store `apply` does not persist a partial chain

## What's new in v3.62.40

- Register batch delete: toast reflects actual deleted vs failed counts (no false full success); transfer dual-side deduped in `removeCashLines`
- Register Bal (footer + phone toolbar) uses chronological ending balance, not sorted last row
- Phone Move: brief toast when an active drag is released off a date chip/row (threshold still ignores tiny taps)
- Cleanup: drop unused `onSelectIds` from RegisterSwap
- Perf: virtualize phone Register **List** with the same `@tanstack/react-virtual` pad pattern as desk (Grid cards + Reconcile phone lists deferred — variable card height / separate route)

## What's new in v3.62.39

- Register phone Move dates: pointer drag-and-drop (grip → ghost → date chip or row) matching desk arrangement — no HTML5 `draggable` (Android WebView-safe)
- Sticky date chips stay as drop targets; arm-then-tap demoted (hint: drag onto a date or row)
- PhoneSwipe stays off while Move dates is on; scroll does not steal mid-drag (`touch-action` + non-passive pointermove)
- Locked / not reschedulable grips refuse drag with a clear toast; Switch off / leave Register clears drag state

## What's new in v3.62.38

- Fix `deploy/android/apk.bat` false "java is not JDK 17" on Microsoft OpenJDK (`openjdk version "17.0.20.1"`): drop brittle for/f + findstr /r quote regex; after forcing JAVA_HOME to Microsoft jdk-17*, verify `bin\java.exe` and `java -version | findstr /C:"17."`

## What's new in v3.62.37

- Register phone Move dates: date chips stay in the sticky Filters chrome so grip→chip tap-tap still works after scrolling the list/grid
- Clearer Move feedback: toast if no grip armed, same-date / locked line; dimmed locked grips explain why a row can't move
- Turning Move dates off clears any armed grip

## What's new in v3.62.36

- Hardened double-click `deploy/android/apk.bat` (+ repo-root `apk.bat`): forces Microsoft JDK 17, sets ANDROID_HOME/NDK, verifies `java -version` before pack
- Self-deploy: Desktop launcher can call the fixed bat; pack still outputs versioned arm64 release APK

## What's new in v3.62.35

- Register View: **Move dates** Switch stays, now at the **top** of View (phone sheet + desktop popover)
- Bank Move when rows are ticked: one compact sticky bar — `{n} selected` · To bank · Move · Clear · Delete (no stacked second panel / duplicate count)
- Register/Reconcile phone Grid: quieter card outlines (less lined/cluttered); keep readable spacing

## What's new in v3.62.34

- Phone table column titles (Date, Amount, Check, …) stay on **one line** — side-scroll instead of wrapping

## What's new in v3.62.33

- Phone list tables: **no letter crush** — cells stay single-line (`nowrap`); card scrolls horizontally when columns exceed the viewport (and vertically for rows)
- Removed v3.62.31 wrap/break rules that forced `word-break` / `overflow-wrap: anywhere` and `min-width: 0` on every list table
- Payee/memo/description may wrap at word boundaries only (with a ~10rem floor); money/date/status stay nowrap at normal size
- Register Grid: status chip shows the badge only (no duplicate Pending/Cleared/Reconciled text)
- Page titles keep full readable size on phone (no compact shrink)

## What's new in v3.62.32

- Register phone **View** column chips (Date, Type, No., Payee, Memo, Bank, Payment, Deposit, Balance, **Status**) apply to **Grid and List** — not desktop-only
- Phone Filters sheets: Select menus stay usable (period/type/sort actually apply on Register, Reconcile, and other list tabs)
- Phone List keeps full desktop-like columns with wrap + scroll (readable type, no compacting); Grid outlines aligned (no double borders)
- Reconcile phone List/Grid: full payee/memo visible; Resize type honored on List

## What's new in v3.62.31

- Phone doc lists (Invoices, Checks, Bills, Receipts): **no swipe** — uniform tables with full row info and RowActions (Register/Reconcile keep Grid/List + PhoneSwipe)
- Phone tables: wrap cells so memo/description/amounts stay visible; no aggressive ellipsis cutoff
- Bottom sheet close **X** hidden (Done already closes); Register/Reconcile swipe colors no longer bleed at card edges
- Employees summary chips stay one row on phone (Active / On file / Showing)

## What's new in v3.62.30

- Phone doc lists (Invoices, Checks, Bills, Receipts): **swipe** a row for Void/Delete — Pay/Collect and ⋯ stay on the face
- Reconcile **View** sheet: Layout (Grid/List) + Resize type (same font size as Register)
- README + phone screenshots refreshed (device shots: Desk, Employees, Ledger, Aging, Close; plus Register Grid/List / Invoices / Reconcile View)

## What's new in v3.62.29

- **Filters** open as a real phone bottom sheet on every list (embedded panel, not a nested Filters button)
- Register: Layout control only in **View**; Reconcile Grid cards show Memo

## What's new in v3.62.28

- Phone Register/Reconcile **List** = Invoices-style flat table; **Grid** keeps full cards with Memo

## What's new in v3.62.27

- Phone Filters panel + View sheet; Move dates under Layout; swipe CSS hardened for Register/Reconcile

## What's new in v3.62.26

- Sticky Register/Reconcile chrome, Filters sheets, company Sheet, swipe Clear/status/delete, safe-reach bars

## What's new in v3.62.25

- Phone Grid|List on Register and Reconcile (Move dates on Register)

## What's new in v3.62.21

- Phone Register + Reconcile: **Grid** = full cards (incl. Memo); **List** = Invoices-style table; Filters open as a bottom sheet
- Compact phone chrome (shorter hints, stacked Filters/search); desktop tables unchanged

## What's new in v3.62.20

- Register phone: Date + Payee + money columns; fixed clipped ticks; no sticky-date collision
- Reconcile: aging chips instead of one long line; tighter phone column defaults + scroll hint

## What's new in v3.62.19

- Phone: all toasts (Post, undo/redo, errors) stay at the bottom — a CSS override had pinned them over the header

## What's new in v3.62.18

- Android: one clean status-bar gap (edge-to-edge + single native pad; no double stack)
- Company switcher: clearer truncate, phone dialog from first paint, stronger tap target
- Desk: close banner stacks on phone; bank/list rows easier to tap

## What's new in v3.62.17

- Android: remove double status-bar gap (decorFits without stacking native padding)
- Phone Register: sideways scroll restored; compact columns (payee + amounts); sticky date
- Fold / tablet: denser mid-width layout; desktop layout unchanged at md+

## What's new in v3.62.16

- Phone: company switcher and ⋯ More open reliable dialogs (dropdowns were missing taps under Display zoom)
- Register: narrower mobile column defaults + denser cells so more fits before sideways scroll
- Undo/redo (and other) toasts sit at the bottom so they don’t cover the header

## What's new in v3.62.15

- Mobile: remove double top gap (native status-bar inset + CSS) on home and sidebar
- Phone tables: hide column-resize handles; horizontal scroll instead of stuck widths
- Tighter page title / desk spacing for a more balanced mobile layout

## What's new in v3.62.14

- Status bar: apply system-bar insets to the WebView **after** Tauri starts (previous flag was overwritten)
- Phone menu also keeps a fallback top spacer if insets are missing

## What's new in v3.62.13

- Android App info version now tracks the real release (was stuck at 3.57.0)
- Status bar: WebView stays below system bars so the phone menu no longer draws under the clock/battery

## What's new in v3.62.12

- Display zoom no longer shrinks the phone menu under the status bar (zoom applies to the workspace only)
- Menu sheet uses a solid status-bar inset so it clears the system top bar like the header

## What's new in v3.62.11

- Mobile header is one row: menu · **company** · undo/redo · More (find, theme, Options)
- Denser page spacing on phone so lists and forms use more of the screen

## What's new in v3.62.10

- Company switcher is a full-width row under the top bar on phone (was easy to miss next to undo/zoom)
- Options opens with a **Switch company** card at the top

## What's new in v3.62.9

- Phone menu **Collapse** now collapses the sheet too (narrow icon rail), matching the desktop sidebar

## What's new in v3.62.8

- Phone menu: **Collapse** is back next to Options (sheet stays labeled — no icon-only rail)
- Status-bar inset: safe-area padding compensates for Display zoom so the drawer no longer crawls under the system top bar

## What's new in v3.62.7

- Phone menu: never icon-only rail — **Collapse** is desktop sidebar only; sheet always shows labels (fixes empty sparse drawer)
- Slightly denser sheet nav groups

## What's new in v3.62.6

- **Balanced mobile polish** (phone / coarse pointer): calmer header (tighter action gaps, scrollable actions, quieter zoom −/%/+, graceful company truncate); slightly denser list/register/nav rows (≥40px touch); smaller page titles so content starts sooner; modest table/card padding trim; tighter sidebar sheet nav — keeps professional ledger feel (not minimalist)
- Preserves v3.62.5 white-square scrollbar hide, display zoom, and safe-area insets

## What's new in v3.62.5

- Kill the lower-right white square on Android for real: hide WebView scrollbars on touch (transparent corner CSS is ignored), stop dual-axis page scroll hosts, move toasts to top-center

## What's new in v3.62.4

- **Display zoom** (Options → Display / Formatting): 75%–150% in 5% steps, device-local (`finance-manager-ui-zoom`). Scales whole chrome via CSS `zoom` / `--app-ui-zoom`; early boot before paint
- Header **− / % / +** on phone / coarse pointer (next to theme). Pinch zoom allowed (viewport `maximum-scale=5, user-scalable=yes`)
- Transparent `::-webkit-scrollbar-corner` (fixes Chromium white square at scrollpane bottom-right)
- Mobile cut-offs: page actions / Customers & Vendors / party panes / Register post row scroll or stack instead of clipping; dialogs use safe-area max-height
- Android WebView: packer patches MainActivity pinch zoom when gen exists (see deploy/android README)

## What's new in v3.62.3

- Sidebar: **Collapse** also appears in the phone menu (same footer as Options), not only the wide sidebar
- Launcher icon framed with more navy margin (zoomed out further)
- Sidebar footer clears the gesture bar

## What's new in v3.62.2

- Permanent md+ sidebar and mobile sheet Close clear the Android status bar (safe-area inset + coarse fallback)
- Sheet content top padding aligned with the Close control inset
- Launcher icon zoomed out further (adaptive FG ~44%, legacy ~54%) for a calmer navy frame around the cream pillars

## What's new in v3.62.1

- Android release APK loads bundled UI (custom-protocol) — no more black screen / `127.0.0.1:8080`
- Mobile top bar clears the status bar (safe-area fallback for edge-to-edge WebView)
- `pack-android.mjs` / `apk.bat`: direct `cargo --release --features custom-protocol` + NDK clang (android-studio-script is fallback only)
- Launcher icon reframed for adaptive-icon safe zone (less zoom / crop on the home screen)

## What's new in v3.62.0

- Register: the tick column is always on — no **Move** arming button and no View → **Allow delete** switch. Tick lines, then **Delete** on the bulk bar (opening rows and finished statements stay locked). When a selection is live, bank reassign still sits on that bar. Date-move is drag (View → Drag rows) or the calendar, not a second mode
- Post / Edit: **Delete** for the open line, left of Close. Reconciled lines cannot be deleted until you undo that rec
- Close: Open AR / Open AP / Trial balance sticky bar no longer paints over the date calendar. The picker portals to the page with a solid fill at z-5000; the Close summary sticks at z-4
- Date picker: opaque `var(--color-popover)` fill (the old `hsl(var(--popover))` was invalid in this theme, so Close totals showed through the grid)

## What's new in v3.61.0

- Register recon badges show full words: **Cleared**, **Reconciled**, and **Pending** (no more single-letter C / R) — same on print
- Amounts use thousand separators by default (e.g. `9,825,076.00`), including when currency is blank; Options → **Display / Formatting** can turn separators off and set decimal places (0–4). Stored with the company file
- Register Post/Edit: Check # on create and edit (loads/saves `checkNumber`); cash-sale edit shows receipt No. (read-only) and optional Ref
- DateInput calendar: higher z-index above dialogs; smarter above/below placement so the picker is not buried under the sheet

## What's new in v3.60

- Date fields: calendar chevron stays inside the input on the right (Reconcile, Reports, Close, Options, and every other DateInput) — relative wrapper + absolute icon; no orphaned marker below the field
- Calendar popover styles for the shared DateInput picker

## What’s new in v3.59

- Undo/redo toasts name the action (e.g. Undid: delete invoice INV-1042); menu items show the same peek labels
- Options → Currency and tax: country tax packs; **Also update home currency** switch; **No currency** blank option (amounts without a symbol)
- Android mobile: status-bar safe-area padding, double-tap copy, brand navy launcher icons synced into the APK
- Android `apk.bat` / `pack-android.mjs`: JDK 17, NDK, symlink copy fallback, auto-sign for solo builds


## What’s new in v3.58

- Pacific Harbor sample: full-year trade rhythm with as-of early September (Jan–early Sep mostly posted; later months pending); recurring warehouse rent due 1 Sep

## What’s new in v3.57

- Invoice edit keeps VAT journals in balance; totals follow stored tax rate (Settings toggle no longer rewrites history)
- Employee payees linked by id (no vendor name collisions); cannot delete vendors that still have checks; blank names blocked
- See [docs/BUGS-AND-IMPROVEMENTS.md](docs/BUGS-AND-IMPROVEMENTS.md) for the full fixed / open / improvements list

## What’s new in v3.56

- **Employees** roster with search, status/pay-type filters, column sort, and paycheck posting
- Local calendar dates (Manila-safe), purge/register balance fix, In/Out window balance, Output VAT split
- Register Post dropdowns stack above dialogs; softer hover scrollbars; Settings labeled **Options**
- Company backup includes employees; Tauri package version aligned to 3.56

## Install and deploy

This is a **Tauri 2 desktop app** — the same stack as Font Manager — plus a web build. Double-click `deploy.bat` on Windows for an installer you can copy to other PCs. They do not need Node or Rust.

| Target | One-click | What you get |
| --- | --- | --- |
| **Windows (priority)** | `deploy.bat` | **NSIS setup** (and **MSI** if WiX v3 is installed) under `src-tauri/target/release/bundle/`. Install that on this PC or another. WebView2 is bundled. `desktop-setup.bat` installs Rust once and opens the app. |
| **Android** | `deploy/android/apk.bat` (or root `apk.bat`) | Real **Tauri APK** (same WebView app as desktop, not a PWA/TWA). One-click forces **Microsoft JDK 17**, sets SDK/NDK, then packs. Versioned `.apk` lands in `deploy/android/` (`finance-manager-v{ver}-arm64-release.apk`). |
| **Web** | Remix from Grok, **or** `deploy/web/build.bat` | Remix is the live SSR app. The local pack writes `web/index.html` + `web/assets/`. Serve with `deploy/web/serve.bat` (not `file://`). |
| **iPhone / iPad** | Safari → Share → **Add to Home Screen** | Same web app. |

**Windows build needs (once):** Node 22, Rust (the script can install it), and **Visual Studio Build Tools** with “Desktop development with C++”. First compile is slow. After that, other computers only run the installer.

Vite is installed with the rest of the packages — you do not need a global `vite` command.

Lists (banks, register, receipts, checks, reports, reconcile) wrap actions and keep peso amounts on one line on a phone. Long lists scroll inside the card (sticky headers), same as reports. **Reports → Aging** stacks Receivables then Payables (never two skinny columns) so Open amounts like `₱15,253,430.00` stay whole — swipe sideways on a phone if the row is wider than the card. Reconcile proof is two boards — statement vs book — stacked on a phone, side by side on a desk. Book cash lives on the desk, not in the header, so the company name does not collide with Find.

**Windows `deploy.bat`:** Vite 8 used to crash if the folder name had parentheses (a second zip extract is `finance-manager-main (1)`). The desktop pack now uses a relative `desktop.html`, so that path builds. Node 24 peers: `.npmrc` has `legacy-peer-deps=true`. After this installer, **delete the leftover white shortcut** and pin the new one — shortcut and taskbar both use the navy pillars tile. (v3.53 pointed the window icon one folder too high and cargo stopped; v3.54 reads `src-tauri/icons/icon.png`.)


## Screenshots

![Treasury desk — cash across banks](docs/screenshots/desk.png)

![Banks — accounts and balances](docs/screenshots/banks.png)

![Bank register — receipt status menu (Pending / Cleared / Void)](docs/screenshots/register.png)

![Checks — Clear / Bounce / Void from row ⋯](docs/screenshots/checks-status.png)

![Receipts — Pending / Cleared / Void from status chip](docs/screenshots/receipts-status.png)

![Employees — roster, filters, and Pay](docs/screenshots/employees.png)

![Reports — AR then AP aging](docs/screenshots/reports.png)

![Reconcile — statement vs book proof](docs/screenshots/reconcile.png)

![Close — Open AR / AP / TB, checklist](docs/screenshots/close.png)

![Options — currency, country tax pack, Also update home currency](docs/screenshots/options-currency-tax.png)

![Options — Display / Formatting and storage](docs/screenshots/options.png)

![Labeled undo toast — Undid: update options](docs/screenshots/undo-toast.png)

Phone (device shots in dark theme; Register/Invoices/Reconcile also have light studio shots above the fold in git history):

![Desk on a phone](docs/screenshots/desk-phone.png)

![Employees on a phone](docs/screenshots/employees-phone.png)

![Register on a phone — Grid cards with Memo](docs/screenshots/register-phone-grid.png)

![Register on a phone — List table](docs/screenshots/register-phone-list.png)

![Invoices on a phone](docs/screenshots/invoices-phone.png)

![General ledger on a phone](docs/screenshots/ledger-phone.png)

![Reports — Receivables aging on a phone](docs/screenshots/reports-receivables-phone.png)

![Reports — Payables aging on a phone](docs/screenshots/reports-payables-phone.png)

![Reconcile on a phone — View sheet Layout + type size](docs/screenshots/reconcile-phone.png)

![Close on a phone](docs/screenshots/close-phone.png)

![Customers on a phone — horizontal scroll / display zoom](docs/screenshots/customers-phone.png)

![Options display zoom on a phone](docs/screenshots/options-display-zoom-phone.png)

Books do **not** follow you to another phone or laptop. Download a backup on one device and restore it on the other.


## Bank register

- Opens on **this month**, not the whole file. Filters → **Month**, **Year**, or **All dates**. All dates on screen is **last calendar year through today** (plus a Balance forward) so a fat file does not allocate every historical line. A custom From/To still walks exactly that range. CSV is the whole bank. Type dates as `08312026` or `08/31/2026`.
- The first row is **Balance forward** when a date window is on — one number for everything before the From date, then only this period’s lines. Running balance stays correct without walking five years of rows on screen.
- Last balance in the strip is the end of **this window**, in document flow — it does not stick over search or filters. Desk is still the full cash position.
- The bank tab you were on comes back after a refresh. Hidden columns and type size live in the company file; light/dark is a browser preference. Search and drag do not stick — those are easy to leave on by accident.
- Switch banks with the tabs above the table — that is the book you are in
- One search bar plus **Filters** (period, type, in/out, sort) and **View** (columns, type size, drag). On a phone search is its own row, then In / Out / Last balance, then Filters / View (swipe if they do not fit). Bank tabs stay one row and scroll sideways — Safekeeping does not wrap under Payroll. On a narrow screen the table keeps Date, No., Payee, Payment, Deposit, and Balance — Type, Memo, Bank, and Status hide so payee names are not clipped. Swipe the book for the rest, or turn columns back on from View on a wide screen. Dates drop the year when it is this year (`Sep 1`). On a phone, **Grid** shows full cards (with Memo) and **List** matches the Invoices-style table; the running balance stays on every row. On phone doc lists (Invoices, Checks, Bills, Receipts), swipe a row for Void/Delete (Pay/Collect and ⋯ stay on the face). Reconcile **View** holds Layout (Grid/List) and Resize type (same font size as Register). On a desk it stays a matrix table. **Every other table uses the same family:** click a header to sort, drag the column line to resize, double-click the line to auto-fit, search, and a **Filters** popover (Month / Year / All dates, type or status, sort). That includes invoices, bills, receipts, checks, employees, banks, ledger, customer/vendor history, and reconcile. Tight lists keep **Status on the row** and put extra work in **⋯** (Collect + Print/Void/Delete on invoices; Pay on bills) so buttons never paint over Status. If the card is tighter than the columns, a thin scrollbar appears — no dark fade. The tick column (delete / reassign bank) stays on the register only.
- **Post** sits next to Print. Type is a dropdown: Check, Cash sale, Receive payment, Transfer, Vendor pay, Deposit, Expense. **Last type sticks** (Check the first time). **Tab order is Date → Payee → Amount → Memo → Bank.** Date autofocuses. Date is a typeable combo (`08312026`, `08/31/26`, or `08/31/2026`). Click the chevron for a calendar. **T** = today, **+** / **−** bump a day. Last date sticks like Type. Enter posts. The button reads **Saved** for a beat, then the line clears and Date is ready again. Esc or Close leaves. Double-click a register line (check, cash sale, transfer, deposit, expense) opens **the same window** in Save mode, with **Delete** for that line. Receive payment and on-account receipts still use the allocation window. Bills stay bills.
- **Issue check** and **Receive** in the header still open the full forms when you need line items or a printed check. On a phone those two plus Reconcile live in the menu — the register keeps Post, Print, and CSV.
- The header sits on the page ground — no white bar. In / Out / Last balance is the same: ink on the page, not a card. Search and filters sit above the book without a second white well. The register table is the figure.
- Hover a row to lock the line across the ten columns. **Last balance** stays in the strip **above the table, in document flow** — it does not float over the book while you scroll, and it does not cover search.
- Empty memo, payment, and deposit cells stay blank on screen. Print still uses dashes
- The tick column is always on. Click the gutter to select a line — it does not open the record. Space toggles the highlighted row. A sticky bar then offers **Delete** and bank reassign. **Pending and Cleared** of every type tick (check, cash sale, receipt, vendor pay, expense, transfer). **Reconciled** (finished statement) shows a lock — undo that rec to change it. Opening balance cannot be ticked. Click a row to highlight it. Double-click or Enter opens it.
- Header titles for Date / Type / Payee sit **in the center** of each column (QuickBooks). Money **titles** (Payment, Deposit, Balance, Amount, Book, Open) are also centered over the column; the **figures** stay right-aligned on the same plumb line. Drag the faint column **hairline** to resize — it thickens on hover. **Double-click** the line to auto-fit the longest **visible cell** (not the header title). Same on every list. Widths come back after a refresh. Print still uses View’s show/hide, not these widths. Tables fill the card — name columns (Payee, Received from, Customer, Bank, Nickname, Memo) share leftover width the way a CSS grid `1fr` track would. Money, status, and **Actions stay content-sized** (Delete on Banks is a tight column, not a well). If the book is tighter than the content, the card scrolls sideways with a thin bar — there is no dark fade over the last column. The last header is not resizable. One hairline between columns. First visit (or factory widths) **auto-fits** to the painted cells. Date scrolls with the book (it is not frozen).
- Payment is debit red, deposit is credit green, running **Balance** stays ink-dark so it reads as the result. The three money columns share tabular lining numerals and right-align to the same plumb line.
- View → columns show/hide Date, Type, No., Payee, Memo, Bank, Payment, Deposit, Balance, and Status. Print uses the same setting — no second set of toggles
- Collapse the side menu to give the register more room — layout follows that workspace, not the whole window
- **Print** opens an on-screen sheet (so it works in this preview, on a phone, and in a desktop window). **Close** and **Print** stay on the first row at 44px — on a narrow overlay they stack full-width so neither is off-screen. Paper, pages, type, and zoom sit on a second row that **wraps** to the overlay width — the bar follows the print overlay (container query), not only the window. Labels shorten (Port. / Land. / Fit / View / Print). **Print** (or System print) runs the OS dialog; if this preview blocks `window.print`, the sheet stays on screen and Close still works. The paper trigger shows **Letter** (or A4…) — click it for US (Letter, Legal, Tabloid, Statement, Executive, Folio) and ISO (A3–A5, B4, B5); dimensions sit beside each name. The list opens **over** the sheet so every size is reachable. The sheet **is the page** — company name left, report title right, address and phone on one line, email on the next so it never collides with the table. Register print **splits by rows** so a year or All dates does not freeze the preview; later pages say continued, totals sit on the last page. Print columns ignore the on-screen widths: date, type, number, bank, money, and **Status size to their text** (Pending is never cut to Pendin); leftover goes to Payee and Memo. Status uses the same type size as the row, not a large chip. **Fit type** is empty % (full-size type from View → Type size, columns squeeze to the page). **100%** is that same type size. Next to it is a **suggested %** for this paper and orientation (Letter portrait is near 75; Statement and A5 go smaller; a wide sheet goes toward 90) — not a fixed 80. The blank box stays blank on Fit; typing 40–150 leaves Fit and sets type — they do not stack. A percent **shrinks the type** so more register lines fit on one page (View 12px at 100% is about the old 34-line page; 11px or 75% packs more). It does not shrink a finished page as a picture. Fit view is the camera — it does not print. Statement and A5 tighten the letterhead and cell padding so totals stay on the page. **Pages** is All, **This**, or a from–to range. Reports Print is the tab you are on (Aging is AR then AP). Close → Period pack is one sheet per report so range swap works on a 2+ page pack. The dashed box and gray desk do not print. Page numbers do. **Fit view / +/−** is the camera (Fit view on a phone uses a tighter pad so the whole page is on screen). Copies and **Save as PDF** stay in the OS dialog — there is no in-app PDF library. Esc or Close.
- Same-day lines stay in the order you typed them (a silent timestamp, not a column). The running balance does not reshuffle when two deposits share a date.
- Posting the same payee, amount, and date twice is allowed — books are double-entry (every line is a balanced journal), not unique-by-payee. A toast notes the match and keeps both.
- The register is one continuous book with a running balance. It does **not** page 100-then-next like mail — that would split a day’s context. Only the rows on screen are painted; the date window is what keeps thousands of older lines out of the table.

## Close the month

- **Close** (Books): rec every live bank through the date, post recurring, trial balance in balance. Open AR / AP / TB stay in a low sticky summary so the Close-through calendar can sit on top. Desk banner **Post rent** (or Post N due) writes every recurrence through month-end and rolls next dates — same as Settings → Recurring → Post. **Print the period pack** (TB, P&L by account for the month and YTD, AR/AP aging as of the date, each finished rec report, open customer statements) — that is the review. There is no aging checkbox. Close posts a **close journal**; those bank balances as of the close date are the **opening fact** for the next month’s register (the first row reads Closed through that date). Reopen is a dated audit event (type REOPEN), not a toggle.
- **Reconcile**: beginning is the **last finished statement ending** (or bank opening). Tick what is on the paper — the tick column is always on this page (register ticks are for delete / bank reassign, not rec). Outstanding checks and deposits in transit stay off the statement and prove the book. Proof is two boards: **Statement** (beginning, cleared in/out, cleared difference) and **Book** (book, outstanding, in transit, explained difference). Amounts stay on one line. **Cleared difference** and **explained difference** must both be **0**. Post a service charge or interest from this screen if the bank has a line the books do not — those freeze as adjustments on the rec document. **Last statement** prints the frozen rec (named outstanding, DIT, adjustments, 30/60/90). **Undo last** requires UNDO and is blocked inside a closed period. Register status: non-checks cycle Pending ↔ Cleared; checks use the Pending/Cleared/Bounce/Void menu. **R is Finish statement**, not a register click, and it survives a restore. Uncleared 90+ days is called out.
- **Audit** on Close: who (this browser), what, old/new, timestamp. Export CSV. Merge writes both sides.
- **Settings → Company file**: one JSON that **is** this company (recon, close, audit included). **Save company file** / Open. Open replaces this company or adds that file. There is no “download this company” and no “download all companies” — the local copy in this browser is first; Settings → **Save company file** is the off-device backup (header Export is spreadsheets only). After every successful save this browser also writes a **local copy** (IndexedDB, one slot per company, timestamped). **Restore last local copy** puts that snapshot back for the company you are in; if you removed the sample, that is how it returns without Reload sample. Settings → Storage shows IndexedDB vs fallback, whether the browser granted **persistent** storage (so it is less likely to evict the books), and usage. There is no cloud. Tables are flat: banks, customers, vendors, employees, invoices, bills, receipts, checks, journals (lines stay on the journal), and the rest. Parties do not nest transactions. New ids are UUIDs.
- **Settings → Recurring**: warehouse rent is due in the sample (1 Sep) so September cannot close until you post it.

The register is still the book. These are how you close it.

## Receive payments

Receipts → **On account**, Invoices → **Collect**, or a customer → Receive payment is QuickBooks’ Receive Payments window:

1. Customer (type the name, Enter to pick — or **+ Add “Name”** if it is new)
2. Amount
3. Date
4. Check / ref no.
5. Open invoices, oldest first

Typing the amount fills Payment down the list until the money is gone. Tick an invoice to apply its amount due (or clear it). Override a cell if you need to. Enter posts from anywhere in the form. After a post, focus returns to Customer so the next one is ready — the window does not close. Cash sales stay their own ticket.

The allocation grid is that customer’s open invoices only (up to eighty oldest). It does not walk the rest of the file.

There is no Undeposited Funds holding account and no live card rail. Deposit to is the bank. Card keeps last four digits only. Leftover cash that does not fit an invoice is blocked — that would be an unapplied credit, which needs its own ticket.

## Transfers

A transfer is one journal with two bank lines sharing one date. Drag either leg the same way you drag a check — **both banks move together**. The ghost reads “Transfer · both banks,” and both rows dim while you hold it. That is double-entry, not a lock. Reconcile the journal and both legs lock.

## Reconciliation

Non-check lines on the register cycle **Pending ↔ Cleared**. **Checks** open a status menu: **Pending / Cleared / Bounce / Void** (same actions on Checks ⋯ and the check record). **R** is only written by Reconcile → Finish statement.

- **Pending** — not matched to a statement
- **Cleared** — working tick; the rec page still has to finish
- **Bounced / Voided** — reversed off the books (delete to re-enter)
- **Reconciled (R)** — on a finished statement and locked. Undo that rec to change it. Closed periods stay locked.

Checks that already cleared in the sample start as **Cleared**. **R** is only written by Reconcile → Finish statement — the sample does not fake finished recs, so ticks (delete / bank reassign) work on every type until you finish one.

## Find and undo

Press **Ctrl+K** (Windows/Linux) or **⌘K** (Mac) to search payee, number, amount, or memo. Click a result to open the record. **Ctrl+F** stays the browser’s find-on-page — stealing it would hide every other match on the screen.

**Ctrl+Z** (⌘Z) undoes the last change in this company — a post, void, delete, or settings edit. **Ctrl+Y** or **⌘⇧Z** redoes. The pair of buttons next to Find does the same. The stack is this session only (about forty steps); it does not survive a reload, and it clears when you switch companies, open a file, or restore a local copy. Typing in a field still uses the field’s own undo.

## Phone

A phone is a check-in, not a second desktop. The hamburger is the menu — the treasury mark lives there, not in the header (it cannot fit next to Find and undo). Book cash is on the desk, not in the header, so the company name and date do not collide. There is no chip strip and no tab bar (it would sit on the Grok pill). Dialogs come up from the bottom. Desk figures sit two-up from the first paint so peso amounts do not wait for a wide window. Customer and vendor list/detail swap until the workspace is wide enough for both. Bank tabs and filter pills scroll sideways instead of wrapping. On a phone the register is **Grid** (uniform cards with Memo) or **List** (Invoices-style table); both keep a running balance. **Move dates** rearranges like a passbook: drag a grip above/below another row (same day reorders; another day adopts that date) — no sticky date-chip strip. On a desk it stays the matrix table. History tables keep Date, No., Amount, and Balance so `RCPT-2026-001` is not clipped to `RCPT-202`. The customer/vendor directory list keeps Name and Open (Contact, Email, Phone wait for a wide screen). Tap a history line to open it. Bank **cards** show name, nickname, book amount, then pending — Delete is on the list and inside the bank record, not on every card. The column rule is a larger hit target on a touch screen; the hairline stays thin.

## Speed

The desk is figures, a 90-day SVG sparkline (not a chart library), and lists. Forecast is three numbers plus the same path. Find (Ctrl+K) only walks the register while the window is open. Opening the books waits for this browser’s file, then seeds the sample if it is empty. Saving waits a beat after you post so typing stays snappy. Dragging a column line only writes widths after you let go (a short debounce), and the drag itself paints on animation frames so the book stays smooth. The register only builds CashLine objects inside the date window; earlier dates roll into the forward as a number. Default date order does not copy-sort the month again. Bank cards compute every book balance in **one** pass over the journals.

## Appearance

Light or dark — sun/moon in the header, or Settings → Appearance. This is a browser preference, not part of the company file. Print stays on paper. The app mark is a navy tile with three cream pillars (a ledger/treasury hall) in light, and a cream tile with ink pillars in dark — menu (sidebar or hamburger) and favicon all follow the toggle. Not a hamburger, and not a second mark in the phone header.

## CSV

Every list has a same-size **CSV** button. Kind and status land in Title Case. A toast confirms the download. CSV is the full bank, not just the date window. Spreadsheets stay CSV — no extra Excel library.

## Backup

Settings → **Save company file** writes this company as JSON (or downloads if the browser will not pick a folder). Header **Export** is spreadsheets (CSV) only — there is no Company JSON there, because cloud is not in this cut. **Restore last local copy** puts back the automatic snapshot this browser kept after the last save — that is local-first, not sync. There is no “download this company” button and no “download all companies.”

## How much it holds

About **100 entries a day** is ~36,000 a year. Books live in this browser (IndexedDB) — there is no separate database to install, and Remix stays one click. The company file is still the whole book; **Purge closed** is how old years leave the file. What the register holds in the table is the date window plus one rolled opening, and only the rows on screen are painted.

A month is tens of rows. A year is the sample. **All dates** on screen is last calendar year plus a Balance forward — it does not allocate every historical line. Twenty years in one file is still a lot of source documents to keep — export a JSON backup yearly, then purge. Settings → Storage shows usage (type PURGE).

Reload the sample from Settings anytime, or **Remove sample** to drop it from this browser.

The menu is a framed rail: it does not scroll with the books. **Options** (Settings) and **Collapse** stay pinned at the bottom. Only the workspace on the right scrolls. The register virtualizes against that pane so tens of thousands of lines still paint only what is on screen. Dialogs snap open with no fade.

## Lists (invoices, bills, receipts, checks)

The same muscle memory as the register, without turning those pages into a second bank book:

- Arrow Up / Down moves a › pointer. Enter (or double-click) opens the row. Click parks the pointer.
- Primary actions (Collect, Pay, Print) stay on the row. Desk: short extras (Delete, Void) are buttons; **⋯** only when many secondary actions or on phone/narrow. Status chips stay separate.
- Drag the column **hairline** to resize. Double-click the line to auto-fit the visible cells (content, not the title).
- Header titles are centered; money **figures** stay right. Forecast, ledger, reports, and Settings recurring use the same alignment.
- Type a customer or vendor to filter. If there is no match, **+ Add “Name”** and Enter creates them without leaving the form.

Customers and Vendors are tens of rows — they are **not** virtualized. The lag killer for thousands of entries is still the register’s month window plus one rolled opening, not a 50,000-row invoice grid.


## Employees

**Employees** is a QuickBooks-style roster: name, title, pay type (salary / hourly), rate, default pay bank, hire date, and active/inactive.

- Search the roster; filter **All / Active / Inactive** and **Any pay / Salary / Hourly**.
- Click a column header to sort (name, title, rate, bank, status). Filters popover has the same sort shortcuts.
- **Pay** posts a paycheck as a check from the chosen bank to Payroll expense — it lands in Register and Checks. (Thin payroll: no withholdings or YTD yet.)
- Company backup / Save company file includes the employees table (file version 14).

## Customers and vendors

**List** is a sortable, resizable directory (Name, Contact, Email, Phone, Open) — text titles centered, money titles over the figures, hairline resize, and double-click auto-fit as the register. On a phone the list keeps Name and Open. **Cards** is a contact grid. Filter **All / Open / Zero** lives in the **Filters** popover (Month / Year / All dates on history). The toggle sticks after a refresh. On a wide screen, click a row to select it; double-click or Enter opens Details. On a phone, **tap a name (or a card) to open its history**. Date / No. / Amount / Balance stay on screen in history.

In cards view, click the sort label to cycle **Name A–Z → Name Z–A → highest open balance**.

## Elsewhere

**Desk** is cash across banks, a 90-day sparkline, overdue invoices, and open bills. Forecast is the same path plus budget items. **Employees**, **Customers**, and **Vendors** are QuickBooks-style centers (list + transactions). Click selects; double-click or Enter opens. **Ledger** and **Reports** are the books.

Checks already **void** (the row and number stay, the amount goes to zero) as well as delete (unlocked in View, confirm DELETE). **Close** freezes the period once recs, recurring, and trial balance are clean.
