'use client';

import { useCallback, useRef, useState } from 'react';
import {
  SidebarToggleIcon,
  RobotIcon,
  ChevronDownIcon,
  CheckIcon,
  DownloadIcon,
  TrashIcon,
  CloseIcon,
} from '@/components/ui/Icons';
import { useDismiss } from '@/hooks/useDismiss';
import { formatSize } from '@/hooks/useOllama';
import { exportConversationJSON, exportConversationMarkdown } from '@/lib/export';
import { Conversation, OllamaModel } from '@/types/chat';

interface Props {
  onToggleSidebar: () => void;
  /** Titre affiché : conversation active, sinon nom du modèle. */
  title: string;
  conversation: Conversation | null;
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (m: string) => void;
  onDeleteConversation: (id: string) => void;
}

export default function MainHeader({
  onToggleSidebar,
  title,
  conversation,
  models,
  selectedModel,
  onModelChange,
  onDeleteConversation,
}: Props) {
  return (
    <header className="flex items-center gap-2 px-3 sm:px-5 h-[68px] shrink-0 border-b border-border-subtle">
      <button
        onClick={onToggleSidebar}
        aria-label="Afficher ou masquer la barre latérale"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
      >
        <SidebarToggleIcon size={20} />
      </button>

      <h1 className="flex-1 min-w-0 truncate text-sm font-medium text-text-primary">
        {title}
      </h1>

      <div className="flex items-center gap-1.5 shrink-0">
        <ModelBadge
          models={models}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        <ExportMenu conversation={conversation} />
        <DeleteButton
          conversation={conversation}
          onDeleteConversation={onDeleteConversation}
        />
      </div>
    </header>
  );
}

/* ---------- Badge sélecteur de modèle ---------- */

function ModelBadge({
  models,
  selectedModel,
  onModelChange,
}: {
  models: OllamaModel[];
  selectedModel: string;
  onModelChange: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const choose = (name: string) => {
    onModelChange(name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Changer de modèle"
        className="flex items-center gap-1.5 pl-2 pr-2 sm:pl-2.5 sm:pr-2.5 h-9 max-w-[38vw] sm:max-w-[220px] rounded-lg bg-bg-field border border-border hover:bg-bg-field-hover transition-colors text-text-primary"
      >
        <RobotIcon size={16} color="var(--accent)" className="shrink-0" />
        <span className="truncate text-xs sm:text-sm font-medium">
          {selectedModel || 'Modèle'}
        </span>
        <ChevronDownIcon size={13} color="var(--color-text-muted)" className="shrink-0" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choix rapide du modèle"
          className="absolute top-full right-0 mt-2 w-[240px] max-w-[80vw] bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto p-1"
        >
          {models.length === 0 && (
            <li className="px-3 py-3 text-sm text-text-muted text-center">Aucun modèle</li>
          )}
          {models.map((m) => {
            const isSel = m.name === selectedModel;
            return (
              <li key={m.name} role="option" aria-selected={isSel}>
                <button
                  type="button"
                  onClick={() => choose(m.name)}
                  className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm hover:bg-bg-hover transition-colors"
                >
                  <span
                    className={`flex-1 truncate ${isSel ? 'text-accent font-medium' : 'text-text-primary'}`}
                  >
                    {m.name}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{formatSize(m.size)}</span>
                  {isSel && <CheckIcon size={15} color="var(--accent)" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Menu d'export ---------- */

function ExportMenu({ conversation }: { conversation: Conversation | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const disabled = !conversation;

  const handle = (fn: (c: Conversation) => void) => {
    if (conversation) fn(conversation);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Exporter la conversation"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <DownloadIcon size={18} />
      </button>

      {open && conversation && (
        <div
          role="menu"
          aria-label="Formats d'export"
          className="absolute top-full right-0 mt-2 w-[180px] bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 p-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handle(exportConversationJSON)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            Exporter en JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handle(exportConversationMarkdown)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors"
          >
            Exporter en Markdown
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Suppression avec confirmation inline ---------- */

function DeleteButton({
  conversation,
  onDeleteConversation,
}: {
  conversation: Conversation | null;
  onDeleteConversation: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const disabled = !conversation;

  const openConfirm = () => {
    setOpen(true);
    // Déplace le focus sur l'action destructive une fois le popover monté.
    requestAnimationFrame(() => confirmRef.current?.focus());
  };

  const confirm = () => {
    if (conversation) onDeleteConversation(conversation.id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={openConfirm}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Supprimer la conversation"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-led-off hover:bg-led-off/15 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <TrashIcon size={17} />
      </button>

      {open && conversation && (
        <div
          role="dialog"
          aria-label="Confirmer la suppression"
          className="absolute top-full right-0 mt-2 w-[240px] bg-bg-card border border-border rounded-xl shadow-2xl z-50 p-3"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-sm text-text-primary leading-snug">
              Supprimer cette conversation ?
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Annuler la suppression"
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <CloseIcon size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 h-9 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Annuler
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={confirm}
              className="flex-1 h-9 rounded-lg bg-led-off text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
