# KeePass Sync (Deutsch)

**Synchronisiere und merge deine KeePass/KeePassXC-Datenbank über FTP, SFTP, SMB oder SCP.**

Sprachen: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Plattformen

- Linux, Windows (inkl. WSL2), macOS (x86_64)  
- **Node.js 18+** und **KeePassXC** (mit `keepassxc-cli`) erforderlich.

---

## Schnellstart

```bash
npm install
cp config.example.json config.json
# config.json anpassen: FTP-Zugang, lokale Pfade, KeePass-Master-Passwort

npm run sync
# oder: node sync.js
```

- Verbindung testen: `node sync.js --test`
- Status: `node sync.js --status`

Unter Linux: `./linux/sync_ftp.sh` · Unter Windows: `windows\sync_ftp.bat` oder `windows\sync_ftp.ps1`.

---

## Ablauf: Sync & Merge

1. Backup der lokalen DB  
2. Download der DB vom Server (FTP/SFTP/SMB/SCP)  
3. Merge mit KeePassXC-CLI (lokale + heruntergeladene DB)  
4. Upload der gemergten DB zurück auf den Server  

So bleibt die Datei auf dem Server aktuell; auf dem Handy die gleiche DB per FTP/SFTP öffnen und mit denselben Zugangsdaten arbeiten.

---

## FTP-Zugangsdaten (z. B. in Android/iOS-Apps)

In vielen KeePass-Apps (KeePass2Android, Strongbox usw.) kannst du eine **externe Datenbank** per FTP/SFTP hinzufügen. Dieselben Werte wie in der `config.json` verwenden:

| Feld in der App | Bedeutung | Entspricht in config.json |
|-----------------|------------|----------------------------|
| **Host** | Server (IP oder Hostname) | `ftp.host` |
| **Port** | 21 (FTP), 22 (SFTP), 990 (FTPS) | `ftp.port` |
| **Verschlüsselung** | Keine/FTP, FTPES, FTPS, SFTP | `ftp.type`: `"ftp"` oder `"sftp"` |
| **Benutzername** | FTP-Login | `ftp.user` |
| **Passwort** | FTP-Passwort | `ftp.password` |
| **Startverzeichnis** | Ordner der .kdbx auf dem Server | Verzeichnisteil von `ftp.remotePath` (z. B. `/` oder `/backups`) |

Dateiname der DB = Dateiname aus `ftp.remotePath` (z. B. `keepass_passwords.kdbx`).

---

## Externe Datenbank auf Android/iOS

1. KeePass-App installieren (z. B. KeePass2Android, Strongbox).  
2. **Datenbank hinzufügen** → **Über Netzwerk** / **FTP** / **SFTP**.  
3. Dieselben Zugangsdaten wie in `config.json` eintragen (Host, Port, Verschlüsselung, Benutzer, Passwort, Startverzeichnis).  
4. Beim Öffnen lädt die App die aktuelle Datei; mit KeePass Sync auf dem PC bleibt die Server-Datei durch Sync/merge aktuell.

Weitere Infos: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted).

---

## Sicherheit

- Keine Passwörter in Logs.  
- Master-Passwort optional per Umgebung: `KEEPASS_DB_PASSWORD=… node sync.js`.  
- `config.json` mit restriktiven Rechten (z. B. `chmod 600 config.json`).

---

## FTP aus dem Projekt testen

```bash
npm run open-ftp
# oder: node scripts/open_ftp.js
```

Listet das konfigurierte FTP/SFTP-Verzeichnis auf.

---

## Weitere Doku

- [Installation & Automatisierung](docs/INSTALL.de.md) · [Test](docs/TEST.de.md)  
- [Haupt-README](README.md)

**Version 2.0.0** · MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
