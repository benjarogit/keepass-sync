# KeePass Sync - Windows wrapper (calls node sync.js)
# Copyright (c) 2026 Sunny C.

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")

if (Get-Command node -ErrorAction SilentlyContinue) {
    if (Test-Path "sync.js") {
        node sync.js $args
        exit $LASTEXITCODE
    }
}

Write-Host "Error: Node.js or sync.js not found." -ForegroundColor Red
Write-Host "Install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
exit 1
