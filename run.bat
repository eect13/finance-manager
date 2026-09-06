@echo off
setlocal EnableExtensions
call "%~dp0deploy\windows\run.bat"
exit /b %ERRORLEVEL%
