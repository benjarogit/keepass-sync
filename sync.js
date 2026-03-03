#!/usr/bin/env node
/**
 * KeePass Sync - Node.js
 * Sync & merge KeePass/KeePassXC database via FTP, SFTP, SMB, or SCP.
 * Platforms: Linux, Windows, WSL2, macOS (x86_64).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Ensure we run from project root (where config.json lives)
const projectRoot = path.resolve(__dirname);
process.chdir(projectRoot);

const CONFIG_FILE = process.env.KEEPASS_SYNC_CONFIG || 'config.json';
const LOG_FILE = 'sync_log.txt';

const args = process.argv.slice(2);
const flags = {
  test: args.includes('--test'),
  status: args.includes('--status'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  quiet: args.includes('--quiet') || args.includes('-q'),
  version: args.includes('--version'),
  help: args.includes('--help'),
  config: args[args.indexOf('--config') + 1] || CONFIG_FILE,
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

function writeLog(message, logFilePath = LOG_FILE) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `${timestamp} ${message}`;
  if (!flags.quiet) console.log(logMessage);
  try {
    fs.appendFileSync(path.join(projectRoot, logFilePath), logMessage + '\n');
  } catch (_) {}
}

function loadConfig() {
  const configPath = path.isAbsolute(flags.config) ? flags.config : path.join(projectRoot, flags.config);
  if (!fs.existsSync(configPath)) {
    writeLog(`Configuration not found: ${flags.config}`);
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
    config.local.localPath = expand(config.local.localPath || 'keepass_passwords.kdbx');
    config.local.tempPath = expand(config.local.tempPath || 'temp_keepass_passwords.kdbx');
    config.local.backupDir = config.local.backupDir || 'backups';
    config.local.maxBackups = config.local.maxBackups ?? 2;
    config.settings.max_retries = config.settings.max_retries ?? 3;
    config.settings.retry_delay = config.settings.retry_delay ?? 5;
    config.settings.watch_delay = config.settings.watch_delay ?? 30;
    const protocol = (config.ftp.type || 'ftp').toLowerCase();
    config.ftp.port = config.ftp.port ?? (protocol === 'ftp' ? 21 : 22);
    config.dbPassword = process.env.KEEPASS_DB_PASSWORD || config.keepass.databasePassword || '';
    if (!config.dbPassword && !flags.test && !flags.status) {
      writeLog('ERROR: Database password not set. Use config.json "keepass.databasePassword" or env KEEPASS_DB_PASSWORD.');
      process.exit(1);
    }
    return config;
  } catch (e) {
    writeLog(`Error loading config: ${e.message}`);
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
  writeLog('Creating backup...');
  try {
    if (!fs.existsSync(localDB)) {
      writeLog('WARNING: Local database not found');
      return false;
    }
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backupFile = path.join(backupDir, `keepass_passwords_${today}.kdbx`);
    fs.copyFileSync(localDB, backupFile);
    writeLog('Backup created');
    return true;
  } catch (e) {
    writeLog(`Backup failed: ${e.message}`);
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
      writeLog(`Old backup deleted: ${path.basename(files[i].path)}`);
    }
  } catch (_) {}
}

async function downloadFTP(host, user, password, remotePath, tempFile, port, secure) {
  writeLog('Starting download (FTP)...');
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
    writeLog('Download successful');
    return true;
  } catch (e) {
    writeLog(`Download failed: ${e.message}`);
    return false;
  } finally {
    client.close();
  }
}

async function downloadSFTP(host, user, password, remotePath, tempFile, port) {
  writeLog('Starting download (SFTP)...');
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
    writeLog('Download successful');
    return true;
  } catch (e) {
    writeLog(`Download failed: ${e.message}`);
    return false;
  } finally {
    await sftp.end();
  }
}

async function downloadSMB(host, share, user, password, remotePath, tempFile, domain) {
  writeLog('Starting download (SMB)...');
  if (os.platform() === 'win32') {
    writeLog('SMB on Windows: use FTP or SFTP, or install smbclient (e.g. via Git for Windows).');
    return false;
  }
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const exec = promisify(execFile);
  const smbPath = findExecutable('smbclient');
  if (!smbPath) {
    writeLog('ERROR: smbclient not found. Install: sudo apt install smbclient');
    return false;
  }
  const smbURL = `//${host}/${share}`;
  const userArg = `${domain || 'WORKGROUP'}\\${user}%${password}`;
  try {
    await exec(smbPath, [smbURL, '-U', userArg, '-c', `get "${remotePath}" "${tempFile}"`]);
    if (fs.existsSync(tempFile)) {
      writeLog('Download successful');
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

async function downloadFile(opts) {
  const { maxRetries = 3, retryDelay = 5 } = opts;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 60);
      writeLog(`Retry ${attempt}/${maxRetries - 1} in ${delay}s...`);
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
    }
    if (ok) return true;
  }
  writeLog(`Download failed after ${maxRetries} attempts`);
  return false;
}

async function uploadFTP(host, user, password, remotePath, localFile, port, secure) {
  writeLog('Starting upload (FTP)...');
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
    writeLog('Upload successful');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`);
    return false;
  } finally {
    client.close();
  }
}

async function uploadSFTP(host, user, password, remotePath, localFile, port) {
  writeLog('Starting upload (SFTP)...');
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
    writeLog('Upload successful');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`);
    return false;
  } finally {
    await sftp.end();
  }
}

async function uploadSMB(host, share, user, password, remotePath, localFile, domain) {
  writeLog('Starting upload (SMB)...');
  if (os.platform() === 'win32') {
    writeLog('SMB on Windows not supported in this build. Use FTP or SFTP.');
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
    writeLog('Upload successful');
    return true;
  } catch (e) {
    writeLog(`Upload failed: ${e.message}`);
    return false;
  }
}

async function uploadFile(opts) {
  const { maxRetries = 3, retryDelay = 5 } = opts;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 60);
      writeLog(`Retry ${attempt}/${maxRetries - 1} in ${delay}s...`);
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
    }
    if (ok) return true;
  }
  writeLog(`Upload failed after ${maxRetries} attempts`);
  return false;
}

function mergeDatabases(keepassxcPath, localDB, tempDB, password) {
  return new Promise((resolve) => {
    writeLog('Merging databases...');
    const proc = spawn(keepassxcPath, ['merge', '-s', localDB, tempDB, '--same-credentials'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdin.write(password);
    proc.stdin.end();
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        writeLog('Merge successful');
        resolve(true);
      } else {
        writeLog(`Merge failed: ${stderr.trim() || code}`);
        resolve(false);
      }
    });
    proc.on('error', (e) => {
      writeLog(`KeePassXC-CLI error: ${e.message}`);
      resolve(false);
    });
  });
}

async function performSync() {
  const keepassxcPath = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  if (!keepassxcPath) {
    writeLog('ERROR: KeePassXC-CLI not found. Install KeePassXC and ensure keepassxc-cli is in PATH.');
    return false;
  }
  if (!config.dbPassword) {
    writeLog('ERROR: Database password required (config or KEEPASS_DB_PASSWORD).');
    return false;
  }
  createBackup(config.local.localPath, config.local.backupDir);
  cleanupBackups(config.local.backupDir, config.local.maxBackups);

  const okDownload = await downloadFile({
    tempFile: config.local.tempPath,
    maxRetries: config.settings.max_retries,
    retryDelay: config.settings.retry_delay,
  });
  if (!okDownload) return false;

  const okMerge = await mergeDatabases(keepassxcPath, config.local.localPath, config.local.tempPath, config.dbPassword);
  if (!okMerge) return false;

  const okUpload = await uploadFile({
    localFile: config.local.localPath,
    maxRetries: config.settings.max_retries,
    retryDelay: config.settings.retry_delay,
  });
  if (!okUpload) return false;

  try {
    if (fs.existsSync(config.local.tempPath)) fs.unlinkSync(config.local.tempPath);
  } catch (_) {}
  writeLog('Synchronization completed.');
  return true;
}

async function testConnection() {
  writeLog('=== Connection test ===');
  const keepassxcPath = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  if (keepassxcPath) writeLog(`KeePassXC-CLI: ${keepassxcPath}`);
  else writeLog('KeePassXC-CLI: not found');
  if (fs.existsSync(config.local.localPath)) {
    const st = fs.statSync(config.local.localPath);
    writeLog(`Local DB: ${config.local.localPath} (${st.size} bytes)`);
  } else writeLog(`Local DB not found: ${config.local.localPath}`);
  writeLog(`Protocol: ${(config.ftp.type || 'ftp').toUpperCase()}`);
  writeLog(`Host: ${config.ftp.host}`);
  writeLog('=== Test done ===');
  return true;
}

function showStatus() {
  writeLog('=== KeePass Sync status ===');
  if (fs.existsSync(config.local.localPath)) {
    const st = fs.statSync(config.local.localPath);
    writeLog(`Local DB: ${config.local.localPath} (${(st.size / 1024).toFixed(2)} KB, modified: ${st.mtime.toISOString().slice(0, 19)})`);
  } else writeLog(`Local DB not found: ${config.local.localPath}`);
  if (fs.existsSync(config.local.backupDir)) {
    const files = fs.readdirSync(config.local.backupDir).filter((f) => f.endsWith('.kdbx'));
    writeLog(`Backups: ${files.length}`);
  }
  const kp = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  writeLog(`KeePassXC-CLI: ${kp ? kp : 'not found'}`);
  writeLog(`Protocol: ${(config.ftp.type || 'ftp').toUpperCase()}, Host: ${config.ftp.host}`);
}

async function main() {
  checkPlatform();

  if (flags.version) {
    console.log('KeePass Sync 2.0.0 (Node.js)');
    return;
  }
  if (flags.help) {
    console.log(`
KeePass Sync - Sync & merge KeePass database via FTP/SFTP/SMB/SCP

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
  KEEPASS_SYNC_CONFIG  Config file path
`);
    return;
  }

  loadConfig();

  if (!flags.quiet) writeLog(`=== KeePass Sync - ${os.platform()} ===`);

  if (flags.test) {
    await testConnection();
    process.exit(0);
  }
  if (flags.status) {
    showStatus();
    process.exit(0);
  }
  if (flags.watch) {
    writeLog('--watch not implemented. Run sync manually or use cron/Task Scheduler.');
    process.exit(1);
  }

  const success = await performSync();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  writeLog(`FATAL: ${err.message}`);
  process.exit(1);
});
