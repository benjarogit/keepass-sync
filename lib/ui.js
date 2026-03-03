/**
 * KeePass Sync - CLI UI (cross-platform)
 * Colors only when TTY; symbols and boxes for nice output.
 * Linux, Windows, macOS, WSL2.
 *
 * Copyright (c) 2026 Sunny C.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const isTTY = process.stdout.isTTY && process.stderr.isTTY;

// ANSI codes (empty when not TTY or NO_COLOR)
const c = isTTY && !process.env.NO_COLOR
  ? {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  }
  : { red: '', green: '', yellow: '', blue: '', cyan: '', magenta: '', bold: '', dim: '', reset: '' };

const OK = '✓';
const FAIL = '✗';
const WARN = '⚠';
const INFO = 'ℹ';
const ARROW = '›';

/**
 * @param {string} message
 * @param {string} [logFile]
 */
function log(message, logFile) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const line = `${ts} ${message}`;
  console.log(line);
  if (logFile) {
    try {
      fs.appendFileSync(logFile, line + '\n');
    } catch (_) {}
  }
}

/** @param {string} msg */
function ok(msg) {
  return `${c.green}${OK}${c.reset} ${msg}`;
}

/** @param {string} msg */
function fail(msg) {
  return `${c.red}${FAIL}${c.reset} ${msg}`;
}

/** @param {string} msg */
function warn(msg) {
  return `${c.yellow}${WARN}${c.reset} ${msg}`;
}

/** @param {string} msg */
function info(msg) {
  return `${c.cyan}${INFO}${c.reset} ${msg}`;
}

/** @param {string} msg */
function dim(msg) {
  return `${c.dim}${msg}${c.reset}`;
}

/** @param {string} title */
function header(title) {
  const width = 52;
  const line = '═'.repeat(width);
  const pad = Math.max(0, Math.floor((width - title.length) / 2));
  return [
    '',
    `${c.cyan}╔${line}╗${c.reset}`,
    `${c.cyan}║${c.reset}${' '.repeat(pad)}${c.bold}${title}${c.reset}${' '.repeat(width - pad - title.length)}${c.cyan}║${c.reset}`,
    `${c.cyan}╚${line}╝${c.reset}`,
    '',
  ].join('\n');
}

/** @param {string} title */
function section(title) {
  return `\n${c.bold}${c.cyan}─── ${title} ───${c.reset}\n\n`;
}

/** @param {string} title */
function divider(title = '') {
  const w = 48;
  return `${c.dim}${'─'.repeat(w)}${c.reset}\n`;
}

/** @param {string[]} options */
function menu(title, options) {
  const lines = [
    '',
    `${c.bold}${c.cyan}─── ${title} ───${c.reset}`,
    '',
    ...options.map((opt, i) => `  ${c.green}${i + 1}${c.reset}) ${opt}`),
    '',
  ];
  return lines.join('\n');
}

/**
 * Interactive menu – returns choice (1-based index) or null on exit.
 * @param {string} title
 * @param {string[]} options
 * @returns {Promise<number|null>}
 */
function promptMenu(title, options) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(menu(title, options));
    const prompt = `${c.yellow}${ARROW} Choice (1–${options.length}, q=quit):${c.reset} `;
    rl.question(prompt, (answer) => {
      rl.close();
      const s = (answer || '').trim().toLowerCase();
      if (s === 'q' || s === 'quit' || s === '') {
        resolve(null);
        return;
      }
      const n = parseInt(s, 10);
      if (n >= 1 && n <= options.length) resolve(n);
      else resolve(null);
    });
  });
}

module.exports = {
  c,
  OK,
  FAIL,
  WARN,
  INFO,
  ARROW,
  isTTY,
  log,
  ok,
  fail,
  warn,
  info,
  dim,
  header,
  section,
  divider,
  menu,
  promptMenu,
};
