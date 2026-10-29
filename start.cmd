@echo off
setlocal
cd /d "%~dp0"

set "ACTION=%~1"
if not defined ACTION set "ACTION=start"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" -Action "%ACTION%"
exit /b %ERRORLEVEL%
