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

echo Finance Manager — Android APK (Trusted Web Activity)
echo One-click: paste the published https URL once. Later runs reuse it.
echo.

if "%START_URL%"=="" if exist "deploy\android\start-url.txt" (
  set /p START_URL=<deploy\android\start-url.txt
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

echo %START_URL%> deploy\android\start-url.txt

call node scripts\pack-android.mjs
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
npx --yes @bubblewrap/cli init --manifest "%START_URL%/__grok/manifest.webmanifest" --directory deploy\android\twa --skipPwaValidation
if errorlevel 1 goto :fail
npx --yes @bubblewrap/cli build --directory deploy\android\twa --skipPwaValidation
echo.
echo APK is under deploy\android\twa\app\build\outputs\apk\
pause
exit /b 0

:fail
echo Build failed. Use PWABuilder with the published URL, or Add to Home Screen in Chrome.
start https://www.pwabuilder.com
pause
exit /b 1
