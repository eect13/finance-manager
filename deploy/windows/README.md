# Windows (priority)

This is a **Tauri 2 desktop app**. Double-click `deploy.bat` at the repo root for an NSIS setup (and MSI if WiX v3 is installed). Copy that installer to other PCs — they do not need Node or Rust.

## One-click on this PC

1. Install **Node 22** and **Visual Studio Build Tools** with “Desktop development with C++”.
2. Double-click `desktop-setup.bat` once — it can install Rust and open the app in a desktop window.
3. Double-click `deploy.bat` for the installer. First compile is slow (cargo release).
4. Run the NSIS setup from `src-tauri/target/release/bundle/nsis/`. Delete any leftover white shortcut, then pin the installed app — the tile is navy with cream pillars.

`run.bat` launches the compiled `.exe` if a release build is already on disk.

## What you get

| File | Role |
| --- | --- |
| `deploy.bat` (repo root) | `npm install` + Vite desktop UI + cargo release + NSIS/MSI |
| `desktop-setup.bat` | Installs Rust if needed and runs `tauri dev` |
| `run.bat` | Starts the release `.exe` after a local compile |
| `src-tauri/target/release/bundle/` | NSIS setup and MSI |

Books stay in **this computer’s WebView2 profile** (IndexedDB). Download a backup to move them.
