# Finance Manager v2.0

Treasury books in the browser. Banks, receipts, checks, invoices, bills, and a **bank register**.

Pacific Harbor Trading is the default **sample company** — a full 2026 year of trading (rent, payroll, utilities, invoices, bills). Activity through late August is posted and cleared; later months sit as pending checks and open invoices. Create more companies from the name in the header or from Settings — each has its own books.

**License:** MIT. **Style:** ledger, light or dark. **Tags:** finance, accounting, bank register.

No accounts, no server setup. Remix from Grok to publish. Books stay in this browser until you download a backup.

## Bank register

- Opens on **this year**, not the whole file. Filters → **Month**, **Year**, or **All dates**. A custom From/To sticks too.
- The first row is **Balance forward** when a date window is on — one number for everything before the From date, then only this period’s lines. Running balance stays correct without walking five years of rows on screen.
- Last balance in the strip is the end of **this window**. Desk is still the full cash position.
- The bank tab you were on comes back after a refresh. Hidden columns and type size live in the company file; light/dark is a browser preference. Search, delete-unlock, and drag do not stick — those are easy to leave on by accident.
- Switch banks with the tabs above the table — that is the book you are in
- One search bar plus **Filters** (period, type, in/out, sort) and **View** (columns, type size, delete, drag)
- **Post** is collapsed until you need it (Hide / Add entry). Date and bank sit first — they stick after you post. Payee, amount, and type change every line. After Post, focus snaps to Payee (or Amount on Transfer). Enter posts. Esc clears payee and amount.
- Check, Receive, or **Transfer**. Transfer turns Payee into **To bank**; the bank field is **From**. Dropdowns show the nickname only. One post writes both legs (payment out, deposit in) as Internal — they still move cash, they are not a cleared check
- **Issue check** and **Receive** in the header open the full forms; they stay quiet so Post keeps the weight
- Hover a row to lock the line across the ten columns. **Last balance** stays in the strip above the table while you scroll (pinning the totals row over the book would cover lines)
- Empty memo, payment, and deposit cells stay blank on screen. Print still uses dashes
- Tick a line to move it between banks — the move bar stays hidden until something is selected. Ticks are squares (multi-select), not circles
- Payment is debit red, deposit is credit green, running **Balance** stays ink-dark so it reads as the result
- View → columns show/hide Date, Type, No., Payee, Memo, Bank, Payment, Deposit, Balance, and Status. Print preview uses the same setting
- Collapse the side menu to give the register more room — layout follows that workspace, not the whole window
- **Print / Save PDF** opens the browser print dialog (Save as PDF is there). Preview shows one paper-shaped page so a full year does not stall; company address prints on the sheet
- The register is one continuous book with a running balance. It does **not** page 100-then-next like mail — that would split a day’s context. Only the rows on screen are painted; the date window is what keeps thousands of older lines out of the table.

## Find

Press **Ctrl+K** (Windows/Linux) or **⌘K** (Mac) to search payee, number, amount, or memo. Click a result to open the record. **Ctrl+F** stays the browser’s find-on-page — stealing it would hide every other match on the screen.

## Appearance

Light or dark — sun/moon in the header, or Settings → Appearance. This is a browser preference, not part of the company file. Print stays on paper.

## CSV

Every list has a same-size **CSV** button. Kind and status land in Title Case. A toast confirms the download. CSV is the full bank, not just the date window.

## Backup

Settings → Backup **Download books** saves every company in this browser as one JSON file. **This company** is just the file you are in. **Restore backup** detects either shape. Header **Export** has the same two JSON items plus the spreadsheets.

## How much it holds

About **100 entries a day** is ~36,000 a year. Books live in this browser (IndexedDB) — there is no separate database to install, and Remix stays one click. The company file is still the whole book; **Purge closed** is how old years leave the file. What the register holds in the table is the date window plus one rolled opening, and only the rows on screen are painted.

A month is tens of rows. A year is the sample. Twenty years in one file is still a lot of source documents to keep — export a JSON backup yearly, then purge. Settings → Storage shows usage (type PURGE).

Reload the sample from Settings anytime.

## Elsewhere

**Desk** is cash position and the ninety-day forecast — the cards follow the workspace, not just the window. **Customers** and **Vendors** are QuickBooks-style centers (list + transactions, click to edit). **Ledger** and **Reports** are the books.

Checks already **void** (the row and number stay, the amount goes to zero) as well as delete (unlocked in View, confirm DELETE). A period lock — freeze everything before a filing date — is the next control if you want it, not a lag fix.
