'use client';

import { useState, useCallback } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import ChatArea from '@/components/chat/ChatArea';
import {
  SendIcon,
  SidebarToggleIcon,
  CodeIcon,
  LightBulbIcon,
  PenIcon,
  SearchIcon,
} from '@/components/ui/Icons';
import { useChat, createMessage } from '@/hooks/useChat';
import { Message, ChatSettings, Conversation } from '@/types/chat';

interface Props {
  onToggleSidebar: () => void;
  settings: ChatSettings;
  conversation: Conversation | null;
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
  onEnsureConversation,
  onAddMessage,
  onUpdateAssistant,
  onSaveConversation,
  onGenerateTitle,
}: Props) {
  const [input, setInput] = useState('');

  const convId = conversation?.id || '';
  const messages = conversation?.messages || [];

  const { isStreaming, sendMessages, stop } = useChat({
    settings,
    messages,
    onUpdateAssistant,
    onStreamEnd: () => {
      if (convId) onSaveConversation(convId);
    },
  });

  const hasMessages = messages.length > 0;

  const handleSend = useCallback(async (text?: string) => {
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
  }, [input, isStreaming, convId, messages, onEnsureConversation, onAddMessage, onGenerateTitle, sendMessages, stop, settings.model]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-bg-hover transition-colors"
          >
            <SidebarToggleIcon size={20} />
          </button>
          <span className="text-sm text-text-muted font-medium">
            {settings.model || 'Aucun modèle'}
          </span>
        </div>
        {conversation && (
          <span className="text-sm text-text-muted truncate max-w-sm font-medium">
            {conversation.title}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <ChatArea messages={messages} isStreaming={isStreaming} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-lg px-4">
              <div className="flex justify-center mb-6">
                <StarLogo size={56} />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary mb-3">
                Comment puis-je vous aider ?
              </h2>
              <p className="text-base text-text-muted mb-8">
                Choisissez une suggestion ou écrivez votre message.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.label)}
                      className="flex flex-col items-center gap-3 p-5 w-40 rounded-xl bg-bg-card border border-border-subtle hover:bg-bg-hover hover:border-[var(--accent)] transition-all duration-200"
                    >
                      <Icon size={28} color="var(--accent)" />
                      <span className="text-sm font-semibold text-text-secondary">
                        {s.label}
                      </span>
                      <span className="text-xs text-text-muted leading-tight">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-5 py-4 pr-14 text-base text-text-secondary placeholder:text-text-placeholder resize-none accent-border-focus transition-all duration-200"
          />
          <button
            onClick={() => handleSend()}
            className={`absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-150 ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600'
                : 'gradient-bg hover:brightness-110'
            }`}
          >
            {isStreaming ? (
              <span className="w-3.5 h-3.5 bg-white rounded-sm" />
            ) : (
              <SendIcon size={18} color="white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
