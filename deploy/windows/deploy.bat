@echo off
setlocal EnableExtensions
cd /d "%~dp0."
cd /d "..\.."
if not exist "package.json" goto :noroots
if not exist "scripts\deploy.mjs" goto :noroots

where node >nul 2>nul
if errorlevel 1 goto :nonode

echo Building Finance Manager for Windows (.exe)...
echo Leave this window open. First build can take a few minutes.
echo.
node scripts\deploy.mjs
if errorlevel 1 goto :fail
echo.
pause
exit /b 0

:noroots
echo ERROR: Could not find the Finance Manager repo root.
echo Double-click deploy.bat at the unzipped GitHub folder instead.
pause
exit /b 1

:nonode
echo.
echo Node.js 22 or newer is required.
echo Opening https://nodejs.org - install it, then double-click this file again.
echo.
start https://nodejs.org
pause
exit /b 1

:fail
echo.
echo Build failed. Read the message above.
pause
exit /b 1
