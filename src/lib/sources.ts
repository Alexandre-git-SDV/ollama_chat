import { Source, SourceTemplate } from '@/types/source';

export const SOURCES_STORAGE_KEY = 'ollama-chat-sources';

/** Source Ollama locale, toujours présente et non supprimable. */
export const OLLAMA_SOURCE: Source = {
  id: 'ollama-local',
  kind: 'ollama',
  name: 'Ollama local',
  subtitle: 'Modèles exécutés sur votre machine',
  tint: '#8b5cf6',
  removable: false,
  requiresKey: false,
};

/** Sources ajoutables depuis l'onglet « Sources ». */
export const SOURCE_TEMPLATES: SourceTemplate[] = [
  { kind: 'claude', label: 'Claude', subtitle: 'Anthropic', tint: '#d97757', requiresKey: true },
  { kind: 'gpt', label: 'GPT', subtitle: 'OpenAI', tint: '#10a37f', requiresKey: true },
  { kind: 'mistral', label: 'Mistral', subtitle: 'Mistral AI', tint: '#f97316', requiresKey: true },
  { kind: 'gemini', label: 'Gemini', subtitle: 'Google', tint: '#4285f4', requiresKey: true },
  { kind: 'custom', label: 'Autre', subtitle: 'Source personnalisée', tint: '#64748b', requiresKey: true, editableName: true },
];

export function defaultSources(): Source[] {
  return [{ ...OLLAMA_SOURCE }];
}

/** Une source est « connectée » si elle n'exige pas de clé, ou si une clé est renseignée. */
export function isSourceConnected(source: Source, ollamaOnline: boolean): boolean {
  if (source.kind === 'ollama') return ollamaOnline;
  if (!source.requiresKey) return true;
  return Boolean(source.apiKey && source.apiKey.trim().length > 0);
}

/** Initiale affichée dans le badge de la source. */
export function sourceInitial(source: Source): string {
  return (source.name.trim()[0] || '?').toUpperCase();
}
