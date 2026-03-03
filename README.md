# KeePass Sync

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/node/v/keepass-sync)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/issues)

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

### From npm (recommended)

```bash
npm install -g keepass-sync
# or locally: npm install keepass-sync
```

### From source

```bash
git clone https://github.com/benjarogit/keepass-sync.git
cd keepass-sync
npm install
```

**Requirements:** Node.js 18+, KeePassXC (with `keepassxc-cli` in PATH)

---

## Quick Start

```bash
# 1. Create config
cp config.example.json config.json
# Edit config.json: FTP/SFTP access, local paths, KeePass master password

# 2. Run sync
keepass-sync
# or: npm run sync / node sync.js

# Test connection (no sync)
keepass-sync --test

# Status
keepass-sync --status
```

**Wrappers:** `./linux/sync_ftp.sh` · `./mac/sync_ftp.sh` · `windows\sync_ftp.bat` · `.\windows\sync_ftp.ps1`

---

## How Sync & Merge Works

1. **Backup** local database
2. **Download** database from server (FTP/SFTP/SMB/SCP)
3. **Merge** with KeePassXC-CLI (`keepassxc-cli merge -s … --same-credentials`)
4. **Upload** merged database back to server

The server file stays current; open the same DB on mobile with the same FTP credentials.

---

## Configuration

Edit `config.json`:

| Field | Meaning |
|-------|---------|
| `ftp.host` | Server (IP or hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp`, or `smb` |
| `ftp.user` | Username |
| `ftp.password` | Password |
| `ftp.remotePath` | Full path to .kdbx on server |
| `keepass.databasePassword` | KeePass master password |

**Optional:** `KEEPASS_DB_PASSWORD` env var overrides the master password (safer than storing it in config).

---

## FTP Credentials (e.g. for Android/iOS Apps)

Use the same values as in `config.json` when adding an external database in KeePass2Android, Strongbox, etc.:

| App field | config.json |
|-----------|-------------|
| Host | `ftp.host` |
| Port | `ftp.port` |
| Encryption | `ftp.type` (`sftp` or `ftp`) |
| Username | `ftp.user` |
| Password | `ftp.password` |
| Start directory | Directory part of `ftp.remotePath` |

More: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

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

Version in `package.json` and Git tags (e.g. `v2.0.0`) stay in sync. npm package and GitHub releases match.

---

## Documentation

- [Installation & Automation](docs/INSTALL.de.md) (DE) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)
- [Testing](docs/TEST.de.md) (DE) · [EN](docs/TEST.en.md) · [ES](docs/TEST.es.md)

---

**Version:** 2.0.0 · **License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
