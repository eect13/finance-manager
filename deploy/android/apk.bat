@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0\..\.."

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22+ is required.
  start https://nodejs.org
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
  pause
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME=%JAVA_HOME%
java -version 2>&1
echo.

REM Confirm major version is 17
for /f "tokens=3" %%V in ('java -version 2^>^&1 ^| findstr /i "version"') do (
  set "JV=%%~V"
  goto :got_jv
)
:got_jv
echo Detected java version string: !JV!
echo !JV! | findstr /r "\"17[\.\"]" >nul
if errorlevel 1 (
  echo ERROR: java is not JDK 17. Got: !JV!
  echo This bat refuses Studio JBR / JDK 25. Fix JAVA_HOME and retry.
  echo.
  echo Common fixes:
  echo   - Install Microsoft OpenJDK 17 ^(not Android Studio JBR^)
  echo   - Android Studio SDK + NDK
  echo   - Run desktop-setup.bat once for Rust
  echo See deploy\android\README.md
  pause
  exit /b 1
)

REM --- Android SDK / NDK ---
if exist "%LOCALAPPDATA%\Android\Sdk" (
  set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
  set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
  echo ANDROID_HOME=%ANDROID_HOME%
) else (
  echo WARNING: %LOCALAPPDATA%\Android\Sdk not found — packer may still locate SDK.
)

if exist "%LOCALAPPDATA%\Android\Sdk\ndk\30.0.16138531" (
  set "NDK_HOME=%LOCALAPPDATA%\Android\Sdk\ndk\30.0.16138531"
  echo NDK_HOME=%NDK_HOME%
) else (
  echo NDK 30.0.16138531 not at default path — leaving NDK_HOME unset ^(packer will search^).
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
  pause
  exit /b 1
)

echo.
echo APK copied to deploy\android\
if exist "deploy\android\finance-manager-arm64-release.apk" (
  echo   deploy\android\finance-manager-arm64-release.apk
  for %%F in ("deploy\android\finance-manager-arm64-release.apk") do echo     size %%~zF bytes
)
for %%F in ("deploy\android\finance-manager-v*-arm64-release.apk") do (
  if exist "%%~F" (
    echo   %%~nxF
    echo     size %%~zF bytes
  )
)
start "" explorer deploy\android
pause
exit /b 0
