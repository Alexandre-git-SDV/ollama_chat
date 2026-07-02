'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import ChatArea from '@/components/chat/ChatArea';
import MainHeader from '@/components/layout/MainHeader';
import {
  SendIcon,
  CodeIcon,
  LightBulbIcon,
  PenIcon,
  SearchIcon,
} from '@/components/ui/Icons';
import { useChat, createMessage } from '@/hooks/useChat';
import { Message, ChatSettings, Conversation, OllamaModel } from '@/types/chat';

interface Props {
  onToggleSidebar: () => void;
  settings: ChatSettings;
  conversation: Conversation | null;
  models: OllamaModel[];
  onModelChange: (m: string) => void;
  onDeleteConversation: (id: string) => void;
  /** Incrémenté par le parent pour demander le focus de la zone de saisie. */
  focusSignal: number;
  onEnsureConversation: () => Promise<string>;
  onAddMessage: (convId: string, msg: Message) => void;
  onUpdateAssistant: (convId: string, content: string) => void;
  onSaveConversation: (convId: string) => Promise<void>;
  onGenerateTitle: (convId: string, messages: Message[]) => void;
}

const suggestions = [
  { icon: CodeIcon, label: 'Écrire du code', desc: 'Génère du code dans ton langage préféré' },
  { icon: LightBulbIcon, label: 'Brainstorming', desc: 'Trouve des idées créatives' },
  { icon: PenIcon, label: 'Rédaction', desc: 'Aide à la rédaction de textes' },
  { icon: SearchIcon, label: 'Analyse', desc: 'Analyse et explique un concept' },
];

export default function MainContent({
  onToggleSidebar,
  settings,
  conversation,
  models,
  onModelChange,
  onDeleteConversation,
  focusSignal,
  onEnsureConversation,
  onAddMessage,
  onUpdateAssistant,
  onSaveConversation,
  onGenerateTitle,
}: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convId = conversation?.id || '';
  const messages = useMemo(() => conversation?.messages || [], [conversation]);

  const { isStreaming, sendMessages, stop } = useChat({
    settings,
    messages,
    onUpdateAssistant,
    onStreamEnd: () => {
      if (convId) onSaveConversation(convId);
    },
  });

  const hasMessages = messages.length > 0;

  // Auto-dimensionne la zone de saisie.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // Place le focus dans la zone de saisie quand le parent le demande (nouvelle
  // conversation). Effet purement DOM, sans setState.
  useEffect(() => {
    if (focusSignal > 0) textareaRef.current?.focus();
  }, [focusSignal]);

  const handleSend = useCallback(
    async (text?: string) => {
      const value = text || input;
      if (isStreaming) {
        stop();
        return;
      }
      if (!value.trim()) return;

      let id = convId;
      if (!id) {
        id = await onEnsureConversation();
      }

      const userMsg = createMessage('user', value.trim());
      const assistantMsg = createMessage('assistant', '', settings.model);

      const isFirstMessage = messages.filter((m) => m.role === 'user').length === 0;
      onAddMessage(id, userMsg);
      onAddMessage(id, assistantMsg);

      if (isFirstMessage) {
        onGenerateTitle(id, [...messages, userMsg]);
      }

      const allMessages = [...messages, userMsg];
      sendMessages(id, allMessages);
      setInput('');
    },
    [input, isStreaming, convId, messages, onEnsureConversation, onAddMessage, onGenerateTitle, sendMessages, stop, settings.model]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header */}
      <MainHeader
        onToggleSidebar={onToggleSidebar}
        title={conversation?.title || settings.model || 'Aucun modèle'}
        conversation={conversation}
        models={models}
        selectedModel={settings.model}
        onModelChange={onModelChange}
        onDeleteConversation={onDeleteConversation}
      />

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <ChatArea messages={messages} isStreaming={isStreaming} />
        ) : (
          <div className="h-full flex items-center justify-center px-4 py-8">
            <div className="text-center w-full max-w-[560px]">
              <div className="flex justify-center mb-7">
                <StarLogo size={64} gradient className="float-star" />
              </div>
              <h2 className="text-[28px] font-bold text-text-title mb-3">
                Comment puis-je vous aider ?
              </h2>
              <p className="text-[15px] text-text-muted mb-9">
                Choisissez une suggestion ou écrivez votre message.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.label)}
                      className="flex flex-col items-start gap-2 p-4 text-left rounded-2xl bg-bg-card border border-border-subtle hover:border-accent hover:bg-bg-field-hover transition-all duration-200 min-h-[44px]"
                    >
                      <Icon size={22} color="var(--accent)" />
                      <span className="text-sm font-semibold text-text-primary">{s.label}</span>
                      <span className="text-xs text-text-muted leading-snug">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre de saisie */}
      <div className="shrink-0 px-4 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-[720px] mx-auto">
          <div className="relative flex items-end gap-2 bg-bg-composer border border-border rounded-2xl pl-4 pr-2 py-2 focus-within:border-accent transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message…"
              aria-label="Message"
              className="flex-1 bg-transparent py-2 text-[15px] text-text-primary placeholder:text-text-placeholder resize-none outline-none max-h-[200px]"
            />
            <button
              onClick={() => handleSend()}
              aria-label={isStreaming ? 'Arrêter la génération' : 'Envoyer le message'}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-150 ${
                isStreaming ? 'bg-led-off hover:brightness-110' : 'gradient-bg hover:brightness-110'
              }`}
            >
              {isStreaming ? (
                <span className="w-3.5 h-3.5 bg-white rounded-[3px]" />
              ) : (
                <SendIcon size={18} color="white" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-text-faint mt-2">
            Les réponses sont générées localement via Ollama
          </p>
        </div>
      </div>
    </main>
  );
}
