# KeePass Sync

**Synchronisiere und merge deine KeePass/KeePassXC-Datenbank über FTP, SFTP, SMB oder SCP.**  
Die Datenbank auf dem Server bleibt aktuell; Änderungen am PC oder Handy werden beim nächsten Abruf gemerged.

**Sprachen:** [Deutsch](README.de.md) · [English](README.en.md) · [Español](README.es.md)

---

## Unterstützte Plattformen

- **Linux**
- **Windows** (inkl. WSL2)
- **macOS** (x86_64)

Voraussetzung: **Node.js 18+** und **KeePassXC** (mit `keepassxc-cli`).

---

## Schnellstart

```bash
# 1. Abhängigkeiten
npm install

# 2. Konfiguration (config.json anlegen)
cp config.example.json config.json
# config.json bearbeiten: FTP/SFTP-Zugang, lokale Pfade, KeePass-Master-Passwort

# 3. Sync ausführen
npm run sync
# oder: node sync.js

# Verbindung testen (ohne Sync)
node sync.js --test

# Status anzeigen
node sync.js --status
```

Unter Linux/macOS kannst du die Wrapper nutzen: `./linux/sync_ftp.sh` bzw. `./mac/sync_ftp.sh`.  
Unter Windows: `windows\sync_ftp.bat` oder PowerShell `.\windows\sync_ftp.ps1`.

---

## So funktioniert Sync & Merge

1. **Backup** der lokalen Datenbank wird erstellt.
2. **Download** der Datenbank vom Server (FTP/SFTP/SMB/SCP).
3. **Merge** mit KeePassXC-CLI: lokale und heruntergeladene DB werden zusammengeführt (`keepassxc-cli merge -s … --same-credentials`).
4. **Upload** der gemergten (lokalen) Datenbank zurück auf den Server.

So ist die Datei auf dem FTP immer aktuell. Wenn du auf einem anderen Gerät (z. B. Handy) die gleiche DB öffnest und änderst, lädt die App die aktuelle Version; beim nächsten Sync auf dem PC wird wieder gemerged.

---

## Protokolle

| Typ    | Port (typisch) | Hinweis |
|--------|----------------|---------|
| **FTP**  | 21             | Über Node (basic-ftp), kein lftp nötig |
| **SFTP** | 22             | Über Node (ssh2-sftp-client) |
| **SCP**  | 22             | Wie SFTP (SSH-basiert) |
| **SMB**  | —              | Linux/macOS: `smbclient` erforderlich; Windows: FTP/SFTP empfohlen |

---

## FTP-Zugangsdaten (z. B. für Android/iOS-Apps)

In vielen KeePass-Apps (z. B. KeePass2Android, Strongbox) kannst du eine **externe Datenbank** per FTP/SFTP hinzufügen. Die gleichen Werte wie in der `config.json` von KeePass Sync verwenden, damit alle Geräte dieselbe Datei nutzen.

Im Dialog **„FTP-Zugangsdaten eingeben:“** (oder vergleichbar) trägst du ein:

| Feld | Bedeutung | Beispiel / config.json |
|------|-----------|-------------------------|
| **Host** | Server-Adresse (IP oder Hostname) | `192.168.0.1` oder `ftp.example.com` → `ftp.host` |
| **Port** | 21 (FTP), 22 (SFTP), 990 (FTPS implizit) | → `ftp.port` |
| **Verschlüsselung** | Keine (FTP), FTPES, FTPS oder SFTP | SFTP/FTPES empfohlen → `ftp.type`: `"sftp"` oder `"ftp"` |
| **Benutzername** | FTP-/SFTP-Login | → `ftp.user` |
| **Passwort** | FTP-/SFTP-Passwort | → `ftp.password` |
| **Startverzeichnis (optional)** | Pfad zum Ordner, in dem die .kdbx liegt | z. B. `/` oder `/backups`; entspricht dem Verzeichnisteil von `ftp.remotePath` |

Die **Datei** der Datenbank ist der Dateiname aus `ftp.remotePath` (z. B. `keepass_passwords.kdbx`).  
Ausführliche Anleitung für KeePassXC: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted).

---

## Externe Datenbank auf Android/iOS hinzufügen

1. KeePass-App installieren (z. B. KeePass2Android, Strongbox).
2. **Datenbank hinzufügen** → **Über Netzwerk** / **FTP** / **SFTP**.
3. Dieselben Zugangsdaten wie in der `config.json` eintragen (Host, Port, Verschlüsselung, Benutzer, Passwort, Startverzeichnis).
4. Beim Öffnen lädt die App die aktuelle Datei vom Server; nach Änderungen ggf. „Speichern“/Upload nutzen (app-abhängig).  
   Mit KeePass Sync auf dem PC bleibt die Server-Datei durch regelmäßigen Sync/merge aktuell.

---

## Sicherheit

- **Passwörter** erscheinen nicht in Logs.
- **Master-Passwort:** Optional über Umgebungsvariable setzen: `KEEPASS_DB_PASSWORD=dein_passwort node sync.js` (überschreibt `config.json`).
- **config.json** enthält Zugangsdaten im Klartext. Rechte einschränken: unter Linux/macOS z. B. `chmod 600 config.json`.
- **config.json** steht in `.gitignore` und wird nicht mit dem Projekt mitcommittet.

---

## FTP aus dem Projekt verbinden

Mit den Zugangsdaten aus `config.json` kannst du die Verbindung aus dem Workspace testen:

```bash
npm run open-ftp
# oder: node scripts/open_ftp.js
```

Damit wird das konfigurierte FTP/SFTP-Verzeichnis aufgelistet (kein interaktives Öffnen im Dateimanager).

---

## KeePassXC-Referenz

Die KeePassXC-Quellen liegen als Submodul unter `keepassxc/` (optional). Nach dem Klonen initialisieren mit:

```bash
git submodule update --init
```

---

## Weitere Dokumentation

- [Installation & Automatisierung](docs/INSTALL.de.md) (DE) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)
- [Test-Anleitung](docs/TEST.de.md) (DE) · [EN](docs/TEST.en.md) · [ES](docs/TEST.es.md)

---

**Version:** 2.0.0 · **Lizenz:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
