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
    isStreaming: false,
    abortController: null,
    theme: localStorage.getItem('theme') || 'dark'
  };

  // ══════════════════════════════════════════
  //  ÉLÉMENTS DOM
  // ══════════════════════════════════════════
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    app:                $('#app'),
    sidebar:            $('#sidebar'),
    conversationsNav:   $('#conversationsNav'),
    messagesContainer:  $('#messagesContainer'),
    welcomeScreen:      $('#welcomeScreen'),
    userInput:          $('#userInput'),
    btnSend:            $('#btnSend'),
    btnStop:            $('#btnStop'),
    btnNewChat:         $('#btnNewChat'),
    btnModelSelect:     $('#btnModelSelect'),
    btnSidebarToggle:   $('#btnSidebarToggle'),
    btnTheme:           $('#btnTheme'),
    btnModalClose:      $('#btnModalClose'),
    modalOverlay:       $('#modalOverlay'),
    modalBody:          $('#modalBody'),
    modelName:          $('#modelName'),
    headerTitle:        $('#headerTitle'),
    toastContainer:     $('#toastContainer'),
    hljsThemeDark:      $('#hljs-theme-dark'),
    hljsThemeLight:     $('#hljs-theme-light')
  };

  // ══════════════════════════════════════════
  //  THÈME LIGHT / DARK
  // ══════════════════════════════════════════
  function initTheme() {
    applyTheme(state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme(state.theme);
  }

  function applyTheme(theme) {
    // Attribut data-theme sur <html>
    document.documentElement.setAttribute('data-theme', theme);

    // Basculer les feuilles highlight.js
    if (theme === 'dark') {
      dom.hljsThemeDark.disabled = false;
      dom.hljsThemeLight.disabled = true;
    } else {
      dom.hljsThemeDark.disabled = true;
      dom.hljsThemeLight.disabled = false;
    }

    // Re-highlight tous les blocs de code existants
    $$('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
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
    if (typeof marked === 'undefined') {
      return escapeHtml(text).replace(/\n/g, '<br>');
    }
    try {
      return marked.parse(text);
    } catch (_) {
      return escapeHtml(text).replace(/\n/g, '<br>');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ══════════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ══════════════════════════════════════════
  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
  }

  // ══════════════════════════════════════════
  //  API — MODÈLES
  // ══════════════════════════════════════════

  /**
   * GET /api/tags → Liste des modèles installés
   */
  async function fetchModels() {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();

      if (data.success && data.models) {
        state.models = data.models;
        return data.models;
      }
      throw new Error(data.error || 'Erreur inconnue');
    } catch (err) {
      console.error('❌ fetchModels:', err);
      showToast('Impossible de charger les modèles. Ollama est-il lancé ?', 'error');
      return [];
    }
  }

  /**
   * GET /api/ps → Modèles chargés en mémoire
   */
  async function fetchRunningModels() {
    try {
      const res = await fetch('/api/ps');
      const data = await res.json();
      if (data.success) return data.running || [];
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
      const res = await fetch('/api/show', {
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
   * POST /api/generate/load → Charger un modèle en mémoire
   */
  async function loadModel(modelName) {
    try {
      const res = await fetch('/api/generate/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Modèle "${modelName}" chargé`, 'success');
      }
      return data;
    } catch (err) {
      showToast(`Erreur chargement du modèle: ${err.message}`, 'error');
      return { success: false };
    }
  }

  /**
   * POST /api/generate/unload → Décharger un modèle
   */
  async function unloadModel(modelName) {
    try {
      const res = await fetch('/api/generate/unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Modèle "${modelName}" déchargé`, 'info');
      }
      return data;
    } catch (err) {
      showToast(`Erreur déchargement: ${err.message}`, 'error');
      return { success: false };
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
      const res = await fetch('/api/chat/conversations');
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
      const res = await fetch(`/api/chat/conversation/${id}`);
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
      const res = await fetch('/api/chat/conversation', {
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
      console.error('❌ saveConversation:', err);
    }
  }

  /**
   * PUT /api/chat/conversation/:id → Renommer
   */
  async function renameConversation(id, title) {
    try {
      await fetch(`/api/chat/conversation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
    } catch (err) {
      console.error('❌ renameConversation:', err);
    }
  }

  /**
   * DELETE /api/chat/conversation/:id
   */
  async function deleteConversation(id) {
    try {
      await fetch(`/api/chat/conversation/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('❌ deleteConversation:', err);
    }
  }

  /**
   * POST /api/chat/title → Générer un titre
   */
  async function generateTitle(model, message) {
    try {
      const res = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, message })
      });
      const data = await res.json();
      if (data.success) return data.title;
      return null;
    } catch (_) {
      return null;
    }
  }

  // ══════════════════════════════════════════
  //  CHAT STREAMING (SSE via POST)
  // ══════════════════════════════════════════

  /**
   * POST /api/chat/stream
   * Envoie les messages et reçoit les tokens en SSE
   */
  async function streamChat(model, messages, onToken, onDone, onError) {
    state.abortController = new AbortController();

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages }),
        signal: state.abortController.signal
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);

          if (payload === '[DONE]') {
            onDone();
            return;
          }

          try {
            const data = JSON.parse(payload);

            if (data.error) {
              onError(data.error);
              return;
            }

            if (data.done) {
              // Métriques finales
              onDone(data);
            } else if (data.token) {
              onToken(data.token);
            }
          } catch (_) {
            // Ligne JSON invalide → ignorer
          }
        }
      }

      onDone();

    } catch (err) {
      if (err.name === 'AbortError') {
        onDone();
      } else {
        onError(err.message);
      }
    }
  }

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
    dom.messagesContainer.appendChild(dom.welcomeScreen);
    dom.welcomeScreen.classList.remove('hidden');
  }

  function hideWelcome() {
    dom.welcomeScreen.classList.add('hidden');
  }

  function appendMessage(role, content, isStreaming = false) {
    hideWelcome();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (role === 'user') {
      // Lucide: User
      avatar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>`;
    } else {
      // Lucide: Sparkles (même icône que le welcome)
      avatar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/>
          <path d="M19 17v4"/>
          <path d="M3 5h4"/>
          <path d="M17 19h4"/>
        </svg>`;
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isStreaming) {
      bubble.innerHTML = '<span class="cursor-blink">▊</span>';
      msgDiv.setAttribute('data-streaming', 'true');
    } else {
      bubble.innerHTML = renderMarkdown(content);
      addCopyButtons(bubble);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    dom.messagesContainer.appendChild(msgDiv);

    scrollToBottom();
    return msgDiv;
  }

  function updateStreamingMessage(msgDiv, fullText) {
    const bubble = msgDiv.querySelector('.message-bubble');
    if (!bubble) return;
    bubble.innerHTML = renderMarkdown(fullText) + '<span class="cursor-blink">▊</span>';
    scrollToBottom();
  }

  function finalizeStreamingMessage(msgDiv, fullText) {
    const bubble = msgDiv.querySelector('.message-bubble');
    if (!bubble) return;
    bubble.innerHTML = renderMarkdown(fullText);
    msgDiv.removeAttribute('data-streaming');

    // Appliquer highlight.js aux blocs de code
    bubble.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });

    addCopyButtons(bubble);
    scrollToBottom();
  }

  function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.btn-copy-code')) return;

      const btn = document.createElement('button');
      btn.className = 'btn-copy-code';
      btn.textContent = 'Copier';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent).then(() => {
            btn.textContent = '✓ Copié';
            setTimeout(() => { btn.textContent = 'Copier'; }, 2000);
          });
        }
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
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
    renderModelList();
  }

  function closeModelModal() {
    dom.modalOverlay.classList.add('hidden');
  }

  async function renderModelList() {
    dom.modalBody.innerHTML = '<div class="modal-loading">Recherche des modèles…</div>';

    const [models, running] = await Promise.all([
      fetchModels(),
      fetchRunningModels()
    ]);

    if (models.length === 0) {
      dom.modalBody.innerHTML = `
        <div class="modal-empty">
          <p>Aucun modèle trouvé.</p>
          <p>Installez un modèle avec : <code>ollama pull llama3.1</code></p>
        </div>`;
      return;
    }

    const runningNames = new Set((running || []).map(r => r.name));

    let html = '<div class="model-list">';
    for (const m of models) {
      const isActive = state.currentModel === m.name;
      const isRunning = runningNames.has(m.name);

      html += `
        <div class="model-item ${isActive ? 'active' : ''}"
             data-model="${escapeHtml(m.name)}">
          <div class="model-item-info">
            <div class="model-item-name">
              ${escapeHtml(m.name)}
              ${isRunning ? '<span class="badge-running">En cours</span>' : ''}
              ${isActive ? '<span class="badge-active">Sélectionné</span>' : ''}
            </div>
            <div class="model-item-meta">
              ${m.parameterSize} · ${m.quantization} · ${m.sizeHuman} · ${m.family}
            </div>
          </div>
          <button class="btn-select-model" data-model="${escapeHtml(m.name)}">
            ${isActive ? '✓ Actif' : 'Utiliser'}
          </button>
        </div>`;
    }
    html += '</div>';
    dom.modalBody.innerHTML = html;

    // Événements de sélection
    dom.modalBody.querySelectorAll('.btn-select-model').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modelName = e.target.getAttribute('data-model');
        selectModel(modelName);
        closeModelModal();
      });
    });
  }

  function selectModel(modelName) {
    state.currentModel = modelName;
    dom.modelName.textContent = modelName;
    localStorage.setItem('selectedModel', modelName);
    showToast(`Modèle sélectionné : ${modelName}`, 'success');
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
            <button class="conv-btn-rename" data-id="${conv.id}" title="Renommer">✏️</button>
            <button class="conv-btn-delete" data-id="${conv.id}" title="Supprimer">🗑️</button>
          </div>
        </div>`;
    }
    dom.conversationsNav.innerHTML = html;

    // Click pour ouvrir
    dom.conversationsNav.querySelectorAll('.conv-item-title').forEach((el) => {
      el.addEventListener('click', () => {
        loadConversation(el.getAttribute('data-id'));
      });
    });

    // Renommer
    dom.conversationsNav.querySelectorAll('.conv-btn-rename').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const newTitle = prompt('Nouveau titre :');
        if (newTitle && newTitle.trim()) {
          await renameConversation(id, newTitle.trim());
          renderConversationsList();
        }
      });
    });

    // Supprimer
    dom.conversationsNav.querySelectorAll('.conv-btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Supprimer cette conversation ?')) {
          await deleteConversation(id);
          if (state.currentConversationId === id) {
            startNewChat();
          }
          renderConversationsList();
        }
      });
    });
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — CONVERSATIONS
  // ══════════════════════════════════════════

  async function startNewChat() {
    state.currentConversationId = null;
    state.messages = [];
    clearMessages();
    dom.headerTitle.textContent = 'Ollama Chat';
    renderConversationsList();
  }

  async function loadConversation(id) {
    const conv = await fetchConversation(id);
    if (!conv) {
      showToast('Conversation introuvable', 'error');
      return;
    }

    state.currentConversationId = conv.id;
    state.messages = conv.messages || [];

    if (conv.model && !state.currentModel) {
      selectModel(conv.model);
    }

    dom.headerTitle.textContent = conv.title || 'Ollama Chat';

    // Réafficher les messages
    dom.messagesContainer.innerHTML = '';
    dom.messagesContainer.appendChild(dom.welcomeScreen);

    if (state.messages.length === 0) {
      dom.welcomeScreen.classList.remove('hidden');
    } else {
      dom.welcomeScreen.classList.add('hidden');
      for (const msg of state.messages) {
        appendMessage(msg.role, msg.content);
      }
    }

    // Highlight tous les blocs de code
    $$('pre code').forEach((block) => hljs.highlightElement(block));

    renderConversationsList();
    scrollToBottom();

    // Fermer la sidebar en mobile
    dom.sidebar.classList.remove('open');
  }

  // ══════════════════════════════════════════
  //  LOGIQUE — ENVOI MESSAGE
  // ══════════════════════════════════════════

  async function sendMessage() {
    const text = dom.userInput.value.trim();
    if (!text || state.isStreaming) return;

    if (!state.currentModel) {
      showToast('Veuillez sélectionner un modèle', 'error');
      openModelModal();
      return;
    }

    // Vider le champ
    dom.userInput.value = '';
    dom.userInput.style.height = 'auto';
    dom.btnSend.disabled = true;

    // Créer une conversation si nécessaire
    if (!state.currentConversationId) {
      const conv = await createConversation(state.currentModel);
      if (conv) {
        state.currentConversationId = conv.id;
      }
    }

    // Ajouter le message utilisateur
    const userMsg = { role: 'user', content: text };
    state.messages.push(userMsg);
    appendMessage('user', text);

    // Sauvegarder
    if (state.currentConversationId) {
      saveConversation(state.currentConversationId, {
        messages: state.messages,
        model: state.currentModel
      });
    }

    // Préparer la réponse streaming
    setStreamingState(true);
    const assistantDiv = appendMessage('assistant', '', true);
    let fullResponse = '';

    // Messages à envoyer (inclure l'historique)
    const chatMessages = state.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    await streamChat(
      state.currentModel,
      chatMessages,
      // onToken
      (token) => {
        fullResponse += token;
        updateStreamingMessage(assistantDiv, fullResponse);
      },
      // onDone
      async (metrics) => {
        finalizeStreamingMessage(assistantDiv, fullResponse);
        setStreamingState(false);

        // Ajouter la réponse à l'historique
        const assistantMsg = { role: 'assistant', content: fullResponse };
        state.messages.push(assistantMsg);

        // Sauvegarder
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
          console.log(`⚡ ${totalSec}s | ${tokensPerSec} tokens/s | ${metrics.eval_count || '?'} tokens`);
        }
      },
      // onError
      (error) => {
        finalizeStreamingMessage(assistantDiv, `⚠️ Erreur : ${error}`);
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
  //  ÉVÉNEMENTS
  // ══════════════════════════════════════════

  function bindEvents() {
    // Envoi
    dom.btnSend.addEventListener('click', sendMessage);

    // Stop streaming
    dom.btnStop.addEventListener('click', stopStreaming);

    // Textarea : Enter pour envoyer, Shift+Enter pour saut de ligne
    dom.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    dom.userInput.addEventListener('input', autoResizeTextarea);

    // Nouvelle conversation
    dom.btnNewChat.addEventListener('click', startNewChat);

    // Modal modèles
    dom.btnModelSelect.addEventListener('click', openModelModal);
    dom.btnModalClose.addEventListener('click', closeModelModal);
    dom.modalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModelModal();
    });

    // Thème
    dom.btnTheme.addEventListener('click', toggleTheme);

    // Toggle sidebar mobile
    dom.btnSidebarToggle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('open');
    });

    // Fermer sidebar en cliquant sur main (mobile)
    dom.messagesContainer.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        dom.sidebar.classList.remove('open');
      }
    });

    // Raccourci Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dom.modalOverlay.classList.contains('hidden')) {
          closeModelModal();
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

    console.log('✅ Ollama Chat App initialisée');
  }

  // Lancer l'app quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
