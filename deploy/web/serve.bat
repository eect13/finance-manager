@echo off
setlocal EnableExtensions
cd /d "%~dp0."
cd /d "..\.."
if not exist "package.json" goto :noroots
if not exist "web\serve.mjs" goto :nopack

echo Serving web\
echo Close this window to stop.
echo.
node web\serve.mjs
if errorlevel 1 goto :fail
pause
exit /b 0

:noroots
echo ERROR: Could not find the Finance Manager repo root.
pause
exit /b 1

:nopack
echo No web pack yet. Double-click build.bat first.
pause
exit /b 1

:fail
echo.
echo Serve failed. Read the message above.
pause
exit /b 1
