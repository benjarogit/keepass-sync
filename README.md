# KeePass Sync

<div align="center">

**Cross‑platform KeePass / KeePassXC database synchronization over FTP, SFTP, SMB and SCP – with automatic merge using `keepassxc-cli`.**  
**Plattformen:** Linux · Windows (inkl. WSL2) · macOS (x86_64)

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/benjarogit/keepass-sync?style=social)](https://github.com/benjarogit/keepass-sync/stargazers)
[![GitHub downloads](https://img.shields.io/github/downloads/benjarogit/keepass-sync/total)](https://github.com/benjarogit/keepass-sync/releases)

**Sprachen · Languages:** [Deutsch](README.de.md) · [English](README.en.md) · [Español](README.es.md)

</div>

---

## Inhalt

- [Überblick](#überblick)
- [Funktionen](#funktionen)
- [Systemanforderungen](#systemanforderungen)
- [Schnellstart](#schnellstart)
- [Wie der Sync & Merge funktioniert](#wie-der-sync--merge-funktioniert)
- [Unterstützte Protokolle](#unterstützte-protokolle)
- [FTP-Zugangsdaten (Android/iOS)](#ftp-zugangsdaten-androidios)
- [Externe Datenbank auf Android/iOS](#externe-datenbank-auf-androidios)
- [Sicherheit](#sicherheit)
- [FTP aus dem Projekt testen](#ftp-aus-dem-projekt-testen)
- [KeePassXC-Referenz](#keepassxc-referenz)
- [Weitere Dokumentation](#weitere-dokumentation)

---

## Überblick

KeePass Sync ist ein **CLI-Tool**, das deine **KeePass / KeePassXC `.kdbx`‑Datenbank** automatisch zwischen Geräten synchron hält:

- zentrale Datenbank auf **FTP/SFTP/SMB/SCP** (z. B. eigener Server oder NAS),
- automatisches **Merge** der Änderungen mit `keepassxc-cli`,
- funktioniert mit Desktop (KeePassXC) und mobilen Apps (z. B. KeePass2Android, Strongbox).

Suchwörter / Keywords für dich und Google: `KeePass Sync`, `KeePassXC`, `kdbx`, `FTP`, `SFTP`, `password manager`, `merge`, `Android`, `iOS`, `KeePass2Android`, `Strongbox`.

---

## Funktionen

- **Sync & Merge**: Lokale und entfernte DB werden mit `keepassxc-cli merge -s ... --same-credentials` zusammengeführt.
- **Mehrere Protokolle**: FTP, SFTP, SMB, SCP (Konfiguration über `config.json`).
- **Retry & Logging**: konfigurierbare Wiederholungen und Logs.
- **Cross‑Plattform**: Linux, Windows (inkl. WSL2), macOS (x86_64) – ein gemeinsames Node.js‑Script.
- **Mobile‑freundlich**: ideal in Kombination mit KeePass‑Apps, die FTP/SFTP unterstützen.

---

## Systemanforderungen

- **Node.js**: Version **18 oder neuer** (`"engines": { "node": ">=18.0.0" }`).
- **KeePassXC** mit `keepassxc-cli` im `PATH`.
- Für SMB: `smbclient` (Linux/macOS).  
- Für SCP/SFTP: Standard‑SSH‑Tools, Node‑Libraries werden mit `npm install` installiert.

---

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Konfiguration (config.json anlegen)
cp config.example.json config.json
# config.json bearbeiten: FTP/SFTP-Zugang, lokale Pfade, KeePass-Master-Passwort

# 3. Sync ausführen
npm run sync
# oder
node sync.js

# Verbindung testen (ohne Sync)
node sync.js --test

# Status anzeigen
node sync.js --status
```

Unter Linux/macOS kannst du zusätzlich die Wrapper nutzen: `./linux/sync_ftp.sh` bzw. `./mac/sync_ftp.sh`.  
Unter Windows: `windows\sync_ftp.bat` oder PowerShell `./windows/sync_ftp.ps1`.

---

## Wie der Sync & Merge funktioniert

1. **Backup** der lokalen Datenbank wird erstellt.
2. **Download** der Datenbank vom Server (FTP/SFTP/SMB/SCP) in eine temporäre Datei.
3. **Merge** mit KeePassXC‑CLI: lokale und heruntergeladene DB werden zusammengeführt (`keepassxc-cli merge -s … --same-credentials`).
4. **Upload** der gemergten lokalen Datenbank zurück auf den Server.

So ist die Datei auf dem Server immer aktuell. Wenn du auf einem anderen Gerät (z. B. Handy) die gleiche DB öffnest und änderst, lädt die App die aktuelle Version; beim nächsten Sync am PC wird wieder gemerged.

---

## Unterstützte Protokolle

| Typ    | Port (typisch) | Hinweis |
|--------|----------------|---------|
| **FTP**  | 21             | Über Node (`basic-ftp`), kein `lftp` nötig |
| **SFTP** | 22             | Über Node (`ssh2-sftp-client`) |
| **SCP**  | 22             | Wie SFTP (SSH‑basiert) |
| **SMB**  | —              | Linux/macOS: `smbclient` erforderlich; Windows: FTP/SFTP empfohlen |

---

## FTP-Zugangsdaten (Android/iOS)

In vielen KeePass‑Apps (z. B. KeePass2Android, Strongbox) kannst du eine **externe Datenbank** per FTP/SFTP hinzufügen. Verwende die gleichen Werte wie in der `config.json` von KeePass Sync, damit alle Geräte dieselbe Datei nutzen.

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

## Externe Datenbank auf Android/iOS

1. KeePass‑App installieren (z. B. KeePass2Android, Strongbox).
2. **Datenbank hinzufügen** → **Über Netzwerk** / **FTP** / **SFTP**.
3. Dieselben Zugangsdaten wie in der `config.json` eintragen (Host, Port, Verschlüsselung, Benutzer, Passwort, Startverzeichnis).
4. Beim Öffnen lädt die App die aktuelle Datei vom Server; nach Änderungen ggf. „Speichern“/Upload nutzen (app‑abhängig).  
   Mit KeePass Sync auf dem PC bleibt die Server‑Datei durch regelmäßigen Sync/Merge aktuell.

---

## Sicherheit

- **Passwörter** werden **nicht** in Logs geschrieben.
- **Master‑Passwort:** Optional über Umgebungsvariable setzen: `KEEPASS_DB_PASSWORD=dein_passwort node sync.js` (überschreibt `config.json`).
- **config.json** enthält Zugangsdaten im Klartext → Rechte einschränken, z. B. `chmod 600 config.json` unter Linux/macOS.
- **config.json** steht in `.gitignore` und wird nicht ins Repo eingecheckt.

---

## FTP aus dem Projekt testen

Mit den Zugangsdaten aus `config.json` kannst du die Verbindung aus dem Workspace testen:

```bash
npm run open-ftp
# oder
node scripts/open_ftp.js
```

Damit wird das konfigurierte FTP/SFTP-Verzeichnis aufgelistet (kein interaktives Öffnen im Dateimanager).

---

## KeePassXC-Referenz

Die KeePassXC‑Quellen liegen als Submodul unter `keepassxc/` (optional). Nach dem Klonen initialisieren mit:

```bash
git submodule update --init
```

---

## Weitere Dokumentation

- [Installation & Automatisierung](docs/INSTALL.de.md) (DE) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)
- [Test-Anleitung](docs/TEST.de.md) (DE) · [EN](docs/TEST.en.md) · [ES](docs/TEST.es.md)

---

**Version:** 2.0.0 · **Lizenz:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
