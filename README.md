# Finance Manager v3.63.57

Treasury books in a **desktop window**, and in the browser. Banks, receipts, checks, invoices, bills, **employees**, and a **bank register**.

Pacific Harbor Trading is the default **sample company** — a full 2026 year of trading for a mid-size warehouse, about **40 customers**, **30 vendors**, **14 employees**, and **~1,700 documents**. Payee is the customer or vendor name; memo is the reason. Create more companies from the name in the header or from Settings. **Remove sample** deletes that file from this browser; **Restore last local copy** puts back the last automatic snapshot; Reload sample brings the demo back.

**License:** MIT. Light or dark. No accounts, no server, no cloud. Books stay on this computer (IndexedDB). Options → Backup can save a JSON company file (pick a backup folder on desktop). Open replaces this company; Merge adds records that are not already here.

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

## What's new in v3.63.57

- **Staff payroll matches the named employees:** Semi-monthly lump is ₱190,000 (₱380,000 a month, plus 13th). Existing Pacific Harbor files with the old ₱252,800 budget get the Reload sample callout.
- **Open company file asks first:** After you pick a JSON, type REPLACE. Merge still adds missing records with no extra confirm.
- **Regional packs are worksheets:** Settings says so on the card, not only behind More — estimates and CSV, not IRS / CPF / ATO / HMRC / BIR eFiling.
- **Phone Desk cash tiles:** “In the bank” stays one line; bank nicknames ellipsize instead of wrapping.
- **Opening splash:** App mark + Finance Manager while IndexedDB hydrates. No flash of the sample over your file.

## What's new in v3.63.56

- **Finalize pass:** Recaptured README gallery against the mid-size Pacific Harbor sample. README changelog is this release plus the two before it — older notes stay in [docs/BUGS-AND-IMPROVEMENTS.md](docs/BUGS-AND-IMPROVEMENTS.md). Dead Options-density React store dropped; Comfortable boot script remains.

## What's new in v3.63.55

- **Compact remnant trim:** Options density stays gone. Force-Comfortable boot remains (clears old Compact localStorage). Unreachable Compact CSS token overrides and dead `isCompact` virt paths removed — spacing is Comfortable-only.
- **Reload sample for existing profiles:** Options jump includes Sample; outdated/missing Pacific Harbor gets a clear callout and a emphasized Reload sample control. Confirm copy and toast match `resetDemo` (replaces the sample file with the mid-size seed; other companies stay).

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
- **Backup**: Options → Backup. Pick a backup folder (desktop) then Save company file writes JSON there; otherwise download/save picker. Open replaces this company; Merge adds missing records; Restore last local copy is this browser’s snapshot. Header Export is CSV only.

The register is still the book. See [docs/BUGS-AND-IMPROVEMENTS.md](docs/BUGS-AND-IMPROVEMENTS.md) for the full fixed/open list and older release notes.

## Deploy notes

More detail: [deploy/README.md](deploy/README.md), [deploy/windows/README.md](deploy/windows/README.md), [deploy/android/README.md](deploy/android/README.md).

This is a **Tauri 2** desktop app — not a PWA wrapper and not a packed Node `.exe`.
