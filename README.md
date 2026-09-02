# Finance Manager v3.43

Treasury books in the browser. Banks, receipts, checks, invoices, bills, and a **bank register**.

Pacific Harbor Trading is the default **sample company** — a 2026 year of trading (rent, payroll, utilities, invoices, bills) plus extra trade so the file sits near **1,000 documents**. Payee is the customer or vendor name; memo is the reason (Ayala Land / Warehouse rent — never one string). Every payee is on file. Listed A–Z. Activity through late August is posted; later months sit pending. Create more companies from the name in the header or from Settings. **Remove sample** (Settings) deletes that file from this browser; **Restore last local copy** puts back the last automatic snapshot, and Reload sample brings the demo back. If it was the only company, a blank file takes its place.

**License:** MIT. **Style:** ledger, light or dark (the treasury mark in the menu and favicon inverts with the theme). **Tags:** finance, accounting, bank register.

No accounts, no server setup. Remix from Grok to publish. Books stay in this browser (IndexedDB, asked to persist) until you download a backup. There is no cloud.

## Install and deploy

This is a **PWA** (same books in the browser that installed it). Windows `deploy.bat` also writes a **`.exe`**. It is not Tauri, not an MSI, and not listed on the App Store or Play Store.

| Target | One-click | What you get |
| --- | --- | --- |
| **Windows (priority)** | `deploy.bat` then `run.bat` | Production build plus **`dist/FinanceManager.exe`**. The exe serves `dist/app/` and opens Edge/Chrome as an **app window** (no address bar). Keep the `app` folder next to the exe. In that window: **⋯ → Install app** and pin to taskbar. Same scripts live under `deploy/windows/`. |
| **Android** | `deploy/android/apk.bat` | Paste the published https URL once (Remix from Grok) — later runs reuse it. Builds a Trusted Web Activity **APK** if Android Studio/SDK is installed. Without the SDK it opens [PWABuilder](https://www.pwabuilder.com) so you can download the package. Chrome → **Add to Home Screen** is the one-tap install that always works. |
| **Web** | Remix from Grok, **or** `deploy/web/build.bat` | Remix is the live SSR app. The local pack writes `web/index.html` plus one HTML file per route (`web/register/index.html`, …) and `web/assets/`. Serve with `deploy/web/serve.bat` (not `file://`). |
| **iPhone / iPad** | Safari → Share → **Add to Home Screen** | Same web app. |

Node 22 is required for local builds. After Remix, other PCs only need the URL.

**Android APK cannot wrap a local folder.** The wrapper is a Chrome Custom Tab pointed at your **https** origin. Sideload the APK; there is no Play listing in this cut.

Books do **not** follow you to another phone or laptop. Download a backup on one device and restore it on the other.

## Bank register

- Opens on **this month**, not the whole file. Filters → **Month**, **Year**, or **All dates**. All dates on screen is **last calendar year through today** (plus a Balance forward) so a fat file does not allocate every historical line. A custom From/To still walks exactly that range. CSV is the whole bank. Type dates as `08312026` or `08/31/2026`.
- The first row is **Balance forward** when a date window is on — one number for everything before the From date, then only this period’s lines. Running balance stays correct without walking five years of rows on screen.
- Last balance in the strip is the end of **this window**, in document flow — it does not stick over search or filters. Desk is still the full cash position.
- The bank tab you were on comes back after a refresh. Hidden columns and type size live in the company file; light/dark is a browser preference. Search, delete-unlock, and drag do not stick — those are easy to leave on by accident.
- Switch banks with the tabs above the table — that is the book you are in
- One search bar plus **Filters** (period, type, in/out, sort) and **View** (columns, type size, delete, drag). On a phone search is its own row, then In / Out / Last balance, then Move / Filters / View (swipe if they do not fit). Bank tabs stay one row and scroll sideways — Safekeeping does not wrap under Payroll. On a narrow screen the table keeps Date, No., Payee, Payment, Deposit, and Balance — Type, Memo, Bank, and Status hide so payee names are not clipped. Swipe the book for the rest, or turn columns back on from View on a wide screen. Dates drop the year when it is this year (`Sep 1`). The register is a list only — cards would break the running balance. **Every other table uses the same family:** click a header to sort, drag the column line to resize, double-click the line to auto-fit, search, and a **Filters** popover (Month / Year / All dates, type or status, sort). That includes invoices, bills, receipts, checks, banks, ledger, customer/vendor history, and reconcile. Tight lists keep **Status on the row** and put extra work in **⋯** (Collect + Print/Void/Delete on invoices; Pay on bills) so buttons never paint over Status. If the card is tighter than the columns, a thin scrollbar appears — no dark fade. **Move** (tick column) stays on the register only.
- **Post** sits next to Print. Type is a dropdown: Check, Cash sale, Receive payment, Transfer, Vendor pay, Deposit, Expense. **Last type sticks** (Check the first time). **Tab order is Date → Payee → Amount → Memo → Bank.** Date autofocuses. Date is a typeable combo (`08312026`, `08/31/26`, or `08/31/2026`). Click the chevron for a calendar. **T** = today, **+** / **−** bump a day. Last date sticks like Type. Enter posts. The button reads **Saved** for a beat, then the line clears and Date is ready again. Esc or Close leaves. Double-click a register line (check, cash sale, transfer, deposit, expense) opens **the same window** in Save mode. Receive payment and on-account receipts still use the allocation window. Bills stay bills.
- **Issue check** and **Receive** in the header still open the full forms when you need line items or a printed check. On a phone those two plus Reconcile live in the menu — the register keeps Post, Print, and CSV.
- The header sits on the page ground — no white bar. In / Out / Last balance is the same: ink on the page, not a card. Search and filters sit above the book without a second white well. The register table is the figure.
- Hover a row to lock the line across the ten columns. **Last balance** stays in the strip **above the table, in document flow** — it does not float over the book while you scroll, and it does not cover search.
- Empty memo, payment, and deposit cells stay blank on screen. Print still uses dashes
- The tick column stays off until **Move** is on (next to Filters). Then the 40px gutter slides in so you can bulk-move banks. Click the gutter to tick a line — it does not open the record. **Pending and C** of every type tick (check, cash sale, receipt, vendor pay, expense, transfer). **R** (finished statement) shows a lock, not an empty box — undo that rec to move it. Click a row to highlight it. Double-click or Enter opens it.
- Header titles for Date / Type / Payee sit **in the center** of each column (QuickBooks). Money **titles** (Payment, Deposit, Balance, Amount, Book, Open) are also centered over the column; the **figures** stay right-aligned on the same plumb line. Drag the faint column **hairline** to resize — it thickens on hover. **Double-click** the line to auto-fit the longest **visible cell** (not the header title). Same on every list. Widths come back after a refresh. Print still uses View’s show/hide, not these widths. Tables fill the card — name columns (Payee, Received from, Customer, Bank, Nickname, Memo) share leftover width the way a CSS grid `1fr` track would. Money, status, and **Actions stay content-sized** (Delete on Banks is a tight column, not a well). If the book is tighter than the content, the card scrolls sideways with a thin bar — there is no dark fade over the last column. The last header is not resizable. One hairline between columns. First visit (or factory widths) **auto-fits** to the painted cells. Date scrolls with the book (it is not frozen).
- Payment is debit red, deposit is credit green, running **Balance** stays ink-dark so it reads as the result. The three money columns share tabular lining numerals and right-align to the same plumb line.
- View → columns show/hide Date, Type, No., Payee, Memo, Bank, Payment, Deposit, Balance, and Status. Print uses the same setting — no second set of toggles
- Collapse the side menu to give the register more room — layout follows that workspace, not the whole window
- **Print** opens an on-screen sheet (so it works in this preview, on a phone, and in a desktop window). **Close** and **Print** stay on the first row at 44px — on a narrow overlay they stack full-width so neither is off-screen. Paper, pages, type, and zoom sit on a second row that **wraps** to the overlay width — the bar follows the print overlay (container query), not only the window. Labels shorten (Port. / Land. / Fit / View / Print). **Print** (or System print) runs the OS dialog; if this preview blocks `window.print`, the sheet stays on screen and Close still works. The paper trigger shows **Letter** (or A4…) — click it for US (Letter, Legal, Tabloid, Statement, Executive, Folio) and ISO (A3–A5, B4, B5); dimensions sit beside each name. The list opens **over** the sheet so every size is reachable. The sheet **is the page** — company name left, report title right, address and phone on one line, email on the next so it never collides with the table. Register print **splits by rows** so a year or All dates does not freeze the preview; later pages say continued, totals sit on the last page. Print columns ignore the on-screen widths: date, type, number, bank, money, and **Status size to their text** (Pending is never cut to Pendin); leftover goes to Payee and Memo. Status uses the same type size as the row, not a large chip. **Fit type** is empty % (full-size type from View → Type size, columns squeeze to the page). **100%** is that same type size. Next to it is a **suggested %** for this paper and orientation (Letter portrait is near 75; Statement and A5 go smaller; a wide sheet goes toward 90) — not a fixed 80. The blank box stays blank on Fit; typing 40–150 leaves Fit and sets type — they do not stack. A percent **shrinks the type** so more register lines fit on one page (View 12px at 100% is about the old 34-line page; 11px or 75% packs more). It does not shrink a finished page as a picture. Fit view is the camera — it does not print. Statement and A5 tighten the letterhead and cell padding so totals stay on the page. **Pages** is All, **This**, or a from–to range. Reports Print is the tab you are on (Aging is AR then AP). Close → Period pack is one sheet per report so range swap works on a 2+ page pack. The dashed box and gray desk do not print. Page numbers do. **Fit view / +/−** is the camera (Fit view on a phone uses a tighter pad so the whole page is on screen). Copies and **Save as PDF** stay in the OS dialog — there is no in-app PDF library. Esc or Close.
- Same-day lines stay in the order you typed them (a silent timestamp, not a column). The running balance does not reshuffle when two deposits share a date.
- Posting the same payee, amount, and date twice is allowed — books are double-entry (every line is a balanced journal), not unique-by-payee. A toast notes the match and keeps both.
- The register is one continuous book with a running balance. It does **not** page 100-then-next like mail — that would split a day’s context. Only the rows on screen are painted; the date window is what keeps thousands of older lines out of the table.

## Close the month

- **Close** (Books): rec every live bank through the date, post recurring, trial balance in balance. Desk banner **Post rent** (or Post N due) writes every recurrence through month-end and rolls next dates — same as Settings → Recurring → Post. **Print the period pack** (TB, P&L by account for the month and YTD, AR/AP aging as of the date, each finished rec report, open customer statements) — that is the review. There is no aging checkbox. Close posts a **close journal**; those bank balances as of the close date are the **opening fact** for the next month’s register (the first row reads Closed through that date). Reopen is a dated audit event (type REOPEN), not a toggle.
- **Reconcile**: beginning is the **last finished statement ending** (or bank opening). Tick what is on the paper — the tick column is always on this page (Move is only on the register). Outstanding checks and deposits in transit stay off the statement and prove the book. The eight proof figures (Beginning, Cleared in/out, Outstanding, In transit, Book, Cleared diff, Explained) sit in a compact card grid — two-up on a phone, eight-across on a wide desk. **Cleared difference** and **explained difference** must both be **0**. Post a service charge or interest from this screen if the bank has a line the books do not — those freeze as adjustments on the rec document. **Last statement** prints the frozen rec (named outstanding, DIT, adjustments, 30/60/90). **Undo last** requires UNDO and is blocked inside a closed period. Register click only cycles Pending ↔ C. **R is Finish statement**, not a register click, and it survives a restore. Uncleared 90+ days is called out.
- **Audit** on Close: who (this browser), what, old/new, timestamp. Export CSV. Merge writes both sides.
- **Settings → Company file**: one JSON that **is** this company (recon, close, audit included). **Save company file** / Open. Open replaces this company or adds that file. There is no “download this company” and no “download all companies” — the local copy in this browser is first; Settings → **Save company file** is the off-device backup (header Export is spreadsheets only). After every successful save this browser also writes a **local copy** (IndexedDB, one slot per company, timestamped). **Restore last local copy** puts that snapshot back for the company you are in; if you removed the sample, that is how it returns without Reload sample. Settings → Storage shows IndexedDB vs fallback, whether the browser granted **persistent** storage (so it is less likely to evict the books), and usage. There is no cloud. Tables are flat: banks, customers, vendors, invoices, bills, receipts, checks, journals (lines stay on the journal), and the rest. Parties do not nest transactions. New ids are UUIDs.
- **Settings → Recurring**: warehouse rent is due in the sample (1 Aug) so August cannot close until you post it.

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

Status on the register cycles **Pending ↔ C**. **R** is only written by Reconcile → Finish statement.

- **Pending** — not matched to a statement
- **C** — cleared (working tick; the rec page still has to finish)
- **R** — on a finished statement and locked. Undo that rec to change it. Closed periods stay locked.

Checks that already cleared in the sample start as **C**. **R** is only written by Reconcile → Finish statement — the sample does not fake finished recs, so Move works on every type until you finish one.

## Find and undo

Press **Ctrl+K** (Windows/Linux) or **⌘K** (Mac) to search payee, number, amount, or memo. Click a result to open the record. **Ctrl+F** stays the browser’s find-on-page — stealing it would hide every other match on the screen.

**Ctrl+Z** (⌘Z) undoes the last change in this company — a post, void, delete, or settings edit. **Ctrl+Y** or **⌘⇧Z** redoes. The pair of buttons next to Find does the same. The stack is this session only (about forty steps); it does not survive a reload, and it clears when you switch companies, open a file, or restore a local copy. Typing in a field still uses the field’s own undo.

## Phone

A phone is a check-in, not a second desktop. The hamburger is the menu — the treasury mark lives there, not in the header (it cannot fit next to Find and undo). There is no chip strip and no tab bar (it would sit on the Grok pill). Dialogs come up from the bottom. Desk figures sit two-up from the first paint so peso amounts do not wait for a wide window. Customer and vendor list/detail swap until the workspace is wide enough for both. Bank tabs and filter pills scroll sideways instead of wrapping. The register stays a list with a running balance; it does not turn into cards. History tables keep Date, No., Amount, and Balance so `RCPT-2026-001` is not clipped to `RCPT-202`. The customer/vendor directory list keeps Name and Open (Contact, Email, Phone wait for a wide screen). Tap a history line to open it. Bank **cards** show name, nickname, book amount, then pending — Delete is on the list and inside the bank record, not on every card. The column rule is a larger hit target on a touch screen; the hairline stays thin.

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

The menu is a framed rail: it does not scroll with the books. **Settings** and **Collapse** stay pinned at the bottom. Only the workspace on the right scrolls. The register virtualizes against that pane so tens of thousands of lines still paint only what is on screen. Dialogs snap open with no fade.

## Lists (invoices, bills, receipts, checks)

The same muscle memory as the register, without turning those pages into a second bank book:

- Arrow Up / Down moves a › pointer. Enter (or double-click) opens the row. Click parks the pointer.
- Each row shows one primary action (Collect, Pay, Print, Update) and a **⋯** for the rest, so Status is never covered.
- Drag the column **hairline** to resize. Double-click the line to auto-fit the visible cells (content, not the title).
- Header titles are centered; money **figures** stay right. Forecast, ledger, reports, and Settings recurring use the same alignment.
- Type a customer or vendor to filter. If there is no match, **+ Add “Name”** and Enter creates them without leaving the form.

Customers and Vendors are tens of rows — they are **not** virtualized. The lag killer for thousands of entries is still the register’s month window plus one rolled opening, not a 50,000-row invoice grid.

## Customers and vendors

**List** is a sortable, resizable directory (Name, Contact, Email, Phone, Open) — text titles centered, money titles over the figures, hairline resize, and double-click auto-fit as the register. On a phone the list keeps Name and Open. **Cards** is a contact grid. Filter **All / Open / Zero** lives in the **Filters** popover (Month / Year / All dates on history). The toggle sticks after a refresh. On a wide screen, click a row to select it; double-click or Enter opens Details. On a phone, **tap a name (or a card) to open its history**. Date / No. / Amount / Balance stay on screen in history.

In cards view, click the sort label to cycle **Name A–Z → Name Z–A → highest open balance**.

## Elsewhere

**Desk** is cash across banks, a 90-day sparkline, overdue invoices, and open bills. Forecast is the same path plus budget items. **Customers** and **Vendors** are QuickBooks-style centers (list + transactions). Click selects; double-click or Enter opens. **Ledger** and **Reports** are the books.

Checks already **void** (the row and number stay, the amount goes to zero) as well as delete (unlocked in View, confirm DELETE). **Close** freezes the period once recs, recurring, and trial balance are clean.
