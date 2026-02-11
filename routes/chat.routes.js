/**
 * ============================================
 *  Routes Chat — Streaming & Conversations
 * ============================================
 */

const { Router }     = require('express');
const chatController = require('../controllers/chat.controller');

const router = Router();

// POST /api/chat/stream — Chat en streaming SSE
router.post('/stream', chatController.streamChat);

// POST /api/chat/title — Génération de titre
router.post('/title', chatController.generateTitle);

// GET /api/chat/conversations — Liste des conversations
router.get('/conversations', chatController.listConversations);

// GET /api/chat/conversation/:id — Charger une conversation
router.get('/conversation/:id', chatController.getConversation);

// POST /api/chat/conversation — Créer une conversation
router.post('/conversation', chatController.createConversation);

// POST /api/chat/conversation/:id/save — Sauvegarder une conversation
router.post('/conversation/:id/save', chatController.saveConversation);

// PUT /api/chat/conversation/:id — Renommer une conversation
router.put('/conversation/:id', chatController.renameConversation);

// DELETE /api/chat/conversation/:id — Supprimer une conversation
router.delete('/conversation/:id', chatController.deleteConversation);

module.exports = router;