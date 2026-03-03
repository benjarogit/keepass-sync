#!/usr/bin/env node
/**
 * KeePass Sync - Node.js CLI
 * Sync & merge KeePass/KeePassXC database via FTP, SFTP, SMB, or SCP.
 * Platforms: Linux, Windows, WSL2, macOS (x86_64).
 *
 * Copyright (c) 2026 Sunny C.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const ui = require('./lib/ui.js');

// Ensure we run from project root (where config.json lives)
const projectRoot = path.resolve(__dirname);
process.chdir(projectRoot);

const CONFIG_FILE = process.env.KEEPASS_SYNC_CONFIG || 'config.json';
const LOG_FILE = 'sync_log.txt';

const args = process.argv.slice(2);
const flags = {
  test: args.includes('--test'),
  status: args.includes('--status'),
  sync: args.includes('--sync'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  quiet: args.includes('--quiet') || args.includes('-q'),
  version: args.includes('--version'),
  help: args.includes('--help'),
  config: (() => { const i = args.indexOf('--config'); return i >= 0 && args[i + 1] ? args[i + 1] : CONFIG_FILE; })(),
};

let config = null;

function checkPlatform() {
  const platform = os.platform();
  const isWsl = !!process.env.WSL_DISTRO_NAME;
  const allowed = ['linux', 'win32', 'darwin'];
  if (!allowed.includes(platform)) {
    console.error('Unsupported platform:', platform);
    console.error('Supported: Linux, Windows (incl. WSL2), macOS (x86_64).');
    process.exit(1);
  }
}

/** @param {string} message */
/** @param {'ok'|'fail'|'warn'|'info'|'plain'} [type] */
function writeLog(message, type = 'plain', logFilePath = LOG_FILE) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const raw = `${timestamp} ${message}`;
  if (!flags.quiet) {
    const styled = type === 'ok' ? ui.ok(message) : type === 'fail' ? ui.fail(message) : type === 'warn' ? ui.warn(message) : type === 'info' ? ui.info(message) : message;
    console.log(styled);
  }
  try {
    fs.appendFileSync(path.join(projectRoot, logFilePath), raw + '\n');
  } catch (_) {}
}

function loadConfig() {
  const configPath = path.isAbsolute(flags.config) ? flags.config : path.join(projectRoot, flags.config);
  if (!fs.existsSync(configPath)) {
    writeLog(`Configuration not found: ${flags.config}`, 'fail');
    process.exit(1);
  }
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(data);
    const home = os.homedir();
    const expand = (p) => (p || '').replace(/^~/, home);
    config.ftp = config.ftp || {};
    config.local = config.local || {};
    config.keepass = config.keepass || {};
    config.settings = config.settings || {};
    const localRaw = expand(config.local.localPath || 'keepass_passwords.kdbx');
    const tempRaw = expand(config.local.tempPath || 'temp_keepass_passwords.kdbx');
    const envLocalPath = process.env.KEEPASS_LOCAL_PATH;
    config.local.localPath = envLocalPath
      ? path.resolve(expand(envLocalPath))
      : (path.isAbsolute(localRaw) ? localRaw : path.resolve(projectRoot, localRaw));
    config.local.tempPath = path.resolve(projectRoot, tempRaw);
    config.local.backupDir = config.local.backupDir || 'backups';
    config.local.maxBackups = config.local.maxBackups ?? 2;
    config.settings.max_retries = config.settings.max_retries ?? 3;
    config.settings.retry_delay = config.settings.retry_delay ?? 5;
    config.settings.watch_delay = config.settings.watch_delay ?? 30;
    const protocol = (config.ftp.type || 'ftp').toLowerCase();
    config.ftp.port = config.ftp.port ?? (protocol === 'ftp' ? 21 : 22);
    config.dbPassword = process.env.KEEPASS_DB_PASSWORD || config.keepass.databasePassword || '';
    const skipPasswordCheck = flags.test || flags.status || flags.menu;
    if (!config.dbPassword && !skipPasswordCheck) {
      writeLog('Database password not set. Use config.json "keepass.databasePassword" or env KEEPASS_DB_PASSWORD.', 'fail');
      process.exit(1);
    }
    return config;
  } catch (e) {
    writeLog(`Error loading config: ${e.message}`, 'fail');
    process.exit(1);
  }
}

function findExecutable(name) {
  const isWin = os.platform() === 'win32';
  const nameExe = isWin && !name.endsWith('.exe') ? `${name}.exe` : name;
  if (config?.keepass?.keepassXCPath) {
    const hint = path.isAbsolute(config.keepass.keepassXCPath)
      ? config.keepass.keepassXCPath
      : path.join(projectRoot, config.keepass.keepassXCPath);
    if (fs.existsSync(hint)) return hint;
  }
  const pathEnv = process.env.PATH || '';
  const sep = os.platform() === 'win32' ? ';' : ':';
  for (const p of pathEnv.split(sep)) {
    const full = path.join(p.trim(), nameExe);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
    } catch (_) {}
  }
  return null;
}

function createBackup(localDB, backupDir) {
  writeLog('Creating backup...', 'info');
  try {
    if (!fs.existsSync(localDB)) {
      writeLog('Local database not found', 'warn');
      return false;
    }
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backupFile = path.join(backupDir, `keepass_passwords_${today}.kdbx`);
    fs.copyFileSync(localDB, backupFile);
    writeLog('Backup created', 'ok');
    return true;
  } catch (e) {
    writeLog(`Backup failed: ${e.message}`, 'fail');
    return false;
  }
}

function cleanupBackups(backupDir, maxBackups) {
  try {
    if (!fs.existsSync(backupDir)) return;
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith('keepass_passwords_') && f.endsWith('.kdbx'))
      .map((f) => ({ path: path.join(backupDir, f), mtime: fs.statSync(path.join(backupDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    for (let i = maxBackups; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
      writeLog(`Old backup deleted: ${path.basename(files[i].path)}`, 'info');
    }
  } catch (_) {}
}

async function downloadFTP(host, user, password, remotePath, tempFile, port, secure) {
  writeLog('Starting download (FTP)...', 'info');
  const lftpPath = findExecutable('lftp');
  if (lftpPath && os.platform() !== 'win32') {
    try {
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const exec = promisify(execFile);
      const ftpPort = port || 21;
      const protocol = secure ? 'ftps' : 'ftp';
      const remoteDir = path.dirname(remotePath).replace(/\\/g, '/') || '/';
      const remoteFile = path.basename(remotePath);
      const site = `${protocol}://${host}`;
      const cmds = `set net:timeout 60; set ftp:passive-mode on; set xfer:clobber on; cd ${remoteDir || '/'}; get ${remoteFile} -o ${tempFile}; bye`;
      await exec(lftpPath, ['-u', `${user},${password}`, '-p', String(ftpPort), '-e', cmds, site]);
      writeLog('Download successful (lftp)', 'ok');
      return true;
    } catch (e) {
      writeLog(`lftp download failed: ${e.message}, trying basic-ftp...`, 'warn');
    }
  }
  const { Client } = require('basic-ftp');
  const client = new Client(60000);
  try {
    await client.access({
      host,
      port: port || 21,
      user,
      password,
      secure: secure === true,
    });
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/') || '/';
    const remoteFile = path.basename(remotePath);
    if (remoteDir && remoteDir !== '/' && remoteDir !== '.') await client.cd(remoteDir);
    await client.downloadTo(tempFile, remoteFile);
    writeLog('Download successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Download failed: ${e.message}`, 'fail');
    return false;
  } finally {
    client.close();
  }
}

async function downloadSFTP(host, user, password, remotePath, tempFile, port) {
  writeLog('Starting download (SFTP)...', 'info');
  const SftpClient = require('ssh2-sftp-client');
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host,
      port: port || 22,
      username: user,
      password,
      readyTimeout: 10000,
    });
    await sftp.get(remotePath, tempFile);
    writeLog('Download successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Download failed: ${e.message}`, 'fail');
    return false;
  } finally {
    await sftp.end();
  }
}

async function downloadSMB(host, share, user, password, remotePath, tempFile, domain) {
  writeLog('Starting download (SMB)...', 'info');
  if (os.platform() === 'win32') {
    writeLog('SMB on Windows: use FTP or SFTP, or install smbclient (e.g. via Git for Windows).', 'fail');
    return false;
  }
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const exec = promisify(execFile);
  const smbPath = findExecutable('smbclient');
  if (!smbPath) {
    writeLog('smbclient not found. Install: sudo apt install smbclient', 'fail');
    return false;
  }
  const smbURL = `//${host}/${share}`;
  const userArg = `${domain || 'WORKGROUP'}\\${user}%${password}`;
  try {
    await exec(smbPath, [smbURL, '-U', userArg, '-c', `get "${remotePath}" "${tempFile}"`]);
    if (fs.existsSync(tempFile)) {
      writeLog('Download successful', 'ok');
      return true;
    }
  } catch (e) {
    writeLog(`Download failed: ${e.message}`);
  }
  return false;
}

async function downloadSCP(host, user, password, remotePath, tempFile, port) {
  return downloadSFTP(host, user, password, remotePath, tempFile, port || 22);
}

async function downloadRclone(remotePath, tempFile) {
  writeLog('Starting download (rclone/Google Drive)...', 'info');
  const rclonePath = findExecutable('rclone');
  if (!rclonePath) {
    writeLog('rclone not found. Install: pacman -S rclone or apt install rclone', 'fail');
    return false;
  }
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const exec = promisify(execFile);
  try {
    await exec(rclonePath, ['copyto', remotePath, tempFile]);
    writeLog('Download successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Download failed: ${e.message}`, 'fail');
    return false;
  }
}

async function downloadFile(opts) {
  const { maxRetries = 3, retryDelay = 5 } = opts;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 60);
      writeLog(`Retry ${attempt}/${maxRetries - 1} in ${delay}s...`, 'warn');
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
    let ok = false;
    const protocol = (config.ftp.type || 'ftp').toLowerCase();
    const port = config.ftp.port ?? (protocol === 'ftp' ? 21 : 22);
    if (protocol === 'ftp') {
      ok = await downloadFTP(config.ftp.host, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.tempFile, port, false);
    } else if (protocol === 'sftp' || protocol === 'scp') {
      ok = await downloadSFTP(config.ftp.host, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.tempFile, port);
    } else if (protocol === 'smb') {
      ok = await downloadSMB(config.ftp.host, config.ftp.share, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.tempFile, config.ftp.domain);
    } else if (protocol === 'rclone' || protocol === 'gdrive') {
      ok = await downloadRclone(config.ftp.remotePath, opts.tempFile);
    }
    if (ok) return true;
  }
  writeLog(`Download failed after ${maxRetries} attempts`, 'fail');
  return false;
}

async function uploadFTP(host, user, password, remotePath, localFile, port, secure) {
  writeLog('Starting upload (FTP)...', 'info');
  const lftpPath = findExecutable('lftp');
  if (lftpPath && os.platform() !== 'win32') {
    try {
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const exec = promisify(execFile);
      const ftpPort = port || 21;
      const protocol = secure ? 'ftps' : 'ftp';
      const remoteDir = path.dirname(remotePath).replace(/\\/g, '/') || '/';
      const remoteFile = path.basename(remotePath);
      const site = `${protocol}://${host}`;
      const cmds = `set net:timeout 60; set ftp:passive-mode on; set xfer:clobber on; cd ${remoteDir || '/'}; put ${localFile} -o ${remoteFile}; bye`;
      await exec(lftpPath, ['-u', `${user},${password}`, '-p', String(ftpPort), '-e', cmds, site]);
      writeLog('Upload successful (lftp)', 'ok');
      return true;
    } catch (e) {
      writeLog(`lftp upload failed: ${e.message}, trying basic-ftp...`, 'warn');
    }
  }
  const { Client } = require('basic-ftp');
  const client = new Client(60000);
  try {
    await client.access({
      host,
      port: port || 21,
      user,
      password,
      secure: secure === true,
    });
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/') || '/';
    const remoteFile = path.basename(remotePath);
    if (remoteDir && remoteDir !== '/' && remoteDir !== '.') await client.cd(remoteDir);
    await client.uploadFrom(localFile, remoteFile);
    writeLog('Upload successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`, 'fail');
    return false;
  } finally {
    client.close();
  }
}

async function uploadSFTP(host, user, password, remotePath, localFile, port) {
  writeLog('Starting upload (SFTP)...', 'info');
  const SftpClient = require('ssh2-sftp-client');
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host,
      port: port || 22,
      username: user,
      password,
      readyTimeout: 10000,
    });
    const remoteDir = path.dirname(remotePath);
    if (remoteDir && remoteDir !== '.') {
      const parts = remoteDir.replace(/\\/g, '/').split('/').filter(Boolean);
      for (const p of parts) {
        try { await sftp.mkdir(p, true); } catch (_) {}
        await sftp.cd(p);
      }
      await sftp.cd('/');
    }
    await sftp.put(localFile, remotePath);
    writeLog('Upload successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`, 'fail');
    return false;
  } finally {
    await sftp.end();
  }
}

async function uploadSMB(host, share, user, password, remotePath, localFile, domain) {
  writeLog('Starting upload (SMB)...', 'info');
  if (os.platform() === 'win32') {
    writeLog('SMB on Windows not supported in this build. Use FTP or SFTP.', 'fail');
    return false;
  }
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const exec = promisify(execFile);
  const smbPath = findExecutable('smbclient');
  if (!smbPath) return false;
  const smbURL = `//${host}/${share}`;
  const userArg = `${domain || 'WORKGROUP'}\\${user}%${password}`;
  try {
    await exec(smbPath, [smbURL, '-U', userArg, '-c', `put "${localFile}" "${remotePath}"`]);
    writeLog('Upload successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`, 'fail');
    return false;
  }
}

async function uploadRclone(remotePath, localFile) {
  writeLog('Starting upload (rclone/Google Drive)...', 'info');
  const rclonePath = findExecutable('rclone');
  if (!rclonePath) {
    writeLog('rclone not found. Install: pacman -S rclone or apt install rclone', 'fail');
    return false;
  }
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const exec = promisify(execFile);
  try {
    await exec(rclonePath, ['copyto', localFile, remotePath]);
    writeLog('Upload successful', 'ok');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`, 'fail');
    return false;
  }
}

async function uploadFile(opts) {
  const { maxRetries = 3, retryDelay = 5 } = opts;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 60);
      writeLog(`Retry ${attempt}/${maxRetries - 1} in ${delay}s...`, 'warn');
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
    let ok = false;
    const protocol = (config.ftp.type || 'ftp').toLowerCase();
    const port = config.ftp.port ?? (protocol === 'ftp' ? 21 : 22);
    if (protocol === 'ftp') {
      ok = await uploadFTP(config.ftp.host, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.localFile, port, false);
    } else if (protocol === 'sftp' || protocol === 'scp') {
      ok = await uploadSFTP(config.ftp.host, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.localFile, port);
    } else if (protocol === 'smb') {
      ok = await uploadSMB(config.ftp.host, config.ftp.share, config.ftp.user, config.ftp.password, config.ftp.remotePath, opts.localFile, config.ftp.domain);
    } else if (protocol === 'rclone' || protocol === 'gdrive') {
      ok = await uploadRclone(config.ftp.remotePath, opts.localFile);
    }
    if (ok) return true;
  }
  writeLog(`Upload failed after ${maxRetries} attempts`, 'fail');
  return false;
}

/**
 * Validates that a KDBX file can be read by KeePassXC-CLI (not corrupt, compatible format).
 * @returns {Promise<{ok: boolean, message?: string}>}
 */
function validateKdbxFile(keepassxcPath, dbPath, password) {
  return new Promise((resolve) => {
    const proc = spawn(keepassxcPath, ['ls', dbPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdin.write(password + '\n');
    proc.stdin.end();
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true });
      } else {
        const err = (stderr || stdout || '').trim();
        resolve({ ok: false, message: err || `exit ${code}` });
      }
    });
    proc.on('error', (e) => {
      resolve({ ok: false, message: e.message });
    });
  });
}

function mergeDatabases(keepassxcPath, localDB, tempDB, password) {
  return new Promise((resolve) => {
    writeLog('Merging databases...', 'info');
    const proc = spawn(keepassxcPath, ['merge', '-s', localDB, tempDB, '--same-credentials'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdin.write(password + '\n');
    proc.stdin.end();
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        writeLog('Merge successful', 'ok');
        resolve(true);
      } else {
        writeLog(`Merge failed: ${stderr.trim() || code}`, 'fail');
        resolve(false);
      }
    });
    proc.on('error', (e) => {
      writeLog(`KeePassXC-CLI error: ${e.message}`, 'fail');
      resolve(false);
    });
  });
}

async function performSync() {
  const keepassxcPath = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  if (!keepassxcPath) {
    writeLog('KeePassXC-CLI not found. Install KeePassXC and ensure keepassxc-cli is in PATH.', 'fail');
    return false;
  }
  if (!config.dbPassword) {
    writeLog('Database password required (config or KEEPASS_DB_PASSWORD).', 'fail');
    return false;
  }
  if (flags.verbose) {
    writeLog('Paths: local=' + config.local.localPath + ', temp=' + config.local.tempPath + ', remote=' + (config.ftp.remotePath || config.ftp.host), 'info');
  }
  createBackup(config.local.localPath, config.local.backupDir);
  cleanupBackups(config.local.backupDir, config.local.maxBackups);

  if (flags.verbose) writeLog('Step: Download...', 'info');
  const okDownload = await downloadFile({
    tempFile: config.local.tempPath,
    maxRetries: config.settings.max_retries,
    retryDelay: config.settings.retry_delay,
  });
  if (!okDownload) return false;

  if (flags.verbose) writeLog('Step: Validation...', 'info');
  writeLog('Validating downloaded file...', 'info');
  const validation = await validateKdbxFile(keepassxcPath, config.local.tempPath, config.dbPassword);
  if (!validation.ok) {
    writeLog('Downloaded file is corrupt or incompatible. No changes made.', 'fail');
    writeLog(`Reason: ${validation.message}`, 'fail');
    try {
      const sz = fs.statSync(config.local.tempPath).size;
      writeLog(`Downloaded file size: ${sz} bytes`, 'info');
    } catch (_) {}
    const pt = (config.ftp.type || 'ftp').toLowerCase();
    if (pt === 'ftp') writeLog('Tip: Install lftp for reliable FTP (pacman/apt: lftp). Use KDBX 3.1 for best compatibility.', 'warn');
    else writeLog('Tip: Use KDBX 3.1 for best compatibility with KeePass2Android.', 'warn');
    return false;
  }
  writeLog('Downloaded file validated', 'ok');

  const localExists = fs.existsSync(config.local.localPath);
  if (localExists) {
    const localSize = fs.statSync(config.local.localPath).size;
    const tempSize = fs.statSync(config.local.tempPath).size;
    if (localSize > 0 && tempSize < localSize * 0.5) {
      writeLog('Warning: Downloaded file is much smaller than local – possible data loss on server.', 'warn');
    }
  }

  if (!localExists) {
    if (flags.verbose) writeLog('Step: No local DB – copy as initial import.', 'info');
    writeLog('No local DB yet – using downloaded file as initial database.', 'info');
    try {
      fs.copyFileSync(config.local.tempPath, config.local.localPath);
    } catch (e) {
      writeLog(`Failed to copy: ${e.message}`, 'fail');
      return false;
    }
  } else {
    if (flags.verbose) writeLog('Step: Merge (local ← temp)...', 'info');
    const okMerge = await mergeDatabases(keepassxcPath, config.local.localPath, config.local.tempPath, config.dbPassword);
    if (!okMerge) return false;
  }

  if (flags.verbose) writeLog('Step: Upload...', 'info');
  const okUpload = await uploadFile({
    localFile: config.local.localPath,
    maxRetries: config.settings.max_retries,
    retryDelay: config.settings.retry_delay,
  });
  if (!okUpload) return false;

  try {
    if (fs.existsSync(config.local.tempPath)) fs.unlinkSync(config.local.tempPath);
  } catch (_) {}
  writeLog('Synchronization completed.', 'ok');
  return true;
}

async function testConnection() {
  console.log(ui.header('Connection Test'));
  const keepassxcPath = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  if (keepassxcPath) writeLog(`KeePassXC-CLI: ${keepassxcPath}`, 'ok');
  else writeLog('KeePassXC-CLI: not found', 'fail');
  if (fs.existsSync(config.local.localPath)) {
    const st = fs.statSync(config.local.localPath);
    writeLog(`Local DB: ${config.local.localPath} (${st.size} bytes)`, 'ok');
  } else writeLog(`Local DB not found: ${config.local.localPath}`, 'warn');
  writeLog(`Protocol: ${(config.ftp.type || 'ftp').toUpperCase()}`, 'info');
  const proto = (config.ftp.type || 'ftp').toLowerCase();
  if (proto === 'rclone' || proto === 'gdrive') {
    writeLog(`Remote: ${config.ftp.remotePath}`, 'info');
  } else {
    writeLog(`Host: ${config.ftp.host}`, 'info');
  }
  writeLog('Test done', 'ok');
  return true;
}

function showStatus() {
  console.log(ui.header('KeePass Sync Status'));
  if (fs.existsSync(config.local.localPath)) {
    const st = fs.statSync(config.local.localPath);
    writeLog(`Local DB: ${config.local.localPath} (${(st.size / 1024).toFixed(2)} KB)`, 'ok');
    writeLog(`  Modified: ${st.mtime.toISOString().slice(0, 19)}`, 'info');
  } else writeLog(`Local DB not found: ${config.local.localPath}`, 'warn');
  if (fs.existsSync(config.local.backupDir)) {
    const files = fs.readdirSync(config.local.backupDir).filter((f) => f.endsWith('.kdbx'));
    writeLog(`Backups: ${files.length}`, 'info');
  }
  const kp = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  writeLog(`KeePassXC-CLI: ${kp ? kp : 'not found'}`, kp ? 'ok' : 'warn');
  const p = (config.ftp.type || 'ftp').toLowerCase();
  const loc = (p === 'rclone' || p === 'gdrive') ? config.ftp.remotePath : config.ftp.host;
  writeLog(`Protocol: ${(config.ftp.type || 'ftp').toUpperCase()}, ${p === 'rclone' || p === 'gdrive' ? 'Remote' : 'Host'}: ${loc}`, 'info');
}

async function main() {
  checkPlatform();

  if (flags.version) {
    console.log('KeePass Sync 2.0.1 (Node.js)');
    return;
  }
  if (flags.help) {
    console.log(`
KeePass Sync - Sync & merge KeePass database via FTP/SFTP/SMB/SCP/Google Drive

Usage: node sync.js [OPTIONS]

Options:
  --sync       Perform sync (default)
  --test       Test connection
  --status     Show status
  --watch      Watch and auto-sync (optional)
  --config FILE  Config file (default: config.json)
  --verbose, -v
  --quiet, -q
  --version
  --help

Environment:
  KEEPASS_DB_PASSWORD  Master password (overrides config)
  KEEPASS_LOCAL_PATH   Path to local KDBX (overrides config)
  KEEPASS_SYNC_CONFIG  Config file path
`);
    return;
  }

  const noActionFlags = !flags.test && !flags.status && !flags.sync && !flags.help && !flags.version && !flags.watch;
  const showMenu = noActionFlags && ui.isTTY && !flags.quiet;
  flags.menu = showMenu;

  if (showMenu) {
    loadConfig();
    console.log(ui.header('KeePass Sync'));
    const choice = await ui.promptMenu('Select action', [
      'Run sync (Download → Merge → Upload)',
      'Test connection',
      'Show status',
      'Exit',
    ]);
    if (choice === null || choice === 4) {
      writeLog('Exited.', 'info');
      process.exit(0);
    }
    if (choice === 1) {
      const success = await performSync();
      process.exit(success ? 0 : 1);
    }
    if (choice === 2) {
      await testConnection();
      process.exit(0);
    }
    if (choice === 3) {
      showStatus();
      process.exit(0);
    }
    process.exit(0);
  }

  loadConfig();

  if (!flags.quiet) writeLog(`KeePass Sync - ${os.platform()}`, 'info');

  if (flags.test) {
    await testConnection();
    process.exit(0);
  }
  if (flags.status) {
    showStatus();
    process.exit(0);
  }
  if (flags.watch) {
    writeLog('--watch not implemented. Run sync manually or use cron/Task Scheduler.', 'warn');
    process.exit(1);
  }

  const success = await performSync();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  writeLog(`FATAL: ${err.message}`, 'fail');
  process.exit(1);
});
