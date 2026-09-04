@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required.
  start https://nodejs.org
  pause
  exit /b 1
)

echo Finance Manager - Android APK (Tauri)
echo Same WebView app as the desktop window. Not a PWA.
echo.
echo One-click solo build:
echo   - Forces Microsoft OpenJDK 17 (not Studio JBR 25)
echo   - Sets ANDROID_HOME / NDK_HOME
echo   - If Windows symlinks fail: copies .so + assets, Gradle -x rustBuild
echo First run can take a while. Leave this window open.
echo.

call node scripts\pack-android.mjs
if errorlevel 1 (
  echo.
  echo Build failed. Check the message above.
  echo Common fixes:
  echo   - Install Microsoft OpenJDK 17 ^(not Android Studio JBR^)
  echo   - Android Studio SDK + NDK
  echo   - Run desktop-setup.bat once for Rust
  echo See deploy\android\README.md
  pause
  exit /b 1
)

echo.
echo APK copied to deploy\android\
if exist "deploy\android\finance-manager-arm64-release.apk" (
  echo   deploy\android\finance-manager-arm64-release.apk
)
start "" explorer deploy\android
pause
exit /b 0
