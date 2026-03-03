#!/usr/bin/env node
/**
 * KeePass Sync - Interactive setup script
 * Guides user through protocol selection, dependency check, and config creation.
 * Supports FTP, SFTP, SMB, SCP, Google Drive (rclone).
 * Copyright (c) 2026 Sunny C.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');
const ui = require('../lib/ui.js');

const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'config.json');

function findExecutable(name) {
  const isWin = os.platform() === 'win32';
  const nameExe = isWin && !name.endsWith('.exe') ? `${name}.exe` : name;
  const pathEnv = process.env.PATH || '';
  const sep = isWin ? ';' : ':';
  for (const p of pathEnv.split(sep)) {
    const full = path.join(p.trim(), nameExe);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
    } catch (_) {}
  }
  return null;
}

function checkKeepassxcCli() {
  const kp = findExecutable('keepassxc-cli') || findExecutable('keepassxc-cli.exe');
  return !!kp;
}

function checkRclone() {
  return !!findExecutable('rclone');
}

function checkSmbclient() {
  return !!findExecutable('smbclient');
}

function checkLftp() {
  return !!findExecutable('lftp');
}

async function main() {
  console.log(ui.header('KeePass Sync – Setup'));

  // 1. Protocol selection
  const protocolChoice = await ui.promptMenu('Select sync protocol', [
    'Google Drive (rclone) – recommended, best mobile compatibility',
    'FTP',
    'SFTP',
    'SCP',
    'SMB (Linux/macOS only)',
  ]);

  if (!protocolChoice) {
    console.log(ui.info('Setup cancelled.'));
    process.exit(0);
  }

  const protocols = ['gdrive', 'ftp', 'sftp', 'scp', 'smb'];
  const protocol = protocols[protocolChoice - 1];

  // 2. Dependency check
  console.log(ui.section('Checking dependencies'));

  const missing = [];
  if (!checkKeepassxcCli()) {
    missing.push('KeePassXC (keepassxc-cli) – Install KeePassXC: https://keepassxc.org/download/');
  }
  if (protocol === 'gdrive' && !checkRclone()) {
    missing.push('rclone – Install: https://rclone.org/install/ or pacman -S rclone / apt install rclone / brew install rclone');
  }
  if (protocol === 'smb' && !checkSmbclient()) {
    if (os.platform() === 'win32') {
      missing.push('SMB on Windows: Use FTP or SFTP instead (SMB not supported on Windows).');
    } else {
      missing.push('smbclient – Install: pacman -S samba or apt install samba-common');
    }
  }
  if (protocol === 'ftp' && os.platform() !== 'win32' && !checkLftp()) {
    console.log(ui.warn('lftp not found. FTP will use Node.js (basic-ftp). For reliability, install lftp: pacman -S lftp or apt install lftp'));
  }

  if (missing.length > 0) {
    console.log(ui.fail('Missing dependencies:'));
    missing.forEach((m) => console.log('  - ' + m));
    console.log('');
    console.log(ui.info('Please install the above, then run npm run setup again.'));
    process.exit(1);
  }

  console.log(ui.ok('All required dependencies found.'));

  // 3. Create config.json
  const templateFile = protocol === 'gdrive' ? 'config.example.gdrive.json' : 'config.example.json';
  const templatePath = path.join(projectRoot, templateFile);

  if (!fs.existsSync(templatePath)) {
    console.log(ui.fail(`Template not found: ${templateFile}`));
    process.exit(1);
  }

  if (fs.existsSync(configPath)) {
    const overwrite = await ui.promptMenu('config.json already exists. Overwrite?', ['No, keep existing', 'Yes, overwrite with template']);
    if (overwrite !== 2) {
      console.log(ui.info('Keeping existing config.json. Edit it manually if needed.'));
    } else {
      fs.copyFileSync(templatePath, configPath);
      console.log(ui.ok(`config.json created from ${templateFile}`));
    }
  } else {
    fs.copyFileSync(templatePath, configPath);
    console.log(ui.ok(`config.json created from ${templateFile}`));
  }

  if (protocol === 'gdrive') {
    console.log(ui.info("Run 'rclone config' to create your 'gdrive' remote if you haven't already."));
  }

  console.log(ui.section('Next steps'));
  console.log('1. Edit config.json – set localPath, credentials, remotePath');
  console.log('2. Test: node sync.js --test');
  console.log('3. Sync: node sync.js --sync');
  console.log('');

  // 4. Automatic execution setup
  const platform = os.platform();
  let installScript = null;
  if (platform === 'linux') installScript = './linux/install.sh';
  else if (platform === 'darwin') installScript = './mac/install.sh';
  else if (platform === 'win32') installScript = '.\\windows\\install.ps1';

  if (installScript) {
    const setupAuto = await ui.promptMenu('Set up automatic sync (cron/Task Scheduler/LaunchAgent)?', ['No, skip', 'Yes, run install script']);
    if (setupAuto === 2) {
      console.log('');
      if (platform === 'linux' && fs.existsSync(path.join(projectRoot, 'linux/install.sh'))) {
        try {
          const result = spawnSync('bash', [path.join(projectRoot, 'linux/install.sh')], { stdio: 'inherit', cwd: projectRoot });
          if (result.status !== 0) console.log(ui.warn('Install script exited with code ' + (result.status || 1)));
        } catch (e) {
          console.log(ui.fail('Could not run install script: ' + e.message));
        }
      } else if (platform === 'darwin' && fs.existsSync(path.join(projectRoot, 'mac/install.sh'))) {
        try {
          const result = spawnSync('bash', [path.join(projectRoot, 'mac/install.sh')], { stdio: 'inherit', cwd: projectRoot });
          if (result.status !== 0) console.log(ui.warn('Install script exited with code ' + (result.status || 1)));
        } catch (e) {
          console.log(ui.fail('Could not run install script: ' + e.message));
        }
      } else if (platform === 'win32' && fs.existsSync(path.join(projectRoot, 'windows/install.ps1'))) {
        console.log(ui.info('Run in PowerShell (as Administrator if needed):'));
        console.log('  Set-ExecutionPolicy Bypass -Scope Process -Force; .\\windows\\install.ps1');
      } else {
        console.log(ui.warn(`Install script not found. See docs/INSTALL.*.md for manual setup.`));
      }
    }
  }

  console.log('');
  console.log(ui.ok('Setup complete!'));
}

main().catch((err) => {
  console.error(ui.fail('Error: ' + err.message));
  process.exit(1);
});
