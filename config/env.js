/**
 * ============================================
 *  Configuration Environnement
 * ============================================
 */

const path = require('path');

const config = {
  // ── Serveur ──
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // ── Ollama ──
  ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',

  // ── Conversations (stockage fichier) ──
  conversationsDir: process.env.CONVERSATIONS_DIR
    || path.join(__dirname, '..', 'data', 'conversations'),

  // ── Public ──
  publicDir: path.join(__dirname, '..', 'public'),

  // ── Environnement ──
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development'
};

module.exports = config;