'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, ChatSettings } from '@/types/chat';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createMessage(role: 'user' | 'assistant', content: string, model?: string): Message {
  return {
    id: uid(),
    role,
    content,
    model,
    createdAt: new Date().toISOString(),
  };
}

interface UseChatOptions {
  settings: ChatSettings;
  messages: Message[];
  onUpdateAssistant: (convId: string, content: string) => void;
  onStreamEnd?: () => void;
}

export function useChat({ settings, messages, onUpdateAssistant, onStreamEnd }: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const accumulatorRef = useRef('');
  const messagesRef = useRef<Message[]>(messages);
  const onUpdateAssistantRef = useRef(onUpdateAssistant);
  const onStreamEndRef = useRef(onStreamEnd);
  const settingsRef = useRef(settings);

  messagesRef.current = messages;
  onUpdateAssistantRef.current = onUpdateAssistant;
  onStreamEndRef.current = onStreamEnd;
  settingsRef.current = settings;

  const sendMessages = useCallback(
    async (convId: string, messagesToSend: Message[]) => {
      if (isStreaming) return;

      setIsStreaming(true);
      accumulatorRef.current = '';

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesToSend.map((m) => ({ role: m.role, content: m.content })),
            model: settingsRef.current.model,
            temperature: settingsRef.current.temperature,
            maxTokens: settingsRef.current.maxTokens,
            systemPrompt: settingsRef.current.systemPrompt,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('Stream failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatorRef.current += data.content;
                onUpdateAssistantRef.current(convId, accumulatorRef.current);
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          if (!accumulatorRef.current) {
            onUpdateAssistantRef.current(convId, '❌ Erreur de connexion à Ollama.');
          }
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        onStreamEndRef.current?.();
      }
    },
    [isStreaming]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, sendMessages, stop };
}
