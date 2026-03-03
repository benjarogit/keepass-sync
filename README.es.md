# KeePass Sync (Español)

[![CI](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/benjarogit/keepass-sync/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![npm downloads](https://img.shields.io/npm/dm/keepass-sync.svg)](https://www.npmjs.com/package/keepass-sync)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/github/license/benjarogit/keepass-sync)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/benjarogit/keepass-sync)](https://github.com/benjarogit/keepass-sync/releases)

**Sincroniza y fusiona tu base de datos KeePass/KeePassXC por FTP, SFTP, SMB o SCP.**

Idiomas: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Plataformas

- Linux, Windows (incl. WSL2), macOS (x86_64)
- **Node.js 18+** y **KeePassXC** (con `keepassxc-cli`) requeridos
- **Protocolos (orden recomendado):** 1. Google Drive (rclone), 2. SFTP (preferir sobre FTP cuando uses protocolos FTP), 3. FTP, SMB, SCP

---

## Instalación

### 1. Instalar

```bash
npm install -g keepass-sync
# o desde source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

**Configuración rápida:** Ejecuta `npm run setup` para configuración interactiva (recomendado para principiantes). Para Google Drive: `cp config.example.gdrive.json config.json`, luego ejecuta `rclone config`.

### 2. Configurar

```bash
cp config.example.json config.json
# Para Google Drive: cp config.example.gdrive.json config.json
# Editar config.json – ver tabla abajo
```

| Campo | Significado |
|-------|-------------|
| `local.localPath` | Ruta a la .kdbx local – el mismo archivo que en KeePassXC. Absoluta (ej. `/ruta/a/keepass_passwords.kdbx`) o relativa al directorio del proyecto. |
| `ftp.host` | Servidor (IP o hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp`, `smb` o `rclone`/`gdrive` (Google Drive) |
| `ftp.user` | Usuario |
| `ftp.password` | Contraseña |
| `ftp.remotePath` | Ruta completa al .kdbx en el servidor |
| `keepass.databasePassword` | Contraseña maestra KeePass |

**Opcional:** `KEEPASS_DB_PASSWORD` sustituye la contraseña maestra (más seguro que en config). `KEEPASS_LOCAL_PATH` sustituye la ruta a la KDBX local.

### 3. Ejecutar

```bash
keepass-sync --test   # Probar conexión (sin sync)
keepass-sync          # Sync & merge
keepass-sync --status # Estado
```

**Wrappers:** `./linux/sync_ftp.sh` · `./mac/sync_ftp.sh` · `windows\sync_ftp.bat` · `.\windows\sync_ftp.ps1`

<details>
<summary><strong>Instalación detallada y automatización (Systemd, Cron, Task Scheduler)</strong></summary>

Guías completas: [DE](docs/INSTALL.de.md) · [EN](docs/INSTALL.en.md) · [ES](docs/INSTALL.es.md)

</details>

---

## Cómo funciona Sync & Merge

**Solo merge – sin sobrescribir.** Ambas fuentes se combinan; entradas locales y remotas se fusionan. Nada se reemplaza a ciegas.

1. Copia de seguridad de la DB local
2. Descarga de la DB del servidor (FTP/SFTP/SMB/SCP)
3. Validación del archivo descargado (rechazo si KDBX corrupto o incompatible)
4. Merge con KeePassXC-CLI (DB local + descargada)
5. Subida de la DB fusionada al servidor

El archivo en el servidor se mantiene actualizado; en el móvil abre la misma DB por FTP/SFTP con las mismas credenciales.

**Si falla el merge:** Ni el archivo local ni el del servidor se modifican. Las copias en `backups/` permanecen intactas.

---

## Android: Añadir base de datos externa

### Google Drive (recomendado)

Con `type: "rclone"` abre la base de datos en KeePass2Android directamente desde **Google Drive** (soporte integrado). Elige el mismo archivo que en `remotePath`, ej. en la carpeta `KeePass/keepass_passwords.kdbx`. No hace falta configurar FTP.

### FTP/SFTP

En KeePass2Android, Strongbox, etc. usa los mismos valores que en `config.json`: Host, Puerto, Usuario, Contraseña, Directorio inicial. **Preferir SFTP** (cifrado; menos problemas de compatibilidad que FTP).

| Campo en la app | Introducir |
|-----------------|------------|
| **Host** | `ftp.host` |
| **Puerto** | 21 (FTP) o 22 (SFTP) |
| **Cifrado** | FTP o SFTP (`ftp.type`) |
| **Usuario** | `ftp.user` |
| **Contraseña** | `ftp.password` |
| **Directorio inicial** | Parte directorio de `ftp.remotePath` |

**Consejo:** Si hay problemas con KeePass2Android y FTP: En KeePassXC guardar como KDBX 3.1. Con Google Drive normalmente no hace falta.

[KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

---

## Seguridad

- No se escriben contraseñas en los logs
- Contraseña maestra opcional por `KEEPASS_DB_PASSWORD`
- Restringir `config.json`: `chmod 600 config.json`

---

## Probar FTP desde el proyecto

```bash
npm run open-ftp
```

---

## Documentación

| Tema | DE | EN | ES |
|------|----|----|-----|
| Instalación y automatización | [INSTALL](docs/INSTALL.de.md) | [INSTALL](docs/INSTALL.en.md) | [INSTALL](docs/INSTALL.es.md) |
| Pruebas | [TEST](docs/TEST.de.md) | [TEST](docs/TEST.en.md) | [TEST](docs/TEST.es.md) |

---

**License:** MIT · [GitHub](https://github.com/benjarogit/keepass-sync) · [npm](https://www.npmjs.com/package/keepass-sync)
