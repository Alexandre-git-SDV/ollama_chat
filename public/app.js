/**
 * ============================================
 *  OLLAMA CHAT APP — Client JavaScript
 * ============================================
 *
 *  Routes API utilisées :
 *
 *  GET  /api/tags                          → Liste modèles installés
 *  GET  /api/ps                            → Modèles chargés en mémoire
 *  GET  /api/version                       → Version Ollama
 *  POST /api/show                          → Détails d'un modèle
 *  POST /api/generate/load                 → Charger un modèle
 *  POST /api/generate/unload               → Décharger un modèle
 *
 *  POST /api/chat/stream                   → Chat streaming SSE
 *  POST /api/chat/title                    → Générer un titre
 *  GET  /api/chat/conversations            → Lister les conversations
 *  GET  /api/chat/conversation/:id         → Charger une conversation
 *  POST /api/chat/conversation             → Créer une conversation
 *  POST /api/chat/conversation/:id/save    → Sauvegarder une conversation
 *  PUT  /api/chat/conversation/:id         → Renommer une conversation
 *  DELETE /api/chat/conversation/:id       → Supprimer une conversation
 *
 * ============================================
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════
  //  ÉTAT GLOBAL
  // ══════════════════════════════════════════

  const state = {
    currentModel: null,
    currentConversationId: null,
    messages: [],
    models: [],
    runningModels: [],
    isStreaming: false,
    abortController: null,
    theme: localStorage.getItem('theme') || 'dark',
    logoColor: localStorage.getItem('logoColor') || '#8b5cf6'
  };

  // ══════════════════════════════════════════
  //  ÉLÉMENTS DOM
  // ══════════════════════════════════════════

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    app:                 $('#app'),
    sidebar:             $('#sidebar'),
    conversationsNav:    $('#conversationsNav'),
    messagesContainer:   $('#messagesContainer'),
    welcomeScreen:       $('#welcomeScreen'),
    welcomeLogo:         $('#welcomeLogo'),
    userInput:           $('#userInput'),
    btnSend:             $('#btnSend'),
    btnStop:             $('#btnStop'),
    btnNewChat:          $('#btnNewChat'),
    btnModelSelect:      $('#btnModelSelect'),
    btnSidebarToggle:    $('#btnSidebarToggle'),
    btnTheme:            $('#btnTheme'),
    btnSettings:         $('#btnSettings'),
    btnModalClose:       $('#btnModalClose'),
    btnSettingsClose:    $('#btnSettingsClose'),
    modalOverlay:        $('#modalOverlay'),
    modalBody:           $('#modalBody'),
    settingsOverlay:     $('#settingsOverlay'),
    settingsModelsList:  $('#settingsModelsList'),
    modelName:           $('#modelName'),
    headerTitle:         $('#headerTitle'),
    toastContainer:      $('#toastContainer'),
    hljsThemeDark:       $('#hljs-theme-dark'),
    hljsThemeLight:      $('#hljs-theme-light'),
    themeIcon:           $('#themeIcon'),
    themeLabel:          $('#themeLabel'),
    ollamaVersion:       $('#ollamaVersion'),
    settingsActiveModel: $('#settingsActiveModel')
  };

  // ══════════════════════════════════════════
  //  ICÔNES SVG (remplace tous les emojis)
  // ══════════════════════════════════════════

  const ICONS = {
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
           <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
           </svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
            </svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
           <path d="m15 5 4 4"/>
           </svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
           <circle cx="12" cy="7" r="4"/>
           </svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
               <path d="M5 3v4"/><path d="M19 17v4"/>
               <path d="M3 5h4"/><path d="M17 19h4"/>
               </svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
           </svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>`,
    stop: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`
  };

  // ══════════════════════════════════════════
  //  UTILITAIRES
  // ══════════════════════════════════════════

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ══════════════════════════════════════════
  //  TOAST NOTIFICATIONS (sans emoji)
  // ══════════════════════════════════════════

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'error')   iconSvg = ICONS.error;
    if (type === 'success') iconSvg = ICONS.success;
    if (type === 'warning') iconSvg = ICONS.warning;

    toast.innerHTML = `
      ${iconSvg ? `<span class="toast-icon">${iconSvg}</span>` : ''}
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ══════════════════════════════════════════
  //  THÈME LIGHT / DARK
  // ══════════════════════════════════════════

  function initTheme() {
    applyTheme(state.theme);
    applyLogoColor(state.logoColor);
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme(state.theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Basculer les feuilles highlight.js
    if (theme === 'dark') {
      dom.hljsThemeDark.disabled  = false;
      dom.hljsThemeLight.disabled = true;
    } else {
      dom.hljsThemeDark.disabled  = true;
      dom.hljsThemeLight.disabled = false;
    }

    // Mettre à jour l'icône et le label du bouton thème
    if (dom.themeIcon) {
      dom.themeIcon.outerHTML = theme === 'dark' ? ICONS.moon : ICONS.sun;
      // Re-cacher la référence (l'icône a été remplacée)
      dom.themeIcon = null;
    }
    if (dom.themeLabel) {
      dom.themeLabel.textContent = theme === 'dark' ? 'Thème sombre' : 'Thème clair';
    }

    // Re-highlight tous les blocs de code existants
    $$('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  function applyLogoColor(color) {
    document.documentElement.style.setProperty('--logo-color', color);
    state.logoColor = color;
    localStorage.setItem('logoColor', color);
  }

  // ══════════════════════════════════════════
  //  MARKDOWN → HTML (avec highlight.js)
  // ══════════════════════════════════════════

  function initMarked() {
    if (typeof marked === 'undefined') return;

    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (_) { /* ignore */ }
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true
    });
  }

  function renderMarkdown(text) {
    if (typeof marked !== 'undefined' && text) {
      try {
        return marked.parse(text);
      } catch (_) { /* fallback */ }
    }
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  // ══════════════════════════════════════════
  //  API — MODÈLES
  // ══════════════════════════════════════════

  /**
   * GET /api/tags → Liste des modèles installés
   */
  async function fetchModels() {
    try {
      const res  = await fetch('/api/tags');
      const data = await res.json();
      if (data.success && data.models) {
        state.models = data.models;
        return data.models;
      }
      throw new Error(data.error || 'Erreur inconnue');
    } catch (err) {
      console.error('Erreur fetchModels:', err);
      showToast('Impossible de charger les modèles. Ollama est-il lancé ?', 'error');
      return [];
    }
  }

  /**
   * GET /api/ps → Modèles chargés en mémoire
   */
  async function fetchRunningModels() {
    try {
      const res  = await fetch('/api/ps');
      const data = await res.json();
      if (data.success) {
        state.runningModels = data.running || [];
        return state.runningModels;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /**
   * POST /api/show → Détails d'un modèle
   */
  async function fetchModelDetails(modelName) {
    try {
      const res  = await fetch('/api/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      const data = await res.json();
      if (data.success) return data.info;
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * GET /api/version → Version d'Ollama
   */
  async function fetchOllamaVersion() {
    try {
      const res  = await fetch('/api/version');
      const data = await res.json();
      if (data.success) return data.version;
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * POST /api/generate/load → Charger un modèle en mémoire
   */
  async function loadModel(modelName) {
    try {
      const res  = await fetch('/api/generate/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Modèle "${modelName}" chargé`, 'success');
        return true;
      }
      throw new Error(data.error || 'Erreur inconnue');
    } catch (err) {
      showToast(`Erreur chargement : ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * POST /api/generate/unload → Décharger un modèle
   */
  async function unloadModel(modelName) {
    try {
      const res  = await fetch('/api/generate/unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Modèle "${modelName}" déchargé`, 'success');
        return true;
      }
      throw new Error(data.error || 'Erreur inconnue');
    } catch (err) {
      showToast(`Erreur déchargement : ${err.message}`, 'error');
      return false;
    }
  }

  // ══════════════════════════════════════════
  //  API — CONVERSATIONS
  // ══════════════════════════════════════════

  /**
   * GET /api/chat/conversations
   */
  async function fetchConversations() {
    try {
      const res  = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data.success) return data.conversations || [];
      return [];
    } catch (_) {
      return [];
    }
  }

  /**
   * GET /api/chat/conversation/:id
   */
  async function fetchConversation(id) {
    try {
      const res  = await fetch(`/api/chat/conversation/${id}`);
      const data = await res.json();
      if (data.success) return data.conversation;
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * POST /api/chat/conversation → Créer nouvelle
   */
  async function createConversation(model) {
    try {
      const res  = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      const data = await res.json();
      if (data.success) return data.conversation;
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * POST /api/chat/conversation/:id/save
   */
  async function saveConversation(id, payload) {
    try {
      await fetch(`/api/chat/conversation/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Erreur saveConversation:', err);
    }
  }

  /**
   * PUT /api/chat/conversation/:id → Renommer
   */
  async function renameConversation(id, title) {
    try {
      const res  = await fetch(`/api/chat/conversation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      return data.success;
    } catch (_) {
      return false;
    }
  }

  /**
   * DELETE /api/chat/conversation/:id
   */
  async function deleteConversation(id) {
    try {
      const res  = await fetch(`/api/chat/conversation/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return data.success;
    } catch (_) {
      return false;
    }
  }

  /**
   * POST /api/chat/title → Générer un titre automatique
   */
  async function generateTitle(model, userMessage) {
    try {
      const res  = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, message: userMessage })
      });
      const data = await res.json();
      if (data.success) return data.title;
      return null;
    } catch (_) {
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  STREAMING SSE — CORRIGÉ
  // ══════════════════════════════════════════

  /**
   * POST /api/chat/stream
   * Envoie les messages et reçoit la réponse en SSE
   *
   * @param {string}   model      — Nom du modèle
   * @param {Array}    messages   — Historique des messages
   * @param {Function} onToken    — Callback appelé pour chaque token reçu
   * @param {Function} onDone     — Callback appelé quand le stream est terminé
   * @param {Function} onError    — Callback appelé en cas d'erreur
   */
  function streamChat(model, messages, onToken, onDone, onError) {
    const abortController = new AbortController();
    state.abortController = abortController;

    fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages }),
      signal: abortController.signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let lastMetrics = null;

      function processChunk() {
        reader.read().then(({ done, value }) => {
          if (done) {
            // Traiter le buffer restant
            if (buffer.trim()) {
              processSSELines(buffer);
            }
            onDone(fullText, lastMetrics);
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          // Traiter toutes les lignes SSE complètes
          processSSELines(buffer);

          // Continuer la lecture
          processChunk();
        }).catch(err => {
          if (err.name === 'AbortError') {
            onDone(fullText, lastMetrics);
          } else {
            onError(err.message);
          }
        });
      }

      function processSSELines(raw) {
        const lines = raw.split('\n');
        // Garder la dernière ligne incomplète dans le buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Ignorer les lignes vides et les commentaires SSE
          if (!trimmed || trimmed.startsWith(':')) continue;

          // Ligne "data: ..."
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);

            // Signal de fin
            if (jsonStr === '[DONE]') {
              // onDone sera appelé quand le reader signale done
              continue;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              // ── Token de contenu ──
              if (parsed.token) {
                fullText += parsed.token;
                onToken(parsed.token, fullText);
              }

              // ── Chunk complet avec message.content ──
              if (parsed.message && parsed.message.content) {
                fullText += parsed.message.content;
                onToken(parsed.message.content, fullText);
              }

              // ── Métriques de fin ──
              if (parsed.done === true) {
                lastMetrics = {
                  total_duration: parsed.total_duration,
                  eval_count:     parsed.eval_count,
                  eval_duration:  parsed.eval_duration
                };
              }

              // ── Erreur envoyée par le serveur ──
              if (parsed.error) {
                onError(parsed.error);
                return;
              }
            } catch (_) {
              // Ligne JSON invalide, ignorer
            }
          }
        }
      }

      processChunk();
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        // L'utilisateur a annulé, pas une erreur
        return;
      }
      onError(err.message);
    });
  }

  /**
   * Arrêter le streaming en cours
   */
  function stopStreaming() {
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
    setStreamingState(false);
  }

  // ══════════════════════════════════════════
  //  INTERFACE — MESSAGES
  // ══════════════════════════════════════════

  function clearMessages() {
    dom.messagesContainer.innerHTML = '';
    dom.welcomeScreen && dom.messagesContainer.appendChild(dom.welcomeScreen);
  }

  function showWelcome(show) {
    if (dom.welcomeScreen) {
      dom.welcomeScreen.classList.toggle('hidden', !show);
    }
  }

  /**
   * Créer un élément message dans le DOM
   */
  function createMessageElement(role, content, isStreaming = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? ICONS.user : ICONS.sparkles;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const msgContent = document.createElement('div');
    msgContent.className = 'msg-content';

    if (isStreaming) {
      msgContent.innerHTML = '<span class="cursor-blink">|</span>';
      msgDiv.setAttribute('data-streaming', 'true');
    } else {
      msgContent.innerHTML = renderMarkdown(content);
    }

    bubble.appendChild(msgContent);

    // Bouton copier pour les messages assistant
    if (role === 'assistant' && !isStreaming) {
      const actions = createMessageActions(content);
      bubble.appendChild(actions);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);

    return msgDiv;
  }

  /**
   * Créer les boutons d'action du message (copier)
   */
  function createMessageActions(content) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const btnCopy = document.createElement('button');
    btnCopy.className = 'btn-msg-action';
    btnCopy.innerHTML = `${ICONS.copy} <span>Copier</span>`;
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        btnCopy.innerHTML = `${ICONS.check} <span>Copié</span>`;
        setTimeout(() => {
          btnCopy.innerHTML = `${ICONS.copy} <span>Copier</span>`;
        }, 2000);
      });
    });

    actions.appendChild(btnCopy);
    return actions;
  }

  /**
   * Mettre à jour un message en streaming avec le nouveau contenu
   */
  function updateStreamingMessage(msgDiv, fullText) {
    const msgContent = msgDiv.querySelector('.msg-content');
    if (!msgContent) return;

    msgContent.innerHTML = renderMarkdown(fullText) + '<span class="cursor-blink">|</span>';
    scrollToBottom();
  }

  /**
   * Finaliser un message en streaming (retirer le curseur, ajouter les actions)
   */
  function finalizeStreamingMessage(msgDiv, fullText) {
    msgDiv.removeAttribute('data-streaming');

    const msgContent = msgDiv.querySelector('.msg-content');
    if (!msgContent) return;

    msgContent.innerHTML = renderMarkdown(fullText);

    // Ajouter la coloration syntaxique aux blocs de code
    msgDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });

    // Ajouter les boutons de copie sur les blocs de code
    addCodeCopyButtons(msgDiv);

    // Ajouter les actions de message
    const bubble = msgDiv.querySelector('.message-bubble');
    if (bubble) {
      const actions = createMessageActions(fullText);
      bubble.appendChild(actions);
    }
  }

  /**
   * Ajouter un bouton "Copier" sur chaque bloc de code
   */
  function addCodeCopyButtons(container) {
    container.querySelectorAll('pre').forEach((pre) => {
      // Éviter les doublons
      if (pre.querySelector('.code-header')) return;

      const code = pre.querySelector('code');
      if (!code) return;

      // Détecter le langage
      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '') : '';

      const header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `
        <span>${escapeHtml(lang)}</span>
        <button class="btn-copy-code">${ICONS.copy} Copier</button>
      `;

      const btnCopy = header.querySelector('.btn-copy-code');
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(code.textContent).then(() => {
          btnCopy.innerHTML = `${ICONS.check} Copié`;
          setTimeout(() => {
            btnCopy.innerHTML = `${ICONS.copy} Copier`;
          }, 2000);
        });
      });

      pre.insertBefore(header, pre.firstChild);
    });
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
    });
  }

  // ══════════════════════════════════════════
  //  INTERFACE — ÉTAT STREAMING
  // ══════════════════════════════════════════

  function setStreamingState(streaming) {
    state.isStreaming = streaming;

    dom.btnSend.classList.toggle('hidden', streaming);
    dom.btnStop.classList.toggle('hidden', !streaming);
    dom.userInput.disabled = streaming;

    if (!streaming) {
      dom.userInput.focus();
    }
  }

  // ══════════════════════════════════════════
  //  INTERFACE — MODAL MODÈLES
  // ══════════════════════════════════════════

  function openModelModal() {
    dom.modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderModelList();
  }

  function closeModelModal() {
    dom.modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function renderModelList() {
    dom.modalBody.innerHTML = '<div class="modal-loading">Recherche des modèles…</div>';

    const [models, running] = await Promise.all([
      fetchModels(),
      fetchRunningModels()
    ]);

    const runningNames = running.map(r => r.name || r.model);

    if (models.length === 0) {
      dom.modalBody.innerHTML = `
        <div class="modal-loading">Aucun modèle trouvé. Installez un modèle avec <code>ollama pull</code></div>`;
      return;
    }

    let html = '';
    for (const model of models) {
      const isActive  = state.currentModel === model.name;
      const isRunning = runningNames.some(n => n.startsWith(model.name.split(':')[0]));
      const size      = model.size ? formatBytes(model.size) : '';

      html += `
        <div class="model-item ${isActive ? 'active' : ''}" data-model="${escapeHtml(model.name)}">
          <div class="model-item-info">
            <span class="model-item-name">${escapeHtml(model.name)}</span>
            <span class="model-item-meta">${size}</span>
          </div>
          <div class="model-item-status">
            <span class="status-dot ${isRunning ? 'running' : 'stopped'}"></span>
            <span>${isRunning ? 'En mémoire' : 'Inactif'}</span>
          </div>
        </div>`;
    }

    dom.modalBody.innerHTML = html;

    // Bind click → sélectionner le modèle et fermer la modal
    dom.modalBody.querySelectorAll('.model-item').forEach((el) => {
      el.addEventListener('click', () => {
        const modelName = el.getAttribute('data-model');
        selectModel(modelName);
        closeModelModal();
      });
    });
  }

  // ══════════════════════════════════════════
  //  INTERFACE — MODAL PARAMÈTRES
  // ══════════════════════════════════════════

  function openSettingsModal() {
    dom.settingsOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderSettingsContent();
  }

  function closeSettingsModal() {
    dom.settingsOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function renderSettingsContent() {
    // ── Version Ollama ──
    const version = await fetchOllamaVersion();
    if (dom.ollamaVersion) {
      dom.ollamaVersion.textContent = version || 'Non disponible';
    }

    // ── Modèle actif ──
    if (dom.settingsActiveModel) {
      dom.settingsActiveModel.textContent = state.currentModel || 'Aucun';
    }

    // ── Liste des modèles avec boutons charger/décharger ──
    const [models, running] = await Promise.all([
      fetchModels(),
      fetchRunningModels()
    ]);

    const runningNames = running.map(r => r.name || r.model);

    if (models.length === 0) {
      dom.settingsModelsList.innerHTML = `
        <div class="settings-loading">Aucun modèle installé</div>`;
    } else {
      let html = '';
      for (const model of models) {
        const isRunning = runningNames.some(n => n.startsWith(model.name.split(':')[0]));
        html += `
          <div class="settings-model-row">
            <div>
              <span class="settings-model-name">${escapeHtml(model.name)}</span>
              <span class="model-item-status" style="margin-left:8px;">
                <span class="status-dot ${isRunning ? 'running' : 'stopped'}"></span>
              </span>
            </div>
            <div class="settings-model-actions">
              ${isRunning
                ? `<button class="btn-model-control btn-model-unload" data-model="${escapeHtml(model.name)}">
                     ${ICONS.stop} Arrêter
                   </button>`
                : `<button class="btn-model-control btn-model-load" data-model="${escapeHtml(model.name)}">
                     ${ICONS.play} Démarrer
                   </button>`
              }
            </div>
          </div>`;
      }
      dom.settingsModelsList.innerHTML = html;

      // Bind boutons charger
      dom.settingsModelsList.querySelectorAll('.btn-model-load').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const name = btn.getAttribute('data-model');
          btn.disabled = true;
          btn.innerHTML = 'Chargement…';
          await loadModel(name);
          renderSettingsContent(); // Rafraîchir
        });
      });

      // Bind boutons décharger
      dom.settingsModelsList.querySelectorAll('.btn-model-unload').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const name = btn.getAttribute('data-model');
          btn.disabled = true;
          btn.innerHTML = 'Arrêt…';
          await unloadModel(name);
          renderSettingsContent(); // Rafraîchir
        });
      });
    }

    // ── Color swatches ──
    $$('.color-swatch').forEach((swatch) => {
      const color = swatch.getAttribute('data-color');

      // Marquer la couleur active
      swatch.classList.toggle('active', color === state.logoColor);

      swatch.addEventListener('click', () => {
        applyLogoColor(color);
        // Mettre à jour les classes active
        $$('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });
  }

  // ══════════════════════════════════════════
  //  INTERFACE — SIDEBAR CONVERSATIONS
  // ══════════════════════════════════════════

  async function renderConversationsList() {
    const conversations = await fetchConversations();

    if (conversations.length === 0) {
      dom.conversationsNav.innerHTML = `
        <div class="conv-empty">Aucune conversation</div>`;
      return;
    }

    let html = '';
    for (const conv of conversations) {
      const isActive = state.currentConversationId === conv.id;
      html += `
        <div class="conv-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
          <div class="conv-item-title" data-id="${conv.id}">
            ${escapeHtml(conv.title)}
          </div>
          <div class="conv-item-actions">
            <button class="conv-btn-rename" data-id="${conv.id}" title="Renommer">
              ${ICONS.edit}
            </button>
            <button class="conv-btn-delete" data-id="${conv.id}" title="Supprimer">
              ${ICONS.trash}
            </button>
          </div>
        </div>`;
    }
    dom.conversationsNav.innerHTML = html;

    // ── Click pour ouvrir une conversation ──
    dom.conversationsNav.querySelectorAll('.conv-item-title').forEach((el) => {
      el.addEventListener('click', () => {
        loadConversation(el.getAttribute('data-id'));
      });
    });

    // ── Click renommer ──
    dom.conversationsNav.querySelectorAll('.conv-btn-rename').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const titleEl = btn.closest('.conv-item').querySelector('.conv-item-title');
        const currentTitle = titleEl.textContent.trim();
        const newTitle = prompt('Nouveau nom :', currentTitle);
        if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
          const success = await renameConversation(id, newTitle.trim());
          if (success) {
            renderConversationsList();
            if (state.currentConversationId === id) {
              dom.headerTitle.textContent = newTitle.trim();
            }
          }
        }
      });
    });

    // ── Click supprimer ──
    dom.conversationsNav.querySelectorAll('.conv-btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Supprimer cette conversation ?')) {
          const success = await deleteConversation(id);
          if (success) {
            if (state.currentConversationId === id) {
              newConversation();
            }
            renderConversationsList();
            showToast('Conversation supprimée', 'success');
          }
        }
      });
    });
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — CONVERSATIONS
  // ══════════════════════════════════════════

  /**
   * Nouvelle conversation vierge
   */
  function newConversation() {
    state.currentConversationId = null;
    state.messages = [];
    dom.headerTitle.textContent = 'Ollama Chat';
    dom.messagesContainer.innerHTML = '';
    dom.messagesContainer.appendChild(dom.welcomeScreen);
    showWelcome(true);
    renderConversationsList();
  }

  /**
   * Charger une conversation existante
   */
  async function loadConversation(id) {
    const conv = await fetchConversation(id);
    if (!conv) {
      showToast('Conversation introuvable', 'error');
      return;
    }

    state.currentConversationId = id;
    state.messages = conv.messages || [];
    dom.headerTitle.textContent = conv.title || 'Conversation';

    if (conv.model && state.models.find(m => m.name === conv.model)) {
      selectModel(conv.model, false);
    }

    // Afficher les messages
    dom.messagesContainer.innerHTML = '';
    showWelcome(false);

    for (const msg of state.messages) {
      const el = createMessageElement(msg.role, msg.content, false);
      dom.messagesContainer.appendChild(el);
      addCodeCopyButtons(el);
    }

    scrollToBottom();
    renderConversationsList();

    // Fermer la sidebar sur mobile
    if (window.innerWidth < 768) {
      dom.sidebar.classList.add('collapsed');
    }
  }

  /**
   * Sélectionner un modèle
   */
  function selectModel(modelName, save = true) {
    state.currentModel = modelName;
    dom.modelName.textContent = modelName;
    if (save) {
      localStorage.setItem('selectedModel', modelName);
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — ENVOI DE MESSAGE
  // ══════════════════════════════════════════

  async function sendMessage() {
    const text = dom.userInput.value.trim();
    if (!text || state.isStreaming) return;

    if (!state.currentModel) {
      showToast('Veuillez sélectionner un modèle', 'warning');
      return;
    }

    // Créer une conversation si nécessaire
    if (!state.currentConversationId) {
      const conv = await createConversation(state.currentModel);
      if (!conv) {
        showToast('Impossible de créer la conversation', 'error');
        return;
      }
      state.currentConversationId = conv.id;
      dom.headerTitle.textContent = conv.title || 'Nouvelle conversation';
    }

    // Masquer le welcome
    showWelcome(false);

    // Ajouter le message utilisateur
    const userMessage = { role: 'user', content: text };
    state.messages.push(userMessage);

    const userDiv = createMessageElement('user', text);
    dom.messagesContainer.appendChild(userDiv);
    scrollToBottom();

    // Vider le champ de saisie
    dom.userInput.value = '';
    autoResizeTextarea();

    // Créer le placeholder de la réponse assistant (streaming)
    const assistantDiv = createMessageElement('assistant', '', true);
    dom.messagesContainer.appendChild(assistantDiv);
    scrollToBottom();

    // Passer en mode streaming
    setStreamingState(true);

    // Lancer le streaming
    streamChat(
      state.currentModel,
      state.messages,
      // onToken — appelé pour chaque token reçu
      (token, fullText) => {
        updateStreamingMessage(assistantDiv, fullText);
      },
      // onDone — appelé quand le stream est terminé
      async (fullText, metrics) => {
        // Finaliser le message dans le DOM
        finalizeStreamingMessage(assistantDiv, fullText);
        setStreamingState(false);

        // Ajouter la réponse dans l'état
        if (fullText.trim()) {
          state.messages.push({ role: 'assistant', content: fullText });
        }

        // Sauvegarder la conversation
        if (state.currentConversationId) {
          await saveConversation(state.currentConversationId, {
            messages: state.messages,
            model: state.currentModel
          });
        }

        // Générer un titre si c'est le premier échange
        if (state.messages.length === 2 && state.currentConversationId) {
          const title = await generateTitle(state.currentModel, text);
          if (title) {
            dom.headerTitle.textContent = title;
            await saveConversation(state.currentConversationId, { title });
            renderConversationsList();
          }
        }

        // Log métriques si disponibles
        if (metrics && metrics.total_duration) {
          const totalSec = (metrics.total_duration / 1e9).toFixed(1);
          const tokensPerSec = metrics.eval_count && metrics.eval_duration
            ? (metrics.eval_count / (metrics.eval_duration / 1e9)).toFixed(1)
            : '?';
          console.log(`Performance: ${totalSec}s | ${tokensPerSec} tokens/s | ${metrics.eval_count || '?'} tokens`);
        }
      },
      // onError — appelé en cas d'erreur
      (error) => {
        finalizeStreamingMessage(assistantDiv, `Erreur : ${error}`);
        setStreamingState(false);
        showToast(error, 'error');
      }
    );
  }

  // ══════════════════════════════════════════
  //  TEXTAREA AUTO-RESIZE
  // ══════════════════════════════════════════

  function autoResizeTextarea() {
    const el = dom.userInput;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';

    // Activer/désactiver le bouton envoyer
    dom.btnSend.disabled = !el.value.trim();
  }

  // ══════════════════════════════════════════
  //  UTILITAIRES
  // ══════════════════════════════════════════

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k     = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i     = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ══════════════════════════════════════════
  //  ÉVÉNEMENTS
  // ══════════════════════════════════════════

  function bindEvents() {
    // ── Envoi de message ──
    dom.btnSend.addEventListener('click', sendMessage);

    dom.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    dom.userInput.addEventListener('input', autoResizeTextarea);

    // ── Arrêter le streaming ──
    dom.btnStop.addEventListener('click', stopStreaming);

    // ── Nouvelle conversation ──
    dom.btnNewChat.addEventListener('click', newConversation);

    // ── Toggle sidebar ──
    dom.btnSidebarToggle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('collapsed');
    });

    // ── Thème ──
    dom.btnTheme.addEventListener('click', toggleTheme);

    // ── Modal modèles : ouverture ──
    dom.btnModelSelect.addEventListener('click', openModelModal);

    // ── Modal modèles : fermeture ──
    dom.btnModalClose.addEventListener('click', closeModelModal);

    dom.modalOverlay.addEventListener('click', (e) => {
      // Fermer si on clique sur l'overlay (pas sur le contenu de la modal)
      if (e.target === dom.modalOverlay) {
        closeModelModal();
      }
    });

    // ── Modal paramètres : ouverture ──
    dom.btnSettings.addEventListener('click', openSettingsModal);

    // ── Modal paramètres : fermeture ──
    dom.btnSettingsClose.addEventListener('click', closeSettingsModal);

    dom.settingsOverlay.addEventListener('click', (e) => {
      if (e.target === dom.settingsOverlay) {
        closeSettingsModal();
      }
    });

    // ── Fermer sidebar en cliquant sur main (mobile) ──
    dom.messagesContainer.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        dom.sidebar.classList.add('collapsed');
      }
    });

    // ── Raccourci Escape ──
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dom.modalOverlay.classList.contains('hidden')) {
          closeModelModal();
        }
        if (!dom.settingsOverlay.classList.contains('hidden')) {
          closeSettingsModal();
        }
        if (state.isStreaming) {
          stopStreaming();
        }
      }
    });
  }

  // ══════════════════════════════════════════
  //  INITIALISATION
  // ══════════════════════════════════════════

  async function init() {
    initTheme();
    initMarked();
    bindEvents();

    // Charger les modèles
    const models = await fetchModels();

    // Restaurer le modèle sélectionné
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel && models.find(m => m.name === savedModel)) {
      selectModel(savedModel);
    } else if (models.length > 0) {
      selectModel(models[0].name);
    } else {
      dom.modelName.textContent = 'Aucun modèle';
    }

    // Charger les conversations
    await renderConversationsList();

    // Focus sur le champ de saisie
    dom.userInput.focus();

    console.log('Ollama Chat App initialisée');
  }

  // Lancer l'app quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();