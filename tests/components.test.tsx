import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatArea from '@/components/chat/ChatArea';
import Sidebar from '@/components/layout/Sidebar';
import MainHeader from '@/components/layout/MainHeader';
import { Conversation } from '@/types/chat';

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
    const dots = document.querySelectorAll('.dot-bounce');
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

  it('exposes a compact new-conversation button in the header', async () => {
    const user = userEvent.setup();
    const onNewConversation = vi.fn();
    render(<Sidebar {...defaultProps} onNewConversation={onNewConversation} />);
    // Deux points d'entrée « Nouvelle conversation » : la pilule pleine largeur
    // (texte) et le bouton compact du header (aria-label).
    const entries = screen.getAllByRole('button', { name: 'Nouvelle conversation' });
    expect(entries.length).toBe(2);
    await user.click(screen.getByLabelText('Nouvelle conversation'));
    expect(onNewConversation).toHaveBeenCalled();
  });

  it('toggles the theme from the footer', async () => {
    const user = userEvent.setup();
    const onToggleTheme = vi.fn();
    render(
      <Sidebar
        {...defaultProps}
        theme="dark"
        onToggleTheme={onToggleTheme}
        onOpenSettings={vi.fn()}
      />
    );
    await user.click(screen.getByLabelText('Activer le thème clair'));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});

describe('MainHeader', () => {
  const conversation: Conversation = {
    id: 'conv1',
    title: 'Ma conversation',
    messages: [],
    model: 'llama3.2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const baseProps = {
    onToggleSidebar: vi.fn(),
    title: 'Ma conversation',
    conversation,
    models: [
      { name: 'llama3.2', size: 1000, digest: 'a', modified_at: '' },
      { name: 'qwen2.5', size: 2000, digest: 'b', modified_at: '' },
    ],
    selectedModel: 'llama3.2',
    onModelChange: vi.fn(),
    onDeleteConversation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the active title', () => {
    render(<MainHeader {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Ma conversation' })).toBeTruthy();
  });

  it('opens the model badge and switches model', async () => {
    const user = userEvent.setup();
    const onModelChange = vi.fn();
    render(<MainHeader {...baseProps} onModelChange={onModelChange} />);
    await user.click(screen.getByLabelText('Changer de modèle'));
    await user.click(screen.getByRole('button', { name: /qwen2\.5/ }));
    expect(onModelChange).toHaveBeenCalledWith('qwen2.5');
  });

  it('deletes only after inline confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteConversation = vi.fn();
    render(<MainHeader {...baseProps} onDeleteConversation={onDeleteConversation} />);
    await user.click(screen.getByLabelText('Supprimer la conversation'));
    expect(onDeleteConversation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(onDeleteConversation).toHaveBeenCalledWith('conv1');
  });

  it('disables export and delete without an active conversation', () => {
    render(<MainHeader {...baseProps} conversation={null} />);
    expect(screen.getByLabelText('Exporter la conversation')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Supprimer la conversation')).toHaveProperty('disabled', true);
  });
});
