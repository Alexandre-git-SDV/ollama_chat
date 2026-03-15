/**
 * ============================================
 *  Bootstrap — Charge les composants HTML
 *  puis initialise l'application
 * ============================================
 */

const COMPONENTS = [
  { path: 'components/sidebar.html',          slot: 'sidebar-slot' },
  { path: 'components/chat-header.html',      slot: 'chat-header-slot' },
  { path: 'components/chat-messages.html',    slot: 'chat-messages-slot' },
  { path: 'components/chat-input.html',       slot: 'chat-input-slot' },
  { path: 'components/modal-settings.html',   slot: 'modal-settings-slot' },
  { path: 'components/modal-model-info.html', slot: 'modal-model-info-slot' },
  { path: 'components/toast-container.html',  slot: 'toast-slot' },
];

async function loadComponent(path, slotId) {
  const slot = document.getElementById(slotId);
  if (!slot) {
    console.warn(`[Bootstrap] Slot "#${slotId}" introuvable`);
    return;
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    slot.innerHTML = await res.text();
  } catch (err) {
    console.error(`[Bootstrap] Erreur chargement ${path}:`, err);
    slot.innerHTML = `<div style="color:red;padding:1rem;">Erreur: ${path}</div>`;
  }
}

(async function bootstrap() {
  const start = performance.now();

  // 1. Charger tous les composants HTML en parallèle
  await Promise.all(
    COMPONENTS.map(c => loadComponent(c.path, c.slot))
  );

  console.log(`[Bootstrap] Composants chargés en ${(performance.now() - start).toFixed(1)}ms`);

  // 2. Charger les modules JS dans l'ordre
  const scripts = [
    'js/config.js',
    'js/utils/helpers.js',
    'js/utils/dom.js',
    'js/utils/markdown.js',
    'js/components/toast.component.js',
    'js/services/api.service.js',
    'js/services/storage.service.js',
    'js/services/ollama.service.js',
    'js/services/conversation.service.js',
    'js/components/theme.component.js',
    'js/components/sidebar.component.js',
    'js/components/model-selector.component.js',
    'js/components/settings.component.js',
    'js/components/chat.component.js',
    'js/app.js',
  ];

  for (const src of scripts) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Erreur chargement: ${src}`));
      document.body.appendChild(s);
    });
  }

  console.log('[Bootstrap] ✓ Application prête');
})();