@echo off
setlocal
cd /d "%~dp0\..\.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required.
  start https://nodejs.org
  pause
  exit /b 1
)

echo Finance Manager — Android APK (Tauri)
echo Same WebView app as the desktop window. Not a PWA.
echo First run installs Android Rust targets and can take a while.
echo Leave this window open.
echo.

call node scripts\pack-android.mjs
if errorlevel 1 (
  echo.
  echo Install Android Studio with SDK + NDK, JDK 17, and Rust ^(desktop-setup.bat^).
  start https://developer.android.com/studio
  pause
  exit /b 1
)

echo.
echo APK copied to deploy\android\
start "" explorer deploy\android
pause
exit /b 0
