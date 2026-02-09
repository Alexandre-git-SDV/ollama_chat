/**
 * ============================================
 *  OLLAMA CHAT APP — Serveur Principal
 * ============================================
 *  Point d'entrée Express.
 *  - Sert les fichiers statiques (public/)
 *  - Monte les routes API (/api/models, /api/chat)
 *  - Proxy de streaming vers Ollama
 * ============================================
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');

// ── Routes ──────────────────────────────────
const chatRoutes   = require('./routes/chat');
const modelsRoutes = require('./routes/models');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Créer le dossier conversations s'il manque ─
const convDir = path.join(__dirname, 'conversations');
if (!fs.existsSync(convDir)) {
  fs.mkdirSync(convDir, { recursive: true });
}

// ── Middlewares ──────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Montage des routes API ──────────────────
app.use('/api/models', modelsRoutes);
app.use('/api/chat',   chatRoutes);

// ── Route de santé ──────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const resp = await fetch('http://localhost:11434/api/tags');
    if (resp.ok) {
      return res.json({ status: 'ok', ollama: true });
    }
    throw new Error('Ollama non joignable');
  } catch {
    res.json({ status: 'ok', ollama: false });
  }
});

// ── Fallback SPA ────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ───────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   🤖  Ollama Chat App démarrée      ║');
  console.log(`  ║   🌐  http://localhost:${PORT}          ║`);
  console.log('  ║   📡  Ollama: http://localhost:11434 ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});