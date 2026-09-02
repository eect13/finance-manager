# Deploy packs

Finance Manager is a **Tauri 2 desktop app** plus a web build. Remix from Grok publishes the website.

| Pack | One-click | Output |
| --- | --- | --- |
| **Windows (priority)** | `deploy.bat` at the repo root | **NSIS setup** (and **MSI** if WiX v3 is installed) under `src-tauri/target/release/bundle/`. Install that on this PC or another. WebView2 is bundled. `desktop-setup.bat` installs Rust once and opens the app. |
| **Android** | `deploy/android/apk.bat` | Real **Tauri APK** (not a PWA). Needs Android Studio SDK+NDK. Output in `deploy/android/`. |
| **Web** | `deploy/web/build.bat` then `serve.bat` | `web/index.html` + one HTML file per route + `web/assets/` |

Root `deploy.bat` is the Windows installer. `run.bat` launches the compiled desktop app after a successful build.

Not a PWA wrapper, not a packed Node `.exe`. The installer is a real WebView2 window.
