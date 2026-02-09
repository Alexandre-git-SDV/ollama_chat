/**
 * ============================================
 *  OLLAMA CHAT APP — Serveur Principal
 * ============================================
 *  Utilise le client officiel ollama-js pour
 *  communiquer avec Ollama.
 *
 *  Docs de référence :
 *  - https://github.com/ollama/ollama-js
 *  - https://docs.ollama.com/api/introduction
 * ============================================
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { Ollama } = require('ollama');

// ── Instance Ollama client officiel ─────────
// Par défaut se connecte à http://127.0.0.1:11434
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
app.use('/api/models', require('./routes/models'));
app.use('/api/chat',   require('./routes/chat'));

// ── Health check ────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    // ollama.list() renvoie la liste des modèles
    // Si ça fonctionne, Ollama est accessible
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
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ───────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   🤖  Ollama Chat App                     ║');
  console.log(`  ║   🌐  http://localhost:${PORT}                ║`);
  console.log('  ║   📡  Ollama: http://127.0.0.1:11434      ║');
  console.log('  ║   📚  Client: ollama-js officiel           ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});