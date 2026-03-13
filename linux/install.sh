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

# Idle time in milliseconds (if xprintidle missing, assume idle)
IDLE_TIME=$(xprintidle 2>/dev/null || echo "999999")
IDLE_TIME_MIN=$((IDLE_TIME / 60000))

# If system has been idle for at least 5 minutes (or xprintidle not available)
if [ "$IDLE_TIME_MIN" -ge 5 ] 2>/dev/null || [ "$IDLE_TIME" = "999999" ]; then
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

# Idle sync scheduler: cron or systemd user timer
echo "3. Leerlauf-Sync (alle 5 Minuten) einrichten..."

if command -v crontab &> /dev/null; then
    if crontab -l 2>/dev/null | grep -q "$IDLE_SCRIPT"; then
        echo "✓ Cron-Job existiert bereits"
    else
        (crontab -l 2>/dev/null; echo "*/5 * * * * $IDLE_SCRIPT") | crontab -
        echo "✓ Cron-Job installiert"
    fi
else
    # Fallback: systemd user timer (cron not installed)
    USER_SYSTEMD="$HOME/.config/systemd/user"
    mkdir -p "$USER_SYSTEMD"
    cat > "$USER_SYSTEMD/keepass-sync-idle.service" <<SVC_EOF
[Unit]
Description=KeePass Sync (idle check)
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$BASE_DIR
ExecStart=$IDLE_SCRIPT
StandardOutput=append:$BASE_DIR/sync_idle.log
StandardError=append:$BASE_DIR/sync_idle.log

[Install]
WantedBy=default.target
SVC_EOF
    cat > "$USER_SYSTEMD/keepass-sync-idle.timer" <<TMR_EOF
[Unit]
Description=KeePass Sync - every 5 minutes (idle check)
Requires=keepass-sync-idle.service

[Timer]
OnCalendar=*-*-* *:0/5:00
Persistent=true

[Install]
WantedBy=timers.target
TMR_EOF
    systemctl --user daemon-reload
    systemctl --user enable keepass-sync-idle.timer
    systemctl --user start keepass-sync-idle.timer
    echo "✓ Systemd-User-Timer installiert (cron nicht verfügbar)"
fi
echo ""

# Summary
echo "=== Installation abgeschlossen! ==="
echo ""
echo "Installiert:"
echo "  ✓ Systemd Service (bei Herunterfahren)"
echo "  ✓ Leerlauf-Sync (Cron oder Systemd-Timer, alle 5 Minuten)"
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
echo "  crontab -l 2>/dev/null | grep -v '$IDLE_SCRIPT' | crontab -  # falls Cron"
echo "  systemctl --user stop keepass-sync-idle.timer"
echo "  systemctl --user disable keepass-sync-idle.timer  # falls Systemd-Timer"

