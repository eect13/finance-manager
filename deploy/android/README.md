# Android APK

Finance Manager on Android is the **same Tauri 2 app** as the desktop window — a real APK with its own WebView, not a PWA, TWA, or PWABuilder wrapper. Books stay on the phone (IndexedDB).

## One-click

Double-click `apk.bat`. First run initializes `src-tauri/gen/android` and compiles Android Rust targets (slow). Later runs only rebuild.

**Needs (once):** Node 22, Rust (`desktop-setup.bat`), **JDK 17**, and **Android Studio** with SDK + NDK. The script finds the SDK at `%LOCALAPPDATA%\Android\Sdk`.

The `.apk` is copied to this folder. Sideload it (allow unknown sources). There is no Play Store listing in this cut.

## After install

Download a backup on one device and restore it on another. Books do not sync.
