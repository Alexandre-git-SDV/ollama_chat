'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';

interface Props {
  messages: Message[];
  isStreaming: boolean;
  onQuote?: (text: string) => void;
}

export default function ChatArea({ messages, isStreaming, onQuote }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à l'arrivée de nouveaux messages et pendant le streaming.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 mx-auto w-full max-w-[720px]">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
          onQuote={onQuote}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
