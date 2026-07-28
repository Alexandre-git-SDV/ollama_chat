'use client';

import { RefObject, useEffect } from 'react';

/**
 * Ferme un élément flottant (dropdown, menu, popover de confirmation) lorsqu'on
 * clique en dehors ou qu'on presse Échap. N'attache les écouteurs que lorsqu'il
 * est ouvert. `onClose` doit être stable (useCallback) pour éviter de re-souscrire.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}
