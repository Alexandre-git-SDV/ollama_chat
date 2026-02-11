/**
 * ============================================
 *  Routes Ollama — Connexion & Version
 * ============================================
 */

const { Router }       = require('express');
const ollamaController = require('../controllers/ollama.controller');

const router = Router();

// GET /api/health
router.get('/health', ollamaController.healthCheck);

// GET /api/version
router.get('/version', ollamaController.getVersion);

module.exports = router;
