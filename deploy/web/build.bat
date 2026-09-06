@echo off
setlocal EnableExtensions
cd /d "%~dp0."
cd /d "..\.."
if not exist "package.json" goto :noroots
if not exist "scripts\pack-web.mjs" goto :noroots

where node >nul 2>nul
if errorlevel 1 goto :nonode

echo Packing the static web folder into web\
echo.
node scripts\pack-web.mjs
if errorlevel 1 goto :fail
echo.
pause
exit /b 0

:noroots
echo ERROR: Could not find the Finance Manager repo root.
pause
exit /b 1

:nonode
echo Node.js 22 or newer is required.
start https://nodejs.org
pause
exit /b 1

:fail
echo.
echo Pack failed. Read the message above.
pause
exit /b 1
