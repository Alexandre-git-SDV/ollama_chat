/**
 * ============================================
 *  APP EXPRESS — Configuration
 * ============================================
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const config  = require('./config/env');
const logger  = require('./utils/logger');

const { requestLogger, notFound, errorHandler } = require('./middlewares/error.middleware');

// ── Routes ──
const ollamaRoutes = require('./routes/ollama.routes');
const modelsRoutes = require('./routes/models.routes');
const chatRoutes   = require('./routes/chat.routes');

// ══════════════════════════════════════════
//  Création de l'app
// ══════════════════════════════════════════

const app = express();

// ── Middlewares globaux ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Log des requêtes ──
app.use(requestLogger);

// ── Fichiers statiques (frontend) ──
app.use(express.static(config.publicDir));

// ══════════════════════════════════════════
//  Montage des routes API
// ══════════════════════════════════════════

//  /api/health, /api/version
app.use('/api', ollamaRoutes);

//  /api/tags, /api/ps, /api/show, /api/generate/load, /api/generate/unload
app.use('/api', modelsRoutes);

//  /api/chat/stream, /api/chat/title, /api/chat/conversations, etc.
app.use('/api/chat', chatRoutes);

// ══════════════════════════════════════════
//  SPA fallback — renvoie index.html
// ══════════════════════════════════════════

app.get('*', (req, res) => {
  // Ne pas intercepter les routes /api
  if (req.originalUrl.startsWith('/api')) {
    return notFound(req, res);
  }
  res.sendFile(path.join(config.publicDir, 'index.html'));
});

// ── Gestion des erreurs ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
