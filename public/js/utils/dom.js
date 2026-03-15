/**
 * ============================================
 *  Cache DOM — Référence centralisée
 * ============================================
 *
 *  Appelé APRÈS le chargement des composants HTML.
 *  Tous les éléments sont garantis présents dans le DOM.
 */
var DOM = (function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  // On retourne un objet mutable qui sera peuplé par init()
  const refs = {};

  function init() {
    Object.assign(refs, {
      // App
      app:              $('#app'),

      // Sidebar
      sidebar:          $('#sidebar'),
      sidebarBackdrop:  $('#sidebarBackdrop'),
      conversationsList: $('#conversationsList'),
      connectionStatus: $('#connectionStatus'),
      btnNewChat:       $('#btnNewChat'),
      btnOpenSettings:  $('#btnOpenSettings'),
      btnToggleTheme:   $('#btnToggleTheme'),
      themeLabel:       $('#themeLabel'),
      iconMoon:         $('.icon-moon'),
      iconSun:          $('.icon-sun'),

      // Chat header
      btnSidebarToggle: $('#btnSidebarToggle'),
      headerTitle:      $('#headerTitle'),
      btnModelSelect:   $('#btnModelSelect'),
      modelName:        $('#modelName'),
      modelDropdown:    $('#modelDropdown'),
      btnExport:        $('#btnExport'),
      btnDeleteChat:    $('#btnDeleteChat'),

      // Chat messages
      chatMessages:     $('#chatMessages'),
      welcomeScreen:    $('#welcomeScreen'),

      // Chat input
      userInput:        $('#userInput'),
      btnSend:          $('#btnSend'),
      btnStop:          $('#btnStop'),

      // Typing
      typingIndicator:  $('#typingIndicator'),

      // Settings modal
      settingsModal:    $('#settingsModal'),
      closeSettings:    $('#closeSettings'),
      modelSelect:      $('#modelSelect'),
      btnRefreshModels: $('#btnRefreshModels'),
      btnModelInfo:     $('#btnModelInfo'),
      systemPrompt:     $('#systemPrompt'),
      temperature:      $('#temperature'),
      tempValue:        $('#tempValue'),
      colorSwatches:    $('#colorSwatches'),

      // Model info modal
      modelInfoModal:   $('#modelInfoModal'),
      closeModelInfo:   $('#closeModelInfo'),
      modelInfoContent: $('#modelInfoContent'),

      // Toast
      toastContainer:   $('#toastContainer'),

      // Highlight themes
      hljsThemeDark:    $('#hljs-theme-dark'),
      hljsThemeLight:   $('#hljs-theme-light'),
    });

    // Vérification
    const missing = Object.entries(refs)
      .filter(([, el]) => !el)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.warn('[DOM] Éléments manquants:', missing.join(', '));
    } else {
      console.log('[DOM] ✓ Tous les éléments trouvés');
    }
  }

  return { refs, init };
})();
