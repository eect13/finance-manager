# Web (static HTML)

This folder is a snapshot of the production app:

- `index.html` — desk
- `register/index.html`, `banks/index.html`, … — one HTML file per route
- `assets/` — hashed JS/CSS
- `favicon.svg`, `og.jpg`, `__grok/`

It is **not** a `file://` app (modules will not load). Serve the folder:

    node web/serve.mjs

Or any static host with a fallback to `index.html`. Remix from Grok is still the one-click publish — that uses the Vercel SSR build, not this snapshot.

Client-side navigation after the first paint uses the same JS as the live app. Books stay in the browser that opened it.
