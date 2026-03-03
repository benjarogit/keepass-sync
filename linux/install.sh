#!/bin/bash
# KeePass Sync - Linux installation script
# Installs systemd service (on shutdown) and cron job (idle sync every 5 min).
# Copyright (c) 2026 Sunny C.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SYNC_SCRIPT="$BASE_DIR/linux/sync_ftp.sh"
SYNC_JS="$BASE_DIR/sync.js"

echo "=== KeePass Sync - Linux Installation ==="
echo ""

if [ ! -f "$SYNC_SCRIPT" ] || [ ! -f "$SYNC_JS" ]; then
    echo "Fehler: sync.js oder linux/sync_ftp.sh nicht gefunden!"
    exit 1
fi

EXEC_SCRIPT="$SYNC_SCRIPT"
EXEC_CMD="bash"
echo "Verwende: $EXEC_CMD $EXEC_SCRIPT (ruft node sync.js auf)"
echo ""

# Systemd Service installieren
echo "1. Systemd Service für Herunterfahren..."
SERVICE_FILE="/etc/systemd/system/keepass-sync.service"

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=KeePass Sync Service
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$BASE_DIR
ExecStart=$EXEC_CMD $EXEC_SCRIPT
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=halt.target reboot.target shutdown.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable keepass-sync.service

echo "✓ Systemd Service installiert (läuft bei Herunterfahren)"
echo ""

# Idle detection for system idle
echo "2. Idle-Detection für Leerlauf..."

# Check if xprintidle is installed
if ! command -v xprintidle &> /dev/null; then
    echo "Installiere xprintidle für Leerlauf-Erkennung..."
    if command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm xorg-xprintidle 2>/dev/null || echo "Hinweis: xprintidle nicht verfügbar. Installiere manuell."
    elif command -v apt &> /dev/null; then
        sudo apt install -y xprintidle 2>/dev/null || echo "Hinweis: xprintidle nicht verfügbar. Installiere manuell."
    else
        echo "Bitte installiere xprintidle manuell für deine Distribution."
    fi
fi

# Create idle script
IDLE_SCRIPT="$BASE_DIR/linux/idle_sync.sh"

cat > "$IDLE_SCRIPT" <<'IDLE_EOF'
#!/bin/bash
# Idle sync script - checks if system is idle

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if X11 is running
if [ -z "$DISPLAY" ]; then
    exit 0  # No X11, no idle check possible
fi

# Idle time in milliseconds
IDLE_TIME=$(xprintidle 2>/dev/null || echo "0")
IDLE_TIME_MIN=$((IDLE_TIME / 60000))

# If system has been idle for at least 5 minutes
if [ $IDLE_TIME_MIN -ge 5 ]; then
    cd "$BASE_DIR"
    if [ -f "sync.js" ]; then
        node sync.js >> "$BASE_DIR/sync_idle.log" 2>&1
    elif [ -f "linux/sync_ftp.sh" ]; then
        bash linux/sync_ftp.sh >> "$BASE_DIR/sync_idle.log" 2>&1
    fi
fi
IDLE_EOF

chmod +x "$IDLE_SCRIPT"
echo "✓ Idle-Script erstellt: $IDLE_SCRIPT"
echo ""

# Cron job for idle sync
echo "3. Cron-Job für Leerlauf-Sync (alle 5 Minuten)..."
CRON_ENTRY="*/5 * * * * $IDLE_SCRIPT"

# Check if entry already exists
if crontab -l 2>/dev/null | grep -q "$IDLE_SCRIPT"; then
    echo "✓ Cron-Job existiert bereits"
else
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✓ Cron-Job installiert"
fi
echo ""

# Summary
echo "=== Installation abgeschlossen! ==="
echo ""
echo "Installiert:"
echo "  ✓ Systemd Service (bei Herunterfahren)"
echo "  ✓ Cron-Job (bei Leerlauf, alle 5 Minuten)"
echo ""
echo "Teste manuell:"
echo "  - Service: sudo systemctl start keepass-sync.service"
echo "  - Idle-Sync: $IDLE_SCRIPT"
echo ""
echo "Logs:"
echo "  - Systemd: sudo journalctl -u keepass-sync.service"
echo "  - Idle-Sync: $BASE_DIR/sync_idle.log"
echo ""
echo "Deinstallation:"
echo "  sudo systemctl stop keepass-sync.service"
echo "  sudo systemctl disable keepass-sync.service"
echo "  sudo rm /etc/systemd/system/keepass-sync.service"
echo "  crontab -l | grep -v '$IDLE_SCRIPT' | crontab -"

