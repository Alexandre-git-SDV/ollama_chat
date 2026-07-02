'use client';

import { Message } from '@/types/chat';
import StarLogo from '@/components/ui/StarLogo';
import Markdown from './Markdown';
import { UserIcon } from '@/components/ui/Icons';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

function isError(content: string) {
  return content.startsWith('❌');
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';
  const empty = message.content.length === 0;

  return (
    <div className={`flex gap-3 animate-msg-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'gradient-bg' : 'bg-bg-card border border-border-subtle'
        }`}
      >
        {isUser ? (
          <UserIcon size={17} color="#ffffff" />
        ) : (
          <StarLogo size={19} gradient />
        )}
      </div>

      {/* Contenu */}
      <div className={`min-w-0 max-w-full pt-1 ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className="inline-block text-left whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text-primary bg-bg-card border border-border-subtle rounded-2xl rounded-tr-sm px-4 py-2.5">
            {message.content}
          </div>
        ) : isStreaming && empty ? (
          <div className="flex items-center gap-3 pt-1" role="status" aria-live="polite">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="dot-bounce" style={{ animationDelay: '0s' }} />
              <span className="dot-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="dot-bounce" style={{ animationDelay: '0.4s' }} />
            </span>
            <span className="text-sm text-text-muted">Réflexion en cours…</span>
          </div>
        ) : isError(message.content) ? (
          <p className="text-[15px] leading-relaxed text-led-off whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="text-[15px] text-text-primary break-words">
            <Markdown content={message.content} />
            {isStreaming && <span className="cursor-blink" aria-hidden="true" />}
          </div>
        )}
      </div>
    </div>
  );
}
