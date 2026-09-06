@echo off
setlocal EnableExtensions
cd /d "%~dp0."
cd /d "..\.."
if not exist "package.json" goto :noroots

if exist "src-tauri\target\release\Finance Manager.exe" (
  start "" "src-tauri\target\release\Finance Manager.exe"
  exit /b 0
)
if exist "src-tauri\target\release\finance-manager.exe" (
  start "" "src-tauri\target\release\finance-manager.exe"
  exit /b 0
)

echo Install Finance Manager first.
echo Double-click deploy.bat at the repo root, then run the NSIS setup under:
echo   src-tauri\target\release\bundle\nsis\
echo After install, launch Finance Manager from the Start menu.
echo.
pause
exit /b 1

:noroots
echo ERROR: Could not find the Finance Manager repo root.
pause
exit /b 1
