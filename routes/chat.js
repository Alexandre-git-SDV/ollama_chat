/**
 * ============================================
 *  ROUTES — Chat & Conversations
 * ============================================
 *  Utilise le client officiel ollama-js :
 *
 *  ollama.chat({ model, messages, stream }) → POST /api/chat
 *
 *  Mode streaming :
 *    ollama.chat({ ..., stream: true }) retourne un AsyncGenerator
 *    Chaque chunk a la forme :
 *    {
 *      model: "llama3.1:latest",
 *      created_at: "...",
 *      message: { role: "assistant", content: "token..." },
 *      done: false
 *    }
 *
 *    Le dernier chunk a done: true avec les métriques :
 *    {
 *      done: true,
 *      total_duration: ...,
 *      load_duration: ...,
 *      prompt_eval_count: ...,
 *      prompt_eval_duration: ...,
 *      eval_count: ...,
 *      eval_duration: ...
 *    }
 *
 *  Ref: https://github.com/ollama/ollama-js#streaming-responses
 *  Ref: https://docs.ollama.com/api/generate-chat-completion
 * ============================================
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const fsp     = require('fs').promises;
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const CONV_DIR = path.join(__dirname, '..', 'conversations');

// ───────────────────────────────────────────
// POST /api/chat/stream
// Envoie un message au modèle avec streaming SSE
// ───────────────────────────────────────────
router.post('/stream', async (req, res) => {
  const { model, messages } = req.body;

  // ── Validation ──
  if (!model || typeof model !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Le champ "model" (string) est requis.'
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Le champ "messages" (array non vide) est requis.'
    });
  }

  // ── Nettoyage des messages ──
  // L'API Ollama attend : [{ role: "user"|"assistant"|"system", content: "..." }]
  const cleanMessages = messages
    .filter(m => m && m.role && m.content)
    .map(m => ({
      role:    String(m.role).trim(),
      content: String(m.content).trim()
    }))
    .filter(m => ['user', 'assistant', 'system'].includes(m.role) && m.content.length > 0);

  if (cleanMessages.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Aucun message valide après nettoyage.'
    });
  }

  // ── En-têtes SSE ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // ── Gestion de la déconnexion client ──
  let aborted = false;
  req.on('close', () => {
    aborted = true;
  });

  try {
    const ollama = req.app.get('ollama');

    /**
     * ollama.chat() avec stream: true retourne un AsyncGenerator.
     *
     * Chaque itération yield un objet :
     * {
     *   model: string,
     *   created_at: string,
     *   message: { role: "assistant", content: "..." },
     *   done: boolean,
     *   // Quand done === true, métriques incluses :
     *   total_duration?: number,
     *   load_duration?: number,
     *   prompt_eval_count?: number,
     *   prompt_eval_duration?: number,
     *   eval_count?: number,
     *   eval_duration?: number
     * }
     */
    const stream = await ollama.chat({
      model:    model,
      messages: cleanMessages,
      stream:   true
    });

    // ── Itérer sur le stream ──
    for await (const chunk of stream) {
      if (aborted) break;

      if (chunk.done) {
        // Dernier chunk : métriques
        const metrics = {
          done:                true,
          total_duration:      chunk.total_duration,
          load_duration:       chunk.load_duration,
          prompt_eval_count:   chunk.prompt_eval_count,
          prompt_eval_duration: chunk.prompt_eval_duration,
          eval_count:          chunk.eval_count,
          eval_duration:       chunk.eval_duration
        };
        res.write(`data: ${JSON.stringify(metrics)}\n\n`);
      } else {
        // Token par token
        const token = chunk.message?.content || '';
        if (token) {
          res.write(`data: ${JSON.stringify({ token, done: false })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('❌ Erreur ollama.chat() streaming:', err.message);

    if (!aborted) {
      const errorMsg = err.message || 'Erreur de communication avec Ollama';
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// ───────────────────────────────────────────
// POST /api/chat/title
// Génère un titre court pour une conversation
// ───────────────────────────────────────────
router.post('/title', async (req, res) => {
  const { model, message } = req.body;

  if (!model || !message) {
    return res.status(400).json({
      success: false,
      error: '"model" et "message" sont requis.'
    });
  }

  try {
    const ollama = req.app.get('ollama');

    /**
     * ollama.chat() sans stream (stream: false par défaut)
     * retourne directement la réponse complète :
     * {
     *   model: string,
     *   created_at: string,
     *   message: { role: "assistant", content: "..." },
     *   done: true,
     *   total_duration: number,
     *   ...
     * }
     */
    const response = await ollama.chat({
      model:    model,
      messages: [
        {
          role: 'system',
          content: 'Génère un titre TRÈS court (4 à 6 mots maximum) qui résume la question de l\'utilisateur. Réponds UNIQUEMENT avec le titre. Pas de guillemets, pas de ponctuation finale, pas d\'explication.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      stream: false
    });

    let title = (response.message?.content || '').trim();

    // Nettoyage du titre
    title = title
      .replace(/^["'«]|["'»]$/g, '')    // Retirer guillemets
      .replace(/\.+$/, '')                // Retirer point final
      .replace(/\n.*/g, '')              // Garder première ligne seulement
      .trim();

    // Fallback si titre vide ou trop long
    if (!title || title.length > 80 || title.length < 2) {
      title = message.substring(0, 50) + (message.length > 50 ? '…' : '');
    }

    res.json({ success: true, title });

  } catch (err) {
    console.error('❌ Erreur génération titre:', err.message);
    // Fallback : utiliser le début du message
    const fallback = message.substring(0, 50) + (message.length > 50 ? '…' : '');
    res.json({ success: true, title: fallback });
  }
});

// ───────────────────────────────────────────
// GET /api/chat/conversations
// Liste toutes les conversations sauvegardées
// ───────────────────────────────────────────
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
          title:        data.title || 'Sans titre',
          model:        data.model || '',
          created:      data.created,
          updated:      data.updated,
          messageCount: (data.messages || []).length
        });
      } catch (e) {
        // Fichier JSON corrompu → ignorer
        console.warn(`⚠️ Fichier corrompu ignoré: ${file}`);
      }
    }

    // Trier par date de mise à jour décroissante
    conversations.sort((a, b) => new Date(b.updated) - new Date(a.updated));

    res.json({ success: true, conversations });

  } catch (err) {
    console.error('❌ Erreur lecture conversations:', err.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lecture du dossier conversations'
    });
  }
});

// ───────────────────────────────────────────
// GET /api/chat/conversation/:id
// Récupère une conversation complète
// ───────────────────────────────────────────
router.get('/conversation/:id', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Conversation introuvable'
      });
    }

    const raw  = await fsp.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    res.json({ success: true, conversation: data });

  } catch (err) {
    console.error('❌ Erreur lecture conversation:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ───────────────────────────────────────────
// POST /api/chat/conversation — Créer nouvelle
// ───────────────────────────────────────────
router.post('/conversation', async (req, res) => {
  try {
    const id    = uuidv4();
    const now   = new Date().toISOString();
    const model = req.body.model || '';

    const conversation = {
      id,
      title:    'Nouvelle conversation',
      model:    model,
      created:  now,
      updated:  now,
      messages: []
    };

    const filePath = path.join(CONV_DIR, `${id}.json`);
    await fsp.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

    res.json({ success: true, conversation });

  } catch (err) {
    console.error('❌ Erreur création conversation:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ───────────────────────────────────────────
// POST /api/chat/conversation/:id/save
// Sauvegarde messages dans une conversation
// ───────────────────────────────────────────
router.post('/conversation/:id/save', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);
    const { title, model, messages } = req.body;

    let conversation;

    if (fs.existsSync(filePath)) {
      const raw    = await fsp.readFile(filePath, 'utf-8');
      conversation = JSON.parse(raw);

      // Mise à jour sélective
      if (messages !== undefined) conversation.messages = messages;
      if (title !== undefined)    conversation.title    = title;
      if (model !== undefined)    conversation.model    = model;
      conversation.updated = new Date().toISOString();

    } else {
      // Création à la volée
      conversation = {
        id,
        title:    title || 'Nouvelle conversation',
        model:    model || 'unknown',
        created:  new Date().toISOString(),
        updated:  new Date().toISOString(),
        messages: messages || []
      };
    }

    await fsp.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

    res.json({ success: true, conversation });

  } catch (err) {
    console.error('❌ Erreur sauvegarde conversation:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ───────────────────────────────────────────
// PUT /api/chat/conversation/:id
// Renommer une conversation
// ───────────────────────────────────────────
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
      data.title = String(req.body.title).trim().substring(0, 100);
    }
    data.updated = new Date().toISOString();

    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    res.json({ success: true, conversation: data });

  } catch (err) {
    console.error('❌ Erreur renommage:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ───────────────────────────────────────────
// DELETE /api/chat/conversation/:id
// Supprimer une conversation
// ───────────────────────────────────────────
router.delete('/conversation/:id', async (req, res) => {
  try {
    const id       = sanitizeId(req.params.id);
    const filePath = path.join(CONV_DIR, `${id}.json`);

    if (fs.existsSync(filePath)) {
      await fsp.unlink(filePath);
    }

    res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur suppression:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Sécurisation de l'ID : on ne garde que les caractères alphanumériques et tirets.
 * Empêche les attaques de type path traversal.
 */
function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9\-]/g, '');
}

module.exports = router;
