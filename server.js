/**
 * ============================================
 *  OLLAMA CHAT APP — Serveur Principal
 * ============================================
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { Ollama } = require('ollama');

// ── Instance Ollama client officiel ─────────
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

// ── Express App ─────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// Créer le dossier conversations s'il n'existe pas
const convDir = path.join(__dirname, 'conversations');
if (!fs.existsSync(convDir)) {
  fs.mkdirSync(convDir, { recursive: true });
}

// ── Middlewares ──────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Partager l'instance ollama avec les routes
app.set('ollama', ollama);

// ── Routes API ──────────────────────────────
app.use('/api', require('./routes/models'));
app.use('/api/chat', require('./routes/chat'));

// ── Health check ────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const response = await ollama.list();
    res.json({
      status: 'ok',
      ollama: true,
      modelsCount: (response.models || []).length
    });
  } catch (err) {
    res.json({
      status: 'ok',
      ollama: false,
      error: err.message
    });
  }
});

// ── Fallback SPA ────────────────────────────
// ⚠️  Express 5 / path-to-regexp v8+ exige un paramètre nommé
//     pour les wildcards : {*name} au lieu de * tout seul
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ───────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   🤖  Ollama Chat App                     ║');
  console.log(`  ║   🌐  http://localhost:${PORT}               ║`);
  console.log('  ║   📡  Ollama: http://127.0.0.1:11434      ║');
  console.log('  ║   📚  Client: ollama-js officiel          ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});