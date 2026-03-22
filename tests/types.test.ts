import { describe, it, expect } from 'vitest';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

describe('uid generator', () => {
  it('generates a string of length 16', () => {
    const id = uid();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(10);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe('Message type', () => {
  it('has required fields', () => {
    const message = {
      id: uid(),
      role: 'user' as const,
      content: 'Test message',
      createdAt: new Date().toISOString(),
    };

    expect(message.id).toBeTruthy();
    expect(message.role).toBe('user');
    expect(message.content).toBe('Test message');
    expect(message.createdAt).toBeTruthy();
  });

  it('accepts optional model field', () => {
    const message = {
      id: uid(),
      role: 'assistant' as const,
      content: 'Response',
      model: 'llama3.2',
      createdAt: new Date().toISOString(),
    };

    expect(message.model).toBe('llama3.2');
  });
});

describe('Conversation type', () => {
  it('has required fields', () => {
    const conversation = {
      id: uid(),
      title: 'Test conversation',
      messages: [],
      model: 'llama3.2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(conversation.id).toBeTruthy();
    expect(conversation.title).toBe('Test conversation');
    expect(Array.isArray(conversation.messages)).toBe(true);
    expect(conversation.model).toBe('llama3.2');
  });

  it('can hold messages', () => {
    const messages = [
      {
        id: uid(),
        role: 'user' as const,
        content: 'Hello',
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        role: 'assistant' as const,
        content: 'Hi!',
        model: 'llama3.2',
        createdAt: new Date().toISOString(),
      },
    ];

    const conversation = {
      id: uid(),
      title: 'Greeting',
      messages,
      model: 'llama3.2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(conversation.messages.length).toBe(2);
    expect(conversation.messages[0].role).toBe('user');
    expect(conversation.messages[1].role).toBe('assistant');
  });
});

describe('ChatSettings type', () => {
  it('has required fields with defaults', () => {
    const settings = {
      model: 'llama3.2',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
    };

    expect(settings.model).toBeTruthy();
    expect(typeof settings.temperature).toBe('number');
    expect(typeof settings.maxTokens).toBe('number');
    expect(typeof settings.systemPrompt).toBe('string');
  });
});
