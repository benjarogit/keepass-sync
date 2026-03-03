# KeePass Sync (English)

**Sync and merge your KeePass/KeePassXC database via FTP, SFTP, SMB, or SCP.**

Languages: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Platforms

- Linux, Windows (incl. WSL2), macOS (x86_64)  
- **Node.js 18+** and **KeePassXC** (with `keepassxc-cli`) required.

---

## Quick start

```bash
npm install
cp config.example.json config.json
# Edit config.json: FTP credentials, local paths, KeePass master password

npm run sync
# or: node sync.js
```

- Test connection: `node sync.js --test`
- Status: `node sync.js --status`

On Linux: `./linux/sync_ftp.sh` · On Windows: `windows\sync_ftp.bat` or `windows\sync_ftp.ps1`.

---

## How sync & merge works

1. Backup local DB  
2. Download DB from server (FTP/SFTP/SMB/SCP)  
3. Merge with KeePassXC-CLI (local + downloaded DB)  
4. Upload merged DB back to server  

The file on the server stays up to date; on your phone, open the same DB via FTP/SFTP with the same credentials.

---

## FTP credentials (e.g. in Android/iOS apps)

In many KeePass apps (KeePass2Android, Strongbox, etc.) you can add an **external database** via FTP/SFTP. Use the same values as in `config.json`:

| App field | Meaning | In config.json |
|-----------|---------|-----------------|
| **Host** | Server (IP or hostname) | `ftp.host` |
| **Port** | 21 (FTP), 22 (SFTP), 990 (FTPS) | `ftp.port` |
| **Encryption** | None/FTP, FTPES, FTPS, SFTP | `ftp.type`: `"ftp"` or `"sftp"` |
| **Username** | FTP login | `ftp.user` |
| **Password** | FTP password | `ftp.password` |
| **Start directory** | Folder of .kdbx on server | Directory part of `ftp.remotePath` (e.g. `/` or `/backups`) |

DB filename = filename from `ftp.remotePath` (e.g. `keepass_passwords.kdbx`).

---

## Adding external database on Android/iOS

1. Install a KeePass app (e.g. KeePass2Android, Strongbox).  
2. **Add database** → **Via network** / **FTP** / **SFTP**.  
3. Enter the same credentials as in `config.json` (host, port, encryption, user, password, start directory).  
4. When you open the DB, the app loads the current file; with KeePass Sync on your PC, the server file stays up to date via sync/merge.

More info: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted).

---

## Security

- No passwords in logs.  
- Master password optionally via environment: `KEEPASS_DB_PASSWORD=… node sync.js`.  
- Restrict permissions on `config.json` (e.g. `chmod 600 config.json`).

---

## Test FTP from the project

```bash
npm run open-ftp
# or: node scripts/open_ftp.js
```

Lists the configured FTP/SFTP directory.

---

## More docs

- [Installation & automation](docs/INSTALL.en.md) · [Testing](docs/TEST.en.md)  
- [Main README](README.md)

**Version 2.0.0** · MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
