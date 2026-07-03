'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copie du texte dans le presse-papiers avec un feedback temporaire (`copied`).
 * Le timer vit dans le handler ; le cleanup s'exécute au démontage (jamais de
 * setState synchrone en corps d'effet — conforme à `react-hooks/set-state-in-effect`).
 */
export function useCopyFeedback(duration = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), duration);
      } catch {
        // Presse-papiers indisponible (contexte non sécurisé) : échec silencieux.
      }
    },
    [duration]
  );

  return { copied, copy };
}
