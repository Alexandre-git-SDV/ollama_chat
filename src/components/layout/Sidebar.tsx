'use client';

import { useState, useEffect } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import {
  PlusIcon,
  ChatBubbleIcon,
  RobotIcon,
  ChevronDownIcon,
  TrashIcon,
} from '@/components/ui/Icons';
import { Conversation } from '@/types/chat';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  selectedModel: string;
  onModelChange: (m: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  maxTokens: number;
  onMaxTokensChange: (t: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (s: string) => void;
  onNewConversation: () => void;
  onSwitchConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  selectedModel,
  onModelChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  systemPrompt,
  onSystemPromptChange,
  onNewConversation,
  onSwitchConversation,
  onDeleteConversation,
}: Props) {
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/ollama/health');
        const data = await res.json();
        setOllamaConnected(data.ollama);
      } catch {
        setOllamaConnected(false);
      }
    };
    check();
    const i = setInterval(check, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/ollama/tags');
        const data = await res.json();
        if (data.models?.length) {
          const names = data.models.map((m: { name: string }) => m.name);
          setModels(names);
          if (!selectedModel) onModelChange(names[0]);
        }
      } catch {
        setModels([]);
      }
    };
    fetchModels();
  }, [selectedModel, onModelChange]);

  return (
    <aside className="w-60 h-screen flex flex-col bg-bg-sidebar border-r border-border-subtle shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <StarLogo size={28} />
        <span className="text-lg font-bold gradient-text">Ollama Chat</span>
      </div>

      {/* New chat */}
      <div className="px-3 mb-3">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border-subtle hover:bg-bg-hover transition-colors text-sm text-text-secondary"
        >
          <PlusIcon size={14} />
          Nouvelle conversation
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 px-1">
          Conversations
        </p>
        <div className="space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-text-muted px-2 py-3 text-center">
              Aucune conversation
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                conv.id === activeId
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-secondary hover:bg-bg-hover/50'
              }`}
              onClick={() => onSwitchConversation(conv.id)}
            >
              <ChatBubbleIcon size={14} />
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-all"
              >
                <TrashIcon size={12} color="var(--text-muted)" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-border-subtle p-3 space-y-3">
        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-input border border-border-subtle text-sm text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <RobotIcon size={14} color="var(--accent)" />
            <span className="flex-1 text-left truncate">
              {selectedModel || 'Chargement...'}
            </span>
            <ChevronDownIcon size={12} />
          </button>
          {modelOpen && models.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-bg-card border border-border-subtle rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onModelChange(m);
                    setModelOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-hover transition-colors ${
                    m === selectedModel ? 'text-[var(--accent)]' : 'text-text-secondary'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between text-[10px] text-text-muted mb-1 px-1">
            <span>Température</span>
            <span>{temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent)] h-1"
          />
        </div>

        {/* Max tokens */}
        <div>
          <div className="flex justify-between text-[10px] text-text-muted mb-1 px-1">
            <span>Max tokens</span>
            <span>{maxTokens}</span>
          </div>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
            className="w-full accent-[var(--accent)] h-1"
          />
        </div>

        {/* System prompt */}
        <textarea
          rows={2}
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="System prompt..."
          className="w-full text-xs bg-bg-input border border-border-subtle rounded-lg px-2 py-1.5 text-text-secondary placeholder:text-text-placeholder resize-none"
        />

        {/* Status */}
        <div className="flex items-center gap-2 px-1">
          <div
            className={`w-2 h-2 rounded-full ${
              ollamaConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-[10px] text-text-muted">
            Ollama {ollamaConnected ? 'connecté' : 'déconnecté'}
          </span>
        </div>
      </div>
    </aside>
  );
}