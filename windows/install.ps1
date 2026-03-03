# KeePass Sync - Windows installation script
# Creates scheduled task for automatic sync (daily and/or on idle).
# Copyright (c) 2026 Sunny C.
# Run as Administrator for per-user task, or normally for current user.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BaseDir = Join-Path $ScriptDir ".."
$SyncScript = Join-Path $BaseDir "sync.js"
$WrapperPath = Join-Path $ScriptDir "sync_ftp.ps1"

if (-not (Test-Path $SyncScript)) {
    Write-Host "Error: sync.js not found at $SyncScript" -ForegroundColor Red
    exit 1
}

# Use PowerShell wrapper to run sync
$ActionArg = "-NoProfile -ExecutionPolicy Bypass -File `"$WrapperPath`""
$TaskName = "KeePass Sync"
$TaskDesc = "Sync KeePass database via FTP/SFTP/Google Drive"

Write-Host "=== KeePass Sync - Windows Installation ===" -ForegroundColor Cyan
Write-Host ""

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create trigger: daily at 6:00 AM
$DailyTrigger = New-ScheduledTaskTrigger -Daily -At "6:00AM"

# Create trigger: on idle (10 minutes)
$IdleTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 60) -RepetitionDuration (New-TimeSpan -Days 365)
$IdleSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
# Note: "On idle" requires Task Scheduler API; we use recurring hourly as fallback.
# For true idle: User can add via taskschd.msc manually (Trigger -> On idle, 10 min).

# Create action: run PowerShell
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $ActionArg -WorkingDirectory $BaseDir
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Description $TaskDesc -Action $Action -Trigger $DailyTrigger -Principal $Principal -Settings $Settings | Out-Null

Write-Host "Task '$TaskName' created." -ForegroundColor Green
Write-Host "  - Runs daily at 6:00 AM"
Write-Host ""
Write-Host "To add 'On idle' trigger:"
Write-Host "  1. Open Task Scheduler (taskschd.msc)"
Write-Host "  2. Find '$TaskName'"
Write-Host "  3. Properties -> Triggers -> New -> 'On idle' -> 10 minutes"
Write-Host ""
Write-Host "Test manually: .\sync_ftp.ps1"
Write-Host ""
