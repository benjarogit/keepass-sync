#!/usr/bin/env node
/**
 * Open FTP/SFTP connection using config.json.
 * Lists remote directory (start path from config) so you can verify access from the workspace.
 *
 * Copyright (c) 2026 Sunny C.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const configPath = path.join(projectRoot, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('config.json not found in project root.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ftp = config.ftp || {};
const protocol = (ftp.type || 'ftp').toLowerCase();
const host = ftp.host;
const user = ftp.user;
const password = ftp.password;
const port = ftp.port ?? (protocol === 'ftp' ? 21 : 22);
const remotePath = ftp.remotePath || '/';
const remoteDir = path.dirname(remotePath).replace(/\\/g, '/') || '/';

async function listFTP() {
  const { Client } = require('basic-ftp');
  const client = new Client(10000);
  try {
    await client.access({ host, port, user, password, secure: false });
    const dir = remoteDir && remoteDir !== '.' ? remoteDir : '/';
    if (dir !== '/') await client.cd(dir);
    const list = await client.list();
    console.log(`FTP ${host}:${port} ${dir}\n`);
    list.forEach((e) => console.log(`${e.isDirectory ? 'd' : '-'} ${e.name}`));
  } catch (e) {
    console.error('FTP error:', e.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

async function listSFTP() {
  const SftpClient = require('ssh2-sftp-client');
  const sftp = new SftpClient();
  try {
    await sftp.connect({ host, port, username: user, password, readyTimeout: 10000 });
    const dir = remoteDir && remoteDir !== '.' ? remoteDir : '.';
    const list = await sftp.list(dir);
    console.log(`SFTP ${host}:${port} ${dir}\n`);
    list.forEach((e) => console.log(`${e.type === 'd' ? 'd' : '-'} ${e.name}`));
  } catch (e) {
    console.error('SFTP error:', e.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

(async () => {
  if (protocol === 'ftp') await listFTP();
  else if (protocol === 'sftp' || protocol === 'scp') await listSFTP();
  else {
    console.error('Only ftp and sftp are supported by open_ftp. Config type:', protocol);
    process.exit(1);
  }
})();
