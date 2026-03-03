# KeePass Sync

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/issues)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Sync and merge your KeePass/KeePassXC password database over FTP, SFTP, SMB, or SCP.** Keeps the remote file up to date; changes on PC or mobile are merged on the next sync.

**Languages:** [Deutsch](README.de.md) · [English](README.en.md) · [Español](README.es.md)

---

## Features

- **Sync & merge** KeePass/KeePassXC databases via KeePassXC-CLI
- **Protocols:** FTP, SFTP, SCP (Node.js), SMB (Linux/macOS via smbclient)
- **Platforms:** Linux, Windows (incl. WSL2), macOS (x86_64)
- **No lftp** required on Windows – pure Node.js for FTP/SFTP
- **Mobile:** Use the same FTP credentials in KeePass2Android, Strongbox, etc.

---

## Installation

**Requirements:** Node.js 18+, KeePassXC (with `keepassxc-cli` in PATH)

### 1. Install

```bash
npm install -g keepass-sync
# or from source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

### 2. Configure

```bash
cp config.example.json config.json
# Edit config.json – see table below
```

| Field | Meaning |
|-------|---------|
| `ftp.host` | Server (IP or hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp`, or `smb` |
| `ftp.user` | Username |
| `ftp.password` | Password |
| `ftp.remotePath` | Full path to .kdbx on server |
| `keepass.databasePassword` | KeePass master password |

**Optional:** `KEEPASS_DB_PASSWORD` env var overrides the master password (safer than storing in config).

### 3. Run

```bash
keepass-sync --test   # Test connection (no sync)
keepass-sync          # Sync & merge
keepass-sync --status # Status
```

**Wrappers:** `./linux/sync_ftp.sh` · `./mac/sync_ftp.sh` · `windows\sync_ftp.bat` · `.\windows\sync_ftp.ps1`

<details>
<summary><strong>Detailed installation & automation (Systemd, Cron, Task Scheduler)</strong></summary>

Full guides: [DE](docs/INSTALL.de.md) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)

</details>

---

## How Sync & Merge Works

1. **Backup** local database
2. **Download** database from server (FTP/SFTP/SMB/SCP)
3. **Merge** with KeePassXC-CLI (`keepassxc-cli merge -s … --same-credentials`)
4. **Upload** merged database back to server

The server file stays current; open the same DB on mobile with the same FTP credentials.

---

## Android: Externe Datenbank per FTP einrichten

In KeePass2Android, Strongbox oder ähnlichen Apps kannst du die KeePass-Datenbank direkt vom FTP-Server öffnen. Nutze dieselben Werte wie in `config.json`:

Wenn die App nach **FTP-Zugangsdaten** fragt (Dialog „FTP-Zugangsdaten eingeben:“), trage folgendes ein:

| App-Feld | Was eingeben | Beispiel |
|----------|--------------|----------|
| **Host** | `ftp.host` aus config.json (IP oder Hostname) | `192.168.0.1` oder `ftp.meinserver.de` |
| **Port** | `ftp.port` aus config.json | `21` (FTP) oder `22` (SFTP) |
| **Verschlüsselung** | FTP oder SFTP wählen (entspricht `ftp.type`) | „Keine Verschlüsselung (FTP)“ oder „SFTP“ |
| **Benutzername** | `ftp.user` | dein FTP-Benutzername |
| **Passwort** | `ftp.password` | dein FTP-Passwort |
| **Startverzeichnis (optional)** | Verzeichnisteil von `ftp.remotePath` (ohne Dateiname) | `/` oder `/home/user/` |

**Hinweis:** Wenn `ftp.remotePath` z.B. `/home/user/keepass.kdbx` ist, gib als Startverzeichnis `/home/user` ein. Die App zeigt dann die Dateien an – wähle `keepass.kdbx`.

**Sicherheit:** SFTP ist FTP vorzuziehen (Passwörter verschlüsselt).

Mehr: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

---

## Security

- Passwords are not logged
- Use `KEEPASS_DB_PASSWORD` env var instead of storing the master password in config
- Restrict `config.json` permissions: `chmod 600 config.json` (Linux/macOS)
- `config.json` is in `.gitignore` and never committed

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

**How does merge work?** KeePassXC-CLI merges the downloaded file into your local copy; conflicting entries are combined. Both files use the same master password.

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

| Topic | DE | EN | ES |
|-------|----|----|-----|
| Installation & Automation | [INSTALL](docs/INSTALL.de.md) | [INSTALL](docs/INSTALL.en.md) | [INSTALL](docs/INSTALL.es.md) |
| Testing | [TEST](docs/TEST.de.md) | [TEST](docs/TEST.en.md) | [TEST](docs/TEST.es.md) |

---

**License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync) · [npm](https://www.npmjs.com/package/keepass-sync)
