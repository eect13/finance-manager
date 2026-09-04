# Finance Manager - Android APK (solo setup)

Finance Manager on Android is the same Tauri 2 app as the desktop window: a real APK with its own WebView. It is not a PWA, TWA, or PWABuilder wrapper. Books stay on the phone (IndexedDB).

## One-click build

Use the launcher in this folder. The pack script finds JDK 17 and Android SDK paths, then builds. Developer Mode is optional because a file-copy fallback exists.

## What you need (once)

| Tool | Notes |
|------|--------|
| **Node.js 22+** | https://nodejs.org - required for Vite UI pack and npx tauri |
| **Rust** | Install via desktop-setup.bat (or rustup). Android target: aarch64-linux-android |
| **JDK 17** | Microsoft OpenJDK 17, e.g. C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot |
| **Android Studio** | Install SDK + NDK (NDK 30.0.16138531 under %LOCALAPPDATA%\Android\Sdk) |

### Optional: permanent User env vars

Only needed outside the one-click launcher:

```
JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot
ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
ANDROID_SDK_ROOT=%ANDROID_HOME%
NDK_HOME=%ANDROID_HOME%\ndk\30.0.16138531
```

Put %JAVA_HOME%\bin ahead of any other Java on PATH.

### Never use Android Studio JBR (Java 25)

Android Studio bundled JBR is often Java 25. This project expects JDK 17.

- Do not point JAVA_HOME at C:\Program Files\Android\Android Studio\jbr
- Prefer deploy\android\apk.bat (forces JDK 17 and handles the symlink fallback)
- src-tauri\gen\android\gradle.properties pins org.gradle.java.home to JDK 17

### Optional: Windows Developer Mode (symlinks)

Tauri Android build symlinks libfinance_manager_lib.so into jniLibs. Without Developer Mode: Creation symbolic link is not allowed.

deploy\android\apk.bat already works around this (copy .so + assets, assemble excluding rust rebuild tasks). Developer Mode is optional.

Enable anyway: Settings -> System -> For developers -> Developer Mode = On
(https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development)

## Build commands

From the repo root (finance-manager-android):

```bat
npm run deploy:android
```

or double-click deploy/android/apk.bat

apk.bat / npm run deploy:android run pack-android.mjs then tauri android build --apk --ci, then copy APK(s) here.

First run inits src-tauri/gen/android and compiles Android Rust (slow).
Ensure package.json has "tauri": "tauri" for Gradle rustBuild tasks.

## Launcher icon (navy pillars)

Home screen must show the navy cream-pillars brand tile, not the default blue and yellow circles.

Rebuild: refresh icons, run the Android packer, uninstall the old app, then sideload the new release APK.
The packer copies brand mipmaps into the generated Android res folder before assemble.

## Where the APK lands

| Path | Role |
|------ |----- |
| deploy/android/finance-manager-arm64-release.apk | Sideloadable (debug-keystore signed) |
| deploy/android/app-arm64-release.apk | Same bytes |
| deploy/android/app-arm64-release-unsigned.apk | Raw Gradle unsigned release |
| src-tauri/gen/android/app/build/outputs/apk/arm64/release/ | Gradle output folder |

Sideload the signed APK (allow unknown sources). No Play Store listing in this cut.

## After install

Download a backup on one device and restore on another. Books do not sync.

## Quick verify before a build

1. java -version shows 17.x (not 25)
2. JAVA_HOME is Microsoft JDK 17, not Studio JBR
3. libfinance_manager_lib.so under jniLibs/arm64-v8a (or Tauri symlink with Developer Mode)
4. SDK + NDK under %LOCALAPPDATA%/Android/Sdk
