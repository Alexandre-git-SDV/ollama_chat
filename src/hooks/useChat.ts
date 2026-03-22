'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, ChatSettings } from '@/types/chat';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface UseChatOptions {
  settings: ChatSettings;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
  onUpdateAssistant: (content: string) => void;
}

export function useChat({ settings, messages, onAddMessage, onUpdateAssistant }: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const accumulatorRef = useRef('');

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddMessage(userMsg);

      const assistantMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        model: settings.model,
        createdAt: new Date().toISOString(),
      };
      onAddMessage(assistantMsg);

      setIsStreaming(true);
      accumulatorRef.current = '';

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const allMessages = [...messages, userMsg];

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            systemPrompt: settings.systemPrompt,
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
                onUpdateAssistant(accumulatorRef.current);
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          if (!accumulatorRef.current) {
            onUpdateAssistant('❌ Erreur de connexion à Ollama.');
          }
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, settings, isStreaming, onAddMessage, onUpdateAssistant]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, send, stop };
}
