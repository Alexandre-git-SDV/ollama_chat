/**
 * ============================================
 *  Chat Component — Messages & Streaming
 * ============================================
 */
var ChatComponent = (function () {
  'use strict';

  let abortController = null;
  let isGenerating = false;
  let streamingBubble = null;
  let streamingTextEl = null;
  let streamingContent = '';

  function init() {
    bindEvents();
  }

  // ══════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════

  function bindEvents() {
    const d = DOM.refs;

    // Envoi
    if (d.btnSend) {
      d.btnSend.addEventListener('click', sendMessage);
    }

    // Stop streaming
    if (d.btnStop) {
      d.btnStop.addEventListener('click', stopStreaming);
    }

    // Textarea : auto-resize + Enter
    if (d.userInput) {
      d.userInput.addEventListener('input', () => {
        autoResize();
        if (d.btnSend) {
          d.btnSend.disabled = !d.userInput.value.trim();
        }
      });

      d.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Suggestions (welcome screen)
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (d.userInput) {
          d.userInput.value = chip.dataset.prompt;
          d.userInput.focus();
          autoResize();
          if (d.btnSend) d.btnSend.disabled = false;
        }
      });
    });

    // Export
    if (d.btnExport) {
      d.btnExport.addEventListener('click', exportConversation);
    }

    // Supprimer conversation courante
    if (d.btnDeleteChat) {
      d.btnDeleteChat.addEventListener('click', deleteCurrentChat);
    }

    // Thème
    if (d.btnToggleTheme) {
      d.btnToggleTheme.addEventListener('click', () => ThemeComponent.toggle());
    }
  }

  // ══════════════════════════════════════════
  //  TEXTAREA AUTO-RESIZE
  // ══════════════════════════════════════════

  function autoResize() {
    const input = DOM.refs.userInput;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(
      input.scrollHeight,
      AppConfig.MAX_TEXTAREA_HEIGHT
    ) + 'px';
  }

  // ══════════════════════════════════════════
  //  WELCOME SCREEN
  // ══════════════════════════════════════════

  function showWelcome(visible) {
    if (DOM.refs.welcomeScreen) {
      DOM.refs.welcomeScreen.style.display = visible ? 'flex' : 'none';
    }
  }

  // ══════════════════════════════════════════
  //  SCROLL
  // ══════════════════════════════════════════

  function scrollToBottom() {
    const el = DOM.refs.chatMessages;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  // ══════════════════════════════════════════
  //  RENDER ALL MESSAGES
  // ══════════════════════════════════════════

  function renderMessages() {
    const d = DOM.refs;
    if (!d.chatMessages) return;

    // Supprimer les bulles existantes (garder le welcome screen)
    d.chatMessages.querySelectorAll('.message').forEach(el => el.remove());

    AppState.messages.forEach(msg => {
      appendMessageBubble(msg.role, msg.content, msg.meta || null);
    });

    scrollToBottom();
  }

  // ══════════════════════════════════════════
  //  APPEND MESSAGE BUBBLE
  // ══════════════════════════════════════════

  function appendMessageBubble(role, content, meta) {
    const d = DOM.refs;
    if (!d.chatMessages) return null;

    const bubble = document.createElement('div');
    bubble.className = `message message-${role}`;

    const avatar = role === 'user' ? AppConfig.ICONS.user : AppConfig.ICONS.bot;
    const renderedContent = role === 'assistant'
      ? MarkdownRenderer.render(content)
      : `<p>${Helpers.escapeHtml(content)}</p>`;

    // Métadonnées
    let metaHtml = '';
    if (meta && role === 'assistant') {
      const parts = [];
      if (meta.model)    parts.push(meta.model);
      if (meta.duration) parts.push(meta.duration);
      if (meta.tokens)   parts.push(`${meta.tokens} tokens`);
      if (meta.speed)    parts.push(`${meta.speed} tok/s`);
      if (parts.length) {
        metaHtml = `<div class="message-meta">${Helpers.escapeHtml(parts.join(' · '))}</div>`;
      }
    }

    bubble.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-role">${role === 'user' ? 'Vous' : 'Assistant'}</div>
        <div class="message-text msg-content">${renderedContent}</div>
        ${metaHtml}
        ${role === 'assistant' ? `
          <div class="message-actions">
            <button class="btn-msg-action btn-copy-msg" title="Copier">
              ${AppConfig.ICONS.copy} Copier
            </button>
            <button class="btn-msg-action btn-regenerate" title="Régénérer">
              ${AppConfig.ICONS.refresh} Régénérer
            </button>
          </div>` : ''}
      </div>
    `;

    // Bind : copier le message
    const copyBtn = bubble.querySelector('.btn-copy-msg');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
          ToastComponent.show('Message copié', 'success');
        });
      });
    }

    // Bind : régénérer
    const regenBtn = bubble.querySelector('.btn-regenerate');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => regenerateLastResponse());
    }

    d.chatMessages.appendChild(bubble);
    return bubble;
  }

  // ══════════════════════════════════════════
  //  STREAMING BUBBLE (assistant en cours)
  // ══════════════════════════════════════════

  function createStreamingBubble() {
    const d = DOM.refs;
    if (!d.chatMessages) return;

    streamingContent = '';

    streamingBubble = document.createElement('div');
    streamingBubble.className = 'message message-assistant streaming';

    streamingBubble.innerHTML = `
      <div class="message-avatar">${AppConfig.ICONS.bot}</div>
      <div class="message-content">
        <div class="message-role">Assistant</div>
        <div class="message-text msg-content">
          <span class="cursor-blink">▊</span>
        </div>
        <div class="message-meta streaming-meta"></div>
      </div>
    `;

    streamingTextEl = streamingBubble.querySelector('.message-text');
    d.chatMessages.appendChild(streamingBubble);
    scrollToBottom();
  }

  function appendToStreamingBubble(token) {
    streamingContent += token;

    if (streamingTextEl) {
      streamingTextEl.innerHTML =
        MarkdownRenderer.render(streamingContent) +
        '<span class="cursor-blink">▊</span>';
    }

    scrollToBottom();
  }

  function finalizeStreamingBubble(meta) {
    if (!streamingBubble || !streamingTextEl) return;

    // Supprimer le curseur
    const cursor = streamingTextEl.querySelector('.cursor-blink');
    if (cursor) cursor.remove();

    // Rendu final propre
    streamingTextEl.innerHTML = MarkdownRenderer.render(streamingContent);

    // Highlight les blocs de code
    streamingBubble.querySelectorAll('pre code').forEach(block => {
      if (window.hljs) hljs.highlightElement(block);
    });

    // Métadonnées
    if (meta) {
      const metaEl = streamingBubble.querySelector('.streaming-meta');
      if (metaEl) {
        const parts = [];
        if (meta.model)    parts.push(meta.model);
        if (meta.duration) parts.push(meta.duration);
        if (meta.tokens)   parts.push(`${meta.tokens} tokens`);
        if (meta.speed)    parts.push(`${meta.speed} tok/s`);
        metaEl.textContent = parts.join(' · ');
      }
    }

    // Ajouter les boutons d'action
    const contentEl = streamingBubble.querySelector('.message-content');
    if (contentEl) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actionsDiv.innerHTML = `
        <button class="btn-msg-action btn-copy-msg" title="Copier">
          ${AppConfig.ICONS.copy} Copier
        </button>
        <button class="btn-msg-action btn-regenerate" title="Régénérer">
          ${AppConfig.ICONS.refresh} Régénérer
        </button>
      `;

      const copyBtn = actionsDiv.querySelector('.btn-copy-msg');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(streamingContent).then(() => {
            ToastComponent.show('Message copié', 'success');
          });
        });
      }

      const regenBtn = actionsDiv.querySelector('.btn-regenerate');
      if (regenBtn) {
        regenBtn.addEventListener('click', () => regenerateLastResponse());
      }

      contentEl.appendChild(actionsDiv);
    }

    // Retirer la classe streaming
    streamingBubble.classList.remove('streaming');

    // Reset
    streamingBubble = null;
    streamingTextEl = null;
  }

  // ══════════════════════════════════════════
  //  GENERATING STATE (UI)
  // ══════════════════════════════════════════

  function setGenerating(state) {
    isGenerating = state;
    const d = DOM.refs;

    if (d.typingIndicator) {
      d.typingIndicator.style.display = state ? 'flex' : 'none';
    }
    if (d.btnSend) {
      d.btnSend.style.display = state ? 'none' : 'flex';
    }
    if (d.btnStop) {
      d.btnStop.style.display = state ? 'flex' : 'none';
    }
    if (d.userInput) {
      d.userInput.disabled = state;
      if (!state) d.userInput.focus();
    }
  }

  // ══════════════════════════════════════════
  //  SEND MESSAGE
  // ══════════════════════════════════════════

  async function sendMessage() {
    const d = DOM.refs;
    if (!d.userInput || isGenerating) return;

    const text = d.userInput.value.trim();
    if (!text) return;

    const model = ModelSelectorComponent.getSelectedModel();
    if (!model) {
      ToastComponent.show('Veuillez sélectionner un modèle', 'warning');
      return;
    }

    // Masquer le welcome screen
    showWelcome(false);

    // Vider l'input
    d.userInput.value = '';
    d.userInput.style.height = 'auto';
    if (d.btnSend) d.btnSend.disabled = true;

    // Créer une conversation si nécessaire
    if (!AppState.currentConversationId) {
      try {
        const conv = await ConversationService.create(model);
        AppState.currentConversationId = conv.id;
        if (d.headerTitle) d.headerTitle.textContent = conv.title || 'Nouvelle conversation';
        SidebarComponent.setActiveConversation(conv.id);
      } catch (err) {
        ToastComponent.show('Erreur création conversation: ' + err.message, 'error');
        return;
      }
    }

    // Ajouter le message user au state et au DOM
    const userMsg = { role: 'user', content: text };
    AppState.messages.push(userMsg);
    appendMessageBubble('user', text, null);
    scrollToBottom();

    // Construire les messages pour l'API
    const apiMessages = buildApiMessages();

    // Créer la bulle streaming pour l'assistant
    createStreamingBubble();
    setGenerating(true);

    // AbortController
    abortController = new AbortController();

    try {
      const response = await OllamaService.chatStream(
        model,
        apiMessages,
        parseFloat(StorageService.getTemperature()),
        abortController.signal
      );

      // Lire le stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalMeta = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // SSE format: "data: {...}"
          let jsonStr = line;
          if (line.startsWith('data: ')) {
            jsonStr = line.slice(6);
          }

          try {
            const json = JSON.parse(jsonStr);

            if (json.token) {
              appendToStreamingBubble(json.token);
            }

            if (json.done) {
              finalMeta = {
                model: model,
                duration: json.total_duration
                  ? Helpers.formatDuration(json.total_duration)
                  : null,
                tokens: json.eval_count || null,
                speed: (json.eval_count && json.eval_duration)
                  ? ((json.eval_count / (json.eval_duration / 1e9)).toFixed(1))
                  : null,
              };
            }
          } catch (e) {
            // Ligne JSON invalide, on ignore
            console.warn('[Chat] JSON parse:', e.message);
          }
        }
      }

      // Traiter le reste du buffer
      if (buffer.trim()) {
        let jsonStr = buffer;
        if (buffer.startsWith('data: ')) jsonStr = buffer.slice(6);
        try {
          const json = JSON.parse(jsonStr);
          if (json.token) appendToStreamingBubble(json.token);
          if (json.done) {
            finalMeta = {
              model: model,
              duration: json.total_duration
                ? Helpers.formatDuration(json.total_duration)
                : null,
              tokens: json.eval_count || null,
              speed: (json.eval_count && json.eval_duration)
                ? ((json.eval_count / (json.eval_duration / 1e9)).toFixed(1))
                : null,
            };
          }
        } catch (e) { /* ignore */ }
      }

      // Finaliser
      finalizeStreamingBubble(finalMeta);

      // Ajouter au state
      const assistantMsg = {
        role: 'assistant',
        content: streamingContent || '(Réponse vide)',
        meta: finalMeta,
      };
      // Note: streamingContent est encore accessible car on l'a capturé
      // avant le reset dans finalizeStreamingBubble
      // Correction: on le capture avant
      AppState.messages.push({
        role: 'assistant',
        content: streamingContent,
        meta: finalMeta,
      });

      // Sauvegarder la conversation
      if (AppState.currentConversationId) {
        await ConversationService.save(
          AppState.currentConversationId,
          AppState.messages
        );
      }

      // Générer un titre si premier message
      if (AppState.messages.length <= 2) {
        generateAndSetTitle(model);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        finalizeStreamingBubble({ model });
        AppState.messages.push({
          role: 'assistant',
          content: streamingContent + '\n\n*(Génération interrompue)*',
          meta: { model },
        });
        ToastComponent.show('Génération arrêtée', 'info');
      } else {
        console.error('[Chat] Erreur streaming:', err);

        // Supprimer la bulle de streaming
        if (streamingBubble) {
          streamingBubble.remove();
          streamingBubble = null;
          streamingTextEl = null;
        }

        ToastComponent.show('Erreur: ' + err.message, 'error');
      }
    } finally {
      setGenerating(false);
      abortController = null;
    }
  }

  // ══════════════════════════════════════════
  //  BUILD API MESSAGES (avec system prompt)
  // ══════════════════════════════════════════

  function buildApiMessages() {
    const messages = [];

    // System prompt
    const systemPrompt = StorageService.getSystemPrompt();
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    // Historique des messages
    messages.push(...AppState.messages.map(m => ({
      role: m.role,
      content: m.content,
    })));

    return messages;
  }

  // ══════════════════════════════════════════
  //  GENERATE TITLE
  // ══════════════════════════════════════════

  async function generateAndSetTitle(model) {
    const d = DOM.refs;
    try {
      const title = await OllamaService.generateTitle(model, AppState.messages);
      if (title && AppState.currentConversationId) {
        await ConversationService.rename(AppState.currentConversationId, title);
        if (d.headerTitle) d.headerTitle.textContent = title;
        SidebarComponent.loadConversations();
      }
    } catch (err) {
      console.warn('[Chat] Titre auto-generation:', err.message);
    }
  }

  // ══════════════════════════════════════════
  //  STOP STREAMING
  // ══════════════════════════════════════════

  function stopStreaming() {
    if (abortController) {
      abortController.abort();
    }
  }

  // ══════════════════════════════════════════
  //  REGENERATE LAST RESPONSE
  // ══════════════════════════════════════════

  async function regenerateLastResponse() {
    if (isGenerating) return;

    // Supprimer le dernier message assistant
    if (AppState.messages.length > 0 &&
        AppState.messages[AppState.messages.length - 1].role === 'assistant') {
      AppState.messages.pop();
    }

    // Supprimer la dernière bulle assistant du DOM
    const d = DOM.refs;
    if (d.chatMessages) {
      const bubbles = d.chatMessages.querySelectorAll('.message-assistant');
      if (bubbles.length > 0) {
        bubbles[bubbles.length - 1].remove();
      }
    }

    // Récupérer le dernier message user
    const lastUserMsg = [...AppState.messages]
      .reverse()
      .find(m => m.role === 'user');

    if (!lastUserMsg) {
      ToastComponent.show('Aucun message à régénérer', 'warning');
      return;
    }

    // Relancer le streaming
    const model = ModelSelectorComponent.getSelectedModel();
    if (!model) {
      ToastComponent.show('Veuillez sélectionner un modèle', 'warning');
      return;
    }

    const apiMessages = buildApiMessages();
    createStreamingBubble();
    setGenerating(true);
    abortController = new AbortController();

    try {
      const response = await OllamaService.chatStream(
        model,
        apiMessages,
        parseFloat(StorageService.getTemperature()),
        abortController.signal
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalMeta = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let jsonStr = line.startsWith('data: ') ? line.slice(6) : line;
          try {
            const json = JSON.parse(jsonStr);
            if (json.token) appendToStreamingBubble(json.token);
            if (json.done) {
              finalMeta = {
                model,
                duration: json.total_duration
                  ? Helpers.formatDuration(json.total_duration)
                  : null,
                tokens: json.eval_count || null,
                speed: (json.eval_count && json.eval_duration)
                  ? ((json.eval_count / (json.eval_duration / 1e9)).toFixed(1))
                  : null,
              };
            }
          } catch (e) { /* ignore */ }
        }
      }

      finalizeStreamingBubble(finalMeta);

      AppState.messages.push({
        role: 'assistant',
        content: streamingContent,
        meta: finalMeta,
      });

      if (AppState.currentConversationId) {
        await ConversationService.save(
          AppState.currentConversationId,
          AppState.messages
        );
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        finalizeStreamingBubble({ model });
        ToastComponent.show('Régénération arrêtée', 'info');
      } else {
        if (streamingBubble) {
          streamingBubble.remove();
          streamingBubble = null;
          streamingTextEl = null;
        }
        ToastComponent.show('Erreur: ' + err.message, 'error');
      }
    } finally {
      setGenerating(false);
      abortController = null;
    }
  }

  // ══════════════════════════════════════════
  //  NEW CHAT
  // ══════════════════════════════════════════

  function newChat() {
    const d = DOM.refs;

    AppState.currentConversationId = null;
    AppState.messages = [];

    // Vider les bulles
    if (d.chatMessages) {
      d.chatMessages.querySelectorAll('.message').forEach(el => el.remove());
    }

    // Afficher le welcome
    showWelcome(true);

    // Reset header
    if (d.headerTitle) d.headerTitle.textContent = 'Nouvelle conversation';

    // Reset input
    if (d.userInput) {
      d.userInput.value = '';
      d.userInput.style.height = 'auto';
      d.userInput.disabled = false;
      d.userInput.focus();
    }
    if (d.btnSend) {
      d.btnSend.disabled = true;
      d.btnSend.style.display = 'flex';
    }
    if (d.btnStop) d.btnStop.style.display = 'none';
    if (d.typingIndicator) d.typingIndicator.style.display = 'none';

    // Déselectionner dans la sidebar
    SidebarComponent.setActiveConversation(null);

    console.log('[Chat] Nouvelle conversation');
  }

  // ══════════════════════════════════════════
  //  LOAD CONVERSATION
  // ══════════════════════════════════════════

  async function loadConversation(id) {
    const d = DOM.refs;

    try {
      const conv = await ConversationService.get(id);

      AppState.currentConversationId = id;
      AppState.messages = conv.messages || [];

      // Masquer le welcome
      showWelcome(false);

      // Titre
      if (d.headerTitle) {
        d.headerTitle.textContent = conv.title || 'Sans titre';
      }

      // Modèle
      if (conv.model) {
        ModelSelectorComponent.selectModel(conv.model, false);
      }

      // Rendu
      renderMessages();

      // Active dans la sidebar
      SidebarComponent.setActiveConversation(id);

      console.log('[Chat] Conversation chargée:', id);

    } catch (err) {
      console.error('[Chat] Erreur chargement:', err);
      ToastComponent.show('Erreur chargement: ' + err.message, 'error');
    }
  }

  // ══════════════════════════════════════════
  //  DELETE CURRENT CHAT
  // ══════════════════════════════════════════

  async function deleteCurrentChat() {
    if (!AppState.currentConversationId) {
      ToastComponent.show('Aucune conversation à supprimer', 'warning');
      return;
    }

    if (!confirm('Supprimer cette conversation ?')) return;

    try {
      await ConversationService.remove(AppState.currentConversationId);
      newChat();
      SidebarComponent.loadConversations();
      ToastComponent.show('Conversation supprimée', 'success');
    } catch (err) {
      ToastComponent.show('Erreur suppression: ' + err.message, 'error');
    }
  }

  // ══════════════════════════════════════════
  //  EXPORT CONVERSATION
  // ══════════════════════════════════════════

  function exportConversation() {
    if (AppState.messages.length === 0) {
      ToastComponent.show('Aucune conversation à exporter', 'warning');
      return;
    }

    const d = DOM.refs;
    const title = (d.headerTitle && d.headerTitle.textContent) || 'conversation';

    let md = `# ${title}\n\n`;
    md += `**Modèle** : ${ModelSelectorComponent.getSelectedModel() || '?'}\n`;
    md += `**Date** : ${new Date().toLocaleString('fr-FR')}\n\n---\n\n`;

    AppState.messages.forEach(msg => {
      const label = msg.role === 'user' ? 'Vous' : 'Assistant';
      md += `### ${label}\n\n${msg.content}\n\n`;

      if (msg.meta) {
        const parts = [];
        if (msg.meta.model)    parts.push(msg.meta.model);
        if (msg.meta.duration) parts.push(msg.meta.duration);
        if (msg.meta.tokens)   parts.push(msg.meta.tokens + ' tokens');
        if (msg.meta.speed)    parts.push(msg.meta.speed + ' tok/s');
        if (parts.length) md += `*${parts.join(' · ')}*\n\n`;
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\s-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    ToastComponent.show('Conversation exportée', 'success');
  }

  // ══════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════

  return {
    init,
    sendMessage,
    stopStreaming,
    newChat,
    loadConversation,
    deleteCurrentChat,
    exportConversation,
    regenerateLastResponse,
    renderMessages,
    scrollToBottom,
    showWelcome,
  };
})();