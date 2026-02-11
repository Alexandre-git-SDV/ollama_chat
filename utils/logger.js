/**
 * ============================================
 *  Logger utilitaire
 * ============================================
 */

const config = require('../config/env');

const COLORS = {
  reset:   '\x1b[0m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  gray:    '\x1b[90m'
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info(...args) {
    console.log(`${COLORS.cyan}[${timestamp()}] ℹ️  INFO${COLORS.reset}`, ...args);
  },

  success(...args) {
    console.log(`${COLORS.green}[${timestamp()}] ✅ OK${COLORS.reset}`, ...args);
  },

  warn(...args) {
    console.warn(`${COLORS.yellow}[${timestamp()}] ⚠️  WARN${COLORS.reset}`, ...args);
  },

  error(...args) {
    console.error(`${COLORS.red}[${timestamp()}] ❌ ERROR${COLORS.reset}`, ...args);
  },

  debug(...args) {
    if (config.isDev) {
      console.log(`${COLORS.gray}[${timestamp()}] 🐛 DEBUG${COLORS.reset}`, ...args);
    }
  },

  request(method, url, status, duration) {
    const color = status >= 400 ? COLORS.red : status >= 300 ? COLORS.yellow : COLORS.green;
    console.log(
      `${COLORS.gray}[${timestamp()}]${COLORS.reset} ${COLORS.blue}${method}${COLORS.reset} ${url} ${color}${status}${COLORS.reset} ${COLORS.gray}${duration}ms${COLORS.reset}`
    );
  }
};

module.exports = logger;