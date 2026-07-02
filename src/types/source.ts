export type SourceKind =
  | 'ollama'
  | 'claude'
  | 'gpt'
  | 'mistral'
  | 'gemini'
  | 'custom';

export interface Source {
  id: string;
  kind: SourceKind;
  name: string;
  subtitle: string;
  /** Teinte du badge (hex). */
  tint: string;
  /** Ollama local ne peut pas être supprimé. */
  removable: boolean;
  /** Nécessite une clé API pour être « connectée ». */
  requiresKey: boolean;
  /** Clé API — stockée uniquement en local (localStorage), jamais envoyée au serveur. */
  apiKey?: string;
  /** Nom éditable pour les sources personnalisées. */
  editableName?: boolean;
}

/** Modèle d'une source ajoutable depuis la modale Paramètres. */
export interface SourceTemplate {
  kind: SourceKind;
  label: string;
  subtitle: string;
  tint: string;
  requiresKey: boolean;
  editableName?: boolean;
}
