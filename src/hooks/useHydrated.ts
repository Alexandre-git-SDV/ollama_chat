'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Retourne false au rendu serveur et au premier rendu client, puis true.
 * Permet de différer l'affichage de valeurs issues de localStorage sans
 * provoquer de mismatch d'hydratation ni de setState synchrone en effet.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
