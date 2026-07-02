'use client';

import { useState } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import StatusLed from '@/components/ui/StatusLed';
import {
  PlusIcon,
  ChatBubbleIcon,
  RobotIcon,
  ChevronDownIcon,
  TrashIcon,
  LoaderIcon,
  PenIcon,
  CheckIcon,
  XIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
} from '@/components/ui/Icons';
import { formatSize } from '@/hooks/useOllama';
import { Conversation, OllamaModel } from '@/types/chat';
import { Theme } from '@/lib/theme';

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
  onRenameConversation: (id: string, title: string) => void;
  isLoading?: boolean;
  mounted?: boolean;
  /** Statut de connexion Ollama (fourni par le parent). */
  online?: boolean;
  /** Modèles disponibles (fournis par le parent). */
  models?: OllamaModel[];
  onOpenSettings?: () => void;
  /** Thème courant + bascule (piloté par useAppSettings). */
  theme?: Theme;
  onToggleTheme?: () => void;
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
  onRenameConversation,
  isLoading = false,
  mounted = false,
  online = false,
  models = [],
  onOpenSettings,
  theme = 'dark',
  onToggleTheme,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  return (
    <nav
      aria-label="Navigation des conversations"
      className="h-full w-[280px] flex flex-col bg-bg-sidebar border-r border-border-subtle"
    >
      {/* Header logo */}
      <div className="flex items-center gap-3 px-5 h-[68px] shrink-0">
        <StarLogo size={26} gradient />
        <span className="text-[22px] font-bold gradient-text whitespace-nowrap leading-none">
          Ollama Chat
        </span>
        <button
          onClick={onNewConversation}
          aria-label="Nouvelle conversation"
          className="ml-auto w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <PlusIcon size={20} />
        </button>
      </div>

      {/* Nouvelle conversation */}
      <div className="px-4 pb-3 shrink-0">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-4 min-h-[44px] rounded-xl border border-border hover:bg-bg-hover hover:border-border-strong transition-colors text-[15px] text-text-primary font-medium"
        >
          <PlusIcon size={18} />
          Nouvelle conversation
        </button>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        <p className="text-[11px] uppercase tracking-[0.09em] text-text-label mb-2 px-2 font-semibold">
          Conversations
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <LoaderIcon size={20} color="var(--accent)" />
          </div>
        )}

        {!isLoading && !mounted && (
          <div className="space-y-2">
            {[80, 60, 90, 70].map((w, i) => (
              <div
                key={i}
                className="h-10 rounded-xl bg-bg-hover animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {!isLoading && mounted && conversations.length === 0 && (
          <p className="text-sm text-text-muted px-3 py-6 text-center">Aucune conversation</p>
        )}

        {mounted && conversations.length > 0 && (
          <ul className="space-y-1">
            {conversations.map((conv) => {
              const active = conv.id === activeId;
              const renaming = renamingId === conv.id;
              return (
                <li key={conv.id}>
                  <div
                    className={`group flex items-center gap-2 px-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${
                      active
                        ? 'bg-bg-hover text-text-primary'
                        : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                    onClick={() => {
                      if (!renaming) onSwitchConversation(conv.id);
                    }}
                  >
                    <ChatBubbleIcon size={16} className="shrink-0" />

                    {renaming ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          autoFocus
                          aria-label="Renommer la conversation"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameConversation(conv.id, renameValue.trim() || conv.title);
                              setRenamingId(null);
                            }
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 bg-bg-field border border-accent rounded-lg px-2 py-1 text-sm text-text-primary outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameConversation(conv.id, renameValue.trim() || conv.title);
                            setRenamingId(null);
                          }}
                          aria-label="Valider"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
                        >
                          <CheckIcon size={15} color="var(--color-led-on)" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(null);
                          }}
                          aria-label="Annuler"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
                        >
                          <XIcon size={15} color="var(--color-text-muted)" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm">{conv.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(conv.id);
                            setRenameValue(conv.title);
                          }}
                          aria-label="Renommer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <PenIcon size={13} color="var(--color-text-muted)" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          aria-label="Supprimer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-led-off/15 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <TrashIcon size={14} color="var(--color-text-muted)" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bloc contrôles bas */}
      <div className="border-t border-border-subtle p-4 space-y-4 shrink-0">
        {/* Sélecteur de modèle */}
        <div className="relative">
          <button
            onClick={() => setModelOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={modelOpen}
            className="w-full flex items-center gap-3 px-4 min-h-[44px] rounded-xl bg-bg-field border border-border text-sm text-text-primary hover:bg-bg-field-hover transition-colors"
          >
            <RobotIcon size={19} color="var(--accent)" />
            <span className="flex-1 text-left truncate">{selectedModel || 'Chargement…'}</span>
            <ChevronDownIcon size={14} />
          </button>
          {modelOpen && models.length > 0 && (
            <ul
              role="listbox"
              aria-label="Choix du modèle"
              className="absolute bottom-full left-0 right-0 mb-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto p-1"
            >
              {models.map((m) => {
                const isSel = m.name === selectedModel;
                return (
                  <li key={m.name} role="option" aria-selected={isSel}>
                    <button
                      onClick={() => {
                        onModelChange(m.name);
                        setModelOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm hover:bg-bg-hover transition-colors ${
                        isSel ? 'text-accent font-medium' : 'text-text-secondary'
                      }`}
                    >
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="font-mono text-xs text-text-muted">{formatSize(m.size)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Température */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
            <span className="font-medium">Température</span>
            <span className="font-mono text-text-secondary">{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            aria-label="Température"
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Max tokens */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
            <span className="font-medium">Max tokens</span>
            <span className="font-mono text-text-secondary">{maxTokens}</span>
          </div>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxTokens}
            aria-label="Nombre maximum de tokens"
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Contexte */}
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="Contexte…"
          aria-label="Contexte système"
          className="w-full text-sm bg-bg-field border border-border rounded-xl px-3 py-2 text-text-primary placeholder:text-text-placeholder resize-none focus:border-accent focus:outline-none transition-colors"
        />

        {/* Pied : statut connexion + actions (paramètres, thème) */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 min-w-0">
            <StatusLed on={online} label={`Ollama ${online ? 'connecté' : 'déconnecté'}`} />
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Ouvrir les paramètres"
              className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <SettingsIcon size={18} />
            </button>
          )}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={
                mounted && theme === 'light'
                  ? 'Activer le thème sombre'
                  : 'Activer le thème clair'
              }
              aria-pressed={mounted ? theme === 'light' : false}
              className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              {mounted && theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
