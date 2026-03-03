@echo off
REM KeePass Sync - Windows (calls Node.js)
cd /d "%~dp0\.."

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    if exist "sync.js" (
        node sync.js %*
        exit /b %ERRORLEVEL%
    )
)

echo Error: Node.js or sync.js not found.
echo Install Node.js 18+ from https://nodejs.org/
pause
exit /b 1
