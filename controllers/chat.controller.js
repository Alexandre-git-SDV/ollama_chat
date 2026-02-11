/**
 * ============================================
 *  Controller Chat — Streaming & Conversations
 * ============================================
 */

const fs             = require('fs');
const fsp            = require('fs').promises;
const path           = require('path');
const { v4: uuidv4 } = require('uuid');
const ollamaService  = require('../services/ollama.service');
const config         = require('../config/env');
const logger         = require('../utils/logger');

// ── Dossier de stockage des conversations ──
const CONV_DIR = config.conversationsDir;

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(CONV_DIR)) {
  fs.mkdirSync(CONV_DIR, { recursive: true });
  logger.info('Dossier conversations créé:', CONV_DIR);
}

/**
 * Nettoie un ID pour éviter les path-traversal
 */
function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9\-]/g, '');
}

// ════════════════════════════════════════════
//  CONTROLLER
// ════════════════════════════════════════════

const chatController = {

  // ────────────────────────────────────────
  //  POST /api/chat/stream
  //  Chat en streaming (SSE)
  // ────────────────────────────────────────
  async streamChat(req, res) {
    const { model, messages, options } = req.body;

    // ── Validation ──
    if (!model || typeof model !== 'string') {
      return res.status(400).json({
        success: false,
        error:   'Le champ "model" (string) est requis.'
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error:   'Le champ "messages" (array non vide) est requis.'
      });
    }

    // ── Nettoyage des messages ──
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
        error:   'Aucun message valide après nettoyage.'
      });
    }

    // ── En-têtes SSE ──
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // ── Gestion de la déconnexion client ──
    let aborted = false;
    req.on('close', () => {
      aborted = true;
      logger.debug('Client SSE déconnecté');
    });

    try {
      logger.info(`Chat stream → modèle="${model}", ${cleanMessages.length} message(s)`);

      const stream = await ollamaService.chatStream(model, cleanMessages, options || {});

      for await (const chunk of stream) {
        if (aborted) break;

        // chunk ollama-js : { message: { role, content }, done, ... }
        const payload = {
          token: chunk.message?.content || '',
          done:  chunk.done || false
        };

        // Ajouter les métriques quand c'est terminé
        if (chunk.done) {
          payload.total_duration = chunk.total_duration;
          payload.eval_count     = chunk.eval_count;
          payload.eval_duration  = chunk.eval_duration;
        }

        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }

      // Signal de fin
      if (!aborted) {
        res.write('data: [DONE]\n\n');
      }

    } catch (err) {
      logger.error('Erreur chat stream:', err.message);

      if (!aborted) {
        const errorPayload = {
          error: true,
          message: err.message || 'Erreur lors du streaming'
        };
        res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      }
    } finally {
      if (!aborted) {
        res.end();
      }
    }
  },

  // ────────────────────────────────────────
  //  POST /api/chat/title
  //  Génère un titre pour une conversation
  // ────────────────────────────────────────
  async generateTitle(req, res) {
    try {
      const { model, message } = req.body;

      if (!model || !message) {
        return res.status(400).json({
          success: false,
          error:   'Les champs "model" et "message" sont requis.'
        });
      }

      const title = await ollamaService.generateTitle(model, message);
      res.json({ success: true, title });

    } catch (err) {
      logger.error('Erreur generateTitle:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  GET /api/chat/conversations
  //  Liste toutes les conversations
  // ────────────────────────────────────────
  async listConversations(req, res) {
    try {
      const files = await fsp.readdir(CONV_DIR);
      const conversations = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const raw  = await fsp.readFile(path.join(CONV_DIR, file), 'utf-8');
          const conv = JSON.parse(raw);
          conversations.push({
            id:       conv.id,
            title:    conv.title || 'Sans titre',
            model:    conv.model || 'unknown',
            created:  conv.created,
            updated:  conv.updated,
            messages: conv.messages ? conv.messages.length : 0
          });
        } catch (parseErr) {
          logger.warn(`Fichier conversation invalide: ${file}`, parseErr.message);
        }
      }

      // Tri par date de mise à jour décroissante
      conversations.sort((a, b) => {
        return new Date(b.updated || b.created) - new Date(a.updated || a.created);
      });

      res.json({ success: true, conversations });

    } catch (err) {
      logger.error('Erreur listConversations:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  GET /api/chat/conversation/:id
  //  Charge une conversation
  // ────────────────────────────────────────
  async getConversation(req, res) {
    try {
      const id       = sanitizeId(req.params.id);
      const filePath = path.join(CONV_DIR, `${id}.json`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error:   'Conversation non trouvée.'
        });
      }

      const raw  = await fsp.readFile(filePath, 'utf-8');
      const conv = JSON.parse(raw);

      res.json({ success: true, conversation: conv });

    } catch (err) {
      logger.error('Erreur getConversation:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  POST /api/chat/conversation
  //  Crée une nouvelle conversation
  // ────────────────────────────────────────
  async createConversation(req, res) {
    try {
      const { title, model } = req.body;
      const id = uuidv4();

      const conversation = {
        id,
        title:    title || 'Nouvelle conversation',
        model:    model || 'unknown',
        created:  new Date().toISOString(),
        updated:  new Date().toISOString(),
        messages: []
      };

      const filePath = path.join(CONV_DIR, `${id}.json`);
      await fsp.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

      logger.info(`Conversation créée: ${id}`);
      res.json({ success: true, conversation });

    } catch (err) {
      logger.error('Erreur createConversation:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  POST /api/chat/conversation/:id/save
  //  Sauvegarde (mise à jour) une conversation
  // ────────────────────────────────────────
  async saveConversation(req, res) {
    try {
      const id       = sanitizeId(req.params.id);
      const filePath = path.join(CONV_DIR, `${id}.json`);
      const { title, model, messages } = req.body;

      let conversation;

      if (fs.existsSync(filePath)) {
        const raw    = await fsp.readFile(filePath, 'utf-8');
        conversation = JSON.parse(raw);

        if (messages !== undefined) conversation.messages = messages;
        if (title !== undefined)    conversation.title    = title;
        if (model !== undefined)    conversation.model    = model;
        conversation.updated = new Date().toISOString();
      } else {
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
      logger.error('Erreur saveConversation:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  PUT /api/chat/conversation/:id
  //  Renomme une conversation
  // ────────────────────────────────────────
  async renameConversation(req, res) {
    try {
      const id       = sanitizeId(req.params.id);
      const filePath = path.join(CONV_DIR, `${id}.json`);
      const { title } = req.body;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error:   'Conversation non trouvée.'
        });
      }

      if (!title || typeof title !== 'string') {
        return res.status(400).json({
          success: false,
          error:   'Le champ "title" est requis.'
        });
      }

      const raw          = await fsp.readFile(filePath, 'utf-8');
      const conversation = JSON.parse(raw);

      conversation.title   = title.trim();
      conversation.updated = new Date().toISOString();

      await fsp.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');

      res.json({ success: true, conversation });

    } catch (err) {
      logger.error('Erreur renameConversation:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ────────────────────────────────────────
  //  DELETE /api/chat/conversation/:id
  //  Supprime une conversation
  // ────────────────────────────────────────
  async deleteConversation(req, res) {
    try {
      const id       = sanitizeId(req.params.id);
      const filePath = path.join(CONV_DIR, `${id}.json`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error:   'Conversation non trouvée.'
        });
      }

      await fsp.unlink(filePath);
      logger.info(`Conversation supprimée: ${id}`);

      res.json({ success: true, message: 'Conversation supprimée.' });

    } catch (err) {
      logger.error('Erreur deleteConversation:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = chatController;
