/**
 * ============================================
 *  Controller Models — Gestion des modèles
 * ============================================
 */

const ollamaService = require('../services/ollama.service');
const logger        = require('../utils/logger');

const modelsController = {

  /**
   * GET /api/tags
   * Liste tous les modèles installés
   */
  async listModels(req, res) {
    try {
      const models = await ollamaService.listModels();
      res.json({
        success: true,
        models:  models.map(m => ({
          name:        m.name,
          model:       m.model,
          size:        m.size,
          digest:      m.digest,
          modified_at: m.modified_at,
          details:     m.details || {}
        }))
      });
    } catch (err) {
      logger.error('Erreur listModels:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/ps
   * Liste les modèles actuellement chargés en mémoire
   */
  async listRunning(req, res) {
    try {
      const running = await ollamaService.listRunningModels();
      res.json({
        success: true,
        running: running.map(m => ({
          name:       m.name,
          model:      m.model,
          size:       m.size,
          digest:     m.digest,
          expires_at: m.expires_at,
          details:    m.details || {}
        }))
      });
    } catch (err) {
      logger.error('Erreur listRunning:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/show
   * Détails d'un modèle spécifique
   * Body: { name: "llama3:latest" }
   */
  async showModel(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error:   'Le champ "name" est requis.'
        });
      }

      const info = await ollamaService.showModel(name);
      res.json({ success: true, info });

    } catch (err) {
      logger.error('Erreur showModel:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/show/:name
   * Rétro-compatibilité — Détails d'un modèle par URL
   */
  async showModelByName(req, res) {
    try {
      const modelName = req.params.name;
      const info = await ollamaService.showModel(modelName);
      res.json({ success: true, info });
    } catch (err) {
      logger.error('Erreur showModelByName:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/generate/load
   * Charge un modèle en mémoire
   * Body: { name: "llama3:latest" }
   */
  async loadModel(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error:   'Le champ "name" est requis.'
        });
      }

      await ollamaService.loadModel(name);
      res.json({ success: true, message: `Modèle "${name}" chargé.` });

    } catch (err) {
      logger.error('Erreur loadModel:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/generate/unload
   * Décharge un modèle de la mémoire
   * Body: { name: "llama3:latest" }
   */
  async unloadModel(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({
          success: false,
          error:   'Le champ "name" est requis.'
        });
      }

      await ollamaService.unloadModel(name);
      res.json({ success: true, message: `Modèle "${name}" déchargé.` });

    } catch (err) {
      logger.error('Erreur unloadModel:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = modelsController;
