# KeePass Sync (English)

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Sync and merge your KeePass/KeePassXC database via FTP, SFTP, SMB, or SCP.**

Languages: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Platforms

- Linux, Windows (incl. WSL2), macOS (x86_64)
- **Node.js 18+** and **KeePassXC** (with `keepassxc-cli`) required

---

## Installation

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

**Optional:** `KEEPASS_DB_PASSWORD` overrides the master password (safer than storing in config).

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

1. Backup local DB
2. Download DB from server (FTP/SFTP/SMB/SCP)
3. Merge with KeePassXC-CLI (local + downloaded DB)
4. Upload merged DB back to server

The file on the server stays up to date; on your phone, open the same DB via FTP/SFTP with the same credentials.

---

## Android: Adding External Database via FTP

In KeePass2Android, Strongbox, etc. use the same values as in `config.json`:

| App field | Enter |
|-----------|-------|
| **Host** | `ftp.host` |
| **Port** | `ftp.port` (21 or 22) |
| **Encryption** | FTP or SFTP (`ftp.type`) |
| **Username** | `ftp.user` |
| **Password** | `ftp.password` |
| **Start directory** | Directory part of `ftp.remotePath` |

More: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

---

## Security

- No passwords in logs
- Master password optionally via `KEEPASS_DB_PASSWORD`
- Restrict `config.json`: `chmod 600 config.json`

---

## Test FTP from Project

```bash
npm run open-ftp
```

---

## Documentation

| Topic | DE | EN | ES |
|-------|----|----|-----|
| Installation & Automation | [INSTALL](docs/INSTALL.de.md) | [INSTALL](docs/INSTALL.en.md) | [INSTALL](docs/INSTALL.es.md) |
| Testing | [TEST](docs/TEST.de.md) | [TEST](docs/TEST.en.md) | [TEST](docs/TEST.es.md) |

---

**License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync) · [npm](https://www.npmjs.com/package/keepass-sync)
