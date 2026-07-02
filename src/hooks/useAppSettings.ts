'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  Theme,
} from '@/lib/theme';
import { SOURCES_STORAGE_KEY, defaultSources } from '@/lib/sources';
import { Source, SourceTemplate } from '@/types/source';
import { useHydrated } from '@/hooks/useHydrated';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    return localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

function loadTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return DEFAULT_THEME;
  }
}

function loadSources(): Source[] {
  if (typeof window === 'undefined') return defaultSources();
  try {
    const raw = localStorage.getItem(SOURCES_STORAGE_KEY);
    if (!raw) return defaultSources();
    const parsed = JSON.parse(raw) as Source[];
    // Garantit la présence de la source Ollama non supprimable.
    if (!parsed.some((s) => s.kind === 'ollama')) {
      return [...defaultSources(), ...parsed];
    }
    return parsed;
  } catch {
    return defaultSources();
  }
}

/**
 * Préférences globales persistées en local : couleur d'accent et sources
 * (avec leurs clés API, qui ne quittent jamais le navigateur).
 */
export function useAppSettings() {
  // Initialisation paresseuse depuis localStorage. L'accent ne pilote que la variable
  // CSS --accent (hors SSR) et le sélecteur de la modale (fermée à l'hydratation),
  // donc aucun risque de mismatch. Les sources restent gatées par `mounted`.
  const [accent, setAccentState] = useState<string>(() => loadAccent());
  const [theme, setThemeState] = useState<Theme>(() => loadTheme());
  const [sources, setSources] = useState<Source[]>(() => loadSources());
  const mounted = useHydrated();

  // Applique et persiste l'accent.
  const setAccent = useCallback((color: string) => {
    setAccentState(color);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, color);
    } catch {
      // ignore
    }
    document.documentElement.style.setProperty('--accent', color);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  // Bascule sombre/clair. La mutation de classe et la persistance se font hors
  // corps d'effet (dans le handler et l'effet ci-dessous), jamais via un setState
  // synchrone en effet — conforme à react-hooks/set-state-in-effect.
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Applique et persiste le thème après hydratation (idempotent : le script
  // anti-FOUC a déjà posé la classe au premier paint).
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  // Persiste les sources à chaque changement (une fois monté).
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
    } catch {
      // ignore
    }
  }, [sources, mounted]);

  const addSource = useCallback((template: SourceTemplate) => {
    const source: Source = {
      id: uid(),
      kind: template.kind,
      name: template.label,
      subtitle: template.subtitle,
      tint: template.tint,
      removable: true,
      requiresKey: template.requiresKey,
      editableName: template.editableName,
      apiKey: '',
    };
    setSources((prev) => [...prev, source]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => !(s.id === id && s.removable)));
  }, []);

  const updateSourceKey = useCallback((id: string, apiKey: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, apiKey } : s)));
  }, []);

  const updateSourceName = useCallback((id: string, name: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  return {
    accent,
    setAccent,
    theme,
    toggleTheme,
    sources: mounted ? sources : defaultSources(),
    addSource,
    removeSource,
    updateSourceKey,
    updateSourceName,
    mounted,
  };
}
