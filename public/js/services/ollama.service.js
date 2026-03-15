/**
 * ============================================
 *  Ollama Service — Communication avec l'API
 * ============================================
 */
var OllamaService = (function () {
  'use strict';

  /**
   * Vérifier la connexion
   */
  async function checkConnection() {
    try {
      const data = await ApiService.get('/health');
      return data.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Liste des modèles installés
   */
  async function listModels() {
    try {
      const data = await ApiService.get('/tags');
      return data.models || [];
    } catch (err) {
      console.error('[Ollama] listModels:', err);
      return [];
    }
  }

  /**
   * Modèles en cours d'exécution
   */
  async function runningModels() {
    try {
      const data = await ApiService.get('/ps');
      return data.models || [];
    } catch {
      return [];
    }
  }

  /**
   * Infos d'un modèle
   */
  async function showModel(modelName) {
    return ApiService.post('/show', { name: modelName });
  }

  /**
   * Charger un modèle en mémoire
   */
  async function loadModel(modelName) {
    return ApiService.post('/generate/load', { model: modelName });
  }

  /**
   * Décharger un modèle
   */
  async function unloadModel(modelName) {
    return ApiService.post('/generate/unload', { model: modelName });
  }

  /**
   * Version Ollama
   */
  async function getVersion() {
    try {
      const data = await ApiService.get('/version');
      return data.version || '—';
    } catch {
      return '—';
    }
  }

  /**
   * Chat streaming — retourne un AsyncGenerator
   * @param {Object} params { model, messages, temperature }
   * @param {AbortSignal} signal
   * @yields {{ token: string, done: boolean, ... }}
   */
  async function* chatStream(params, signal) {
    const res = await fetch(AppConfig.API_BASE + '/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Chat stream HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Garder le dernier fragment incomplet

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Support SSE format "data: {...}"
        const jsonStr = trimmed.startsWith('data: ')
          ? trimmed.slice(6)
          : trimmed;

        if (jsonStr === '[DONE]') return;

        try {
          const json = JSON.parse(jsonStr);

          if (json.token) {
            yield { token: json.token, done: false };
          }
          if (json.message && json.message.content) {
            yield { token: json.message.content, done: false };
          }
          if (json.done) {
            yield {
              token: '',
              done: true,
              total_duration: json.total_duration,
              eval_count: json.eval_count,
              eval_duration: json.eval_duration,
            };
          }
        } catch (e) {
          console.warn('[Ollama] JSON parse:', trimmed, e);
        }
      }
    }

    // Traiter le reste du buffer
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer.trim());
        if (json.message && json.message.content) {
          yield { token: json.message.content, done: false };
        }
        if (json.done) {
          yield {
            token: '',
            done: true,
            total_duration: json.total_duration,
            eval_count: json.eval_count,
            eval_duration: json.eval_duration,
          };
        }
      } catch (e) {
        console.warn('[Ollama] JSON parse final:', buffer, e);
      }
    }
  }

  /**
   * Générer un titre pour la conversation
   */
  async function generateTitle(model, messages) {
    try {
      const data = await ApiService.post('/chat/title', { model, messages });
      return data.title || 'Nouvelle conversation';
    } catch {
      return 'Nouvelle conversation';
    }
  }

  return {
    checkConnection,
    listModels,
    runningModels,
    showModel,
    loadModel,
    unloadModel,
    getVersion,
    chatStream,
    generateTitle,
  };
})();