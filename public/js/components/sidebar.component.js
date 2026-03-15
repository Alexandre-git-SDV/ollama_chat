/**
 * ============================================
 *  Sidebar Component
 * ============================================
 */
var SidebarComponent = (function () {
  'use strict';

  let currentConversationId = null;

  function init() {
    bindEvents();
    updateConnectionStatus();
    loadConversations();

    // Vérifier la connexion périodiquement
    setInterval(updateConnectionStatus, 30000);
  }

  function bindEvents() {
    const d = DOM.refs;

    if (d.btnSidebarToggle) {
      d.btnSidebarToggle.addEventListener('click', toggleSidebar);
    }
    if (d.sidebarBackdrop) {
      d.sidebarBackdrop.addEventListener('click', closeSidebar);
    }
    if (d.btnNewChat) {
      d.btnNewChat.addEventListener('click', () => ChatComponent.newChat());
    }
  }

  function toggleSidebar() {
    const d = DOM.refs;
    if (!d.sidebar) return;

    d.sidebar.classList.toggle('collapsed');

    if (window.innerWidth <= 768) {
      const isOpen = !d.sidebar.classList.contains('collapsed');
      if (d.sidebarBackdrop) {
        d.sidebarBackdrop.classList.toggle('visible', isOpen);
      }
    }
  }

  function closeSidebar() {
    const d = DOM.refs;
    if (d.sidebar) d.sidebar.classList.add('collapsed');
    if (d.sidebarBackdrop) d.sidebarBackdrop.classList.remove('visible');
  }

  async function updateConnectionStatus() {
    const d = DOM.refs;
    if (!d.connectionStatus) return;

    const dot = d.connectionStatus.querySelector('.status-dot');
    const txt = d.connectionStatus.querySelector('.status-text');

    const connected = await OllamaService.checkConnection();

    if (dot) {
      dot.classList.toggle('connected', connected);
      dot.classList.toggle('disconnected', !connected);
    }
    if (txt) {
      txt.textContent = connected ? 'Ollama connecté' : 'Ollama déconnecté';
    }
  }

  async function loadConversations() {
    const d = DOM.refs;
    if (!d.conversationsList) return;

    const conversations = await ConversationService.list();

    if (conversations.length === 0) {
      d.conversationsList.innerHTML = `
        <div class="no-conversations">
          <p>Aucune conversation</p>
        </div>`;
      return;
    }

    d.conversationsList.innerHTML = conversations.map(conv => `
      <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}"
           data-id="${conv.id}">
        <div class="conversation-info" data-action="load" data-id="${conv.id}">
          <span class="conversation-title">${Helpers.escapeHtml(conv.title || 'Sans titre')}</span>
          <span class="conversation-date">${Helpers.formatDate(conv.updated_at)}</span>
        </div>
        <div class="conversation-actions">
          <button class="btn-conv-action" data-action="rename" data-id="${conv.id}"
                  title="Renommer">
            ${AppConfig.ICONS.edit}
          </button>
          <button class="btn-conv-action" data-action="delete" data-id="${conv.id}"
                  title="Supprimer">
            ${AppConfig.ICONS.trash}
          </button>
        </div>
      </div>
    `).join('');

    // Event delegation
    d.conversationsList.addEventListener('click', handleConversationClick);
  }

  async function handleConversationClick(e) {
    const loadBtn = e.target.closest('[data-action="load"]');
    const renameBtn = e.target.closest('[data-action="rename"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    if (loadBtn) {
      const id = loadBtn.dataset.id;
      await ChatComponent.loadConversation(id);
      setActiveConversation(id);
      if (window.innerWidth <= 768) closeSidebar();
    }

    if (renameBtn) {
      e.stopPropagation();
      const id = renameBtn.dataset.id;
      const newTitle = prompt('Nouveau titre :');
      if (newTitle && newTitle.trim()) {
        await ConversationService.rename(id, newTitle.trim());
        loadConversations();
        ToastComponent.show('Conversation renommée', 'success');
      }
    }

    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      if (confirm('Supprimer cette conversation ?')) {
        await ConversationService.remove(id);
        if (id === currentConversationId) {
          ChatComponent.newChat();
        }
        loadConversations();
        ToastComponent.show('Conversation supprimée', 'success');
      }
    }
  }

  function setActiveConversation(id) {
    currentConversationId = id;
    const items = document.querySelectorAll('.conversation-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.id === id);
    });
  }

  return {
    init,
    loadConversations,
    setActiveConversation,
    closeSidebar,
  };
})();