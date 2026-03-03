# Changelog

## [2.0.1] – 2026-03-03

### Added

- **Badges** in README (CI, npm, Node, License, Stars, Issues).
- **npm CLI** preparation: `bin`, keywords, repository, author; `.npmignore` for package exclusions.
- **Smoke tests** (`scripts/smoke-test.js`): `--help`, `--version`, `--test` with `config.test.json`; `npm test`.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): Node 18.x and 20.x, `npm ci`, `npm test`.
- **docs/RELEASING.md**: release workflow, versioning, GitHub description and topics.

### Changed

- **README** restructured: Features, Installation, Quick Start, Konfiguration, FTP/Mobile, Sicherheit, FAQ, Development, Releases.
- **README.de/en/es**: badges, CLI references (`keepass-sync`).
- **INSTALL.md** and **docs/INSTALL.\***: fully on Node.js workflow.
- **TEST.md** and **docs/TEST.\***: examples with `node sync.js` / `keepass-sync`.

### Docs

- **Copyright** "Copyright (c) 2026 Sunny C." in sync.js, open_ftp.js, linux/mac/windows scripts.
- **JSDoc** comments in sync.js and open_ftp.js.

---

## [2.0.0] – 2025-03-03

### Added

- **Node.js** as the only supported implementation (Node 18+).
- **FTP/SFTP** via npm packages (`basic-ftp`, `ssh2-sftp-client`); no lftp required on Windows.
- **scripts/open_ftp.js** – list FTP/SFTP directory using `config.json` (`npm run open-ftp`).
- **KeePassXC** as git submodule under `keepassxc/` for reference.
- **Platform check**: only Linux, Windows (incl. WSL2), macOS (x86_64).
- **KEEPASS_DB_PASSWORD** environment variable to override master password in config.
- **config.example.json**: `port` and comment for start directory (mobile apps).

### Changed

- **Sync entry**: use `node sync.js` or `npm run sync`; wrappers `linux/sync_ftp.sh`, `mac/sync_ftp.sh`, `windows/sync_ftp.bat` and `windows/sync_ftp.ps1` call Node.
- **README**: rewritten with sync/merge flow, FTP credentials table (for Android/iOS apps), security notes, link to KeePassXC docs.
- **INSTALL.md** and **docs/INSTALL.\***: Node.js and `node sync.js` instead of Python; systemd/cron/launchd examples use `/usr/bin/node .../sync.js`.
- **TEST.md** and **docs/TEST.\***: all examples use `node sync.js`.
- **linux/install.sh**: uses `node sync.js` and `linux/sync_ftp.sh`.

### Removed

- **Python** implementation (`python/sync_ftp.py`, `install.py`, `sync.py`).
- **AutoIt**, **Go**, **Node.js (legacy folder)**, **PHP**, **C++**, **COBOL**, **PowerShell** standalone implementations.

### Security

- Passwords are not logged.
- Optional master password via `KEEPASS_DB_PASSWORD`; recommend `chmod 600 config.json` on Linux/macOS.

---

## [1.1.0] – (legacy)

- Previous release with Python and multiple language variants.
