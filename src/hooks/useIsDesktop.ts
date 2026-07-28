'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 768px)';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// Le rendu serveur (et le premier rendu client) considèrent l'écran comme desktop
// pour que la sidebar soit ouverte par défaut sans provoquer de mismatch d'hydratation.
function getServerSnapshot() {
  return true;
}

/** True à partir du breakpoint md (768px). Réagit au redimensionnement. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
