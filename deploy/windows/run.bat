@echo off
setlocal
cd /d "%~dp0\..\.."

if exist "src-tauri\target\release\Finance Manager.exe" (
  start "" "src-tauri\target\release\Finance Manager.exe"
  goto :eof
)
if exist "src-tauri\target\release\finance-manager.exe" (
  start "" "src-tauri\target\release\finance-manager.exe"
  goto :eof
)

echo Install Finance Manager first.
echo Double-click deploy.bat at the repo root, then run the NSIS setup under:
echo   src-tauri\target\release\bundle\nsis\
echo After install, launch Finance Manager from the Start menu.
echo.
pause
