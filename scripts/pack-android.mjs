#!/usr/bin/env node
/**
 * Android pack. Writes a Trusted Web Activity manifest + one-click apk.bat.
 * Compiling an APK needs JDK 17 (present) and the Android SDK (not in this
 * sandbox). On a Windows PC with Android Studio, apk.bat runs Bubblewrap.
 * Without the SDK it opens PWABuilder with the published URL.
 *
 *   node scripts/pack-android.mjs
 *   START_URL=https://your-app.grok.me node scripts/pack-android.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "deploy", "android");
const WIN = platform() === "win32";
const startUrl = (process.env.START_URL || process.env.TWA_START_URL || "").replace(/\/$/, "");
const APP_VERSION =
  readFileSync(join(ROOT, "src/lib/version.ts"), "utf8").match(/APP_VERSION = "([^"]+)"/)?.[1] ?? "0";

mkdirSync(OUT, { recursive: true });

if (!existsSync(join(ROOT, "public", "icon-512.png"))) {
  console.log("Rasterizing app icons…");
  const icons = spawnSync("node", ["scripts/raster-icons.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
  });
  if ((icons.status ?? 1) !== 0) {
    console.warn("Icon raster failed — TWA can still use /favicon.svg on a live host.");
  }
}

const twa = {
  packageId: "ph.finance.manager.twa",
  host: startUrl ? new URL(startUrl).host : "example.grok.me",
  name: "Finance Manager",
  launcherName: "Finance Manager",
  display: "standalone",
  themeColor: "#243542",
  themeColorDark: "#141311",
  navigationColor: "#243542",
  backgroundColor: "#f3f0e8",
  enableNotifications: false,
  startUrl: "/",
  iconUrl: startUrl ? `${startUrl}/icon-512.png` : "/icon-512.png",
  maskableIconUrl: startUrl ? `${startUrl}/icon-512.png` : "/icon-512.png",
  appVersion: APP_VERSION,
  appVersionCode: Number(APP_VERSION.replaceAll(".", "")) || 326,
  isChromeOSOnly: false,
  isMetaQuest: false,
  fallbackType: "customtabs",
  features: {},
  alphaDependencies: { enabled: false },
  enableSiteSettingsShortcut: true,
  orientation: "default",
  generatorApp: "bubblewrap",
};

writeFileSync(join(OUT, "twa-manifest.json"), `${JSON.stringify(twa, null, 2)}\n`);

writeFileSync(
  join(OUT, "README.md"),
  `# Android APK

Finance Manager is a **PWA**. The one-tap install that always works is Chrome → **Add to Home Screen**.

A sideload **APK** is a Trusted Web Activity wrapper around the **published** URL (Remix from Grok). It cannot wrap \`file://\` or a local preview.

## One-click APK (Windows)

1. Remix from Grok so the app has an https URL.
2. Double-click \`apk.bat\`.
3. Paste that URL when asked (saved as \`start-url.txt\` for the next run).
4. If **Android Studio / SDK** is installed, Bubblewrap builds \`app-release-signed.apk\`.
5. If the SDK is missing, the script opens [PWABuilder](https://www.pwabuilder.com) — paste the same URL → Android → Download package.

JDK 17 is enough for the Java side. The Android SDK is what compiles the APK. This sandbox does not ship the SDK, so a binary \`.apk\` is not produced here.

## After install

Books stay in that Chrome/TWA profile. Download a backup to copy them. There is no Play Store listing in this cut.
`,
);

writeFileSync(
  join(OUT, "apk.bat"),
  `@echo off
setlocal
cd /d "%~dp0\\..\\.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required.
  start https://nodejs.org
  pause
  exit /b 1
)

echo Finance Manager — Android APK (Trusted Web Activity)
echo One-click: paste the published https URL once. Later runs reuse it.
echo.

if "%START_URL%"=="" if exist "deploy\\android\\start-url.txt" (
  set /p START_URL=<deploy\\android\\start-url.txt
)
if "%START_URL%"=="" (
  set /p START_URL=Published https URL (Remix from Grok):
)
if "%START_URL%"=="" (
  echo No URL — opening PWABuilder. Paste your published URL there to download an APK.
  start https://www.pwabuilder.com
  pause
  exit /b 1
)

echo %START_URL%> deploy\\android\\start-url.txt

call node scripts\\pack-android.mjs
if errorlevel 1 goto :fail

where java >nul 2>nul
if errorlevel 1 (
  echo JDK 17 is required to compile. Opening PWABuilder instead.
  start https://www.pwabuilder.com
  pause
  exit /b 1
)

if not defined ANDROID_HOME if not defined ANDROID_SDK_ROOT (
  echo Android SDK not found. Opening PWABuilder — paste %START_URL% → Android → Download.
  start https://www.pwabuilder.com/?url=%START_URL%
  pause
  exit /b 0
)

echo Building TWA with Bubblewrap...
npx --yes @bubblewrap/cli init --manifest "%START_URL%/__grok/manifest.webmanifest" --directory deploy\\android\\twa --skipPwaValidation
if errorlevel 1 goto :fail
npx --yes @bubblewrap/cli build --directory deploy\\android\\twa --skipPwaValidation
echo.
echo APK is under deploy\\android\\twa\\app\\build\\outputs\\apk\\
pause
exit /b 0

:fail
echo Build failed. Use PWABuilder with the published URL, or Add to Home Screen in Chrome.
start https://www.pwabuilder.com
pause
exit /b 1
`,
);

console.log(`Android pack written to ${OUT}`);
if (startUrl) console.log(`  host ${twa.host}  version ${APP_VERSION}`);
else console.log("  Set START_URL to your published https origin before compiling.");
console.log("  One-click on Windows: deploy\\android\\apk.bat");
