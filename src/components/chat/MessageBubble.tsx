'use client';

import { Message } from '@/types/chat';
import StarLogo from '@/components/ui/StarLogo';
import Markdown from './Markdown';
import { UserIcon, CopyIcon, CheckIcon, ReplyIcon } from '@/components/ui/Icons';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

interface Props {
  message: Message;
  isStreaming?: boolean;
  /** Insère ce message en citation markdown dans le composer. */
  onQuote?: (text: string) => void;
}

function isError(content: string) {
  return content.startsWith('❌');
}

export default function MessageBubble({ message, isStreaming, onQuote }: Props) {
  const isUser = message.role === 'user';
  const empty = message.content.length === 0;

  const { copied, copy } = useCopyFeedback();

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
            {!isStreaming && !empty && (
              <div className="flex items-center gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => copy(message.content)}
                  aria-label="Copier la réponse"
                  title="Copier la réponse"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </button>
                {onQuote && (
                  <button
                    type="button"
                    onClick={() => onQuote(message.content)}
                    aria-label="Répondre à ce message"
                    title="Répondre à ce message"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    <ReplyIcon size={16} />
                  </button>
                )}
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? 'Réponse copiée' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
