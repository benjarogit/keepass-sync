#!/bin/bash
# KeePass Sync - macOS installation script
# Installs LaunchAgent for automatic sync (hourly and at login).
# Copyright (c) 2026 Sunny C.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SYNC_JS="$BASE_DIR/sync.js"
NODE_PATH=$(command -v node 2>/dev/null || echo "/usr/local/bin/node")

if [ ! -f "$SYNC_JS" ]; then
    echo "Error: sync.js not found at $SYNC_JS"
    exit 1
fi

PLIST_ID="com.keepass-sync"
PLIST_FILE="$HOME/Library/LaunchAgents/${PLIST_ID}.plist"

echo "=== KeePass Sync - macOS Installation ==="
echo ""

# Unload existing agent if present
if launchctl list 2>/dev/null | grep -q "$PLIST_ID"; then
    echo "Unloading existing LaunchAgent..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
fi

mkdir -p "$(dirname "$PLIST_FILE")"

# Create LaunchAgent plist
# RunAtLoad: run once at login
# StartInterval: run every 3600 seconds (1 hour)
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_ID}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_PATH}</string>
        <string>${SYNC_JS}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${BASE_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>${BASE_DIR}/sync_log.txt</string>
    <key>StandardErrorPath</key>
    <string>${BASE_DIR}/sync_error.log</string>
</dict>
</plist>
EOF

launchctl load "$PLIST_FILE"

echo "LaunchAgent installed: $PLIST_FILE"
echo "  - Runs at login (RunAtLoad)"
echo "  - Runs every hour (StartInterval: 3600s)"
echo ""
echo "Logs: $BASE_DIR/sync_log.txt, sync_error.log"
echo ""
echo "To disable: launchctl unload $PLIST_FILE"
echo "To remove:  rm $PLIST_FILE && launchctl unload $PLIST_FILE"
echo ""
