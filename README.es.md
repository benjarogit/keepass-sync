# KeePass Sync (Español)

**Sincroniza y fusiona tu base de datos KeePass/KeePassXC por FTP, SFTP, SMB o SCP.**

Idiomas: [Deutsch](README.de.md) | [English](README.en.md) | [Español](README.es.md)

---

## Plataformas

- Linux, Windows (incl. WSL2), macOS (x86_64)  
- Se requiere **Node.js 18+** y **KeePassXC** (con `keepassxc-cli`).

---

## Inicio rápido

```bash
npm install
cp config.example.json config.json
# Editar config.json: acceso FTP, rutas locales, contraseña maestra de KeePass

npm run sync
# o: node sync.js
```

- Probar conexión: `node sync.js --test`
- Estado: `node sync.js --status`

En Linux: `./linux/sync_ftp.sh` · En Windows: `windows\sync_ftp.bat` o `windows\sync_ftp.ps1`.

---

## Cómo funciona sync y merge

1. Copia de seguridad de la DB local  
2. Descarga de la DB del servidor (FTP/SFTP/SMB/SCP)  
3. Merge con KeePassXC-CLI (DB local + descargada)  
4. Subida de la DB fusionada al servidor  

El archivo en el servidor se mantiene actualizado; en el móvil abre la misma DB por FTP/SFTP con las mismas credenciales.

---

## Datos de acceso FTP (p. ej. en apps Android/iOS)

En muchas apps KeePass (KeePass2Android, Strongbox, etc.) puedes añadir una **base de datos externa** por FTP/SFTP. Usa los mismos valores que en `config.json`:

| Campo en la app | Significado | En config.json |
|-----------------|-------------|-----------------|
| **Host** | Servidor (IP o nombre) | `ftp.host` |
| **Puerto** | 21 (FTP), 22 (SFTP), 990 (FTPS) | `ftp.port` |
| **Cifrado** | Ninguno/FTP, FTPES, FTPS, SFTP | `ftp.type`: `"ftp"` o `"sftp"` |
| **Usuario** | Login FTP | `ftp.user` |
| **Contraseña** | Contraseña FTP | `ftp.password` |
| **Directorio inicial** | Carpeta de la .kdbx en el servidor | Parte directorio de `ftp.remotePath` (ej. `/` o `/backups`) |

Nombre del archivo DB = nombre en `ftp.remotePath` (ej. `keepass_passwords.kdbx`).

---

## Añadir base de datos externa en Android/iOS

1. Instala una app KeePass (p. ej. KeePass2Android, Strongbox).  
2. **Añadir base de datos** → **Por red** / **FTP** / **SFTP**.  
3. Introduce las mismas credenciales que en `config.json` (host, puerto, cifrado, usuario, contraseña, directorio inicial).  
4. Al abrir la DB, la app carga el archivo actual; con KeePass Sync en el PC, el archivo en el servidor se mantiene actualizado con sync/merge.

Más información: [KeePassXC Getting Started](https://keepassxc.org/docs/KeePassXC_GettingStarted).

---

## Seguridad

- No se escriben contraseñas en los logs.  
- Contraseña maestra opcional por variable de entorno: `KEEPASS_DB_PASSWORD=… node sync.js`.  
- Restringir permisos de `config.json` (ej. `chmod 600 config.json`).

---

## Probar FTP desde el proyecto

```bash
npm run open-ftp
# o: node scripts/open_ftp.js
```

Lista el directorio FTP/SFTP configurado.

---

## Más documentación

- [Instalación y automatización](docs/INSTALL.es.md) · [Pruebas](docs/TEST.es.md)  
- [README principal](README.md)

**Versión 2.0.0** · MIT · [GitHub](https://github.com/benjarogit/keepass-sync)
