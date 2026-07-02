'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, CheckIcon, RobotIcon } from '@/components/ui/Icons';
import { formatSize } from '@/hooks/useOllama';
import { OllamaModel } from '@/types/chat';

interface Props {
  models: OllamaModel[];
  value: string;
  onChange: (name: string) => void;
  loadedModels: string[];
}

export default function ModelDropdown({ models, value, onChange, loadedModels }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLoaded = loadedModels.includes(value);
  const selected = models.find((m) => m.name === value);

  // Ferme au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openMenu = useCallback(() => {
    const idx = models.findIndex((m) => m.name === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [models, value]);

  const choose = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
    },
    [onChange]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(models.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = models[activeIndex];
      if (m) choose(m.name);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 min-h-[46px] rounded-xl bg-bg-field border border-border hover:bg-bg-field-hover transition-colors text-left"
      >
        <span
          className={`status-led ${selectedLoaded ? 'status-led--on' : 'status-led--off'}`}
          role="img"
          aria-label={selectedLoaded ? 'modèle chargé' : 'modèle non chargé'}
        />
        <RobotIcon size={18} color="var(--accent)" />
        <span className="flex-1 truncate text-sm text-text-primary">
          {value || 'Aucun modèle disponible'}
        </span>
        {selected && (
          <span className="font-mono text-xs text-text-muted">{formatSize(selected.size)}</span>
        )}
        <ChevronDownIcon size={14} color="var(--color-text-muted)" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Modèles disponibles"
          className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto p-1"
        >
          {models.length === 0 && (
            <li className="px-3 py-3 text-sm text-text-muted text-center">Aucun modèle</li>
          )}
          {models.map((m, i) => {
            const isSel = m.name === value;
            const loaded = loadedModels.includes(m.name);
            return (
              <li key={m.name} role="option" aria-selected={isSel}>
                <button
                  type="button"
                  onClick={() => choose(m.name)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    i === activeIndex ? 'bg-bg-hover' : ''
                  }`}
                >
                  <span
                    className={`status-led ${loaded ? 'status-led--on' : 'status-led--off'}`}
                    role="img"
                    aria-label={loaded ? 'chargé' : 'non chargé'}
                  />
                  <span className={`flex-1 truncate ${isSel ? 'text-accent font-medium' : 'text-text-primary'}`}>
                    {m.name}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{formatSize(m.size)}</span>
                  {isSel && <CheckIcon size={15} color="var(--accent)" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
