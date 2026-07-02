'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/ui/Icons';
import GeneralTab from './GeneralTab';
import SourcesTab from './SourcesTab';
import { OllamaModel } from '@/types/chat';
import { Source, SourceTemplate } from '@/types/source';

type Tab = 'general' | 'sources';

interface Props {
  open: boolean;
  onClose: () => void;
  // Modèle & génération
  models: OllamaModel[];
  loadedModels: string[];
  online: boolean;
  onRefresh: () => Promise<void>;
  model: string;
  onModelChange: (m: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (s: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  // Accent
  accent: string;
  accents: readonly string[];
  onAccentChange: (c: string) => void;
  // Sources
  sources: Source[];
  onAddSource: (t: SourceTemplate) => void;
  onRemoveSource: (id: string) => void;
  onUpdateKey: (id: string, key: string) => void;
  onUpdateName: (id: string, name: string) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'general', label: 'Général' },
  { id: 'sources', label: 'Sources' },
];

export default function SettingsModal(props: Props) {
  const { open, onClose } = props;
  const [tab, setTab] = useState<Tab>('general');
  const closeRef = useRef<HTMLButtonElement>(null);

  // Échap ferme, verrou du scroll de fond, focus initial.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.62)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full sm:max-w-[600px] bg-bg-modal border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-msg-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 h-[60px] shrink-0 border-b border-border-subtle">
          <h2 id="settings-title" className="text-lg font-semibold text-text-title">
            Paramètres
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fermer les paramètres"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <CloseIcon size={19} />
          </button>
        </div>

        {/* Onglets 50/50 */}
        <div role="tablist" aria-label="Sections des paramètres" className="flex shrink-0 border-b border-border-subtle">
          {tabs.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`flex-1 h-12 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  selected
                    ? 'text-text-primary border-accent'
                    : 'text-text-muted border-transparent hover:text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto px-5 sm:px-6 py-6">
          <div
            role="tabpanel"
            id="panel-general"
            aria-labelledby="tab-general"
            hidden={tab !== 'general'}
          >
            {tab === 'general' && (
              <GeneralTab
                models={props.models}
                loadedModels={props.loadedModels}
                model={props.model}
                onModelChange={props.onModelChange}
                onRefresh={props.onRefresh}
                systemPrompt={props.systemPrompt}
                onSystemPromptChange={props.onSystemPromptChange}
                temperature={props.temperature}
                onTemperatureChange={props.onTemperatureChange}
                accent={props.accent}
                accents={props.accents}
                onAccentChange={props.onAccentChange}
              />
            )}
          </div>
          <div
            role="tabpanel"
            id="panel-sources"
            aria-labelledby="tab-sources"
            hidden={tab !== 'sources'}
          >
            {tab === 'sources' && (
              <SourcesTab
                sources={props.sources}
                ollamaOnline={props.online}
                onAddSource={props.onAddSource}
                onRemoveSource={props.onRemoveSource}
                onUpdateKey={props.onUpdateKey}
                onUpdateName={props.onUpdateName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
