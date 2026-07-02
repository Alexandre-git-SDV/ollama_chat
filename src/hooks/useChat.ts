'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Pattern « latest ref » : synchronisé après commit (jamais pendant le rendu),
  // lu uniquement dans des handlers déclenchés après coup.
  useEffect(() => {
    messagesRef.current = messages;
    onUpdateAssistantRef.current = onUpdateAssistant;
    onStreamEndRef.current = onStreamEnd;
    settingsRef.current = settings;
  });

  const sendMessages = useCallback(
    async (convId: string, messagesToSend: Message[]) => {
      if (isStreaming) return;

      setIsStreaming(true);
      accumulatorRef.current = '';

      const controller = new AbortController();
      abortRef.current = controller;

      const model = settingsRef.current.model;
      const systemPrompt = settingsRef.current.systemPrompt?.trim();

      // Messages Ollama : system optionnel en tête, puis l'historique.
      const ollamaMessages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messagesToSend.map((m) => ({ role: m.role, content: m.content })),
      ];

      const fail = (message: string) => {
        // Préfixe « ❌ » : MessageBubble rend ces messages en rouge.
        onUpdateAssistantRef.current(convId, message);
      };

      try {
        const res = await fetch('/api/ollama/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            model,
            messages: ollamaMessages,
            stream: true,
            options: {
              temperature: settingsRef.current.temperature,
              num_predict: settingsRef.current.maxTokens,
            },
          }),
          signal: controller.signal,
        });

        if (res.status === 502 || res.status === 503) {
          fail(
            '❌ Ollama déconnecté — vérifie que le serveur Ollama tourne (ollama serve).'
          );
          return;
        }
        if (res.status === 404) {
          fail(`❌ Modèle introuvable — lance \`ollama pull ${model}\`.`);
          return;
        }
        if (!res.ok || !res.body) {
          fail(`❌ Erreur Ollama (HTTP ${res.status}).`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let json: {
              message?: { content?: string };
              error?: string;
              done?: boolean;
            };
            try {
              json = JSON.parse(trimmed);
            } catch {
              continue;
            }

            if (json.error) {
              if (/not found|no such model|try pulling/i.test(json.error)) {
                fail(`❌ Modèle introuvable — lance \`ollama pull ${model}\`.`);
              } else {
                fail(`❌ Erreur Ollama — ${json.error}`);
              }
              return;
            }

            const content = json.message?.content;
            if (content) {
              accumulatorRef.current += content;
              onUpdateAssistantRef.current(convId, accumulatorRef.current);
            }

            if (json.done) break;
          }
        }
      } catch (err: unknown) {
        // Stop volontaire : on garde le texte déjà accumulé, aucun message.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        fail(
          '❌ Ollama déconnecté — vérifie que le serveur Ollama tourne (ollama serve).'
        );
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
