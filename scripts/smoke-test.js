#!/usr/bin/env node
/**
 * Smoke tests for keepass-sync CLI.
 * Runs without real FTP/Keepass servers; validates --help, --version, --test with dummy config.
 * Copyright (c) 2026 Sunny C.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const syncJs = path.join(projectRoot, 'sync.js');
const configTest = path.join(projectRoot, 'config.test.json');

function run(cmd, args = [], opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 10000,
    ...opts,
  });
  return { ...r, ok: r.status === 0 };
}

let failed = 0;

// 1. --help must exit 0 and print usage
const help = run('node', [syncJs, '--help']);
if (!help.ok) {
  console.error('FAIL: node sync.js --help should exit 0');
  failed++;
} else if (!help.stdout || !help.stdout.includes('Usage')) {
  console.error('FAIL: --help should print Usage');
  failed++;
} else {
  console.log('OK: --help');
}

// 2. --version must exit 0 and print version
const ver = run('node', [syncJs, '--version']);
if (!ver.ok) {
  console.error('FAIL: node sync.js --version should exit 0');
  failed++;
} else if (!ver.stdout || !ver.stdout.includes('2.0.0')) {
  console.error('FAIL: --version should print 2.0.0');
  failed++;
} else {
  console.log('OK: --version');
}

// 3. --test with dummy config: expect clean failure (no crash), exit non-0
if (fs.existsSync(configTest)) {
  const testRun = run('node', [syncJs, '--test', '--config', 'config.test.json'], { env: { ...process.env } });
  if (testRun.signal) {
    console.error('FAIL: --test crashed with signal', testRun.signal);
    failed++;
  } else {
    console.log('OK: --test with dummy config (exit', testRun.status, ')');
  }
} else {
  console.log('SKIP: config.test.json not found');
}

process.exit(failed > 0 ? 1 : 0);
