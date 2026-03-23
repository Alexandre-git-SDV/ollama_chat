import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatArea from '@/components/chat/ChatArea';
import Sidebar from '@/components/layout/Sidebar';

HTMLDivElement.prototype.scrollIntoView = vi.fn();

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    const userMessage = {
      id: '1',
      role: 'user' as const,
      content: 'Bonjour, comment allez-vous ?',
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText('Bonjour, comment allez-vous ?')).toBeTruthy();
  });

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      id: '2',
      role: 'assistant' as const,
      content: 'Je vais bien, merci !',
      model: 'llama3.2',
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText('Je vais bien, merci !')).toBeTruthy();
  });

  it('renders empty assistant message with streaming indicator', () => {
    const streamingMessage = {
      id: '3',
      role: 'assistant' as const,
      content: '',
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={streamingMessage} isStreaming={true} />);
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(3);
  });
});

describe('ChatArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state correctly', () => {
    render(<ChatArea messages={[]} isStreaming={false} />);
    const bubbles = document.querySelectorAll('[class*="flex gap-3"]');
    expect(bubbles.length).toBe(0);
  });

  it('renders messages correctly', () => {
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'Hi there!',
        createdAt: new Date().toISOString(),
      },
    ];

    render(<ChatArea messages={messages} isStreaming={false} />);
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('Hi there!')).toBeTruthy();
  });
});

describe('Sidebar', () => {
  const defaultProps = {
    conversations: [],
    activeId: null,
    selectedModel: 'llama3.2',
    onModelChange: vi.fn(),
    temperature: 0.7,
    onTemperatureChange: vi.fn(),
    maxTokens: 2048,
    onMaxTokensChange: vi.fn(),
    systemPrompt: '',
    onSystemPromptChange: vi.fn(),
    onNewConversation: vi.fn(),
    onSwitchConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
    onRenameConversation: vi.fn(),
    mounted: true,
  };

  it('renders logo and title', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Ollama Chat')).toBeTruthy();
  });

  it('renders new conversation button', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Nouvelle conversation')).toBeTruthy();
  });

  it('renders model selector with selected model', () => {
    render(<Sidebar {...defaultProps} selectedModel="llama3.2" />);
    expect(screen.getByText('llama3.2')).toBeTruthy();
  });

  it('renders temperature slider', () => {
    render(<Sidebar {...defaultProps} temperature={0.7} />);
    expect(screen.getByText('Température')).toBeTruthy();
    expect(screen.getByText('0.7')).toBeTruthy();
  });

  it('renders max tokens slider', () => {
    render(<Sidebar {...defaultProps} maxTokens={2048} />);
    expect(screen.getByText('Max tokens')).toBeTruthy();
    expect(screen.getByText('2048')).toBeTruthy();
  });

  it('renders conversations list', () => {
    const conversations = [
      {
        id: 'conv1',
        title: 'Test conversation',
        messages: [],
        model: 'llama3.2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(<Sidebar {...defaultProps} conversations={conversations} />);
    expect(screen.getByText('Test conversation')).toBeTruthy();
  });

  it('calls onNewConversation when button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);
    await user.click(screen.getByText('Nouvelle conversation'));
    expect(defaultProps.onNewConversation).toHaveBeenCalledTimes(1);
  });
});
