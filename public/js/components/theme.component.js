/**
 * ============================================
 *  Theme Component — Gestion thème clair/sombre
 * ============================================
 */
var ThemeComponent = (function () {
  'use strict';

  function init() {
    const saved = StorageService.getTheme();
    apply(saved);

    // Accent color
    const accent = StorageService.getAccent();
    setAccent(accent);
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const d = DOM.refs;
    if (d.hljsThemeDark && d.hljsThemeLight) {
      d.hljsThemeDark.disabled = (theme === 'light');
      d.hljsThemeLight.disabled = (theme === 'dark');
    }

    if (d.iconMoon && d.iconSun) {
      d.iconMoon.style.display = (theme === 'dark') ? 'inline' : 'none';
      d.iconSun.style.display = (theme === 'light') ? 'inline' : 'none';
    }

    if (d.themeLabel) {
      d.themeLabel.textContent = (theme === 'dark') ? 'Thème sombre' : 'Thème clair';
    }
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = (current === 'dark') ? 'light' : 'dark';
    apply(next);
    StorageService.setTheme(next);
  }

  function setAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    StorageService.setAccent(color);
  }

  return { init, toggle, setAccent };
})();
