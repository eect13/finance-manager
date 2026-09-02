@echo off
setlocal
cd /d "%~dp0\..\.."

if not exist "web\serve.mjs" (
  echo No web pack yet. Double-click build.bat first.
  pause
  exit /b 1
)

echo Serving web\  — close this window to stop.
echo.
node web\serve.mjs
pause
