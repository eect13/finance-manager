@echo off
setlocal
cd /d "%~dp0\..\.."
if not exist "web\serve.mjs" (
  echo No web\ pack yet. Double-click build.bat first.
  pause
  exit /b 1
)
echo Serving web\index.html ...
start "" "http://127.0.0.1:4173/"
node web\serve.mjs
pause
