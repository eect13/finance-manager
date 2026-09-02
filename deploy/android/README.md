# Android APK

Finance Manager is a **PWA**. The one-tap install that always works is Chrome → **Add to Home Screen**.

A sideload **APK** is a Trusted Web Activity wrapper around the **published** URL (Remix from Grok). It cannot wrap `file://` or a local preview.

## One-click APK (Windows)

1. Remix from Grok so the app has an https URL.
2. Double-click `apk.bat`.
3. Paste that URL when asked (saved as `start-url.txt` for the next run).
4. If **Android Studio / SDK** is installed, Bubblewrap builds `app-release-signed.apk`.
5. If the SDK is missing, the script opens [PWABuilder](https://www.pwabuilder.com) — paste the same URL → Android → Download package.

JDK 17 is enough for the Java side. The Android SDK is what compiles the APK. This sandbox does not ship the SDK, so a binary `.apk` is not produced here.

## After install

Books stay in that Chrome/TWA profile. Download a backup to copy them. There is no Play Store listing in this cut.
