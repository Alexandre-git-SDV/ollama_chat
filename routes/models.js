/**
 * ============================================
 *  ROUTES — Modèles Ollama
 * ============================================
 *  GET /api/models          → Liste des modèles installés
 *  GET /api/models/running  → Modèles actuellement chargés
 * ============================================
 */

const express = require('express');
const router  = express.Router();

const OLLAMA = 'http://localhost:11434';

/**
 * GET /api/models
 * Récupère tous les modèles installés via `ollama list`
 */
router.get('/', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA}/api/tags`);

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data   = response.headers.get('content-type')?.includes('json')
                   ? await response.json()
                   : { models: [] };

    // Formater proprement
    const models = (data.models || []).map(m => ({
      name:       m.name,
      size:       m.size,
      sizeHuman:  formatBytes(m.size),
      modified:   m.modified_at,
      family:     m.details?.family || 'unknown',
      parameters: m.details?.parameter_size || 'N/A',
      quantization: m.details?.quantization_level || 'N/A'
    }));

    res.json({ success: true, models });

  } catch (err) {
    console.error('❌ [models] Erreur:', err.message);
    res.status(502).json({
      success: false,
      error: 'Impossible de contacter Ollama. Lancez `ollama serve` d\'abord.'
    });
  }
});

/**
 * GET /api/models/running
 * Modèles actuellement en mémoire (ollama ps)
 */
router.get('/running', async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA}/api/ps`);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    res.json({ success: true, running: data.models || [] });

  } catch (err) {
    console.error('❌ [models/running] Erreur:', err.message);
    res.status(502).json({ success: false, error: err.message });
  }
});

/**
 * Convertit des octets en taille lisible
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = router;
