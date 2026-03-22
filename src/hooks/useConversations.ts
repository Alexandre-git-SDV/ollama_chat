'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';

const STORAGE_KEY = 'ollama-chat-conversations';
const ACTIVE_KEY = 'ollama-chat-active';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadFromStorage(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {
    // storage full
  }
}

function generateTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Nouvelle conversation';
  const text = first.content.slice(0, 50);
  return text.length < first.content.length ? text + '…' : text;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadFromStorage());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadFromStorage();
    const savedActive = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_KEY) : null;
    if (savedActive && loaded.find((c) => c.id === savedActive)) {
      return savedActive;
    }
    return null;
  });
  const activeIdRef = useRef<string | null>(activeId);

  // Keep ref in sync
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Persist conversations
  useEffect(() => {
    if (conversations.length > 0) {
      saveToStorage(conversations);
    }
  }, [conversations]);

  // Persist active id
  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_KEY, activeId);
    }
  }, [activeId]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const createConversation = useCallback((model: string): string => {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: uid(),
      title: 'Nouvelle conversation',
      messages: [],
      model,
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const switchConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const wasActive = activeIdRef.current === id;

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_KEY);
      }
      return filtered;
    });

    if (wasActive) {
      // Use requestAnimationFrame to read updated state after React flush
      requestAnimationFrame(() => {
        const current = loadFromStorage();
        setActiveId(current.length > 0 ? current[0].id : null);
      });
    }
  }, []);

  const addMessage = useCallback((convId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated: Conversation = {
          ...c,
          messages: [...c.messages, message],
          updatedAt: new Date().toISOString(),
        };
        if (updated.messages.filter((m) => m.role === 'user').length === 1) {
          updated.title = generateTitle(updated.messages);
        }
        return updated;
      })
    );
  }, []);

  const updateLastAssistantMessage = useCallback((convId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = [...c.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], content };
            break;
          }
        }
        return { ...c, messages: msgs, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setActiveId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }, []);

  return {
    conversations,
    active,
    activeId,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    updateLastAssistantMessage,
    clearAll,
  };
}