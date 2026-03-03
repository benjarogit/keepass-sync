# KeePass Sync (Deutsch)

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Synchronisiere und merge deine KeePass/KeePassXC-Datenbank über FTP, SFTP, SMB, SCP oder Google Drive (rclone).**

Sprachen: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Plattformen

- Linux, Windows (inkl. WSL2), macOS (x86_64)
- **Node.js 18+** und **KeePassXC** (mit `keepassxc-cli`) erforderlich

**Empfohlen:** Google Drive (rclone) für zuverlässige Cloud-Synchronisation und beste Mobil-App-Kompatibilität – umgeht FTP/SFTP-Probleme mit KeePass2Android.

---

## Installation

### 1. Installieren

```bash
npm install -g keepass-sync
# oder aus Source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

**Schnell-Setup:** `npm run setup` für interaktive Konfiguration (für Einsteiger empfohlen). Für Google Drive: `cp config.example.gdrive.json config.json`, dann `rclone config` ausführen.

### 2. Konfigurieren

```bash
cp config.example.json config.json
# Für Google Drive: cp config.example.gdrive.json config.json
# config.json bearbeiten – siehe Tabelle unten
```

| Feld | Bedeutung |
|------|-----------|
| `local.localPath` | Pfad zur lokalen .kdbx – dieselbe Datei wie in KeePassXC. Absolut (z.B. `/mnt/ssd2/.../keepass_passwords.kdbx`) oder relativ zum Projektordner. |
| `ftp.type` | `ftp`, `sftp`, `scp`, `smb` oder `rclone`/`gdrive` |
| `ftp.host` | Server (IP/Hostname) – bei rclone nicht nötig |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.user` | Benutzername |
| `ftp.password` | Passwort |
| `ftp.remotePath` | Pfad zur .kdbx: Server-Pfad oder rclone-Pfad (`gdrive:Ordner/datei.kdbx`) |
| `keepass.databasePassword` | KeePass-Masterpasswort |

**Optional:** `KEEPASS_DB_PASSWORD` überschreibt das Masterpasswort (sicherer als in config.json). `KEEPASS_LOCAL_PATH` überschreibt den Pfad zur lokalen KDBX.

**Google Drive (rclone):** `type: "rclone"`, `remotePath: "gdrive:Pfad/datei.kdbx"`. Zuerst `rclone config` ausführen und Remote `gdrive` anlegen. Installation: `pacman -S rclone` bzw. `apt install rclone`.

### 3. Ausführen

```bash
keepass-sync --test   # Verbindung testen (ohne Sync)
keepass-sync          # Sync & Merge
keepass-sync --status # Status
```

**Wrappers:** `./linux/sync_ftp.sh` · `./mac/sync_ftp.sh` · `windows\sync_ftp.bat` · `.\windows\sync_ftp.ps1`

<details>
<summary><strong>Detaillierte Installation & Automatisierung (Systemd, Cron, Task Scheduler)</strong></summary>

Vollständige Anleitungen: [DE](docs/INSTALL.de.md) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)

</details>

---

## Ablauf: Sync & Merge

**Nur Merge – kein Überschreiben.** Beide Quellen werden zusammengeführt; lokale und remote Einträge werden gemergt. Nichts wird blind ersetzt.

1. Backup der lokalen DB
2. Download der DB vom Server (FTP/SFTP/SMB/SCP)
3. Validierung der heruntergeladenen Datei (bei Korrupt oder inkompatiblen KDBX: Abbruch)
4. Merge mit KeePassXC-CLI (lokale + heruntergeladene DB)
5. Upload der gemergten DB zurück auf den Server

Die Datei auf dem Server bleibt aktuell; auf dem Handy die gleiche DB per FTP/SFTP mit denselben Zugangsdaten öffnen.

**Bei Merge-Fehler:** Weder lokale noch Server-Datei wird geändert. Backups in `backups/` bleiben unverändert.

### Wann synchronisieren?

- **Nach Änderungen am Desktop:** `keepass-sync --sync` ausführen.
- **Nach Änderungen am Smartphone:** Zuerst in KeePass2Android speichern, danach `keepass-sync --sync` auf dem Desktop ausführen.
- **KeePass2Android:** Datenbank schließen und neu öffnen, um Änderungen vom Sync zu laden.

---

## Android: Externe Datenbank einrichten

### FTP/SFTP

In KeePass2Android dieselben Werte wie in `config.json` nutzen: Host, Port, Benutzer, Passwort, Startverzeichnis.

### Google Drive

Bei `type: "rclone"` die Datenbank in KeePass2Android direkt aus **Google Drive** öffnen (eingebaute Unterstützung). Dieselbe Datei wie in `remotePath` wählen, z.B. im Ordner `KeePass/keepass_passwords.kdbx`.

**Kompatibilität:** KDBX-3.1-Format für beste Kompatibilität. KeePass2Android speichert Google-Drive-Dateien zuverlässiger als FTP.

Mehr: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

---

## Sicherheit

- Keine Passwörter in Logs
- Master-Passwort optional per `KEEPASS_DB_PASSWORD`
- `config.json` schützen: `chmod 600 config.json`

---

## FTP aus dem Projekt testen

```bash
npm run open-ftp
```

---

## Dokumentation

| Thema | DE | EN | ES |
|-------|----|----|-----|
| Installation & Automatisierung | [INSTALL](docs/INSTALL.de.md) | [INSTALL](docs/INSTALL.en.md) | [INSTALL](docs/INSTALL.es.md) |
| Testen | [TEST](docs/TEST.de.md) | [TEST](docs/TEST.en.md) | [TEST](docs/TEST.es.md) |

---

**License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync) · [npm](https://www.npmjs.com/package/keepass-sync)
