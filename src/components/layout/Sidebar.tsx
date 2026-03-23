'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import StarLogo from '@/components/ui/StarLogo';
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
  onRenameConversation: (id: string, title: string) => void;
  isLoading?: boolean;
  mounted?: boolean;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;

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
  sidebarWidth = 288,
  onSidebarWidthChange,
}: Props) {
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

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

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = sidebarWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      onSidebarWidthChange?.(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onSidebarWidthChange]);

  return (
    <>
      <aside
        className="h-screen flex flex-col bg-bg-sidebar border-r border-border-subtle shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <StarLogo size={32} />
          <span className="text-xl font-bold gradient-text whitespace-nowrap">Ollama Chat</span>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={onNewConversation}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-subtle hover:bg-bg-hover transition-colors text-base text-text-secondary font-medium"
          >
            <PlusIcon size={18} />
            Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-xs uppercase tracking-wider text-text-muted mb-3 px-2 font-semibold">
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
                  className="h-10 rounded-xl bg-bg-hover/30 animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}
          {!isLoading && mounted && conversations.length === 0 && (
            <p className="text-sm text-text-muted px-3 py-6 text-center">
              Aucune conversation
            </p>
          )}
          {mounted && conversations.length > 0 && (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    conv.id === activeId
                      ? 'bg-bg-hover text-text-primary'
                      : 'text-text-secondary hover:bg-bg-hover/50'
                  }`}
                  onClick={() => {
                    if (renamingId !== conv.id) onSwitchConversation(conv.id);
                  }}
                >
                  <ChatBubbleIcon size={16} />

                  {renamingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onRenameConversation(conv.id, renameValue.trim() || conv.title);
                            setRenamingId(null);
                          }
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="flex-1 bg-bg-input border border-[var(--accent)] rounded-lg px-2 py-1 text-sm text-text-primary outline-none"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameConversation(conv.id, renameValue.trim() || conv.title);
                          setRenamingId(null);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/20 hover:bg-green-500/40 transition-colors"
                      >
                        <CheckIcon size={14} color="#10b981" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(null);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <XIcon size={14} color="var(--text-muted)" />
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
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors opacity-50 hover:opacity-100"
                      >
                        <PenIcon size={13} color="var(--text-muted)" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-all opacity-50 hover:opacity-100"
                      >
                        <TrashIcon size={14} color="var(--text-muted)" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle p-4 space-y-4">
          <div className="relative">
            <button
              onClick={() => setModelOpen(!modelOpen)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-input border border-border-subtle text-sm text-text-secondary hover:bg-bg-hover transition-colors"
            >
              <RobotIcon size={20} color="var(--accent)" />
              <span className="flex-1 text-left truncate">
                {selectedModel || 'Chargement...'}
              </span>
              <ChevronDownIcon size={14} />
            </button>
            {modelOpen && models.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-card border border-border-subtle rounded-xl shadow-xl overflow-hidden z-50 max-h-56 overflow-y-auto">
                {models.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onModelChange(m);
                      setModelOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-bg-hover transition-colors ${
                      m === selectedModel
                        ? 'text-[var(--accent)] font-medium'
                        : 'text-text-secondary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
              <span className="font-medium">Température</span>
              <span className="font-mono">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              className="w-full accent-[var(--accent)] h-2 rounded-full cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
              <span className="font-medium">Max tokens</span>
              <span className="font-mono">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
              className="w-full accent-[var(--accent)] h-2 rounded-full cursor-pointer"
            />
          </div>

          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="Contexte..."
            className="w-full text-sm bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-text-secondary placeholder:text-text-placeholder resize-none"
          />

          <div className="flex items-center gap-2 px-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                ollamaConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-text-muted font-medium">
              Ollama {ollamaConnected ? 'connecté' : 'déconnecté'}
            </span>
          </div>
        </div>
      </aside>

      <div
        className="w-1 cursor-col-resize shrink-0 hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors"
        onMouseDown={onMouseDown}
      />
    </>
  );
}
