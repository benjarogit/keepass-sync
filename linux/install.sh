#!/bin/bash
# Installations-Script für Linux
# Installiert automatische Ausführung bei Leerlauf und Herunterfahren

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

# Idle-Detection für Leerlauf
echo "2. Idle-Detection für Leerlauf..."

# Prüfe ob xprintidle installiert ist
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

# Idle-Script erstellen
IDLE_SCRIPT="$BASE_DIR/linux/idle_sync.sh"

cat > "$IDLE_SCRIPT" <<'IDLE_EOF'
#!/bin/bash
# Idle-Sync Script - prüft ob System im Leerlauf ist

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Prüfe ob X11 läuft
if [ -z "$DISPLAY" ]; then
    exit 0  # Kein X11, kein Idle-Check möglich
fi

# Idle-Zeit in Millisekunden
IDLE_TIME=$(xprintidle 2>/dev/null || echo "0")
IDLE_TIME_MIN=$((IDLE_TIME / 60000))

# Wenn System seit mindestens 5 Minuten idle ist
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

# Cron-Job für Idle-Sync
echo "3. Cron-Job für Leerlauf-Sync (alle 5 Minuten)..."
CRON_ENTRY="*/5 * * * * $IDLE_SCRIPT"

# Prüfe ob bereits ein Eintrag existiert
if crontab -l 2>/dev/null | grep -q "$IDLE_SCRIPT"; then
    echo "✓ Cron-Job existiert bereits"
else
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✓ Cron-Job installiert"
fi
echo ""

# Zusammenfassung
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

