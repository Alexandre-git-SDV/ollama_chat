'use client';

import StarLogo from '@/components/ui/StarLogo';
import {
  SendIcon,
  TrashIcon,
  ChevronDownIcon,
  SidebarToggleIcon,
  NeuralNetworkIcon,
  PythonIcon,
  DockerIcon,
  SolidIcon,
} from '@/components/ui/Icons';

const suggestions = [
  { icon: NeuralNetworkIcon, label: 'Réseaux de neurones', desc: 'Concepts et architectures' },
  { icon: PythonIcon, label: 'Python', desc: 'Scripts et bonnes pratiques' },
  { icon: DockerIcon, label: 'Docker', desc: 'Conteneurs et déploiement' },
  { icon: SolidIcon, label: 'Principes SOLID', desc: 'Architecture logicielle' },
];

interface MainContentProps {
  onToggleSidebar?: () => void;
}

export default function MainContent({ onToggleSidebar }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col h-screen bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-text-primary">Nouvelle conversation</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-secondary appearance-none pr-7 cursor-pointer accent-border-focus transition-all duration-200">
              <option>llama3.2</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <ChevronDownIcon size={12} />
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary">
            <TrashIcon size={16} />
          </button>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary"
          >
            <SidebarToggleIcon size={16} />
          </button>
        </div>
      </header>

      {/* Empty State */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <div className="flex justify-center mb-5">
            <StarLogo size={48} />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Comment puis-je vous aider ?
          </h2>
          <p className="text-sm text-text-muted mb-8">
            Choisissez une suggestion ou écrivez votre message pour commencer.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 w-36 rounded-xl bg-bg-card border border-border-subtle hover:bg-bg-hover hover:border-[var(--accent)] transition-all duration-200"
                >
                  <Icon size={24} color="var(--accent)" />
                  <span className="text-xs font-medium text-text-secondary">{s.label}</span>
                  <span className="text-[10px] text-text-muted leading-tight">{s.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            rows={1}
            placeholder="Écrivez votre message... (Entrée pour envoyer)"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 pr-12 text-sm text-text-secondary placeholder:text-text-placeholder resize-none accent-border-focus transition-all duration-200"
          />
          <button className="absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-150 hover:brightness-110 gradient-bg">
            <SendIcon size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}