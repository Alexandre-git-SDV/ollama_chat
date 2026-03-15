/**
 * ============================================
 *  Storage Service — Persistance locale
 * ============================================
 */
var StorageService = (function () {
  'use strict';

  const KEYS = AppConfig.STORAGE_KEYS;

  function get(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage] Erreur écriture:', e);
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[Storage] Erreur suppression:', e);
    }
  }

  // Raccourcis typés
  function getModel()        { return get(KEYS.MODEL, AppConfig.DEFAULT_MODEL); }
  function setModel(v)       { set(KEYS.MODEL, v); }
  function getTheme()        { return get(KEYS.THEME, AppConfig.DEFAULT_THEME); }
  function setTheme(v)       { set(KEYS.THEME, v); }
  function getAccent()       { return get(KEYS.ACCENT, AppConfig.DEFAULT_ACCENT); }
  function setAccent(v)      { set(KEYS.ACCENT, v); }
  function getTemperature()  { return parseFloat(get(KEYS.TEMPERATURE, AppConfig.DEFAULT_TEMPERATURE)); }
  function setTemperature(v) { set(KEYS.TEMPERATURE, v); }
  function getSystemPrompt() { return get(KEYS.SYSTEM_PROMPT, AppConfig.DEFAULT_SYSTEM_PROMPT); }
  function setSystemPrompt(v){ set(KEYS.SYSTEM_PROMPT, v); }

  return {
    get, set, remove,
    getModel, setModel,
    getTheme, setTheme,
    getAccent, setAccent,
    getTemperature, setTemperature,
    getSystemPrompt, setSystemPrompt,
  };
})();