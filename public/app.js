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
 *  GET  /api/health                        → Vérification connexion
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
  //  BANNER CONSOLE
  // ══════════════════════════════════════════

  const PORT = location.port || (location.protocol === 'https:' ? '443' : '80');

  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   🤖  Ollama Chat App                     ║');
  console.log(`  ║   🌐  http://localhost:${PORT}               ║`);
  console.log('  ║   📡  Ollama: http://127.0.0.1:11434      ║');
  console.log('  ║   📚  Client: ollama-js officiel          ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');

  // ══════════════════════════════════════════
  //  ÉTAT GLOBAL
  // ══════════════════════════════════════════

  const state = {
    theme:                 localStorage.getItem('theme') || 'dark',
    logoColor:             localStorage.getItem('logoColor') || '#10b981',
    currentModel:          localStorage.getItem('selectedModel') || '',
    currentConversationId: null,
    messages:              [],
    conversations:         [],
    models:                [],
    runningModels:         [],
    isStreaming:            false,
    abortController:       null,
    connected:             false
  };

  // ══════════════════════════════════════════
  //  HELPERS DOM
  // ══════════════════════════════════════════

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

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
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
               <path d="M5 3v4"/><path d="M19 17v4"/>
               <path d="M3 5h4"/><path d="M17 19h4"/>
               </svg>`,
    bot: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
          <path d="M2 14h2"/><path d="M20 14h2"/>
          <path d="M15 13v2"/><path d="M9 13v2"/>
          </svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
           <circle cx="12" cy="7" r="4"/>
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
          <path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/>
          <path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/>
          </svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
           </svg>`,
    stop: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <rect width="14" height="14" x="5" y="5" rx="2"/>
           </svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="currentColor" stroke="none">
           <polygon points="6 3 20 12 6 21 6 3"/>
           </svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M5 12h14"/><path d="M12 5v14"/>
           </svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
           </svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
              </svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
               <circle cx="12" cy="12" r="3"/>
               </svg>`,
    sidebar: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              </svg>`,
    chat: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
           </svg>`,
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
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="12" cy="12" r="10"/>
           <path d="M12 16v-4"/><path d="M12 8h.01"/>
           </svg>`
  };

  // ══════════════════════════════════════════
  //  UTILITAIRES
  // ══════════════════════════════════════════

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatBytes(bytes) {
    if (!bytes) return '?';
    const gb = bytes / 1e9;
    if (gb >= 1) return gb.toFixed(1) + ' GB';
    return (bytes / 1e6).toFixed(0) + ' MB';
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  }

  // ══════════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ══════════════════════════════════════════

  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    // Animation entrée
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ══════════════════════════════════════════
  //  THÈME (DARK / LIGHT)
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
    if (dom.hljsThemeDark) {
      dom.hljsThemeDark.disabled = theme !== 'dark';
    }
    if (dom.hljsThemeLight) {
      dom.hljsThemeLight.disabled = theme !== 'light';
    }

    // Mettre à jour l'icône et le label du bouton thème
    if (dom.themeIcon) {
      dom.themeIcon.innerHTML = theme === 'dark' ? ICONS.moon : ICONS.sun;
    }
    if (dom.themeLabel) {
      dom.themeLabel.textContent = theme === 'dark' ? 'Thème sombre' : 'Thème clair';
    }

    // Re-highlight tous les blocs de code existants
    if (typeof hljs !== 'undefined') {
      $$('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  function applyLogoColor(color) {
    document.documentElement.style.setProperty('--logo-color', color);
    state.logoColor = color;
    localStorage.setItem('logoColor', color);
  }

  // ══════════════════════════════════════════
  //  MARKDOWN → HTML (avec highlight.js)
  // ══════════════════════════════════════════

  let codeBlockCounter = 0;

  function markdownToHtml(text) {
    if (!text) return '';

    let html = escapeHtml(text);

    // ── Code blocks ```lang\n...\n``` ──
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const id = 'code-block-' + (++codeBlockCounter);
      const langLabel = lang || 'code';
      return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">${escapeHtml(langLabel)}</span>
          <button class="copy-code-btn" onclick="window.__copyCode('${id}')">
            ${ICONS.copy} Copier
          </button>
        </div>
        <pre><code id="${id}" class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code"> $ 1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong> $ 1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em> $ 1</em>');

    // Headers
    html = html.replace(/^### (.+) $ /gm, '<h3> $ 1</h3>');
    html = html.replace(/^## (.+) $ /gm, '<h2> $ 1</h2>');
    html = html.replace(/^# (.+) $ /gm, '<h1> $ 1</h1>');

    // Blockquote
    html = html.replace(/^&gt; (.+) $ /gm, '<blockquote> $ 1</blockquote>');

    // Unordered lists
    html = html.replace(/^[-*] (.+) $ /gm, '<li> $ 1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul> $ 1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');

    return html;
  }

  // Global copy helper
  window.__copyCode = function (id) {
    const codeEl = document.getElementById(id);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        showToast('Code copié !', 'success');
      });
    }
  };

  // ══════════════════════════════════════════
  //  HIGHLIGHT.JS — post-rendu
  // ══════════════════════════════════════════

  function highlightCodeBlocks(container) {
    if (typeof hljs === 'undefined') return;
    const blocks = (container || document).querySelectorAll('pre code');
    blocks.forEach((block) => {
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  }

  // ══════════════════════════════════════════
  //  API — FETCH HELPERS
  // ══════════════════════════════════════════

  async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function apiPut(url, body) {
    const res = await fetch(url, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function apiDelete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ══════════════════════════════════════════
  //  API — CONNEXION & VERSION
  // ══════════════════════════════════════════

  /**
   * GET /api/health → { success, connected, host }
   */
  async function checkConnection() {
    try {
      const data = await apiGet('/api/health');
      state.connected = data.connected === true;

      // Mettre à jour l'UI de statut si besoin
      document.body.classList.toggle('ollama-connected', state.connected);
      document.body.classList.toggle('ollama-disconnected', !state.connected);

      return state.connected;
    } catch (_) {
      state.connected = false;
      document.body.classList.add('ollama-disconnected');
      document.body.classList.remove('ollama-connected');
      return false;
    }
  }

  /**
   * GET /api/version → Version Ollama
   */
  async function fetchOllamaVersion() {
    try {
      const data = await apiGet('/api/version');
      if (data.success && data.version) {
        if (dom.ollamaVersion) {
          dom.ollamaVersion.textContent = `Ollama v${data.version}`;
        }
        return data.version;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  API — MODÈLES
  // ══════════════════════════════════════════

  /**
   * GET /api/tags → Liste modèles installés
   */
  async function fetchModels() {
    try {
      const data = await apiGet('/api/tags');
      if (!data.success) throw new Error(data.error || 'Erreur');

      state.models = data.models || [];
      console.log('📋 Modèles disponibles:', state.models.map(m => m.name));

      return state.models;
    } catch (err) {
      console.error('❌ Erreur fetchModels:', err.message);
      state.models = [];
      throw err;
    }
  }

  /**
   * GET /api/ps → Modèles chargés en mémoire
   */
  async function fetchRunningModels() {
    try {
      const data = await apiGet('/api/ps');
      if (data.success) {
        state.runningModels = data.running || [];
        return state.runningModels;
      }
      return [];
    } catch (_) {
      state.runningModels = [];
      return [];
    }
  }

  /**
   * POST /api/show → Détails d'un modèle
   */
  async function fetchModelDetails(modelName) {
    try {
      const data = await apiPost('/api/show', { name: modelName });
      if (data.success) return data.info;
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * POST /api/generate/load → Charger un modèle en mémoire
   */
  async function loadModelInMemory(modelName) {
    try {
      const data = await apiPost('/api/generate/load', { name: modelName });
      if (data.success) {
        showToast(`Modèle "${modelName}" chargé`, 'success');
        return true;
      }
      throw new Error(data.error);
    } catch (err) {
      showToast(`Erreur chargement: ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * POST /api/generate/unload → Décharger un modèle
   */
  async function unloadModelFromMemory(modelName) {
    try {
      const data = await apiPost('/api/generate/unload', { name: modelName });
      if (data.success) {
        showToast(`Modèle "${modelName}" déchargé`, 'success');
        return true;
      }
      throw new Error(data.error);
    } catch (err) {
      showToast(`Erreur déchargement: ${err.message}`, 'error');
      return false;
    }
  }

  // ══════════════════════════════════════════
  //  API — CONVERSATIONS (CRUD)
  // ══════════════════════════════════════════

  /**
   * GET /api/chat/conversations → Liste des conversations
   */
  async function fetchConversations() {
    try {
      const data = await apiGet('/api/chat/conversations');
      if (data.success) {
        state.conversations = data.conversations || [];
        return state.conversations;
      }
      return [];
    } catch (err) {
      console.error('❌ Erreur fetchConversations:', err.message);
      return [];
    }
  }

  /**
   * POST /api/chat/conversation → Créer une conversation
   */
  async function createConversation(model) {
    try {
      const data = await apiPost('/api/chat/conversation', {
        title: 'Nouvelle conversation',
        model: model
      });
      if (data.success && data.conversation) {
        // Recharger la liste
        await fetchConversations();
        renderConversationsList();
        return data.conversation;
      }
      return null;
    } catch (err) {
      console.error('❌ Erreur createConversation:', err.message);
      return null;
    }
  }

  /**
   * GET /api/chat/conversation/:id → Charger une conversation
   */
  async function loadConversation(id) {
    try {
      const data = await apiGet(`/api/chat/conversation/${id}`);
      if (!data.success || !data.conversation) {
        throw new Error('Conversation introuvable');
      }

      const conv = data.conversation;
      state.currentConversationId = conv.id;
      state.messages = conv.messages || [];

      // Mettre à jour le titre
      if (dom.headerTitle) {
        dom.headerTitle.textContent = conv.title || 'Conversation';
      }

      // Sélectionner le modèle de la conversation
      if (conv.model && state.models.some(m => m.name === conv.model)) {
        selectModel(conv.model, false);
      }

      // Afficher les messages
      renderMessages();
      showWelcome(false);
      highlightActiveConversation();

    } catch (err) {
      console.error('❌ Erreur loadConversation:', err.message);
      showToast('Erreur chargement conversation', 'error');
    }
  }

  /**
   * POST /api/chat/conversation/:id/save → Sauvegarder messages
   */
  async function saveConversation() {
    if (!state.currentConversationId) return;
    try {
      await apiPost(`/api/chat/conversation/${state.currentConversationId}/save`, {
        messages: state.messages.map(m => ({
          role:    m.role,
          content: m.content,
          meta:    m.meta || undefined
        })),
        model: state.currentModel
      });
    } catch (err) {
      console.error('❌ Erreur saveConversation:', err.message);
    }
  }

  /**
   * PUT /api/chat/conversation/:id → Renommer
   */
  async function renameConversation(id, newTitle) {
    try {
      const data = await apiPut(`/api/chat/conversation/${id}`, { title: newTitle });
      if (data.success) {
        await fetchConversations();
        renderConversationsList();
        if (state.currentConversationId === id && dom.headerTitle) {
          dom.headerTitle.textContent = newTitle;
        }
      }
    } catch (err) {
      console.error('❌ Erreur renameConversation:', err.message);
    }
  }

  /**
   * DELETE /api/chat/conversation/:id → Supprimer
   */
  async function deleteConversation(id) {
    try {
      const data = await apiDelete(`/api/chat/conversation/${id}`);
      if (data.success) {
        // Si c'est la conversation active, réinitialiser
        if (state.currentConversationId === id) {
          state.currentConversationId = null;
          state.messages = [];
          if (dom.messagesContainer) dom.messagesContainer.innerHTML = '';
          if (dom.headerTitle) dom.headerTitle.textContent = 'Ollama Chat';
          showWelcome(true);
        }
        await fetchConversations();
        renderConversationsList();
        showToast('Conversation supprimée', 'success');
      }
    } catch (err) {
      console.error('❌ Erreur deleteConversation:', err.message);
      showToast('Erreur suppression', 'error');
    }
  }

  /**
   * POST /api/chat/title → Générer un titre automatiquement
   */
  async function generateTitle(model, firstMessage) {
    try {
      const data = await apiPost('/api/chat/title', {
        model:   model,
        message: firstMessage
      });
      if (data.success && data.title) {
        return data.title;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  UI — MODÈLES (SELECT + SETTINGS)
  // ══════════════════════════════════════════

  function renderModelSelect() {
    if (!dom.btnModelSelect) return;

    if (state.models.length === 0) {
      dom.btnModelSelect.innerHTML = `
        <span class="model-select-label">Aucun modèle</span>`;
      if (dom.modelName) dom.modelName.textContent = 'Aucun modèle';
      return;
    }

    // On construit un menu déroulant custom via le bouton
    // Le modelName affiche le modèle sélectionné
    if (dom.modelName) {
      dom.modelName.textContent = state.currentModel || state.models[0].name;
    }
  }

  function selectModel(modelName, save = true) {
    state.currentModel = modelName;
    if (dom.modelName) {
      dom.modelName.textContent = modelName;
    }
    if (save) {
      localStorage.setItem('selectedModel', modelName);
    }
    console.log('🎯 Modèle sélectionné:', modelName);
  }

  async function renderSettingsModels() {
    if (!dom.settingsModelsList) return;

    dom.settingsModelsList.innerHTML = '<div class="settings-loading">Chargement…</div>';

    try {
      const [models, running] = await Promise.all([
        fetchModels(),
        fetchRunningModels()
      ]);

      const runningNames = running.map(r => r.name || r.model);

      if (models.length === 0) {
        dom.settingsModelsList.innerHTML = `
          <div class="settings-loading">Aucun modèle installé</div>`;
        return;
      }

      let html = '';
      for (const model of models) {
        const baseName  = model.name.split(':')[0];
        const isRunning = runningNames.some(n => n.startsWith(baseName));
        const size      = formatBytes(model.size);

        html += `
          <div class="settings-model-row">
            <div class="settings-model-info">
              <span class="settings-model-name">${escapeHtml(model.name)}</span>
              <span class="settings-model-size">${size}</span>
              <span class="model-item-status" style="margin-left:8px;">
                <span class="status-dot ${isRunning ? 'running' : 'stopped'}"></span>
                ${isRunning ? 'Actif' : 'Arrêté'}
              </span>
            </div>
            <div class="settings-model-actions">
              ${isRunning
                ? `<button class="btn-model-control btn-model-unload"
                           data-model="${escapeHtml(model.name)}"
                           title="Décharger de la mémoire">
                     ${ICONS.stop} Arrêter
                   </button>`
                : `<button class="btn-model-control btn-model-load"
                           data-model="${escapeHtml(model.name)}"
                           title="Charger en mémoire">
                     ${ICONS.play} Démarrer
                   </button>`
              }
              <button class="btn-model-control btn-model-select"
                      data-model="${escapeHtml(model.name)}"
                      title="Utiliser ce modèle">
                Sélectionner
              </button>
            </div>
          </div>`;
      }

      dom.settingsModelsList.innerHTML = html;

      // ── Events : charger / décharger / sélectionner ──
      dom.settingsModelsList.querySelectorAll('.btn-model-load').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.innerHTML = `${ICONS.refresh} Chargement…`;
          await loadModelInMemory(btn.dataset.model);
          await renderSettingsModels(); // Re-render
        });
      });

      dom.settingsModelsList.querySelectorAll('.btn-model-unload').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.innerHTML = `${ICONS.refresh} Arrêt…`;
          await unloadModelFromMemory(btn.dataset.model);
          await renderSettingsModels();
        });
      });

      dom.settingsModelsList.querySelectorAll('.btn-model-select').forEach(btn => {
        btn.addEventListener('click', () => {
          selectModel(btn.dataset.model);
          showToast(`Modèle sélectionné : ${btn.dataset.model}`, 'success');
        });
      });

      // Modèle actif dans settings
      if (dom.settingsActiveModel) {
        dom.settingsActiveModel.textContent = state.currentModel || 'Aucun';
      }

    } catch (err) {
      dom.settingsModelsList.innerHTML = `
        <div class="settings-loading">Erreur : ${escapeHtml(err.message)}</div>`;
    }
  }

  // ══════════════════════════════════════════
  //  UI — MODEL DROPDOWN (btnModelSelect)
  // ══════════════════════════════════════════

  function showModelDropdown() {
    // Supprimer un éventuel dropdown existant
    const existing = document.querySelector('.model-dropdown');
    if (existing) { existing.remove(); return; }

    if (state.models.length === 0) {
      showToast('Aucun modèle disponible', 'warning');
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'model-dropdown';

    for (const model of state.models) {
      const item = document.createElement('button');
      item.className = 'model-dropdown-item';
      if (model.name === state.currentModel) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <span class="model-dropdown-name">${escapeHtml(model.name)}</span>
        <span class="model-dropdown-size">${formatBytes(model.size)}</span>
      `;
      item.addEventListener('click', () => {
        selectModel(model.name);
        dropdown.remove();
      });
      dropdown.appendChild(item);
    }

    // Positionner sous le bouton
    if (dom.btnModelSelect) {
      const rect = dom.btnModelSelect.getBoundingClientRect();
      dropdown.style.position = 'absolute';
      dropdown.style.top  = (rect.bottom + 4) + 'px';
      dropdown.style.left = rect.left + 'px';
      dropdown.style.minWidth = rect.width + 'px';
    }

    document.body.appendChild(dropdown);

    // Fermer en cliquant ailleurs
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== dom.btnModelSelect) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    setTimeout(() => document.addEventListener('click', closeDropdown), 10);
  }

  // ══════════════════════════════════════════
  //  UI — CONVERSATIONS LIST
  // ══════════════════════════════════════════

  function renderConversationsList() {
    if (!dom.conversationsNav) return;

    if (state.conversations.length === 0) {
      dom.conversationsNav.innerHTML = `
        <div class="conversations-empty">
          ${ICONS.chat}
          <span>Aucune conversation</span>
        </div>`;
      return;
    }

    // Trier par date de mise à jour décroissante
    const sorted = [...state.conversations].sort((a, b) => {
      return new Date(b.updated || b.created) - new Date(a.updated || a.created);
    });

    dom.conversationsNav.innerHTML = sorted.map(conv => {
      const isActive = conv.id === state.currentConversationId;
      const ago = timeAgo(conv.updated || conv.created);

      return `
        <div class="conversation-item ${isActive ? 'active' : ''}"
             data-id="${escapeHtml(conv.id)}">
          <div class="conversation-item-content">
            <div class="conversation-item-title">${escapeHtml(conv.title || 'Sans titre')}</div>
            <div class="conversation-item-meta">
              ${escapeHtml(conv.model || '')} · ${ago}
            </div>
          </div>
          <div class="conversation-item-actions">
            <button class="btn-conv-rename" data-id="${escapeHtml(conv.id)}" title="Renommer">
              ${ICONS.edit}
            </button>
            <button class="btn-conv-delete" data-id="${escapeHtml(conv.id)}" title="Supprimer">
              ${ICONS.trash}
            </button>
          </div>
        </div>`;
    }).join('');

    // ── Events : Charger ──
    dom.conversationsNav.querySelectorAll('.conversation-item').forEach(el => {
      el.addEventListener('click', (e) => {
        // Ignorer si on a cliqué sur un bouton action
        if (e.target.closest('.btn-conv-rename') || e.target.closest('.btn-conv-delete')) return;
        loadConversation(el.dataset.id);
      });
    });

    // ── Events : Renommer ──
    dom.conversationsNav.querySelectorAll('.btn-conv-rename').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const conv = state.conversations.find(c => c.id === id);
        const newTitle = prompt('Nouveau titre :', conv ? conv.title : '');
        if (newTitle && newTitle.trim()) {
          renameConversation(id, newTitle.trim());
        }
      });
    });

    // ── Events : Supprimer ──
    dom.conversationsNav.querySelectorAll('.btn-conv-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Supprimer cette conversation ?')) {
          deleteConversation(btn.dataset.id);
        }
      });
    });
  }

  function highlightActiveConversation() {
    if (!dom.conversationsNav) return;
    dom.conversationsNav.querySelectorAll('.conversation-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === state.currentConversationId);
    });
  }

  // ══════════════════════════════════════════
  //  UI — MESSAGES
  // ══════════════════════════════════════════

  function createMessageElement(role, content, meta) {
    const wrapper = document.createElement('div');
    wrapper.className = `message message-${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = role === 'user' ? ICONS.user : ICONS.sparkles;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = markdownToHtml(content);

    bubble.appendChild(contentDiv);

    // Métadonnées
    if (meta) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'message-meta';
      const parts = [];
      if (meta.model)    parts.push(meta.model);
      if (meta.duration) parts.push(meta.duration);
      if (meta.tokens)   parts.push(meta.tokens + ' tokens');
      metaDiv.textContent = parts.join(' · ');
      bubble.appendChild(metaDiv);
    }

    wrapper.appendChild(avatarDiv);
    wrapper.appendChild(bubble);

    return wrapper;
  }

  function renderMessages() {
    if (!dom.messagesContainer) return;

    dom.messagesContainer.innerHTML = '';

    for (const msg of state.messages) {
      const el = createMessageElement(msg.role, msg.content, msg.meta);
      dom.messagesContainer.appendChild(el);
    }

    highlightCodeBlocks(dom.messagesContainer);
    scrollToBottom();
  }

  function showWelcome(show) {
    if (dom.welcomeScreen) {
      dom.welcomeScreen.style.display = show ? 'flex' : 'none';
    }
  }

  function scrollToBottom() {
    if (dom.messagesContainer) {
      requestAnimationFrame(() => {
        dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
      });
    }
  }

  // ══════════════════════════════════════════
  //  UI — STREAMING STATE
  // ══════════════════════════════════════════

  function setStreamingUI(streaming) {
    state.isStreaming = streaming;

    if (dom.btnSend) {
      dom.btnSend.style.display = streaming ? 'none' : '';
    }
    if (dom.btnStop) {
      dom.btnStop.style.display = streaming ? '' : 'none';
    }
    if (dom.userInput) {
      dom.userInput.disabled = streaming;
    }
  }

  // ══════════════════════════════════════════
  //  UI — TEXTAREA AUTO-RESIZE
  // ══════════════════════════════════════════

  function autoResizeTextarea() {
    if (!dom.userInput) return;
    dom.userInput.style.height = 'auto';
    dom.userInput.style.height = Math.min(dom.userInput.scrollHeight, 200) + 'px';
  }

  // ══════════════════════════════════════════
  //  UI — MODALS
  // ══════════════════════════════════════════

  function showModal(title, bodyHtml) {
    if (!dom.modalOverlay) return;
    const modalTitle = dom.modalOverlay.querySelector('.modal-title, h3');
    if (modalTitle) modalTitle.textContent = title;
    if (dom.modalBody) dom.modalBody.innerHTML = bodyHtml;
    dom.modalOverlay.style.display = 'flex';
  }

  function hideModal() {
    if (dom.modalOverlay) dom.modalOverlay.style.display = 'none';
  }

  function showSettings() {
    if (dom.settingsOverlay) {
      dom.settingsOverlay.style.display = 'flex';
      renderSettingsModels();
    }
  }

  function hideSettings() {
    if (dom.settingsOverlay) dom.settingsOverlay.style.display = 'none';
  }

  function toggleSidebar() {
    if (dom.sidebar) {
      dom.sidebar.classList.toggle('collapsed');
    }
    if (dom.app) {
      dom.app.classList.toggle('sidebar-collapsed');
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — ENVOI DE MESSAGE (SSE STREAMING)
  // ══════════════════════════════════════════

  async function sendMessage() {
    const text = dom.userInput ? dom.userInput.value.trim() : '';
    if (!text || state.isStreaming) return;

    if (!state.currentModel) {
      showToast('Veuillez sélectionner un modèle', 'warning');
      return;
    }

    // ── Créer une conversation si nécessaire ──
    if (!state.currentConversationId) {
      const conv = await createConversation(state.currentModel);
      if (!conv) {
        showToast('Impossible de créer la conversation', 'error');
        return;
      }
      state.currentConversationId = conv.id;
      if (dom.headerTitle) {
        dom.headerTitle.textContent = conv.title || 'Nouvelle conversation';
      }
    }

    // ── Masquer le welcome ──
    showWelcome(false);

    // ── Ajouter le message utilisateur ──
    const userMessage = { role: 'user', content: text };
    state.messages.push(userMessage);

    const userDiv = createMessageElement('user', text);
    dom.messagesContainer.appendChild(userDiv);
    scrollToBottom();

    // ── Vider le champ de saisie ──
    dom.userInput.value = '';
    autoResizeTextarea();

    // ── Préparer le message assistant (bulle vide) ──
    const assistantWrapper = document.createElement('div');
    assistantWrapper.className = 'message message-assistant';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = ICONS.sparkles;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <span>Réflexion en cours…</span>
      </div>`;

    bubble.appendChild(contentDiv);
    assistantWrapper.appendChild(avatarDiv);
    assistantWrapper.appendChild(bubble);
    dom.messagesContainer.appendChild(assistantWrapper);
    scrollToBottom();

    // ── Mode streaming ──
    setStreamingUI(true);

    let fullContent   = '';
    let evalCount     = 0;
    let totalDuration = 0;

    try {
      state.abortController = new AbortController();

      // ── POST /api/chat/stream → SSE ──
      const response = await fetch('/api/chat/stream', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          model:    state.currentModel,
          messages: state.messages.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: state.abortController.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      // ── Lecture du stream SSE ──
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Garder la dernière ligne (potentiellement incomplète)

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Enlever le préfixe SSE "data: "
          let jsonStr = trimmed;
          if (jsonStr.startsWith('data: ')) {
            jsonStr = jsonStr.substring(6);
          }

          // Signal de fin
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);

            // Erreur serveur dans le stream
            if (data.error) {
              showToast(data.message || 'Erreur streaming', 'error');
              break;
            }

            // Token de contenu
            if (data.token) {
              fullContent += data.token;
              contentDiv.innerHTML = markdownToHtml(fullContent);
              scrollToBottom();
            }

            // Fin avec métriques
            if (data.done) {
              if (data.eval_count)     evalCount     = data.eval_count;
              if (data.total_duration) totalDuration  = data.total_duration;
            }
          } catch (parseErr) {
            // Ignorer les lignes non-JSON (keepalive, etc.)
            console.debug('SSE parse skip:', trimmed);
          }
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Génération arrêtée', 'info');
        if (!fullContent) fullContent = '*(Génération interrompue)*';
      } else {
        console.error('❌ Erreur streaming:', err);
        showToast(`Erreur : ${err.message}`, 'error');
        if (!fullContent) fullContent = `*(Erreur : ${err.message})*`;
      }
    }

    // ── Finalisation ──
    setStreamingUI(false);
    state.abortController = null;

    // Highlight les blocs de code
    highlightCodeBlocks(contentDiv);

    // ── Métadonnées ──
    const meta = { model: state.currentModel };
    if (totalDuration) meta.duration = (totalDuration / 1e9).toFixed(1) + 's';
    if (evalCount)     meta.tokens   = evalCount;

    if (totalDuration || evalCount) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'message-meta';
      const parts = [];
      if (meta.model)    parts.push(meta.model);
      if (meta.duration) parts.push(meta.duration);
      if (meta.tokens)   parts.push(meta.tokens + ' tokens');
      metaDiv.textContent = parts.join(' · ');
      bubble.appendChild(metaDiv);
    }

    // ── Sauvegarder le message assistant ──
    state.messages.push({
      role:    'assistant',
      content: fullContent,
      meta
    });

    await saveConversation();

    // ── Générer un titre automatique si c'est le premier échange ──
    if (state.messages.filter(m => m.role === 'user').length === 1) {
      const title = await generateTitle(state.currentModel, text);
      if (title && state.currentConversationId) {
        await renameConversation(state.currentConversationId, title);
      }
    }

    // ── Rafraîchir la liste des conversations ──
    await fetchConversations();
    renderConversationsList();
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — ARRÊTER LA GÉNÉRATION
  // ══════════════════════════════════════════

  function stopGeneration() {
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — NOUVEAU CHAT
  // ══════════════════════════════════════════

  function newChat() {
    state.currentConversationId = null;
    state.messages = [];

    if (dom.messagesContainer) dom.messagesContainer.innerHTML = '';
    if (dom.headerTitle) dom.headerTitle.textContent = 'Ollama Chat';
    if (dom.userInput) {
      dom.userInput.value = '';
      dom.userInput.focus();
    }

    showWelcome(true);
    highlightActiveConversation();
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — AFFICHER INFOS MODÈLE
  // ══════════════════════════════════════════

  async function showModelInfo(modelName) {
    if (!modelName) {
      showToast('Aucun modèle sélectionné', 'warning');
      return;
    }

    showModal('Informations du modèle', '<div class="settings-loading">Chargement…</div>');

    const info = await fetchModelDetails(modelName);

    if (!info) {
      if (dom.modalBody) {
        dom.modalBody.innerHTML = '<p>Impossible de récupérer les informations.</p>';
      }
      return;
    }

    let html = '';

    // Détails
    if (info.details) {
      html += '<h4>Détails</h4><table class="model-info-table">';
      for (const [key, val] of Object.entries(info.details)) {
        if (val && typeof val !== 'object') {
          html += `<tr><td class="info-key">${escapeHtml(key)}</td><td>${escapeHtml(String(val))}</td></tr>`;
        }
      }
      html += '</table>';
    }

    // Paramètres
    if (info.parameters) {
      html += `<h4>Paramètres</h4><pre class="model-info-pre">${escapeHtml(info.parameters)}</pre>`;
    }

    // Template
    if (info.template) {
      html += `<h4>Template</h4><pre class="model-info-pre">${escapeHtml(info.template)}</pre>`;
    }

    if (dom.modalBody) dom.modalBody.innerHTML = html;
  }

  // ══════════════════════════════════════════
  //  EVENT BINDINGS
  // ══════════════════════════════════════════

  function bindEvents() {
    // ── Envoi de message ──
    if (dom.btnSend) {
      dom.btnSend.addEventListener('click', sendMessage);
    }

    // ── Arrêt de génération ──
    if (dom.btnStop) {
      dom.btnStop.addEventListener('click', stopGeneration);
    }

    // ── Nouveau chat ──
    if (dom.btnNewChat) {
      dom.btnNewChat.addEventListener('click', newChat);
    }

    // ── Textarea : Enter pour envoyer, Shift+Enter pour saut de ligne ──
    if (dom.userInput) {
      dom.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      dom.userInput.addEventListener('input', autoResizeTextarea);
    }

    // ── Sélection de modèle (dropdown) ──
    if (dom.btnModelSelect) {
      dom.btnModelSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        showModelDropdown();
      });

      // Double-clic → infos du modèle
      dom.btnModelSelect.addEventListener('dblclick', () => {
        showModelInfo(state.currentModel);
      });
    }

    // ── Toggle sidebar ──
    if (dom.btnSidebarToggle) {
      dom.btnSidebarToggle.addEventListener('click', toggleSidebar);
    }

    // ── Toggle thème ──
    if (dom.btnTheme) {
      dom.btnTheme.addEventListener('click', toggleTheme);
    }

    // ── Settings (ouvrir / fermer) ──
    if (dom.btnSettings) {
      dom.btnSettings.addEventListener('click', showSettings);
    }
    if (dom.btnSettingsClose) {
      dom.btnSettingsClose.addEventListener('click', hideSettings);
    }
    if (dom.settingsOverlay) {
      dom.settingsOverlay.addEventListener('click', (e) => {
        if (e.target === dom.settingsOverlay) hideSettings();
      });
    }

    // ── Modal (fermer) ──
    if (dom.btnModalClose) {
      dom.btnModalClose.addEventListener('click', hideModal);
    }
    if (dom.modalOverlay) {
      dom.modalOverlay.addEventListener('click', (e) => {
        if (e.target === dom.modalOverlay) hideModal();
      });
    }

    // ── Suggestions (welcome screen) ──
    $$('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt && dom.userInput) {
          dom.userInput.value = prompt;
          autoResizeTextarea();
          sendMessage();
        }
      });
    });

    // ── Raccourcis clavier globaux ──
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+N → Nouveau chat
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        newChat();
      }

      // Escape → Fermer modals / arrêter génération
      if (e.key === 'Escape') {
        if (dom.settingsOverlay && dom.settingsOverlay.style.display !== 'none') {
          hideSettings();
        } else if (dom.modalOverlay && dom.modalOverlay.style.display !== 'none') {
          hideModal();
        } else if (state.isStreaming) {
          stopGeneration();
        }

        // Fermer le dropdown modèle s'il est ouvert
        const dropdown = document.querySelector('.model-dropdown');
        if (dropdown) dropdown.remove();
      }

      // Ctrl+/ → Focus textarea
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (dom.userInput) dom.userInput.focus();
      }
    });

    // ── Color picker pour le logo (dans settings) ──
    const colorPicker = $('#logoColorPicker');
    if (colorPicker) {
      colorPicker.value = state.logoColor;
      colorPicker.addEventListener('input', (e) => {
        applyLogoColor(e.target.value);
      });
    }

    // ── Liens dans settings ──
    const ollamaLink = $('#ollamaLink');
    if (ollamaLink) {
      ollamaLink.href = 'http://127.0.0.1:11434';
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — SAUVEGARDE CONVERSATION
  // ══════════════════════════════════════════

  async function saveConversation() {
    if (!state.currentConversationId) return;

    try {
      await apiPost(`/api/chat/conversation/${state.currentConversationId}/save`, {
        model:    state.currentModel,
        messages: state.messages.map(m => ({
          role:    m.role,
          content: m.content,
          meta:    m.meta || undefined
        }))
      });
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      // Ne pas afficher de toast pour éviter le spam
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — TITRE AUTOMATIQUE
  // ══════════════════════════════════════════

  async function generateTitle(model, userMessage) {
    try {
      const data = await apiPost('/api/chat/title', {
        model,
        message: userMessage
      });
      if (data.success && data.title) {
        return data.title;
      }
      return null;
    } catch (err) {
      console.warn('⚠️ Impossible de générer le titre:', err.message);
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — CHARGER / DÉCHARGER MODÈLE
  // ══════════════════════════════════════════

  async function loadModelInMemory(modelName) {
    try {
      showToast(`Chargement de ${modelName}…`, 'info');
      await apiPost('/api/generate/load', { model: modelName });
      showToast(`${modelName} chargé en mémoire`, 'success');
    } catch (err) {
      showToast(`Erreur chargement : ${err.message}`, 'error');
    }
  }

  async function unloadModelFromMemory(modelName) {
    try {
      showToast(`Déchargement de ${modelName}…`, 'info');
      await apiPost('/api/generate/unload', { model: modelName });
      showToast(`${modelName} déchargé`, 'success');
    } catch (err) {
      showToast(`Erreur déchargement : ${err.message}`, 'error');
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — SÉLECTION MODÈLE
  // ══════════════════════════════════════════

  function selectModel(modelName, save = true) {
    state.currentModel = modelName;
    if (dom.modelName) {
      dom.modelName.textContent = modelName || 'Sélectionner…';
    }
    if (save) {
      localStorage.setItem('selectedModel', modelName);
    }
    console.log('🤖 Modèle sélectionné:', modelName);
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — CHARGER UNE CONVERSATION
  // ══════════════════════════════════════════

  async function loadConversation(id) {
    try {
      const data = await apiGet(`/api/chat/conversation/${id}`);
      if (!data.success || !data.conversation) {
        showToast('Conversation introuvable', 'error');
        return;
      }

      const conv = data.conversation;

      state.currentConversationId = conv.id;
      state.messages = conv.messages || [];

      // Mettre à jour le modèle si la conversation en a un
      if (conv.model) {
        selectModel(conv.model, false);
      }

      // Mettre à jour le titre
      if (dom.headerTitle) {
        dom.headerTitle.textContent = conv.title || 'Conversation';
      }

      // Afficher les messages
      showWelcome(false);
      renderMessages();
      highlightActiveConversation();

      // Focus textarea
      if (dom.userInput) dom.userInput.focus();

    } catch (err) {
      console.error('❌ Erreur chargement conversation:', err);
      showToast('Erreur chargement conversation', 'error');
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — RENOMMER CONVERSATION
  // ══════════════════════════════════════════

  async function renameConversation(id, newTitle) {
    try {
      const data = await apiPut(`/api/chat/conversation/${id}`, {
        title: newTitle
      });

      if (data.success) {
        // Mettre à jour localement
        const conv = state.conversations.find(c => c.id === id);
        if (conv) conv.title = newTitle;

        // Mettre à jour le header si c'est la conversation active
        if (id === state.currentConversationId && dom.headerTitle) {
          dom.headerTitle.textContent = newTitle;
        }

        renderConversationsList();
      }
    } catch (err) {
      console.error('❌ Erreur renommage:', err);
      showToast('Erreur lors du renommage', 'error');
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — SUPPRIMER CONVERSATION
  // ══════════════════════════════════════════

  async function deleteConversation(id) {
    try {
      const data = await apiDelete(`/api/chat/conversation/${id}`);

      if (data.success) {
        // Supprimer localement
        state.conversations = state.conversations.filter(c => c.id !== id);

        // Si c'était la conversation active → nouveau chat
        if (id === state.currentConversationId) {
          newChat();
        }

        renderConversationsList();
        showToast('Conversation supprimée', 'success');
      }
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — CRÉER CONVERSATION
  // ══════════════════════════════════════════

  async function createConversation(model) {
    try {
      const data = await apiPost('/api/chat/conversation', {
        model,
        title: 'Nouvelle conversation'
      });

      if (data.success && data.conversation) {
        state.conversations.unshift(data.conversation);
        renderConversationsList();
        return data.conversation;
      }

      return null;
    } catch (err) {
      console.error('❌ Erreur création conversation:', err);
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  INITIALISATION
  // ══════════════════════════════════════════

  async function init() {
    console.log('🚀 Initialisation Ollama Chat App…');

    // ── Thème ──
    initTheme();

    // ── Bind events ──
    bindEvents();

    // ── Masquer le bouton stop par défaut ──
    setStreamingUI(false);

    // ── Vérifier la connexion à Ollama ──
    const connected = await checkConnection();

    if (!connected) {
      showToast(
        "Ollama non détecté. Lancez 'ollama serve' puis rechargez la page.",
        'error'
      );
    } else {
      console.log('✅ Connexion Ollama établie');
    }

    // ── Charger les modèles ──
    if (connected) {
      await fetchModels();
      renderModelSelector();

      // Restaurer le modèle précédemment sélectionné
      if (state.currentModel) {
        const exists = state.models.some(m => m.name === state.currentModel);
        if (exists) {
          selectModel(state.currentModel, false);
        } else if (state.models.length > 0) {
          selectModel(state.models[0].name);
        }
      } else if (state.models.length > 0) {
        selectModel(state.models[0].name);
      }
    }

    // ── Charger la version ──
    if (connected) {
      await fetchOllamaVersion();
    }

    // ── Charger les conversations ──
    await fetchConversations();
    renderConversationsList();

    // ── Welcome screen ──
    showWelcome(true);

    // ── Focus textarea ──
    if (dom.userInput) dom.userInput.focus();

    // ── Vérification périodique de la connexion ──
    setInterval(async () => {
      const wasConnected = state.connected;
      const isConnected  = await checkConnection();

      // Reconnexion détectée → recharger les modèles
      if (!wasConnected && isConnected) {
        showToast('Connexion Ollama rétablie !', 'success');
        await fetchModels();
        renderModelSelector();
        await fetchOllamaVersion();
      }

      // Perte de connexion
      if (wasConnected && !isConnected) {
        showToast('Connexion Ollama perdue…', 'error');
      }
    }, 15000);

    console.log('✅ Ollama Chat App prêt');
  }

  // ══════════════════════════════════════════
  //  RENDER MODEL SELECTOR (header)
  // ══════════════════════════════════════════

  function renderModelSelector() {
    if (!dom.modelName) return;

    if (state.models.length === 0) {
      dom.modelName.textContent = 'Aucun modèle';
      return;
    }

    if (state.currentModel) {
      dom.modelName.textContent = state.currentModel;
    } else {
      dom.modelName.textContent = 'Sélectionner…';
    }
  }

  // ══════════════════════════════════════════
  //  LANCEMENT
  // ══════════════════════════════════════════

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
