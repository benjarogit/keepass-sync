# KeePass Sync

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/issues)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Sync and merge your KeePass/KeePassXC password database over FTP, SFTP, SMB, SCP, or Google Drive.** Keeps the remote file up to date; changes on PC or mobile are merged on the next sync.

**Languages:** [Deutsch](README.de.md) · [English](README.en.md) · [Español](README.es.md)

---

## Features

- **Sync & merge** KeePass/KeePassXC databases via KeePassXC-CLI
- **Protocols (recommended order):** 1. Google Drive (rclone), 2. SFTP (prefer over FTP when using FTP protocols), 3. FTP, SMB, SCP
- **Platforms:** Linux, Windows (incl. WSL2), macOS (x86_64)
- **No lftp** required on Windows – pure Node.js for FTP/SFTP
- **Mobile:** Use the same credentials in KeePass2Android, Strongbox, etc.

---

## Installation

**Requirements:** Node.js 18+, KeePassXC (with `keepassxc-cli` in PATH)

### 1. Install

```bash
npm install -g keepass-sync
# or from source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

**Quick setup:** Run `npm run setup` for interactive configuration (recommended for beginners). For Google Drive: `cp config.example.gdrive.json config.json` then run `rclone config`.

### 2. Configure

```bash
cp config.example.json config.json
# For Google Drive: cp config.example.gdrive.json config.json
# Edit config.json – see table below
```

| Field | Meaning |
|-------|---------|
| `local.localPath` | Path to local .kdbx – same file as opened in KeePassXC. Absolute (e.g. `/path/to/keepass_passwords.kdbx`) or relative to project dir. |
| `ftp.host` | Server (IP or hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp`, `smb`, or `rclone`/`gdrive` (Google Drive) |
| `ftp.user` | Username |
| `ftp.password` | Password |
| `ftp.remotePath` | Full path to .kdbx on server |
| `keepass.databasePassword` | KeePass master password |

**Optional:** `KEEPASS_DB_PASSWORD` env var overrides the master password (safer than storing in config). `KEEPASS_LOCAL_PATH` overrides the path to the local KDBX.

### 3. Run

```bash
keepass-sync --test   # Test connection (no sync)
keepass-sync          # Sync & merge
keepass-sync --status # Status
```

**Wrappers:** `./linux/sync_ftp.sh` · `./mac/sync_ftp.sh` · `windows\sync_ftp.bat` · `.\windows\sync_ftp.ps1`

<details>
<summary><strong>Detailed installation & automation (Cron, Task Scheduler, LaunchAgent)</strong></summary>

Step-by-step guides for inexperienced users: [DE](docs/INSTALL.de.md) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)  
Includes Cron syntax, Task Scheduler clicks, LaunchAgent setup, and install scripts for Linux/Windows/macOS.

</details>

---

## How Sync & Merge Works

**Merge only – no overwrite.** Both sources are combined; local and remote entries are merged. Nothing is replaced blindly.

1. **Backup** local database
2. **Download** database from server (FTP/SFTP/SMB/SCP)
3. **Validate** downloaded file (reject corrupt or incompatible KDBX)
4. **Merge** with KeePassXC-CLI (`keepassxc-cli merge -s … --same-credentials`)
5. **Upload** merged database back to server

The server file stays current; open the same DB on mobile with the same FTP credentials.

**If merge fails:** Neither local nor server file is modified. Backups in `backups/` remain unchanged.

---

## Android: Externe Datenbank einrichten

### Google Drive (empfohlen)

Bei `type: "rclone"` die Datenbank in KeePass2Android direkt aus **Google Drive** öffnen (eingebaute Unterstützung). Dieselbe Datei wie in `remotePath` wählen, z.B. im Ordner `KeePass/keepass_passwords.kdbx`. Keine FTP-Konfiguration nötig.

### FTP/SFTP

In KeePass2Android, Strongbox oder ähnlichen Apps dieselben Werte wie in `config.json` nutzen: Host, Port, Benutzer, Passwort, Startverzeichnis. **SFTP vorziehen** (Passwörter verschlüsselt; weniger Kompatibilitätsprobleme als mit FTP).

| App-Feld | Was eingeben |
|----------|--------------|
| **Host** | `ftp.host` |
| **Port** | `21` (FTP) oder `22` (SFTP) |
| **Verschlüsselung** | FTP oder SFTP (`ftp.type`) |
| **Benutzername** | `ftp.user` |
| **Passwort** | `ftp.password` |
| **Startverzeichnis** | Verzeichnisteil von `ftp.remotePath` |

**Tipp:** Bei Problemen mit KeePass2Android und FTP: In KeePassXC auf KDBX 3.1 speichern. Mit Google Drive meist nicht nötig.

[KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

---

## Security

- **Passwords are never logged** – credentials never appear in logs or error messages
- **Master password:** Use `KEEPASS_DB_PASSWORD` env var instead of storing in config (safer)
- **KeePassXC-CLI:** Password passed via stdin only, never on command line
- **config.json:** Restricted permissions recommended – `chmod 600 config.json` (Linux/macOS)
- **config.json** is in `.gitignore` and never committed to the repository

---

## Open FTP from Project

List the configured FTP/SFTP directory:

```bash
npm run open-ftp
# or: node scripts/open_ftp.js
```

---

## FAQ

**Do I need an FTP server?** Yes – you need FTP, SFTP, SMB, or SCP access to a server where the .kdbx file is stored.

**How does merge work?** KeePassXC-CLI merges the downloaded file into your local copy; conflicting entries are combined. Both files use the same master password. **Merge only – no overwrite.** Both sources are combined; data is never replaced blindly.

**What if the merge fails?** Neither your local database nor the server file is modified. See Android section for compatibility tips (KDBX format, Google Drive vs FTP). Backups in `backups/` remain safe.

**Does it work on Windows without WSL?** Yes. Node.js handles FTP/SFTP natively; no lftp or WSL needed.

---

## Development

- **Run tests:** `npm test`
- **KeePassXC reference:** `keepassxc/` submodule – `git submodule update --init`

---

## Releases & Versioning

Version in `package.json` and Git tags (e.g. `v2.0.1`) stay in sync. npm package and GitHub releases match.

---

## Documentation

[docs/](docs/README.md) – Installation & Automation · Testing · Release-Workflow

| Topic | DE | EN | ES |
|-------|----|----|-----|
| Installation & Automation | [INSTALL](docs/INSTALL.de.md) | [INSTALL](docs/INSTALL.en.md) | [INSTALL](docs/INSTALL.es.md) |
| Testing | [TEST](docs/TEST.de.md) | [TEST](docs/TEST.en.md) | [TEST](docs/TEST.es.md) |

---

**License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync) · [npm](https://www.npmjs.com/package/keepass-sync)
