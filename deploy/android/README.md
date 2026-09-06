# Finance Manager - Android APK (solo setup)

Finance Manager on Android is the same Tauri 2 app as the desktop window: a real APK with its own WebView. It is not a PWA, TWA, or PWABuilder wrapper. Books stay on the phone (IndexedDB).

A fresh GitHub unzip is enough. `node_modules` and `src-tauri/gen` are not in git — the packer creates them.

## One-click build

Double-click `apk.bat` at the repo root (or `deploy/android/apk.bat`). The pack script finds JDK 17 and Android SDK paths, runs `npm install` if needed, adds the Android Rust target, then builds. Developer Mode is optional because a file-copy fallback exists.

Folders with parentheses (`finance-manager-main (1)`) are OK.

## What you need (once)

| Tool | Notes |
|------|--------|
| **Node.js 22+** | https://nodejs.org - required for Vite UI pack and npx tauri |
| **Rust** | Installed by the packer or desktop-setup.bat. Android target `aarch64-linux-android` is added automatically. |
| **JDK 17** | Microsoft OpenJDK 17 or Eclipse Temurin 17. Not Android Studio JBR / JDK 25. |
| **Android Studio** | Install SDK + NDK (NDK 30.x under `%LOCALAPPDATA%\Android\Sdk`) |

### Never use Android Studio JBR (Java 25)

- Do not point JAVA_HOME at `C:\Program Files\Android\Android Studio\jbr`
- `apk.bat` runs `scripts/pack-android.mjs`, which refuses JBR and pins Gradle to JDK 17

### Optional: Windows Developer Mode (symlinks)

Tauri Android build can symlink `libfinance_manager_lib.so` into jniLibs. Without Developer Mode the packer copies the `.so` instead. Developer Mode is optional.

## Where the APK lands

| Path | Role |
|------ |----- |
| deploy/android/finance-manager-v{ver}-arm64-release.apk | Versioned sideload APK (preferred) |
| deploy/android/finance-manager-arm64-release.apk | Same bytes, unversioned name |

Sideload the signed APK (allow unknown sources). No Play Store listing in this cut.

## How the solo packer builds

1. `npm install` if `@tauri-apps/cli` is missing
2. Vite UI into `.vercel/output/static`
3. `cargo build --release --target aarch64-linux-android --features custom-protocol` (NDK clang)
4. Copy `libfinance_manager_lib.so` into jniLibs/arm64-v8a
5. Sync assets + brand launcher icons into `gen/android`
6. `gradlew assembleArm64Release -x rustBuildArm64Release -x rustBuildUniversalRelease`
7. zipalign + apksigner (debug.keystore)

`custom-protocol` is required: without it Tauri treats the build as dev and the APK tries `127.0.0.1:8080`.

## After install

Download a backup on one device and restore on another. Books do not sync.
