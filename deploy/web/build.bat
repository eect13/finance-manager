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
echo Packing static HTML into web\ (index.html + one file per route)...
node scripts\pack-web.mjs
echo.
pause
