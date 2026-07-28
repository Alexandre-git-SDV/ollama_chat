'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OllamaModel } from '@/types/chat';

/** Formate une taille en octets vers une chaîne lisible (Go/Mo). */
export function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} Go`;
  const mb = bytes / 1024 ** 2;
  return `${Math.round(mb)} Mo`;
}

interface UseOllamaResult {
  online: boolean;
  models: OllamaModel[];
  /** Noms des modèles actuellement chargés en mémoire (api/ps). */
  loadedModels: string[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useOllama(pollMs = 5000): UseOllamaResult {
  const [online, setOnline] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Santé + modèles disponibles et modèles chargés en mémoire, via le proxy
      // catch-all (/api/ollama/api/*) : évite tout « Failed to fetch » / CORS.
      const [tagsRes, psRes] = await Promise.allSettled([
        fetch('/api/ollama/api/tags', {
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        }),
        fetch('/api/ollama/api/ps', {
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        }),
      ]);

      if (!mountedRef.current) return;

      if (tagsRes.status === 'fulfilled' && tagsRes.value.ok) {
        const data = await tagsRes.value.json();
        setOnline(true);
        setModels((data.models || []) as OllamaModel[]);
      } else {
        setOnline(false);
      }

      if (psRes.status === 'fulfilled' && psRes.value.ok) {
        const data = await psRes.value.json();
        setLoadedModels(((data.models || []) as { name: string }[]).map((m) => m.name));
      } else {
        setLoadedModels([]);
      }
    } catch {
      if (mountedRef.current) setOnline(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Différé en microtâche : refresh() pose setLoading(true) de façon synchrone,
    // interdit dans le corps d'un effet (react-hooks/set-state-in-effect).
    void Promise.resolve().then(refresh);
    const id = setInterval(refresh, pollMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh, pollMs]);

  return { online, models, loadedModels, loading, refresh };
}
