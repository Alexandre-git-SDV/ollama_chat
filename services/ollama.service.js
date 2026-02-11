/**
 * ============================================
 *  Service Ollama — Couche d'accès à l'API
 * ============================================
 *
 *  Utilise la librairie officielle ollama-js.
 *  Toute la communication avec Ollama passe ici.
 */

const { Ollama } = require('ollama');
const config     = require('../config/env');
const logger     = require('../utils/logger');

// ── Instance unique du client Ollama ──
const ollama = new Ollama({ host: config.ollamaHost });

const ollamaService = {

  /**
   * Retourne l'instance brute du client (pour usages avancés)
   */
  getClient() {
    return ollama;
  },

  // ════════════════════════════════════════
  //  CONNEXION
  // ════════════════════════════════════════

  /**
   * Vérifie que le serveur Ollama répond
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      // ollama.list() est un bon health-check
      await ollama.list();
      return true;
    } catch (err) {
      logger.warn('Ollama non joignable:', err.message);
      return false;
    }
  },

  // ════════════════════════════════════════
  //  MODÈLES
  // ════════════════════════════════════════

  /**
   * Liste tous les modèles installés
   * @returns {Promise<Array>}
   */
  async listModels() {
    const response = await ollama.list();
    // ollama-js retourne { models: [...] }
    return response.models || [];
  },

  /**
   * Liste les modèles actuellement chargés en mémoire
   * @returns {Promise<Array>}
   */
  async listRunningModels() {
    const response = await ollama.ps();
    // ollama-js retourne { models: [...] }
    return response.models || [];
  },

  /**
   * Affiche les détails d'un modèle
   * @param {string} modelName
   * @returns {Promise<Object>}
   */
  async showModel(modelName) {
    const response = await ollama.show({ model: modelName });
    return {
      modelfile:  response.modelfile  || '',
      parameters: response.parameters || '',
      template:   response.template   || '',
      details:    response.details    || {},
      modelInfo:  response.model_info || {}
    };
  },

  /**
   * Charge un modèle en mémoire (keep_alive)
   * @param {string} modelName
   */
  async loadModel(modelName) {
    // On envoie un generate vide avec keep_alive pour forcer le chargement
    await ollama.generate({
      model:      modelName,
      prompt:     '',
      keep_alive: '10m'
    });
    logger.success(`Modèle "${modelName}" chargé en mémoire`);
  },

  /**
   * Décharge un modèle de la mémoire
   * @param {string} modelName
   */
  async unloadModel(modelName) {
    await ollama.generate({
      model:      modelName,
      prompt:     '',
      keep_alive: '0'
    });
    logger.success(`Modèle "${modelName}" déchargé`);
  },

  // ════════════════════════════════════════
  //  CHAT
  // ════════════════════════════════════════

  /**
   * Chat en streaming (retourne un AsyncGenerator)
   *
   * @param {string} model
   * @param {Array}  messages  - [{ role, content }, ...]
   * @param {Object} [options] - Paramètres optionnels (temperature, etc.)
   * @returns {AsyncGenerator}
   */
  async chatStream(model, messages, options = {}) {
    const response = await ollama.chat({
      model,
      messages,
      stream: true,
      options: {
        temperature: options.temperature,
        top_p:       options.top_p,
        top_k:       options.top_k,
        num_predict: options.num_predict,
        ...options
      }
    });

    // ollama-js retourne un AsyncGenerator quand stream: true
    return response;
  },

  /**
   * Chat sans streaming (réponse complète)
   *
   * @param {string} model
   * @param {Array}  messages
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async chatComplete(model, messages, options = {}) {
    const response = await ollama.chat({
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature,
        ...options
      }
    });
    return response;
  },

  /**
   * Génère un titre pour une conversation
   *
   * @param {string} model
   * @param {string} firstUserMessage
   * @returns {Promise<string>}
   */
  async generateTitle(model, firstUserMessage) {
    const prompt = `Génère un titre court (max 6 mots) pour une conversation qui commence par ce message. Réponds UNIQUEMENT avec le titre, sans guillemets, sans ponctuation finale.\n\nMessage: "${firstUserMessage}"`;

    try {
      const response = await ollama.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 20
        }
      });

      let title = (response.message?.content || 'Nouvelle conversation').trim();
      // Nettoyage
      title = title.replace(/^["'«]|["'»]$/g, '').trim();
      if (title.length > 60) title = title.substring(0, 57) + '...';
      if (title.length < 2) title = 'Nouvelle conversation';

      return title;
    } catch (err) {
      logger.warn('Erreur génération titre:', err.message);
      return 'Nouvelle conversation';
    }
  },

  // ════════════════════════════════════════
  //  VERSION
  // ════════════════════════════════════════

  /**
   * Récupère la version du serveur Ollama
   * @returns {Promise<string|null>}
   */
  async getVersion() {
    try {
      // L'API REST /api/version ; ollama-js n'a pas de méthode dédiée
      const response = await fetch(`${config.ollamaHost}/api/version`);
      const data     = await response.json();
      return data.version || null;
    } catch (err) {
      logger.warn('Impossible de récupérer la version Ollama:', err.message);
      return null;
    }
  }
};

module.exports = ollamaService;
