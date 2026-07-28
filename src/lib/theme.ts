/** Palette d'accents proposée dans les Paramètres. Le premier est le défaut. */
export const ACCENTS = [
  '#8b5cf6', // violet (défaut)
  '#3b82f6', // bleu
  '#10b981', // émeraude
  '#f59e0b', // ambre
  '#ef4444', // rouge
  '#ec4899', // rose
  '#06b6d4', // cyan
] as const;

export const DEFAULT_ACCENT = ACCENTS[0];

export const ACCENT_STORAGE_KEY = 'ollama-chat-accent';

/** Thème d'interface. Le sombre est le défaut ; le clair est une déclinaison AA. */
export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

export const THEME_STORAGE_KEY = 'ollama-chat-theme';
