/**
 * ============================================
 *  Toast Component — Notifications
 * ============================================
 */
var ToastComponent = (function () {
  'use strict';

  function show(message, type = 'info', duration) {
    duration = duration || AppConfig.TOAST_DURATION;
    const container = DOM.refs.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Animation d'entrée
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Suppression
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
  }

  return { show };
})();
