/**
 * ============================================
 *  ROUTES — Chat & Conversations
 * ============================================
 *  POST   /api/chat/stream            → Envoi message (streaming SSE)
 *  POST   /api/chat/title             → Génération auto du titre
 *  GET    /api/chat/conversations      → Liste conversations
 *  GET    /api/chat/conversation/:id   → Détail conversation
 *  PUT    /api/chat/conversation/:id   → Renommer conversation
 *  DELETE /api/chat/conversation/:id   → Supprimer conversation
 *  POST   /api/chat/conversation/:id/save → Sauvegarder messages
 * ============================================
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const fsp     = require('fs').promises;
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const OLLAMA   = 'http://localhost:11434';
const CONV_DIR = path.join(__dirname, '..', 'conversations');

// ─────────────────────────────────────────────
// POST /api/chat/stream
// Streaming SSE : envoie les tokens au fur et à mesure
// ─────────────────────────────────────────────
router.post('/stream', async (req, res) => {
  const { model, messages } = req.body;

  // Validation
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      error: 'Champs "model" et "messages" (array) requis.'
    });
  }

  // Nettoyer les messages
  const cleanMessages = messages
    .filter(m => m.role && m.content)
    .map(m => ({
      role:    sanitize(m.role),
      content: sanitize(m.content)
    }));

  if (cleanMessages.length === 0) {
    return res.status(400).json({ success: false, error: 'Aucun message valide.' });
  }

  // En-têtes SSE
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // Appel Ollama en streaming
    const ollamaRes = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: cleanMessages,
        stream: true
      })
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Lecture du stream Ollama (NDJSON)
    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Ollama renvoie du NDJSON (une ligne JSON par chunk)
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Garder le fragment incomplet

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.message?.content) {
            // Envoyer le token au client
            res.write(`data: ${JSON.stringify({
              token: parsed.message.content,
              done:  false
            })}\n\n`);
          }

          if (parsed.done) {
            // Infos finales (temps, tokens…)
            res.write(`data: ${JSON.stringify({
              done: true,
              total_duration:    parsed.total_duration,
              eval_count:        parsed.eval_count,
              eval_duration:     parsed.eval_duration,
              prompt_eval_count: parsed.prompt_eval_count
            })}\n\n`);
          }
        } catch {
          // Ligne JSON invalide, on ignore
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('❌ [chat/stream] Erreur:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ─────────────────────────────────────────────
// POST /api/chat/title
// Génère un titre court à partir du 1er message
// ─────────────────────────────────────────────
router.post('/title', async (req, res) => {
  const { model, message } = req.body;

  if (!model || !message) {
    return res.status(400).json({ success: false, error: 'model + message requis' });
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Génère un titre TRÈS court (max 6 mots) résumant cette question. Réponds UNIQUEMENT avec le titre, sans guillemets, sans ponctuation finale.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: false
      })
    });

    if (!ollamaRes.ok) throw new Error('Ollama erreur');

    const data  = await ollamaRes.json();
    let   title = data.message?.content?.trim() || '';

    // Nettoyage
    title = title.replace(/^["']|["']$/g, '').trim();
    if (!title || title.length > 80) {
      title = message.substring(0, 50) + (message.length > 50 ? '…' : '');
    }

    res.json({ success: true, title });

  } catch {
    // Fallback : tronquer le message
    const fallback = message.substring(0, 50) + (message.length > 50 ? '…' : '');
    res.json({ success: true, title: fallback });
  }
});

// ─────────────────────────────────────────────
// GET /api/chat/conversations
// Liste toutes les conversations sauvegardées
// ─────────────────────────────────────────────
router.get('/conversations', async (_req, res) => {
  try {
    const files = await fsp.readdir(CONV_DIR);
    const conversations = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const raw  = await fsp.readFile(path.join(CONV_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        conversations.push({
          id:           data.id,
          title:        data.title,
          model:        data.model,
          created:      data.created,
          updated:      data.updated,
          messageCount: (data.messages || []).length
        });
      } catch {
        // Fichier corrompu → on l'ignore
      }
    }

    // Plus récent en premier
    conversations.sort((a, b) => new Date(b.updated) - new Date(a.updated));

    res.json({ success: true, conversations });

  } catch (err) {
    console.error('❌ [conversations] Erreur:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lecture conversations' });
  }
});

// ─────────────────────────────────────────────
// GET /api/chat/conversation/:id
// ─────────────────────────────────────────────
router.get('/conversation/:id', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Conversation introuvable' });
    }

    const raw  = await fsp.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    res.json({ success: true, conversation: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/chat/conversation/:id/save
// Sauvegarde complète des messages
// ─────────────────────────────────────────────
router.post('/conversation/:id/save', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    const { title, model, messages } = req.body;

    let conversation;

    if (fs.existsSync(filePath)) {
      const raw = await fsp.readFile(filePath, 'utf-8');
      conversation = JSON.parse(raw);
      conversation.messages = messages || conversation.messages;
      conversation.title    = title   || conversation.title;
      conversation.model    = model   || conversation.model;
      conversation.updated  = new Date().toISOString();
    } else {
      conversation = {
        id,
        title:   title || 'Nouvelle conversation',
        model:   model || 'unknown',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        messages: messages || []
      };
    }

    await fsp.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

    res.json({ success: true, conversation });

  } catch (err) {
    console.error('❌ [save] Erreur:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/chat/conversation/:id
// Renommer une conversation
// ─────────────────────────────────────────────
router.put('/conversation/:id', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Introuvable' });
    }

    const raw  = await fsp.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    if (req.body.title) {
      data.title = sanitize(req.body.title).substring(0, 100);
    }
    data.updated = new Date().toISOString();

    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    res.json({ success: true, conversation: data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/chat/conversation/:id
// ─────────────────────────────────────────────
router.delete('/conversation/:id', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    if (fs.existsSync(filePath)) {
      await fsp.unlink(filePath);
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Utilitaires ─────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function sanitizeId(id) {
  // N'autoriser que les UUID valides
  return id.replace(/[^a-zA-Z0-9\-]/g, '');
}

module.exports = router;
