@echo off
setlocal
cd /d "%~dp0\..\.."

if exist "dist\FinanceManager.exe" (
  echo Starting Finance Manager.exe
  echo Leave this window open. Close it to stop.
  echo.
  start "" /wait "dist\FinanceManager.exe"
  goto :eof
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required. Double-click deploy.bat after installing it.
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist ".vercel\output\" if not exist "dist\app\" (
  echo No production build yet. Double-click deploy.bat first.
  pause
  exit /b 1
)

echo Starting Finance Manager in an Edge/Chrome app window...
echo Leave this window open. Close it to stop.
echo.

if exist "dist\app\" (
  node scripts\win-launcher.cjs
  goto :eof
)

start /b node scripts\windows-app.mjs open
call npm run preview
echo.
pause
