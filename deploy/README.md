# Deploy packs

Finance Manager is a **browser ledger** (PWA). Remix from Grok publishes the web app. These folders are local packs.

| Pack | One-click | Output |
| --- | --- | --- |
| **Windows (priority)** | `deploy.bat` | `dist/FinanceManager.exe` plus `dist/app/`. Double-click the exe (or `run.bat`). Opens Edge/Chrome as an app window. Keep the `app` folder next to the exe. |
| **Android** | `deploy/android/apk.bat` | TWA APK if Android SDK is installed; URL is remembered after the first paste. Otherwise PWABuilder / Add to Home Screen |
| **Web** | `deploy/web/build.bat` then `serve.bat` | `web/index.html` + one HTML file per route + `web/assets/` |

Root `deploy.bat` / `run.bat` are the Windows shortcuts.

Not Tauri, not an MSI, not App Store / Play Store listing. The `.exe` is a local server of the same web app.
