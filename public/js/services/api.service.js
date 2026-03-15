/**
 * ============================================
 *  API Service — Appels HTTP génériques
 * ============================================
 */
var ApiService = (function () {
  'use strict';

  const BASE = AppConfig.API_BASE;

  async function get(path) {
    const res = await fetch(BASE + path);
    if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}`);
    return res.json();
  }

  async function post(path, body = {}) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → HTTP ${res.status}`);
    return res.json();
  }

  async function put(path, body = {}) {
    const res = await fetch(BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} → HTTP ${res.status}`);
    return res.json();
  }

  async function del(path) {
    const res = await fetch(BASE + path, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${path} → HTTP ${res.status}`);
    return res.json();
  }

  /**
   * POST avec streaming SSE (ReadableStream)
   * @returns {Response} pour lire le body en stream
   */
  async function postStream(path, body = {}) {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST stream ${path} → HTTP ${res.status}`);
    return res;
  }

  return { get, post, put, del, postStream };
})();