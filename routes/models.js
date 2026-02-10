/**
 * ============================================
 *  ROUTES — Modèles Ollama
 * ============================================
 *  Endpoints Ollama réels :
 *
 *  GET  http://localhost:11434/api/version  → Version d'Ollama
 *  GET  http://localhost:11434/api/tags     → Liste des modèles installés
 *  GET  http://localhost:11434/api/ps       → Modèles actuellement chargés
 *  POST http://localhost:11434/api/generate → Activer / Désactiver un modèle
 *
 * ============================================
 */

const express = require('express');
const router  = express.Router();

/**
 * GET /api/version
 * Retourne la version d'Ollama.
 */
router.get('/version', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
    // Si ollama-js ne supporte pas .version(), on fait un fetch direct
    const fetch    = (await import('node-fetch')).default;
    const host     = ollama?.config?.host || 'http://localhost:11434';
    const response = await fetch(`${host}/api/version`);
    const data     = await response.json();

    res.json({ success: true, version: data.version });

  } catch (err) {
    console.error('❌ Erreur /api/version:', err.message);
    res.status(502).json({
      success: false,
      error: 'Impossible de contacter Ollama. Vérifiez que "ollama serve" est lancé.'
    });
  }
});

/**
 * GET /api/tags
 * Liste tous les modèles installés localement.
 *
 * Correspond à : GET http://localhost:11434/api/tags
 */
router.get('/tags', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
    const response = await ollama.list();   // → GET /api/tags

    const models = (response.models || []).map(m => ({
      name:           m.name,
      model:          m.model || m.name,
      size:           m.size,
      sizeHuman:      formatBytes(m.size),
      modified:       m.modified_at,
      digest:         m.digest ? m.digest.substring(0, 12) : '',
      family:         m.details?.family || 'unknown',
      families:       m.details?.families || [],
      parameterSize:  m.details?.parameter_size || 'N/A',
      quantization:   m.details?.quantization_level || 'N/A',
      format:         m.details?.format || 'N/A'
    }));

    res.json({ success: true, models });

  } catch (err) {
    console.error('❌ Erreur ollama.list():', err.message);
    res.status(502).json({
      success: false,
      error: 'Impossible de contacter Ollama. Vérifiez que "ollama serve" est lancé.'
    });
  }
});

/**
 * GET /api/ps
 * Modèles actuellement chargés en mémoire.
 *
 * Correspond à : GET http://localhost:11434/api/ps
 */
router.get('/ps', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
    const response = await ollama.ps();   // → GET /api/ps

    const running = (response.models || []).map(m => ({
      name:      m.name,
      size:      m.size,
      sizeHuman: formatBytes(m.size),
      sizeVram:  m.size_vram,
      expiresAt: m.expires_at,
      digest:    m.digest ? m.digest.substring(0, 12) : ''
    }));

    res.json({ success: true, running });

  } catch (err) {
    console.error('❌ Erreur ollama.ps():', err.message);
    res.status(502).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/generate/load
 * Activer (charger) un modèle en mémoire.
 *
 * Correspond à : POST http://localhost:11434/api/generate
 * Body: { "model": "gpt-oss:20b" }
 */
router.post('/generate/load', async (req, res) => {
  const { model } = req.body;

  if (!model || typeof model !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Le champ "model" (string) est requis.'
    });
  }

  try {
    const ollama = req.app.get('ollama');

    // ollama.generate() avec un prompt vide charge simplement le modèle
    await ollama.generate({
      model:  model,
      prompt: '',
      stream: false
    });

    res.json({ success: true, message: `Modèle "${model}" chargé en mémoire.` });

  } catch (err) {
    console.error('❌ Erreur chargement modèle:', err.message);
    res.status(502).json({
      success: false,
      error: `Impossible de charger le modèle "${model}": ${err.message}`
    });
  }
});

/**
 * POST /api/generate/unload
 * Désactiver (décharger) un modèle de la mémoire.
 *
 * Correspond à : POST http://localhost:11434/api/generate
 * Body: { "model": "gpt-oss:20b", "keep_alive": 0 }
 */
router.post('/generate/unload', async (req, res) => {
  const { model } = req.body;

  if (!model || typeof model !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Le champ "model" (string) est requis.'
    });
  }

  try {
    const ollama = req.app.get('ollama');

    await ollama.generate({
      model:      model,
      prompt:     '',
      keep_alive: 0,
      stream:     false
    });

    res.json({ success: true, message: `Modèle "${model}" déchargé de la mémoire.` });

  } catch (err) {
    console.error('❌ Erreur déchargement modèle:', err.message);
    res.status(502).json({
      success: false,
      error: `Impossible de décharger le modèle "${model}": ${err.message}`
    });
  }
});

/**
 * POST /api/show
 * Détails complets d'un modèle spécifique.
 *
 * Note: Changé de GET à POST car Ollama attend un POST avec body.
 * Correspond à : POST http://localhost:11434/api/show
 * Body: { "model": "llama3.1:latest" }
 */
router.post('/show', async (req, res) => {
  try {
    const ollama    = req.app.get('ollama');
    const modelName = req.body.model;

    if (!modelName) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "model" est requis.'
      });
    }

    const response = await ollama.show({ model: modelName });

    res.json({
      success: true,
      info: {
        modelfile:  response.modelfile,
        parameters: response.parameters,
        template:   response.template,
        details:    response.details,
        modelInfo:  response.model_info
      }
    });

  } catch (err) {
    console.error('❌ Erreur ollama.show():', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/show/:name  (rétro-compatibilité)
 * Redirige vers le POST /api/show
 */
router.get('/show/:name', async (req, res) => {
  try {
    const ollama    = req.app.get('ollama');
    const modelName = req.params.name;

    const response = await ollama.show({ model: modelName });

    res.json({
      success: true,
      info: {
        modelfile:  response.modelfile,
        parameters: response.parameters,
        template:   response.template,
        details:    response.details,
        modelInfo:  response.model_info
      }
    });

  } catch (err) {
    console.error('❌ Erreur ollama.show():', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Formater des octets en chaîne lisible
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = router;
