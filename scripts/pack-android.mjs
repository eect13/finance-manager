#!/usr/bin/env node
/**
 * Real Android APK via Tauri 2 (same WebView stack as the desktop app).
 * Not a PWA, TWA, or PWABuilder wrapper.
 *
 *   node scripts/pack-android.mjs
 *
 * Needs JDK 17 (not Studio JBR 25), Android SDK + NDK, and Rust.
 * On Windows without Developer Mode, Tauri’s jniLibs symlink fails — this
 * script falls back to copying the .so + Vite assets and Gradle assemble
 * with -x rustBuild*.
 *
 * Rust lib is built with `cargo build --release --features custom-protocol`
 * (NDK clang linker env). Without custom-protocol, Tauri bakes in
 * build.devUrl (127.0.0.1:8080) and the release APK shows a black screen.
 * android-studio-script is only a fallback (it often panics on the
 * missing Temp\\…-server-addr file on Windows).
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, platform, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "deploy", "android");
const WIN = platform() === "win32";
const GEN = join(ROOT, "src-tauri", "gen", "android");
const STATIC = join(ROOT, ".vercel", "output", "static");
const LIB_SO = "libfinance_manager_lib.so";
const SO_RELEASE = join(ROOT, "src-tauri", "target", "aarch64-linux-android", "release", LIB_SO);
const JNI_DIR = join(GEN, "app", "src", "main", "jniLibs", "arm64-v8a");
const ASSETS = join(GEN, "app", "src", "main", "assets");
const APK_DIR = join(GEN, "app", "build", "outputs", "apk", "arm64", "release");

function fail(msg, extra) {
  console.error(`\n✗ ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function winQuote(cmd) {
  if (!WIN) return cmd;
  if (!/[ \t]/.test(cmd)) return cmd;
  if (cmd.startsWith('"') && cmd.endsWith('"')) return cmd;
  return `"${cmd}"`;
}

function run(cmd, args, env = process.env, opts = {}) {
  // On Windows, shell:true + an unquoted path with spaces (e.g. C:\Program Files\nodejs\node.exe)
  // becomes `'C:\Program' is not recognized`. Only use shell for .bat/.cmd unless overridden.
  const bat = WIN && /\.(bat|cmd)$/i.test(String(cmd).replace(/^"|"$/g, ""));
  const useShell = opts.shell ?? bat;
  const r = spawnSync(useShell ? winQuote(cmd) : cmd, args, {
    cwd: opts.cwd ?? ROOT,
    stdio: opts.stdio ?? "inherit",
    shell: useShell,
    env,
    encoding: opts.encoding,
    windowsHide: true,
  });
  return r.status ?? 1;
}

function runCapture(cmd, args, env = process.env) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    status: r.status ?? 1,
    out: `${r.stdout || ""}${r.stderr || ""}`,
  };
}

function which(cmd) {
  const r = spawnSync(WIN ? "where" : "which", [cmd], { stdio: "ignore", shell: WIN });
  return r.status === 0;
}

function javaMajor(javaHome) {
  const bin = join(javaHome, "bin", WIN ? "java.exe" : "java");
  if (!existsSync(bin)) return null;
  const { out } = runCapture(bin, ["-version"]);
  const m = out.match(/version "(\d+)/);
  return m ? Number(m[1]) : null;
}

function isStudioJbr(p) {
  const n = p.replace(/\//g, "\\").toLowerCase();
  return n.includes("android studio") && n.includes("\\jbr");
}

function findJdk17() {
  const candidates = [];
  const push = (p) => {
    if (p && existsSync(p) && existsSync(join(p, "bin", WIN ? "java.exe" : "java"))) {
      candidates.push(p);
    }
  };

  if (process.env.JAVA_HOME) push(process.env.JAVA_HOME);

  if (WIN) {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const local = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    for (const base of [
      join(pf, "Microsoft"),
      join(pf, "Eclipse Adoptium"),
      join(pf, "Java"),
      join(pf, "Microsoft", "jdk-17*"),
      join(local, "Programs", "Eclipse Adoptium"),
      join(pf86, "Eclipse Adoptium"),
    ]) {
      if (base.includes("*")) continue;
      if (!existsSync(base)) continue;
      try {
        for (const name of readdirSync(base)) {
          if (/jdk-?17/i.test(name) || /^jdk-17/i.test(name)) push(join(base, name));
        }
      } catch {
        /* ignore */
      }
    }
    // Exact Microsoft OpenJDK layout used on Eric’s PC
    push(join(pf, "Microsoft", "jdk-17.0.20.101-hotspot"));
    // Temurin-style
    for (const base of [join(pf, "Eclipse Adoptium"), join(local, "Programs", "Eclipse Adoptium")]) {
      if (!existsSync(base)) continue;
      try {
        for (const name of readdirSync(base)) {
          if (/jdk-17|temurin-17/i.test(name)) push(join(base, name));
        }
      } catch {
        /* ignore */
      }
    }
  } else {
    for (const p of [
      "/usr/lib/jvm/java-17-openjdk-amd64",
      "/usr/lib/jvm/java-17-openjdk",
      "/Library/Java/JavaVirtualMachines",
    ]) {
      if (p.endsWith("JavaVirtualMachines") && existsSync(p)) {
        for (const name of readdirSync(p)) {
          if (/17/.test(name)) push(join(p, name, "Contents", "Home"));
        }
      } else push(p);
    }
  }

  const seen = new Set();
  for (const c of candidates) {
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (isStudioJbr(c)) continue;
    const major = javaMajor(c);
    if (major === 17) return c;
  }
  return null;
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
      .filter((n) => {
        try {
          return statSync(join(ndkRoot, n)).isDirectory();
        } catch {
          return false;
        }
      })
      .sort()
      .reverse();
    // Prefer known-good 30.x if present, else newest
    const preferred = versions.find((v) => v.startsWith("30."));
    if (preferred) return join(ndkRoot, preferred);
    if (versions[0]) return join(ndkRoot, versions[0]);
  }
  const bundled = join(sdk, "ndk-bundle");
  return existsSync(bundled) ? bundled : null;
}

function findBuildTools(sdk) {
  const root = join(sdk, "build-tools");
  if (!existsSync(root)) return null;
  const versions = readdirSync(root)
    .filter((n) => {
      try {
        return statSync(join(root, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();
  return versions[0] ? join(root, versions[0]) : null;
}

function windowsSymlinksOk() {
  if (!WIN) return true;
  const dir = join(tmpdir(), `fm-symlink-test-${process.pid}`);
  const target = join(dir, "t.txt");
  const link = join(dir, "l.txt");
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(target, "x");
    symlinkSync(target, link);
    return true;
  } catch {
    return false;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function ensureTauriNpmScript() {
  const pkgPath = join(ROOT, "package.json");
  if (!existsSync(pkgPath)) fail("package.json missing at repo root.");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  if (pkg.scripts.tauri === "tauri") return false;
  pkg.scripts.tauri = "tauri";
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('  Added "tauri": "tauri" to package.json (required by Gradle rustBuild).');
  return true;
}

function pinGradleJavaHome(jdk) {
  const props = join(GEN, "gradle.properties");
  if (!existsSync(props)) return;
  let text = readFileSync(props, "utf8");
  const escaped = jdk.replace(/\\/g, "\\\\");
  const line = `org.gradle.java.home=${escaped}`;
  if (/^org\.gradle\.java\.home=.*/m.test(text)) {
    text = text.replace(/^org\.gradle\.java\.home=.*/m, line);
  } else {
    text = `${text.trimEnd()}\n${line}\n`;
  }
  writeFileSync(props, text);
  console.log(`  Pinned org.gradle.java.home → ${jdk}`);
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

function buildFrontend(env) {
  console.log("\nPacking Vite UI for Android assets…");
  const feEnv = {
    ...env,
    // Force vite.config.ts isTauriBuild → static SPA (not Nitro website).
    TAURI_ENV_PLATFORM: env.TAURI_ENV_PLATFORM || "android",
  };
  if (run(process.execPath, [join(ROOT, "scripts", "tauri-before-build.mjs")], feEnv) !== 0) {
    fail("Frontend (Vite) build failed.");
  }
  if (!existsSync(join(STATIC, "index.html"))) {
    fail("UI pack missing .vercel/output/static/index.html");
  }
}

function findAndroidClang(ndk) {
  const prebuilt = join(ndk, "toolchains", "llvm", "prebuilt");
  if (!existsSync(prebuilt)) return null;
  const hosts = readdirSync(prebuilt).filter((n) => {
    try {
      return statSync(join(prebuilt, n)).isDirectory();
    } catch {
      return false;
    }
  });
  // Prefer the host we are on
  const prefer = WIN
    ? hosts.filter((h) => /windows/i.test(h))
    : hosts.filter((h) => /linux/i.test(h));
  const host = prefer[0] || hosts[0];
  if (!host) return null;
  const bin = join(prebuilt, host, "bin");
  // API 24 matches bundle.android.minSdkVersion
  const candidates = WIN
    ? ["aarch64-linux-android24-clang.cmd", "aarch64-linux-android24-clang.exe", "clang.exe"]
    : ["aarch64-linux-android24-clang", "clang"];
  for (const name of candidates) {
    const p = join(bin, name);
    if (existsSync(p)) return p;
  }
  return null;
}

function cargoEnvForAndroid(env, ndk) {
  const clang = findAndroidClang(ndk);
  const next = {
    ...env,
    TAURI_ENV_PLATFORM: "android",
    TAURI_ENV_DEBUG: "false",
    // Ensure release context even if a prior `tauri android dev` left debug flags around
    CARGO_PROFILE_RELEASE_STRIP: env.CARGO_PROFILE_RELEASE_STRIP || "true",
  };
  if (clang) {
    next.CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = clang;
    next.CC_aarch64_linux_android = clang;
    const binDir = dirname(clang);
    const arNames = WIN ? ["llvm-ar.exe", "llvm-ar.cmd", "llvm-ar"] : ["llvm-ar"];
    for (const name of arNames) {
      const ar = join(binDir, name);
      if (existsSync(ar)) {
        next.AR_aarch64_linux_android = ar;
        break;
      }
    }
    console.log(`  NDK clang  ${clang}`);
  } else {
    console.log("  NDK clang not found — cargo may still work if ~/.cargo/config.toml has a linker.");
  }
  return next;
}

function buildRustArm64(env) {
  console.log("\nCompiling Rust lib for aarch64-linux-android (release, custom-protocol)…");
  const ndk = env.NDK_HOME || env.ANDROID_NDK_HOME;
  const cargoEnv = cargoEnvForAndroid(env, ndk);

  // Prefer direct cargo — android-studio-script often panics on Windows
  // (missing Temp\\…-server-addr) even after a successful rustc link.
  const cargoArgs = [
    "build",
    "--manifest-path",
    join(ROOT, "src-tauri", "Cargo.toml"),
    "--release",
    "--target",
    "aarch64-linux-android",
    "--features",
    "custom-protocol",
  ];
  let status = run("cargo", cargoArgs, cargoEnv);
  if (existsSync(SO_RELEASE)) {
    if (status !== 0) {
      console.log("  Rust .so is present (cargo reported a non-zero status — continuing).");
    } else {
      console.log("  Built via cargo --release --features custom-protocol");
    }
    return true;
  }

  console.log("  Direct cargo did not produce the .so — trying tauri android-studio-script…");
  const npx = WIN ? "npx.cmd" : "npx";
  status = run(
    npx,
    ["tauri", "android", "android-studio-script", "--release", "--target", "aarch64"],
    cargoEnv,
  );
  if (existsSync(SO_RELEASE)) {
    if (status !== 0) {
      console.log("  Rust .so is present (symlink/script step likely failed — continuing with copy fallback).");
    }
    return true;
  }
  fail(
    "Rust Android library was not produced.",
    `Expected: ${SO_RELEASE}\nFix NDK / Rust Android targets, then retry.\ncargo/android-studio-script exit: ${status}`,
  );
}

function copySoToJniLibs() {
  if (!existsSync(SO_RELEASE)) fail(`Missing ${SO_RELEASE}`);
  mkdirSync(JNI_DIR, { recursive: true });
  const dest = join(JNI_DIR, LIB_SO);
  try {
    if (existsSync(dest)) rmSync(dest, { force: true });
  } catch {
    try {
      unlinkSync(dest);
    } catch {
      /* ignore */
    }
  }
  copyFileSync(SO_RELEASE, dest);
  console.log(`  Copied ${LIB_SO} → jniLibs/arm64-v8a (file copy, not symlink)`);
}

function syncAssets() {
  if (!existsSync(join(STATIC, "index.html"))) {
    fail("Missing Vite output at .vercel/output/static — frontend pack did not run.");
  }
  mkdirSync(ASSETS, { recursive: true });
  for (const name of readdirSync(ASSETS)) {
    rmSync(join(ASSETS, name), { recursive: true, force: true });
  }
  for (const name of readdirSync(STATIC)) {
    cpSync(join(STATIC, name), join(ASSETS, name), { recursive: true });
  }
  console.log("  Synced Vite output → app/src/main/assets");
}

function gradleAssembleArm64(env) {
  const gradlew = join(GEN, WIN ? "gradlew.bat" : "gradlew");
  if (!existsSync(gradlew)) fail(`Missing ${gradlew} — run tauri android init first.`);
  console.log("\nGradle assembleArm64Release (-x rustBuild*; uses copied .so)…");
  const args = [
    "assembleArm64Release",
    "-x",
    "rustBuildArm64Release",
    "-x",
    "rustBuildUniversalRelease",
    "--no-daemon",
  ];
  const status = run(gradlew, args, env, { cwd: GEN, shell: WIN });
  if (status !== 0) {
    fail(
      "Gradle assembleArm64Release failed.",
      "Confirm JDK 17 is active and NDK is installed. See deploy/android/README.md",
    );
  }
}

function signApkIfNeeded(sdk, env) {
  const unsigned = join(APK_DIR, "app-arm64-release-unsigned.apk");
  const signed = join(APK_DIR, "app-arm64-release.apk");
  if (existsSync(signed) && !existsSync(unsigned)) return signed;
  if (existsSync(signed)) {
    // Prefer already-signed if newer/equal size path from a prior run
  }
  const input = existsSync(unsigned) ? unsigned : existsSync(signed) ? null : null;
  if (!input) {
    if (existsSync(signed)) return signed;
    return null;
  }

  const buildTools = findBuildTools(sdk);
  if (!buildTools) {
    console.log("  build-tools not found — leaving unsigned APK (install SDK build-tools to auto-sign).");
    return unsigned;
  }

  const keystore = join(homedir(), ".android", "debug.keystore");
  if (!existsSync(keystore)) {
    console.log(`  No debug.keystore at ${keystore} — leaving unsigned APK.`);
    return unsigned;
  }

  const zipalign = join(buildTools, WIN ? "zipalign.exe" : "zipalign");
  const apksigner = join(buildTools, WIN ? "apksigner.bat" : "apksigner");
  const aligned = join(APK_DIR, "app-arm64-release-aligned.apk");

  console.log("  Signing with debug.keystore…");
  if (existsSync(zipalign)) {
    run(zipalign, ["-f", "4", unsigned, aligned], env);
  } else {
    copyFileSync(unsigned, aligned);
  }
  const signStatus = run(
    apksigner,
    [
      "sign",
      "--ks",
      keystore,
      "--ks-pass",
      "pass:android",
      "--key-pass",
      "pass:android",
      "--ks-key-alias",
      "androiddebugkey",
      "--out",
      signed,
      aligned,
    ],
    env,
  );
  if (signStatus !== 0 || !existsSync(signed)) {
    console.log("  apksigner failed — deploying unsigned APK.");
    return unsigned;
  }
  return signed;
}

function copyApksToDeploy(sdk, env, preferSigned) {
  mkdirSync(OUT, { recursive: true });
  const found = walkApk(join(GEN, "app", "build", "outputs"));
  if (found.length === 0) fail("Build finished but no .apk was found under gen/android.");

  let primary = preferSigned;
  if (!primary || !existsSync(primary)) {
    primary =
      found.find((p) => /app-arm64-release\.apk$/i.test(p) && !/unsigned/i.test(p)) ||
      found.find((p) => /arm64.*release.*\.apk$/i.test(p)) ||
      found[0];
  }

  // Always refresh friendly name
  const friendly = join(OUT, "finance-manager-arm64-release.apk");
  if (primary && existsSync(primary)) {
    copyFileSync(primary, friendly);
    console.log(`  ${friendly}`);
  }

  for (const apk of found) {
    const dest = join(OUT, basename(apk));
    copyFileSync(apk, dest);
    console.log(`  ${dest}`);
  }

  // If we signed in fallback, ensure friendly points at signed
  if (preferSigned && existsSync(preferSigned)) {
    copyFileSync(preferSigned, friendly);
  }
}


function syncAndroidLauncherIcons() {
  const srcRoot = join(ROOT, "src-tauri", "icons", "android");
  const destRoot = join(GEN, "app", "src", "main", "res");
  if (!existsSync(srcRoot) || !existsSync(dirname(destRoot))) {
    console.log("  Skipping launcher icon sync (icons/android or gen/android missing).");
    return;
  }
  mkdirSync(destRoot, { recursive: true });
  // Copy mipmap-* folders + values/ic_launcher_background.xml
  for (const name of readdirSync(srcRoot)) {
    const from = join(srcRoot, name);
    const to = join(destRoot, name);
    let st;
    try {
      st = statSync(from);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      mkdirSync(to, { recursive: true });
      cpSync(from, to, { recursive: true });
    }
  }
  console.log("  Synced brand launcher icons → gen/android/.../res (mipmap-*)");
}

function fallbackAssemble(env, sdk) {
  console.log("\n── Windows / no-symlink fallback ──");
  console.log("Copy .so into jniLibs, sync assets, Gradle -x rustBuild (no Developer Mode needed).\n");
  buildFrontend(env);
  buildRustArm64(env);
  copySoToJniLibs();
  syncAssets();
  syncAndroidLauncherIcons();
  gradleAssembleArm64(env);
  const signed = signApkIfNeeded(sdk, env);
  copyApksToDeploy(sdk, env, signed);
}

console.log("Finance Manager — Android APK (Tauri, not a PWA)\n");

if (!which("node")) fail("Node.js 22+ is required.", "Install from https://nodejs.org");
if (!which("rustc") || !which("cargo")) {
  fail("Rust is required for the Android APK.", "Run desktop-setup.bat once, then this again.");
}

const jdk = findJdk17();
if (!jdk) {
  fail(
    "JDK 17 not found (required).",
    [
      "Install Microsoft OpenJDK 17, then re-run deploy\\android\\apk.bat.",
      "  https://learn.microsoft.com/en-us/java/openjdk/download",
      "",
      "Do NOT use Android Studio’s bundled JBR (often Java 25) — it breaks Gradle for this project.",
      "Typical path: C:\\Program Files\\Microsoft\\jdk-17.0.xx.x-hotspot",
    ].join("\n"),
  );
}

const sdk = findSdk();
if (!sdk) {
  fail(
    "Android SDK not found.",
    "Install Android Studio (SDK + NDK). Then run deploy\\android\\apk.bat again.\nhttps://developer.android.com/studio",
  );
}

const ndk = findNdk(sdk);
if (!ndk) {
  fail(
    "Android NDK not found under the SDK.",
    [
      `Looked in: ${join(sdk, "ndk")}`,
      "In Android Studio: Settings → Languages & Frameworks → Android SDK → SDK Tools → NDK.",
      "Then set NDK_HOME to that version folder (e.g. …\\Sdk\\ndk\\30.0.16138531).",
    ].join("\n"),
  );
}

const env = {
  ...process.env,
  JAVA_HOME: jdk,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  NDK_HOME: ndk,
  ANDROID_NDK_HOME: ndk,
  PATH: `${join(jdk, "bin")}${WIN ? ";" : ":"}${process.env.PATH || ""}`,
};

console.log(`  JAVA_HOME  ${jdk} (JDK ${javaMajor(jdk)})`);
console.log(`  SDK        ${sdk}`);
console.log(`  NDK        ${ndk}`);

ensureTauriNpmScript();

const npx = WIN ? "npx.cmd" : "npx";

if (!existsSync(GEN)) {
  console.log("\nInitializing the Android project (first time)…");
  if (run(npx, ["tauri", "android", "init", "--ci"], env) !== 0) {
    fail("tauri android init failed. Open Android Studio once so the SDK/NDK finish installing.");
  }
}

pinGradleJavaHome(jdk);
syncAndroidLauncherIcons();

if (process.argv.includes("--env-check")) {
  console.log("\nEnv check OK (no build).");
  console.log(WIN && !windowsSymlinksOk() ? "  Symlinks: blocked (copy fallback would run)" : "  Symlinks: OK");
  process.exit(0);
}

const symOk = windowsSymlinksOk();
// Solo-reliable path: cargo --release --features custom-protocol → copy .so →
// sync assets → Gradle -x rustBuild*. Avoids android-studio-script server-addr
// panics and ensures the lib never bakes in 127.0.0.1:8080.
const preferCargo = WIN || process.argv.includes("--cargo") || !symOk;
if (preferCargo) {
  if (WIN && !symOk) {
    console.log(
      "\n⚠  Windows cannot create symlinks (Developer Mode off, or policy blocks them).",
    );
    console.log("   Using cargo + copy + Gradle -x rustBuild (solo-reliable path).");
  } else {
    console.log("\nUsing cargo + copy + Gradle path (release lib with custom-protocol)…");
  }
  fallbackAssemble(env, sdk);
  console.log("\nSideload deploy\\android\\finance-manager-arm64-release.apk (IndexedDB stays on device).");
  process.exit(0);
}

console.log("\nBuilding release APK via tauri android build…");
const tauriStatus = run(npx, ["tauri", "android", "build", "--apk", "--ci"], env);
if (tauriStatus === 0) {
  const apks = walkApk(join(GEN, "app", "build", "outputs"));
  if (apks.length === 0) fail("Build finished but no .apk was found under gen/android.");
  mkdirSync(OUT, { recursive: true });
  const primary =
    apks.find((p) => /arm64.*release\.apk$/i.test(p) && !/unsigned/i.test(p)) || apks[0];
  copyFileSync(primary, join(OUT, "finance-manager-arm64-release.apk"));
  for (const apk of apks) {
    const dest = join(OUT, basename(apk));
    copyFileSync(apk, dest);
    console.log(`  ${dest}`);
  }
  console.log(`  ${join(OUT, "finance-manager-arm64-release.apk")}`);
  console.log("\nSideload that APK. Books stay on the phone (IndexedDB).");
  process.exit(0);
}

console.log("\n⚠  tauri android build failed — trying cargo/copy/Gradle fallback…");
fallbackAssemble(env, sdk);
console.log("\nSideload deploy\\android\\finance-manager-arm64-release.apk (IndexedDB stays on device).");
