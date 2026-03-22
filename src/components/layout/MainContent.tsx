'use client';

import { useState } from 'react';
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
import { useChat } from '@/hooks/useChat';
import { Message, ChatSettings, Conversation } from '@/types/chat';

interface Props {
  onToggleSidebar: () => void;
  settings: ChatSettings;
  conversation: Conversation | null;
  onEnsureConversation: () => string;
  onAddMessage: (convId: string, msg: Message) => void;
  onUpdateAssistant: (convId: string, content: string) => void;
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
}: Props) {
  const [input, setInput] = useState('');

  const convId = conversation?.id || '';
  const messages = conversation?.messages || [];

  const { isStreaming, send, stop } = useChat({
    settings,
    messages,
    onAddMessage: (msg) => {
      const id = convId || onEnsureConversation();
      onAddMessage(id, msg);
    },
    onUpdateAssistant: (content) => {
      if (convId) onUpdateAssistant(convId, content);
    },
  });

  const hasMessages = messages.length > 0;

  const handleSend = (text?: string) => {
    const value = text || input;
    if (isStreaming) {
      stop();
      return;
    }
    if (!value.trim()) return;

    // Ensure conversation exists
    if (!convId) onEnsureConversation();

    send(value);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover transition-colors"
          >
            <SidebarToggleIcon size={18} />
          </button>
          <span className="text-sm text-text-muted">
            {settings.model || 'Aucun modèle'}
          </span>
        </div>
        {conversation && (
          <span className="text-xs text-text-muted truncate max-w-xs">
            {conversation.title}
          </span>
        )}
      </div>

      {/* Zone centrale */}
      <div className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <ChatArea messages={messages} isStreaming={isStreaming} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-lg px-4">
              <div className="flex justify-center mb-5">
                <StarLogo size={48} />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Comment puis-je vous aider ?
              </h2>
              <p className="text-sm text-text-muted mb-8">
                Choisissez une suggestion ou écrivez votre message.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.label)}
                      className="flex flex-col items-center gap-2 p-4 w-36 rounded-xl bg-bg-card border border-border-subtle hover:bg-bg-hover hover:border-[var(--accent)] transition-all duration-200"
                    >
                      <Icon size={24} color="var(--accent)" />
                      <span className="text-xs font-medium text-text-secondary">
                        {s.label}
                      </span>
                      <span className="text-[10px] text-text-muted leading-tight">
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

      {/* Input */}
      <div className="p-4">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 pr-12 text-sm text-text-secondary placeholder:text-text-placeholder resize-none accent-border-focus transition-all duration-200"
          />
          <button
            onClick={() => handleSend()}
            className={`absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-150 ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600'
                : 'gradient-bg hover:brightness-110'
            }`}
          >
            {isStreaming ? (
              <span className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <SendIcon size={16} color="white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}