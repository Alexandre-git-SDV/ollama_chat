/**
 * ============================================
 *  Controller Ollama — Connexion & Version
 * ============================================
 */

const ollamaService = require('../services/ollama.service');
const config        = require('../config/env');

const ollamaController = {

  /**
   * GET /api/health
   * Vérifie la connexion à Ollama
   */
  async healthCheck(req, res) {
    try {
      const connected = await ollamaService.checkConnection();
      res.json({
        success:   true,
        connected,
        host:      config.ollamaHost
      });
    } catch (err) {
      res.status(500).json({
        success:   false,
        connected: false,
        error:     err.message
      });
    }
  },

  /**
   * GET /api/version
   * Récupère la version d'Ollama
   */
  async getVersion(req, res) {
    try {
      const version = await ollamaService.getVersion();
      res.json({
        success: true,
        version: version || 'inconnue'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error:   err.message
      });
    }
  }
};

module.exports = ollamaController;
