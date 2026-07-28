'use client';

import { PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { Source, SourceTemplate } from '@/types/source';
import { SOURCE_TEMPLATES, isSourceConnected, sourceInitial } from '@/lib/sources';

interface Props {
  sources: Source[];
  ollamaOnline: boolean;
  onAddSource: (t: SourceTemplate) => void;
  onRemoveSource: (id: string) => void;
  onUpdateKey: (id: string, key: string) => void;
  onUpdateName: (id: string, name: string) => void;
}

const labelClass =
  'block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-label mb-2.5';

export default function SourcesTab({
  sources,
  ollamaOnline,
  onAddSource,
  onRemoveSource,
  onUpdateKey,
  onUpdateName,
}: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted leading-relaxed">
        Connectez des fournisseurs de modèles. Les clés API sont stockées uniquement dans votre
        navigateur et ne sont jamais transmises à un serveur.
      </p>

      {/* Sources connectées */}
      <div>
        <span className={labelClass}>Sources connectées</span>
        <div className="space-y-2.5">
          {sources.map((source) => {
            const connected = isSourceConnected(source, ollamaOnline);
            return (
              <div
                key={source.id}
                className="rounded-xl bg-bg-field border border-border p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: source.tint }}
                  >
                    {sourceInitial(source)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {source.editableName ? (
                      <input
                        aria-label="Nom de la source"
                        value={source.name}
                        onChange={(e) => onUpdateName(source.id, e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-text-primary border-b border-transparent hover:border-border focus:border-accent focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="text-sm font-medium text-text-primary truncate">{source.name}</p>
                    )}
                    <p className="text-xs text-text-muted truncate">{source.subtitle}</p>
                  </div>
                  <span
                    className={`status-led ${connected ? 'status-led--on' : 'status-led--off'}`}
                    role="img"
                    aria-label={connected ? 'connectée' : 'non connectée'}
                  />
                  {source.removable && (
                    <button
                      type="button"
                      onClick={() => onRemoveSource(source.id)}
                      aria-label={`Supprimer ${source.name}`}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-led-off hover:bg-led-off/15 transition-colors shrink-0"
                    >
                      <TrashIcon size={15} />
                    </button>
                  )}
                </div>

                {source.requiresKey && (
                  <div className="mt-3">
                    <label htmlFor={`key-${source.id}`} className="sr-only">
                      Clé API pour {source.name}
                    </label>
                    <input
                      id={`key-${source.id}`}
                      type="password"
                      autoComplete="off"
                      value={source.apiKey || ''}
                      onChange={(e) => onUpdateKey(source.id, e.target.value)}
                      placeholder="Clé API…"
                      className="w-full text-sm bg-bg-card border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-placeholder font-mono focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ajouter une source */}
      <div>
        <span className={labelClass}>Ajouter une source</span>
        <div className="flex flex-wrap gap-2">
          {SOURCE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.kind}
              type="button"
              onClick={() => onAddSource(tpl)}
              className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg bg-bg-field border border-border hover:bg-bg-field-hover hover:border-border-strong transition-colors text-sm text-text-primary"
            >
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tpl.tint }}
              />
              {tpl.label}
              <PlusIcon size={14} color="var(--color-text-muted)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
