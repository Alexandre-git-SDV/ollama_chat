/**
 * ============================================
 *  App — Orchestrateur principal
 * ============================================
 *
 *  Exécuté APRÈS le chargement de tous les
 *  composants HTML et scripts JS.
 *
 *  Responsabilité : initialiser chaque module
 *  dans le bon ordre.
 * ============================================
 */

// ── État global de l'application ──
var AppState = {
  currentConversationId: null,
  currentModel: '',
  messages: [],
};

(function () {
  'use strict';

  // ══════════════════════════════════════════
  //  BANNER CONSOLE
  // ══════════════════════════════════════════

  console.log(
    '%c 🤖 Ollama Chat ',
    'background:#8b5cf6;color:white;font-size:14px;padding:4px 12px;border-radius:4px;'
  );
  console.log(`📍 ${AppConfig.BASE_URL}`);

  // ══════════════════════════════════════════
  //  INITIALISATION SÉQUENTIELLE
  // ══════════════════════════════════════════

  function init() {
    const start = performance.now();

    // 1. Cache DOM (tous les éléments doivent exister)
    DOM.init();

    // 2. Utilitaires
    MarkdownRenderer.configure();

    // 3. Thème (avant tout rendu visible)
    ThemeComponent.init();

    // 4. Composants UI
    ToastComponent.init();
    ModelSelectorComponent.init();
    SettingsComponent.init();
    SidebarComponent.init();
    ChatComponent.init();

    // 5. Focus initial
    if (DOM.refs.userInput) DOM.refs.userInput.focus();

    const elapsed = (performance.now() - start).toFixed(1);
    console.log(`[App] ✓ Initialisé en ${elapsed}ms`);
  }

  // Lancer l'init
  init();
})();