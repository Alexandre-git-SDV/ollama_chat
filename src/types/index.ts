export type AccentColor =
  | '#8b5cf6'
  | '#3b82f6'
  | '#06b6d4'
  | '#10b981'
  | '#22c55e'
  | '#f59e0b'
  | '#ef4444'
  | '#ec4899';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  _id: string;
  title: string;
  model: string;
  messages: Message[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface HealthStatus {
  ollama: boolean;
  version: string | null;
}