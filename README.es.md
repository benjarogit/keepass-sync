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

---

## Instalación

### 1. Instalar

```bash
npm install -g keepass-sync
# o desde source: git clone https://github.com/benjarogit/keepass-sync.git && cd keepass-sync && npm install
```

### 2. Configurar

```bash
cp config.example.json config.json
# Editar config.json – ver tabla abajo
```

| Campo | Significado |
|-------|-------------|
| `ftp.host` | Servidor (IP o hostname) |
| `ftp.port` | 21 (FTP), 22 (SFTP/SCP) |
| `ftp.type` | `ftp`, `sftp`, `scp` o `smb` |
| `ftp.user` | Usuario |
| `ftp.password` | Contraseña |
| `ftp.remotePath` | Ruta completa al .kdbx en el servidor |
| `keepass.databasePassword` | Contraseña maestra KeePass |

**Opcional:** `KEEPASS_DB_PASSWORD` sustituye la contraseña maestra (más seguro que en config).

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

1. Copia de seguridad de la DB local
2. Descarga de la DB del servidor (FTP/SFTP/SMB/SCP)
3. Merge con KeePassXC-CLI (DB local + descargada)
4. Subida de la DB fusionada al servidor

El archivo en el servidor se mantiene actualizado; en el móvil abre la misma DB por FTP/SFTP con las mismas credenciales.

---

## Android: Añadir base de datos externa por FTP

En KeePass2Android, Strongbox, etc. usa los mismos valores que en `config.json`:

| Campo en la app | Introducir |
|-----------------|------------|
| **Host** | `ftp.host` |
| **Puerto** | `ftp.port` (21 o 22) |
| **Cifrado** | FTP o SFTP (`ftp.type`) |
| **Usuario** | `ftp.user` |
| **Contraseña** | `ftp.password` |
| **Directorio inicial** | Parte directorio de `ftp.remotePath` |

Más: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted)

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
