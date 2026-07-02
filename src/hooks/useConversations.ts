'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';

const STORAGE_KEY = 'ollama-chat-conversations';
const ACTIVE_KEY = 'ollama-chat-active';
const USER_ID_KEY = 'ollama-chat-user-id';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uid();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
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

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to load conversations');
  const data = await res.json();
  return data.conversations.map((c: Record<string, unknown>) => ({
    ...c,
    id: (c._id as string) || c.id,
    model: (c.modelName as string) || (c.model as string),
  })) as Conversation[];
}

async function createConversationApi(
  model: string,
  title?: string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string
): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify({
      title: title || 'Nouvelle conversation',
      model,
      temperature,
      maxTokens,
      systemPrompt,
    }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  const data = await res.json();
  return {
    id: data._id,
    title: data.title,
    model: data.modelName,
    messages: [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function saveConversationApi(
  id: string,
  messages: Message[],
  title?: string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  model?: string
): Promise<void> {
  const res = await fetch(`/api/conversations/${id}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify({
      messages,
      title,
      temperature,
      maxTokens,
      systemPrompt,
      modelName: model,
    }),
  });
  if (!res.ok) throw new Error('Failed to save conversation');
}

async function deleteConversationApi(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-id': getUserId() },
  });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete conversation');
}

async function renameConversationApi(id: string, title: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to rename conversation');
}

function generateLocalTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'Nouvelle conversation';
  const text = first.content.slice(0, 50);
  return text.length < first.content.length ? text + '…' : text;
}

async function fetchGeneratedTitle(messages: Message[], model: string): Promise<string> {
  try {
    const res = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
    });
    if (!res.ok) throw new Error('Failed to generate title');
    const data = await res.json();
    return data.title || generateLocalTitle(messages);
  } catch {
    return generateLocalTitle(messages);
  }
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
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activeIdRef = useRef<string | null>(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    saveToStorage(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_KEY, activeId);
    }
  }, [activeId]);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      setIsLoading(true);
      try {
        const convs = await fetchConversations();
        if (convs.length > 0) {
          setConversations(convs);
        }
      } catch {
        // fallback to localStorage
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const active = conversations.find((c) => c.id === activeId) || null;

  const createConversation = useCallback(
    async (
      model: string,
      temperature = 1,
      maxTokens = 2048,
      systemPrompt = ''
    ): Promise<string> => {
      try {
        const conv = await createConversationApi(model, 'Nouvelle conversation', temperature, maxTokens, systemPrompt);
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        return conv.id;
      } catch {
        const now = new Date().toISOString();
        const localConv: Conversation = {
          id: uid(),
          title: 'Nouvelle conversation',
          messages: [],
          model,
          temperature: 1,
          maxTokens: 2048,
          systemPrompt: '',
          createdAt: now,
          updatedAt: now,
        };
        setConversations((prev) => [localConv, ...prev]);
        setActiveId(localConv.id);
        return localConv.id;
      }
    },
    []
  );

  const switchConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const wasActive = activeIdRef.current === id;

    try {
      await deleteConversationApi(id);
    } catch {
      // continue with local delete
    }

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_KEY);
      }
      return filtered;
    });

    if (wasActive) {
      requestAnimationFrame(() => {
        const current = loadFromStorage();
        setActiveId(current.length > 0 ? current[0].id : null);
      });
    }
  }, []);

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await renameConversationApi(id, title);
    } catch {
      // continue with local update
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const addMessage = useCallback(
    (convId: string, message: Message) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const msgs = [...c.messages, message];
          const title =
            message.role === 'user' && msgs.filter((m) => m.role === 'user').length === 1
              ? generateLocalTitle(msgs)
              : c.title;
          return { ...c, messages: msgs, title, updatedAt: new Date().toISOString() };
        })
      );
    },
    []
  );

  const updateLastAssistantMessage = useCallback(
    (convId: string, content: string) => {
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
    },
    []
  );

  const saveConversation = useCallback(
    async (convId: string): Promise<void> => {
      setConversations((prev) => {
        const conv = prev.find((c) => c.id === convId);
        if (!conv) return prev;

        (async () => {
          try {
            await saveConversationApi(
              convId,
              conv.messages,
              conv.title,
              conv.temperature ?? 1,
              conv.maxTokens ?? 2048,
              conv.systemPrompt ?? '',
              conv.model
            );
          } catch {
            // silently fail, will save on next attempt
          }
        })();

        return prev;
      });
    },
    []
  );

  const clearAll = useCallback(async () => {
    for (const conv of conversations) {
      try {
        await deleteConversationApi(conv.id);
      } catch {
        // continue
      }
    }
    setConversations([]);
    setActiveId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }, [conversations]);

  const generateTitle = useCallback(
    async (convId: string, messages: Message[], model: string) => {
      const title = await fetchGeneratedTitle(messages, model);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title } : c))
      );
      try {
        await renameConversationApi(convId, title);
      } catch {
        // continue with local update
      }
    },
    []
  );

  return {
    conversations: mounted ? conversations : [],
    // Gaté par `mounted` : `active` vient de localStorage, invisible du SSR — le
    // rendre avant hydratation provoquerait un mismatch (ex. titre du header).
    active: mounted ? active : null,
    activeId,
    isLoading,
    mounted,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    addMessage,
    updateLastAssistantMessage,
    saveConversation,
    clearAll,
    generateTitle,
  };
}
