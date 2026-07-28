'use client';

import { useState } from 'react';
import ModelDropdown from './ModelDropdown';
import AccentPicker from './AccentPicker';
import { RefreshIcon, InfoIcon, ExternalLinkIcon, LoaderIcon } from '@/components/ui/Icons';
import { OllamaModel } from '@/types/chat';

interface Props {
  models: OllamaModel[];
  loadedModels: string[];
  model: string;
  onModelChange: (m: string) => void;
  onRefresh: () => Promise<void>;
  systemPrompt: string;
  onSystemPromptChange: (s: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  accent: string;
  accents: readonly string[];
  onAccentChange: (c: string) => void;
}

const labelClass =
  'block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-label mb-2.5';

export default function GeneralTab({
  models,
  loadedModels,
  model,
  onModelChange,
  onRefresh,
  systemPrompt,
  onSystemPromptChange,
  temperature,
  onTemperatureChange,
  accent,
  accents,
  onAccentChange,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleInfo = async () => {
    if (!model) return;
    setInfoLoading(true);
    setInfo(null);
    try {
      const res = await fetch('/api/ollama/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      if (!res.ok) {
        setInfo('Informations indisponibles pour ce modèle.');
        return;
      }
      const data = await res.json();
      const details = data.details || {};
      const parts = [
        details.family && `Famille : ${details.family}`,
        details.parameter_size && `Paramètres : ${details.parameter_size}`,
        details.quantization_level && `Quantisation : ${details.quantization_level}`,
      ].filter(Boolean);
      setInfo(parts.length ? parts.join(' · ') : 'Aucun détail disponible.');
    } catch {
      setInfo('Ollama injoignable.');
    } finally {
      setInfoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modèle */}
      <div>
        <label className={labelClass}>Modèle</label>
        <ModelDropdown
          models={models}
          value={model}
          onChange={onModelChange}
          loadedModels={loadedModels}
        />
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-bg-field border border-border text-xs text-text-secondary hover:bg-bg-field-hover hover:text-text-primary transition-colors"
          >
            {refreshing ? <LoaderIcon size={14} /> : <RefreshIcon size={14} />}
            Rafraîchir
          </button>
          <button
            type="button"
            onClick={handleInfo}
            className="flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-bg-field border border-border text-xs text-text-secondary hover:bg-bg-field-hover hover:text-text-primary transition-colors"
          >
            {infoLoading ? <LoaderIcon size={14} /> : <InfoIcon size={14} />}
            Infos
          </button>
        </div>
        {info && <p className="mt-2 text-xs text-text-muted font-mono">{info}</p>}
      </div>

      {/* System prompt */}
      <div>
        <label htmlFor="settings-system-prompt" className={labelClass}>
          System prompt
        </label>
        <textarea
          id="settings-system-prompt"
          rows={3}
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="Instruction système appliquée à chaque message…"
          className="w-full text-sm bg-bg-field border border-border rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-placeholder resize-none focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Température */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label htmlFor="settings-temperature" className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-label">
            Température
          </label>
          <span className="font-mono text-sm text-text-secondary">{temperature.toFixed(1)}</span>
        </div>
        <input
          id="settings-temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[11px] text-text-faint mt-1.5">
          <span>Précis</span>
          <span>Créatif</span>
        </div>
      </div>

      {/* Accent */}
      <div>
        <label className={labelClass}>Couleur d&apos;accent</label>
        <AccentPicker accents={accents} value={accent} onChange={onAccentChange} />
      </div>

      {/* Liens */}
      <div>
        <label className={labelClass}>Liens</label>
        <div className="flex flex-col gap-1.5">
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            <ExternalLinkIcon size={15} /> Ollama.com
          </a>
          <a
            href="https://ollama.com/library"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            <ExternalLinkIcon size={15} /> Bibliothèque de modèles
          </a>
        </div>
      </div>
    </div>
  );
}
