# KeePass Sync (Deutsch)

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Synchronisiere und merge deine KeePass/KeePassXC-Datenbank über FTP, SFTP, SMB oder SCP.**

Sprachen: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Plattformen

- Linux, Windows (inkl. WSL2), macOS (x86_64)
- **Node.js 18+** und **KeePassXC** (mit `keepassxc-cli`) erforderlich

---

## Installation

### 1. Installieren

```bash
npm install -g keepass-sync
# oder aus Source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

### 2. Konfigurieren

```bash
cp config.example.json config.json
# config.json bearbeiten – siehe Tabelle unten
```

| Feld | Bedeutung |
|------|-----------|
| `ftp.host` | Server (IP oder Hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp` oder `smb` |
| `ftp.user` | Benutzername |
| `ftp.password` | Passwort |
| `ftp.remotePath` | Vollständiger Pfad zur .kdbx auf dem Server |
| `keepass.databasePassword` | KeePass-Masterpasswort |

**Optional:** `KEEPASS_DB_PASSWORD` überschreibt das Masterpasswort (sicherer als in config.json).

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

1. Backup der lokalen DB
2. Download der DB vom Server (FTP/SFTP/SMB/SCP)
3. Merge mit KeePassXC-CLI (lokale + heruntergeladene DB)
4. Upload der gemergten DB zurück auf den Server

Die Datei auf dem Server bleibt aktuell; auf dem Handy die gleiche DB per FTP/SFTP mit denselben Zugangsdaten öffnen.

---

## Android: Externe Datenbank per FTP einrichten

In KeePass2Android, Strongbox oder ähnlichen Apps dieselben Werte wie in `config.json` nutzen:

| App-Feld | Eintrag |
|----------|---------|
| **Host** | `ftp.host` |
| **Port** | `ftp.port` (21 oder 22) |
| **Verschlüsselung** | FTP oder SFTP (`ftp.type`) |
| **Benutzername** | `ftp.user` |
| **Passwort** | `ftp.password` |
| **Startverzeichnis** | Verzeichnisteil von `ftp.remotePath` |

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
