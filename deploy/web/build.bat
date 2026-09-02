@echo off
setlocal
cd /d "%~dp0\..\.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  start https://nodejs.org
  pause
  exit /b 1
)

echo Packing the static web folder into web\
echo.
node scripts\pack-web.mjs
echo.
pause
