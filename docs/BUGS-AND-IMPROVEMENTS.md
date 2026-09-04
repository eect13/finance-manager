# Finance Manager — bugs & improvements (v3.57)

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

## Still open (known)

| # | Severity | Area | Notes |
| --- | --- | --- | --- |
| A | Low–med | Register “All dates” | Window is prior Jan 1 → today, not all-time (by design for memory); label can still confuse |
| B | Low | Register column sort vs running balance | Balance is chronological; sorting by payee can look “wrong” |
| C | Low–med | VAT model | Output VAT only; no input VAT on bills |
| D | Low | `ensureOutputVat` | Hardcodes `acct-2200` |
| E | Low | Debounced persist (~280ms) | Kill/crash can drop last keystrokes |
| F | Low | `patchJournalAmount` still used for simple 2-line docs | Fine for check/deposit/expense; do not use for multi-line VAT |
| G | Med (product) | Thin payroll | No hours×rate run, withholdings, 13th month, or `employeeId` on check records |
| H | — | Android APK | Needs NDK installed (SDK alone is not enough) |

## Areas of improvement

1. **IndexedDB / size** — Cap audit further; optional purge of closed detail; avoid dual full backup copies; chunked multi-company blobs.
2. **List virtualization** — Extend register’s `@tanstack/react-virtual` to invoices/bills/receipts/checks/ledger/employees when lists grow.
3. **Code-split** — Lazy TanStack routes + Vite `manualChunks` for reports/close/reconcile/seed.
4. **Tauri / Android** — Validate WebView IDB persistence; share/save company JSON; cold-start via splits; finish NDK install for APK.
5. **Payroll depth** — Pay periods, withholdings, link checks to `employeeId`, batch pay run, block delete when pay history exists.
6. **Multi-device** — Explicit company-file exchange / LWW or CRDT; no naive full-state overwrite. P2P stub exists unused.
7. **Purchase VAT** — Input VAT on bills + VAT payable/receivable reports.
8. **Invoice edit UX** — Surface tax as document field clearly so Settings toggle never feels like it rewrites history.
