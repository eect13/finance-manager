@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Always run from repo root (this file lives in deploy\android\).
REM pushd handles paths with spaces; fail loudly if layout is wrong.
pushd "%~dp0..\.." || (
  echo ERROR: could not cd to repo root from "%~dp0"
  pause
  exit /b 1
)
if not exist "package.json" (
  echo ERROR: package.json not found in %CD%
  echo Expected Finance Manager repo root. Desktop launcher must point at:
  echo   C:\Users\Eric\finance-manager-v362\deploy\android\apk.bat
  popd
  pause
  exit /b 1
)
if not exist "scripts\pack-android.mjs" (
  echo ERROR: scripts\pack-android.mjs missing under %CD%
  popd
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required.
  start https://nodejs.org
  popd
  pause
  exit /b 1
)

echo Finance Manager - Android APK (Tauri)
echo Same WebView app as the desktop window. Not a PWA.
echo.
echo One-click solo build:
echo   - Forces Microsoft OpenJDK 17 (not Studio JBR / JDK 25)
echo   - Sets ANDROID_HOME / NDK_HOME
echo   - If Windows symlinks fail: copies .so + assets, Gradle -x rustBuild
echo First run can take a while. Leave this window open.
echo.
echo Working directory: %CD%
echo.

REM --- Force Microsoft JDK 17 (refuse Studio JBR / JDK 25) ---
set "JAVA_HOME="
if exist "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
) else (
  for /d %%D in ("C:\Program Files\Microsoft\jdk-17*") do (
    if exist "%%~D\bin\java.exe" if not defined JAVA_HOME set "JAVA_HOME=%%~D"
  )
)

if not defined JAVA_HOME (
  echo ERROR: Microsoft OpenJDK 17 not found.
  echo Install from https://learn.microsoft.com/java/openjdk/download
  echo Expected: C:\Program Files\Microsoft\jdk-17*
  echo Do NOT use Android Studio JBR or JDK 25 for this build.
  echo.
  echo Common fixes:
  echo   - Install Microsoft OpenJDK 17 ^(not Android Studio JBR^)
  echo   - Android Studio SDK + NDK
  echo   - Run desktop-setup.bat once for Rust
  echo See deploy\android\README.md
  popd
  pause
  exit /b 1
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo ERROR: java.exe missing under JAVA_HOME=%JAVA_HOME%
  popd
  pause
  exit /b 1
)

REM Put Microsoft JDK first on PATH, but always invoke via full path for the check
REM so Oracle javapath / Studio JBR cannot sneak in.
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
echo JAVA_HOME=%JAVA_HOME%
"%JAVA_EXE%" -version 2>&1
echo.

REM Simple sanity: Microsoft prints openjdk version "17.0.20.1"
REM findstr /C:"17." avoids brittle for/f + regex quote stripping.
"%JAVA_EXE%" -version 2>&1 | findstr /C:"17." >nul
if errorlevel 1 (
  echo ERROR: java is not JDK 17 after forcing JAVA_HOME.
  echo Got output above. This bat refuses Studio JBR / JDK 25.
  echo.
  echo Common fixes:
  echo   - Install Microsoft OpenJDK 17 ^(not Android Studio JBR^)
  echo   - Android Studio SDK + NDK
  echo   - Run desktop-setup.bat once for Rust
  echo See deploy\android\README.md
  popd
  pause
  exit /b 1
)
echo JDK 17 check OK.
echo.

REM --- Android SDK / NDK ---
if exist "%LOCALAPPDATA%\Android\Sdk" (
  set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
  set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
  echo ANDROID_HOME=%ANDROID_HOME%
) else (
  echo WARNING: %LOCALAPPDATA%\Android\Sdk not found - packer may still locate SDK.
)

if exist "%LOCALAPPDATA%\Android\Sdk\ndk\30.0.16138531" (
  set "NDK_HOME=%LOCALAPPDATA%\Android\Sdk\ndk\30.0.16138531"
  echo NDK_HOME=%NDK_HOME%
) else (
  echo NDK 30.0.16138531 not at default path - leaving NDK_HOME unset ^(packer will search^).
)
echo.

call node scripts\pack-android.mjs
if errorlevel 1 (
  echo.
  echo Build failed. Check the message above.
  echo Common fixes:
  echo   - Install Microsoft OpenJDK 17 ^(not Android Studio JBR^)
  echo   - Android Studio SDK + NDK
  echo   - Run desktop-setup.bat once for Rust
  echo See deploy\android\README.md
  popd
  pause
  exit /b 1
)

echo.
echo === SUCCESS ===
echo APK folder: %CD%\deploy\android\
set "FOUND_VERSIONED=0"
for %%F in ("deploy\android\finance-manager-v*-arm64-release.apk") do (
  if exist "%%~F" (
    set "FOUND_VERSIONED=1"
    echo   Versioned: %%~nxF
    echo     full:    %%~fF
    echo     size:    %%~zF bytes
  )
)
if "!FOUND_VERSIONED!"=="0" (
  echo   WARNING: no finance-manager-v*-arm64-release.apk found
)
if exist "deploy\android\finance-manager-arm64-release.apk" (
  echo   Friendly:  finance-manager-arm64-release.apk
  for %%F in ("deploy\android\finance-manager-arm64-release.apk") do echo     size:    %%~zF bytes
)
echo.
start "" explorer "%CD%\deploy\android"
popd
pause
exit /b 0
