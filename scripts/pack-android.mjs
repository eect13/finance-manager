#!/usr/bin/env node
/**
 * Real Android APK via Tauri 2 (same WebView stack as the desktop app).
 * Not a PWA, TWA, or PWABuilder wrapper.
 *
 *   node scripts/pack-android.mjs
 *
 * Needs JDK 17, Android Studio SDK + NDK, and Rust. First run inits
 * src-tauri/gen/android and compiles the Android Rust targets.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "deploy", "android");
const WIN = platform() === "win32";
const GEN = join(ROOT, "src-tauri", "gen", "android");

function fail(msg, extra) {
  console.error(`\n✗ ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function run(cmd, args, env = process.env) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
    env,
  });
  return r.status ?? 1;
}

function which(cmd) {
  const r = spawnSync(WIN ? "where" : "which", [cmd], { stdio: "ignore", shell: WIN });
  return r.status === 0;
}

function findSdk() {
  const env = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (env && existsSync(env)) return env;
  const home = homedir();
  const candidates = WIN
    ? [
        join(process.env.LOCALAPPDATA || join(home, "AppData", "Local"), "Android", "Sdk"),
        join(home, "AppData", "Local", "Android", "Sdk"),
        "C:\\Android\\Sdk",
      ]
    : [join(home, "Android", "Sdk"), join(home, "Library", "Android", "sdk"), "/usr/lib/android-sdk"];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function findNdk(sdk) {
  if (process.env.NDK_HOME && existsSync(process.env.NDK_HOME)) return process.env.NDK_HOME;
  const ndkRoot = join(sdk, "ndk");
  if (existsSync(ndkRoot)) {
    const versions = readdirSync(ndkRoot)
      .filter((n) => statSync(join(ndkRoot, n)).isDirectory())
      .sort()
      .reverse();
    if (versions[0]) return join(ndkRoot, versions[0]);
  }
  const bundled = join(sdk, "ndk-bundle");
  return existsSync(bundled) ? bundled : null;
}

function walkApk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkApk(path, acc);
    else if (name.endsWith(".apk")) acc.push(path);
  }
  return acc;
}

console.log("Finance Manager — Android APK (Tauri, not a PWA)\n");

if (!which("node")) fail("Node.js 22+ is required.", "Install from https://nodejs.org");
if (!which("rustc") || !which("cargo")) {
  fail("Rust is required for the Android APK.", "Run desktop-setup.bat once, then this again.");
}
if (!which("java")) {
  fail("JDK 17 is required.", "Install a JDK, or Android Studio’s bundled JBR, then this again.");
}

const sdk = findSdk();
if (!sdk) {
  fail(
    "Android SDK not found.",
    "Install Android Studio (SDK + NDK). Then run deploy\\android\\apk.bat again.\nhttps://developer.android.com/studio",
  );
}
const ndk = findNdk(sdk);
const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
};
if (ndk) env.NDK_HOME = ndk;
console.log(`  SDK  ${sdk}`);
if (ndk) console.log(`  NDK  ${ndk}`);
else console.log("  NDK  (Tauri will look under the SDK)");

const npx = WIN ? "npx.cmd" : "npx";

if (!existsSync(GEN)) {
  console.log("\nInitializing the Android project (first time)…");
  if (run(npx, ["tauri", "android", "init", "--ci"], env) !== 0) {
    fail("tauri android init failed. Open Android Studio once so the SDK/NDK finish installing.");
  }
}

console.log("\nBuilding release APK…");
if (run(npx, ["tauri", "android", "build", "--apk", "--ci"], env) !== 0) {
  fail("tauri android build failed.");
}

mkdirSync(OUT, { recursive: true });
const apks = walkApk(join(GEN, "app", "build", "outputs"));
if (apks.length === 0) fail("Build finished but no .apk was found under gen/android.");
for (const apk of apks) {
  const dest = join(OUT, apk.split(/[/\\]/).pop());
  cpSync(apk, dest);
  console.log(`  ${dest}`);
}
console.log("\nSideload that APK. Books stay on the phone (IndexedDB).");
