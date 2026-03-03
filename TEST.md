# 🧪 Test-Anleitung | Test Guide | Guía de Pruebas

<div align="center">

**🌍 Languages | Idiomas | Sprachen: [🇩🇪 Deutsch](#-deutsch) | [🇬🇧 English](#-english) | [🇪🇸 Español](#-español)**

[← Zurück zur Hauptdokumentation](README.md) • [Installationsanleitung](INSTALL.md)

</div>

---

## 🇩🇪 Deutsch

### a) Wrapper testen

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Wrapper direkt ausführen
node sync.js

# Oder als ausführbare Datei (wenn ausführbar gemacht)
./sync.py
```

**Was passiert:**
- Wrapper erkennt automatisch das Betriebssystem (Linux/Windows/macOS)
- Ruft automatisch `sync.js` auf (bevorzugt)
- Wrapper prüft Node.js und führt node sync.js aus

### b) .sh Datei direkt testen (Linux)

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Direkt ausführen
./linux/sync_ftp.sh

# Oder mit bash
bash linux/sync_ftp.sh
```

**Was passiert:**
- Script prüft ob Node.js verfügbar ist
- Ruft automatisch `sync.js` auf
- Falls Node.js nicht gefunden: Fehlermeldung

### Verbindung testen (ohne Sync)

**Wichtig:** Teste zuerst die Verbindung, bevor du eine vollständige Synchronisation durchführst:

```bash
node sync.js --test
```

Dies prüft:
- ✅ KeePassXC-CLI Verfügbarkeit
- ✅ Lokale Datenbank-Existenz
- ✅ Server-Verbindung (FTP/SFTP/SMB/SCP)
- ✅ Kein Backup nötig
- ✅ Keine Datenänderung

**Erwartete Ausgabe:**
```
=== Verbindungs-Test ===
✅ KeePassXC-CLI gefunden: /usr/bin/keepassxc-cli
✅ Lokale Datenbank: keepass_passwords.kdbx (1234567 bytes, modifiziert: 2025-01-15 14:30:22)
Teste Verbindung (FTP)...
✅ Verbindung zum Server erfolgreich: dein-server.com
=== Test abgeschlossen ===
✅ Alle Tests erfolgreich!
```

### Status anzeigen

Zeige aktuelle Status-Informationen:

```bash
node sync.js --status
```

**Zeigt:**
- Lokale DB-Informationen (Größe, Alter, letzte Änderung)
- Backup-Übersicht (Anzahl, Größe, Datum)
- Konfigurations-Details (Protokoll, Server, Benutzer)
- KeePassXC-CLI Status

### Test mit Debug-Modus

Aktiviere Debug in `config.json` oder nutze `--verbose`:

```bash
node sync.js -v
```

Oder in `config.json`:
```json
{
  "settings": {
    "debug": true
  }
}
```

### Erwartete Ausgabe

Bei erfolgreichem Test siehst du:
```
2025-11-02 17:XX:XX === KeePass Sync - Linux ===
2025-11-02 17:XX:XX Backup wird erstellt...
2025-11-02 17:XX:XX Backup erfolgreich erstellt
2025-11-02 17:XX:XX Starte Download vom Server...
2025-11-02 17:XX:XX Download erfolgreich
2025-11-02 17:XX:XX Führe Merge durch...
2025-11-02 17:XX:XX Merge erfolgreich abgeschlossen. Lokale Datei aktualisiert.
2025-11-02 17:XX:XX Starte Upload zum Server...
2025-11-02 17:XX:XX Upload erfolgreich abgeschlossen.
2025-11-02 17:XX:XX Synchronisation abgeschlossen.
```

Bei Fehlern siehst du detaillierte Fehlermeldungen im Log.

### Fehlerbehebung

**Problem: "Konfigurationsdatei nicht gefunden"**
- Stelle sicher, dass `config.json` existiert. Nutze `npm install && cp config.example.json config.json` zum Erstellen.
- Oder kopiere `config.example.json` zu `config.json` und bearbeite manuell

**Problem: "KeePassXC-CLI nicht gefunden"**
- Installiere KeePassXC: `sudo pacman -S keepassxc` (Arch/CachyOS)
- Oder: `sudo apt install keepassxc` (Debian/Ubuntu)

**Problem: "FTP-Client nicht gefunden"**
- FTP/SFTP: Node.js (basic-ftp, ssh2-sftp-client) – keine zusätzlichen Tools

**Problem: "SMB-Client nicht gefunden"** (nur bei SMB/CIFS)
- Installiere smbclient: `sudo pacman -S samba` (Arch/CachyOS)
- Oder: `sudo apt install samba-common` (Debian/Ubuntu)
- Windows: FTP oder SFTP verwenden (SMB nicht unterstützt)

**Problem: "SCP-Tool nicht gefunden"** (nur bei SCP)
- Installiere sshpass: `sudo pacman -S sshpass` (Arch/CachyOS)
- Oder: `sudo apt install sshpass` (Debian/Ubuntu)
- SCP: Wie SFTP über Node.js

**Problem: "Datei-Überwachung funktioniert nicht"** (nur bei --watch)
- Fallback: Polling-Modus wird automatisch verwendet

### Weitere CLI-Optionen

**Alle verfügbaren Optionen:**
```bash
node sync.js --help
```

**Beispiele:**
```bash
# Normale Synchronisation
node sync.js
node sync.js --sync

# Verbose (Debug-Ausgabe)
node sync.js -v

# Quiet (nur Fehler)
node sync.js -q

# Alternative Config-Datei
node sync.js --config alt_config.json

# Version anzeigen
node sync.js --version
```

### Datei-Überwachung testen

Teste automatische Synchronisation bei Datei-Änderung:

```bash
node sync.js --watch
```

**Was passiert:**
- Script läuft dauerhaft im Hintergrund
- Überwacht die lokale Datenbank-Datei
- Startet automatisch Sync bei Änderung (nach konfigurierbarer Verzögerung)
- Beenden mit `Ctrl+C`

**Hinweis:** Installiere zuerst die benötigte Library:

---

## 🇬🇧 English

### a) Test Wrapper

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Run wrapper directly
node sync.js

# Or as executable (if made executable)
./sync.py
```

**What happens:**
- Wrapper automatically detects the operating system (Linux/Windows/macOS)
- Calls `sync.js` automatically (preferred)
- Wrapper checks Node.js and runs node sync.js

### b) Test .sh File Directly (Linux)

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Execute directly
./linux/sync_ftp.sh

# Or with bash
bash linux/sync_ftp.sh
```

**What happens:**
- Script checks if Node.js is available
- Automatically calls `sync.js`
- If Node.js not found: Error message

### Test with Debug Mode

Enable debug in `config.json`:

```json
{
  "settings": {
    "debug": true
  }
}
```

Then run:
```bash
node sync.js
```

### Expected Output

On successful test you'll see:
```
2025-11-02 17:XX:XX === KeePass Sync - Linux ===
2025-11-02 17:XX:XX Creating backup...
2025-11-02 17:XX:XX Backup successfully created
2025-11-02 17:XX:XX Starting download from server...
2025-11-02 17:XX:XX Download successful
2025-11-02 17:XX:XX Performing merge...
2025-11-02 17:XX:XX Merge completed successfully. Local file updated.
2025-11-02 17:XX:XX Starting upload to server...
2025-11-02 17:XX:XX Upload completed successfully.
2025-11-02 17:XX:XX Synchronization completed.
```

On errors you'll see detailed error messages in the log.

### Troubleshooting

**Issue: "Configuration file not found"**
- Make sure `config.json` exists in the main directory
- Copy `config.example.json` to `config.json` if needed

**Issue: "KeePassXC-CLI not found"**
- Install KeePassXC: `sudo pacman -S keepassxc` (Arch/CachyOS)
- Or: `sudo apt install keepassxc` (Debian/Ubuntu)

**Issue: "FTP client not found"**
- FTP/SFTP: Node.js – no extra tools

---

## 🇪🇸 Español

### a) Probar Wrapper

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Ejecutar wrapper directamente
node sync.js

# O como ejecutable (si se hizo ejecutable)
./sync.py
```

**Qué sucede:**
- El wrapper detecta automáticamente el sistema operativo (Linux/Windows/macOS)
- Llama automáticamente a `sync.js` (preferido)
- Wrapper verifica Node.js y ejecuta node sync.js

### b) Probar Archivo .sh Directamente (Linux)

```bash
cd "/mnt/ssd2/Backup (SSD2)/Tools/Keepass Sync"

# Ejecutar directamente
./linux/sync_ftp.sh

# O con bash
bash linux/sync_ftp.sh
```

**Qué sucede:**
- El script verifica si Node.js está disponible
- Llama automáticamente a `sync.js`
- Si Node.js no se encuentra: Mensaje de error

### Probar con Modo Debug

Habilita debug en `config.json`:

```json
{
  "settings": {
    "debug": true
  }
}
```

Luego ejecuta:
```bash
node sync.js
```

### Salida Esperada

En una prueba exitosa verás:
```
2025-11-02 17:XX:XX === KeePass Sync - Linux ===
2025-11-02 17:XX:XX Creando respaldo...
2025-11-02 17:XX:XX Respaldo creado exitosamente
2025-11-02 17:XX:XX Iniciando descarga desde el servidor...
2025-11-02 17:XX:XX Descarga exitosa
2025-11-02 17:XX:XX Realizando fusión...
2025-11-02 17:XX:XX Fusión completada exitosamente. Archivo local actualizado.
2025-11-02 17:XX:XX Iniciando carga al servidor...
2025-11-02 17:XX:XX Carga completada exitosamente.
2025-11-02 17:XX:XX Sincronización completada.
```

En errores verás mensajes de error detallados en el registro.

### Solución de Problemas

**Problema: "Archivo de configuración no encontrado"**
- Asegúrate de que `config.json` existe. Usa `npm install && cp config.example.json config.json` para crearlo.
- O copia `config.example.json` a `config.json` y edita manualmente

**Problema: "KeePassXC-CLI no encontrado"**
- Instala KeePassXC: `sudo pacman -S keepassxc` (Arch/CachyOS)
- O: `sudo apt install keepassxc` (Debian/Ubuntu)

**Problema: "Cliente FTP no encontrado"**
- FTP/SFTP: Node.js – sin herramientas adicionales

**Problema: "Cliente SMB no encontrado"** (solo para SMB/CIFS)
- Instala smbclient: `sudo pacman -S samba` (Arch/CachyOS)
- O: `sudo apt install samba-common` (Debian/Ubuntu)
- Windows: Usar FTP o SFTP (SMB no soportado)

**Problema: "Herramienta SCP no encontrada"** (solo para SCP)
- Instala sshpass: `sudo pacman -S sshpass` (Arch/CachyOS)
- O: `sudo apt install sshpass` (Debian/Ubuntu)
- SCP: Como SFTP vía Node.js

---

<div align="center">

**← [Zurück zur Hauptdokumentation](README.md) • [Installationsanleitung](INSTALL.md) →**

</div>
