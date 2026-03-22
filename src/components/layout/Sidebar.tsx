'use client';

import { useState, useEffect } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import {
  PlusIcon,
  ChatBubbleIcon,
  SettingsIcon,
  DotIcon,
  ChevronDownIcon,
  RobotIcon,
} from '@/components/ui/Icons';

export default function Sidebar() {
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setOllamaConnected(data.ollama);
      } catch {
        setOllamaConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        const data = await res.json();
        if (data.models?.length) {
          setModels(data.models.map((m: { name: string }) => m.name));
          setSelectedModel(data.models[0].name);
        }
      } catch {
        setModels([]);
      }
    };
    fetchModels();
  }, []);

  return (
    <aside className="w-60 h-screen flex flex-col bg-bg-sidebar border-r border-border-subtle shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <StarLogo size={28} />
        <span className="text-lg font-bold gradient-text">Ollama Chat</span>
      </div>

      {/* Nouveau Chat */}
      <div className="px-3 mb-4">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium gradient-bg hover:brightness-110 transition-all duration-150">
          <PlusIcon size={16} />
          Nouveau Chat
        </button>
      </div>

      {/* Modèle */}
      <div className="px-3 mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-label mb-2 block">
          Modèle
        </span>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <RobotIcon size={14} />
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-bg-input border border-border-subtle rounded-lg pl-8 pr-8 py-2 text-sm text-text-secondary appearance-none cursor-pointer accent-border-focus transition-all duration-200"
          >
            {models.length === 0 && <option value="">Aucun modèle</option>}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
            <ChevronDownIcon size={14} />
          </div>
        </div>
      </div>

      {/* Paramètres */}
      <div className="px-3 mb-4 space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-label block">
          Paramètres
        </span>

        {/* Température */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-text-muted">Température</label>
            <span className="text-xs text-text-muted">{temperature}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent)] h-1"
          />
        </div>

        {/* Max Tokens */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Max Tokens</label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
            className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary accent-border-focus transition-all duration-200"
          />
        </div>

        {/* Prompt Système */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Prompt Système</label>
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Instructions pour le modèle..."
            className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary placeholder:text-text-placeholder resize-none accent-border-focus transition-all duration-200"
          />
        </div>
      </div>

      {/* Historique */}
      <div className="px-3 flex-1 overflow-y-auto">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-label mb-2 block">
          Historique
        </span>
        <div className="flex flex-col items-center justify-center py-8 text-text-placeholder">
          <ChatBubbleIcon size={32} />
          <span className="text-xs mt-2">Aucune conversation</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <DotIcon
            size={8}
            color={ollamaConnected ? '#10b981' : '#ef4444'}
            className={ollamaConnected ? 'dot-pulse' : ''}
          />
          {ollamaConnected ? 'Connecté' : 'Déconnecté'}
        </div>
        <button className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary">
          <SettingsIcon size={16} />
        </button>
      </div>
    </aside>
  );
}