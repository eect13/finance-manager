# Windows (priority)

This is a **PWA**, not an `.exe` / MSI / Tauri installer. The pack opens Edge or Chrome as an **app window** (no address bar), then you Install app to pin it.

## One-click on this PC

1. Double-click `deploy.bat` at the repo root (or this folder’s `deploy.bat`).
2. Double-click `run.bat`. It waits until the local preview is up, then opens **Edge** (or Chrome) with `--app` — no second browser tab.
3. In that window: **⋯ → Install app** (Edge) or **Install Finance Manager** (Chrome). Pin to taskbar / Start.

Node 22 is required for the local build. After **Remix from Grok**, any PC can skip the build: open the published URL → Install app.

## What you get

| File | Role |
| --- | --- |
| `run.bat` | Starts the production preview and opens Edge/Chrome `--app` once it answers |
| `deploy.bat` | `npm install` + production build |
| `scripts/windows-app.mjs` | Finds Edge/Chrome under Program Files, waits, opens the app window |
| `dist/` | Built server + static assets (not a folder of HTML — see `deploy/web`) |

Books stay in **this browser profile**. Download a backup to move them.
