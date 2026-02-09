/**
 * ============================================
 *  ROUTES — Modèles Ollama
 * ============================================
 *  Utilise le client officiel ollama-js :
 *
 *  ollama.list()   → GET /api/tags  → Liste des modèles installés
 *  ollama.ps()     → GET /api/ps    → Modèles actuellement chargés
 *  ollama.show()   → POST /api/show → Détails d'un modèle
 *
 *  Ref: https://github.com/ollama/ollama-js
 *  Ref: https://docs.ollama.com/api/list-local-models
 *  Ref: https://docs.ollama.com/api/list-running-models
 * ============================================
 */

const express = require('express');
const router  = express.Router();

/**
 * GET /api/models
 * Liste tous les modèles installés localement.
 *
 * ollama.list() retourne :
 * {
 *   models: [
 *     {
 *       name: "llama3.1:latest",
 *       model: "llama3.1:latest",
 *       modified_at: "2024-...",
 *       size: 4661224676,
 *       digest: "...",
 *       details: {
 *         parent_model: "",
 *         format: "gguf",
 *         family: "llama",
 *         families: ["llama"],
 *         parameter_size: "8.0B",
 *         quantization_level: "Q4_0"
 *       }
 *     },
 *     ...
 *   ]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
    const response = await ollama.list();

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
 * GET /api/models/running
 * Modèles actuellement chargés en mémoire (ollama ps).
 *
 * ollama.ps() retourne :
 * {
 *   models: [
 *     {
 *       name: "llama3.1:latest",
 *       model: "llama3.1:latest",
 *       size: 5137025024,
 *       digest: "...",
 *       details: { ... },
 *       expires_at: "2024-...",
 *       size_vram: 5137025024
 *     }
 *   ]
 * }
 */
router.get('/running', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
    const response = await ollama.ps();

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
 * GET /api/models/show/:name
 * Détails complets d'un modèle spécifique.
 *
 * ollama.show({ model }) retourne :
 * {
 *   modelfile: "...",
 *   parameters: "...",
 *   template: "...",
 *   details: { ... },
 *   model_info: { ... }
 * }
 */
router.get('/show/:name', async (req, res) => {
  try {
    const ollama   = req.app.get('ollama');
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
