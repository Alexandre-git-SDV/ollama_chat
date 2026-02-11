/**
 * ============================================
 *  Routes Models — Gestion des modèles
 * ============================================
 */

const { Router }       = require('express');
const modelsController = require('../controllers/models.controller');

const router = Router();

// GET /api/tags — Liste modèles installés
router.get('/tags', modelsController.listModels);

// GET /api/ps — Modèles chargés en mémoire
router.get('/ps', modelsController.listRunning);

// POST /api/show — Détails d'un modèle
router.post('/show', modelsController.showModel);

// GET /api/show/:name — Rétro-compatibilité
router.get('/show/:name', modelsController.showModelByName);

// POST /api/generate/load — Charger un modèle
router.post('/generate/load', modelsController.loadModel);

// POST /api/generate/unload — Décharger un modèle
router.post('/generate/unload', modelsController.unloadModel);

module.exports = router;