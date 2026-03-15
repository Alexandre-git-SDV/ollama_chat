/**
 * ============================================
 *  Conversation Service — CRUD
 * ============================================
 */
var ConversationService = (function () {
  'use strict';

  async function list() {
    try {
      const data = await ApiService.get('/chat/conversations');
      return data.conversations || [];
    } catch (err) {
      console.error('[Conversations] list:', err);
      return [];
    }
  }

  async function get(id) {
    const data = await ApiService.get(`/chat/conversation/${id}`);
    if (!data.success) throw new Error(data.error || 'Not found');
    return data.conversation;
  }

  async function create(model) {
    const data = await ApiService.post('/chat/conversation', { model });
    if (!data.success) throw new Error(data.error || 'Creation failed');
    return data.conversation;
  }

  async function save(id, messages) {
    return ApiService.post(`/chat/conversation/${id}/save`, { messages });
  }

  async function rename(id, title) {
    return ApiService.put(`/chat/conversation/${id}`, { title });
  }

  async function remove(id) {
    return ApiService.del(`/chat/conversation/${id}`);
  }

  return { list, get, create, save, rename, remove };
})();