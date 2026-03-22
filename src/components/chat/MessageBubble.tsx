'use client';

import { Message } from '@/types/chat';
import { RobotIcon } from '@/components/ui/Icons';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-[var(--accent)]' : 'bg-bg-card border border-border-subtle'
        }`}
      >
        {isUser ? (
          <span className="text-white text-xs font-bold">U</span>
        ) : (
          <RobotIcon size={16} color="var(--accent)" />
        )}
      </div>

      {/* Bulle */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--accent)] text-white rounded-tr-sm'
            : 'bg-bg-card border border-border-subtle text-text-secondary rounded-tl-sm'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && !message.content && (
            <span className="inline-flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
          {isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-[var(--accent)] ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
}