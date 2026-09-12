# Finance Manager v3.63.43

Treasury books in a **desktop window**, and in the browser. Banks, receipts, checks, invoices, bills, **employees**, and a **bank register**.

Pacific Harbor Trading is the default **sample company** — a full 2026 year of trading plus extra trade so the file sits near **1,000 documents**. Payee is the customer or vendor name; memo is the reason. Create more companies from the name in the header or from Settings. **Remove sample** deletes that file from this browser; **Restore last local copy** puts back the last automatic snapshot; Reload sample brings the demo back.

**License:** MIT. Light or dark. No accounts, no server, no cloud. Books stay on this computer (IndexedDB). Settings → Storage can ask the browser to keep them. Download a backup to move them.

The app mark is a **navy tile with cream pillars**. Windows uses a BMP 32-bit `.ico` (PNG-in-ICO showed as a white square). NSIS writes one Desktop shortcut named **Finance Manager** (navy tile). A second launch focuses the existing window.

## Install (fresh GitHub download)

Unzip the repo (a second unzip named `finance-manager-main (1)` is fine) so `deploy.bat` sits next to `package.json`. Then:

| Target | Double-click | What you get |
| --- | --- | --- |
| **Windows** | `deploy.bat` | **NSIS setup** (and **MSI** if WiX v3 is installed) under `src-tauri/target/release/bundle/`. Copy that installer to other PCs — they do not need Node or Rust. WebView2 is bundled. |
| **Android** | `apk.bat` (or `deploy/android/apk.bat`) | Real **Tauri APK** (same WebView app, not a PWA). Sideload `deploy/android/finance-manager-v{ver}-arm64-release.apk`. |
| **Try on this PC** | `desktop-setup.bat` | Installs Rust if needed and opens the app window. |
| **Web** | `deploy/web/build.bat` then `serve.bat` | Static `web/` folder. Do not open `file://`. |

**Windows, once:** [Node.js 22 LTS](https://nodejs.org) and [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with **Desktop development with C++**. The script can install Rust. First compile is slow.

**Android, once:** Node 22, the same C++ tools + Rust, [Microsoft OpenJDK 17](https://learn.microsoft.com/java/openjdk/download) or Temurin 17 (not Android Studio JBR / JDK 25), and Android Studio SDK + NDK. The packer adds the `aarch64-linux-android` Rust target and runs `npm install` if `node_modules` is missing.

Vite is installed with the packages — no global `vite` command. `.npmrc` has `legacy-peer-deps=true`.

After the Windows installer: Desktop has one **Finance Manager** shortcut (navy pillars). Pin that — do not keep leftover `finance-manager` aliases from older builds.

## What's new in v3.63.43

- **Forecast → Monthly budget polish:** Edit (shared Add dialog) on List and Grid; ConfirmDelete before Remove; search + kind filter persist in localStorage; form clears after Save; Actions column counted explicitly in table width (no undefined-vis quirk).

## What's new in v3.63.42

- **Forecast → Monthly budget:** List | Grid (same View menu as Employees), column show/hide + resize/align, search, and kind filter (All/Out/In) on both layouts. Phone Grid cards avoid horizontal Amount clip; Amount defaults right (align key `-v2`).

## What's new in v3.63.41

- **Single-instance desktop:** opening Finance Manager again focuses, unminimizes, and shows the existing window. Android is unchanged.
- **Tidy NSIS Desktop shortcut:** installer writes one **Finance Manager** shortcut (product name + exe icon) and removes leftover `finance-manager` / `FinanceManager` aliases.

## What's new in v3.63.40

- **Country pack Apply is exclusive:** applying US (or SG/AU/UK/…) turns that pack’s modules on and turns other region packs off (PH payroll/13th/BIR included). VAT/GST packs intentionally enable generic VAT; US sales-tax packs do not. Multi-currency is unchanged.
- **Close checklist Detail** defaults left again — align storage key bumped to `…-col-aligns-v2` so old center prefs do not stick; Status stays center.
- Print on Reports → Payroll only when PH payroll is on; VAT panel BIR/VAT disclaimers only when those modules are on.

## What's new in v3.63.39

- **More regional stubs** (Settings toggles, default off unless the currency / VAT hint matches): US FIT+FICA W-2 style estimate, Singapore CPF, generic VAT/GST workbook, Australia PAYG/BAS summary, UK PAYE+NI, and multi-currency FX rates + convert CSV. Country packs can turn on related toggles. Practical books/accountant worksheets — **not** IRS / CPF Board / ATO / HMRC / VAT e-file.
- Toggling a module off hides Reports / Export UI and does not delete posted paychecks, rates, or accounts.

## What's new in v3.63.38

- **Regional modules:** Settings → Tax & payroll modules toggles for Philippines payroll (SSS / PhilHealth / Pag-IBIG / TRAIN), 13th-month estimate & export, and BIR-style CSVs (1601-C / WHT / VAT summary). Defaults on for PHP / Pacific Harbor sample; off otherwise. Toggling off hides UI — does not delete data.
- **Global appeal:** Non-PH companies keep generic salary/hourly pay without PH withholdings UI or remittance exports until modules are turned on.

## What's new in v3.63.37

- **IDB growth:** Audit capped (newest 800 / ~180 KB); purge closed years also drops finished recon statements through that date; persist + local backup skip identical JSON (fingerprint).
- **Code-split:** Vite `manualChunks` for `finance` + vendor (react / tanstack / ui / utils) on web and Tauri — smaller Android cold-start chunks without changing desktop behavior.
- **PH books helpers (not eFiling):** Reports → Payroll shows 13th-month estimate (posted gross ÷ 12, else months × rate ÷ 12) and 1601-C style WHT summary; CSV exports for 1601-C detail, monthly WHT, 13th month, and VAT summary. Clearly labeled for accountant / books only.

## What'''s new in v3.63.25

- **Journal Debit/Credit phone floor:** widen to ~7.5–8.5rem so ₱1,000,000.00 no longer overflows onto Account.

## What'''s new in v3.63.24

- **Journal sheet hug:** `height: fit-content` / `align-content: start` only on sheets that contain the journal line grid — tall Post / Receive / Employee sheets keep their scrollable max-height behavior.

## What's new in v3.63.23

- **Close:** View menu List|Grid — checklist table or stacked cards; All / Blocked / Clear and Post due stay.
- **Customers / Vendors history:** Grid cards via DocCards (List table kept); View layout toggle.
- **Journal detail sheet:** Account / Debit / Credit fit the phone sheet (no mid-amount clip); sheet hugs content height.

## What's new in v3.63.22

- **P&L Grid:** cards are plain `CardGrid` tiles (no dead click / noop `onOpen`).
- **Employees Grid:** Pay / Edit / Delete on cards, same as the List row actions.
- **Employees Pay column:** money defaults right; align prefs key bumped to v3 so Name-left and other saved aligns stay.
- **Aging Grid:** Total row under the cards (parity with List).
- **Trial balance Grid:** Debit and Credit both shown — no one-sided amount.
- **TB / P&L Grid keyboard:** deferred (List already has focus/Enter; Grid has nothing to open).

## What's new in v3.63.21

- **Reports:** Aging, Trial balance, and P&L get List|Grid like Invoices — cards show party/No./due/age/amount or account + amounts. Auto-fit columns when List is on. VAT and Payroll stay compact tables.
- **Employees:** Pay/Edit/Delete no longer open the edit sheet; Grid cards show the bank nickname; summary is 2+1 on a phone; Name defaults left; rows hint double-tap to open.

## What's new in v3.63.20

- **Status sits in the middle** of its column on Checks, Invoices, and the other lists. Pending / Open were hugging the left edge.
- **Row actions on a phone:** Print, Void, and Delete stay on the row when the Actions column has room. ⋯ only appears when the cell is actually tight.
- **Employees:** Active/Inactive is a badge on the card. Status / pay-type pills wrap with View instead of sliding Hourly off the screen. The page blurb is no longer cut to two lines.

## What's new in v3.63.19

- **Receive payment (and every other sheet):** bank/customer typeahead and the date calendar stay inside the screen — they were sliding past the sheet when the keyboard was open. Method buttons wrap (three then two on a phone) instead of clipping Card. The sheet sits at the top on a phone so the keyboard does not cover Date and Deposit to.
- **Register phone cards:** Pending and the bank (Operating) are the same height.

Older point-release notes live in [docs/BUGS-AND-IMPROVEMENTS.md](docs/BUGS-AND-IMPROVEMENTS.md).

## Regional modules (what they do / don’t)

All are Settings toggles. Off hides the UI; data stays.

| Module | Does | Does not |
| --- | --- | --- |
| **PH payroll / 13th / BIR** | Statutory split on pay, remittance balances, 13th estimate, 1601-C / VAT CSV | BIR eFiling, eBIRForms, TRAIN year-end annualization |
| **US payroll** | FIT + FICA estimate, W-2 style table + CSV from posted gross or salary | IRS e-file, Form W-2/941, Pub 15-T, state tax |
| **Singapore CPF** | EE 20% / ER 17% OW estimate + CSV | CPF Board filing, age bands, Additional Wage ceiling |
| **Generic VAT/GST** | Rate + input/output + monthly journal workbook + CSV | Official VAT/GST return |
| **AU PAYG / BAS** | Resident PAYG estimate + GST remittance-style summary + CSV | ATO BAS, STP, tax-free threshold phase-ins |
| **UK PAYE + NI** | PAYE + Class 1 NI estimate + CSV | HMRC RTI, student loan, pensions |
| **Multi-currency FX** | Rate table, secondary currency convert helpers, document CSV | Per-invoice foreign currency, live FX feed, auto gain/loss journals |

**Defaults:** PHP / Pacific Harbor → PH on. USD → US payroll. SGD → CPF. AUD → PAYG/BAS. GBP → PAYE. Generic VAT on when sales tax is already enabled. FX off until you turn it on. Applying a country pack can enable related toggles.

## Screenshots

![Treasury desk](docs/screenshots/desk.png)

![Bank register](docs/screenshots/register.png)

![Reports — AR then AP aging](docs/screenshots/reports.png)

![Reconcile — statement vs book](docs/screenshots/reconcile.png)

![Employees](docs/screenshots/employees.png)

![Options](docs/screenshots/options.png)

![Desk on a phone](docs/screenshots/desk-phone.png)

![Register on a phone](docs/screenshots/register-phone.png)

Books do **not** follow you to another phone or laptop. Download a backup on one device and restore it on the other.

## Using the books

- **Register** opens on this month. Filters → Month, Year, or All dates (last calendar year through an open end). Tick lines to delete or reassign bank. Double-click or Enter opens Post. Print is an on-screen sheet (Letter/A4 and friends).
- **Reports → Aging** stacks Receivables then Payables (never two skinny columns).
- **Close** recs every live bank, posts recurring, then locks. Reopen is a dated event (type REOPEN).
- **Employees → Pay**: salary uses the rate; hourly is hours × rate. Optional withholding posts to Payroll Withholdings (2210).
- **Backup**: Settings → Save company file (JSON). Restore last local copy is the automatic snapshot in this browser. Header Export is CSV only.

The register is still the book. See [docs/BUGS-AND-IMPROVEMENTS.md](docs/BUGS-AND-IMPROVEMENTS.md) for the full fixed/open list and older release notes.

## Deploy notes

More detail: [deploy/README.md](deploy/README.md), [deploy/windows/README.md](deploy/windows/README.md), [deploy/android/README.md](deploy/android/README.md).

This is a **Tauri 2** desktop app — not a PWA wrapper and not a packed Node `.exe`.
