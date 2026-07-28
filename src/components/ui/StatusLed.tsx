interface StatusLedProps {
  on: boolean;
  /** Libellé texte associé (obligatoire pour l'accessibilité si affiché). */
  label?: string;
  className?: string;
}

/**
 * Pastille de statut avec halo. Le statut n'est jamais transmis par la seule
 * couleur : un libellé texte visible et/ou un aria-label l'accompagne.
 */
export default function StatusLed({ on, label, className = '' }: StatusLedProps) {
  const state = on ? 'connecté' : 'déconnecté';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`status-led ${on ? 'status-led--on' : 'status-led--off'}`}
        role="img"
        aria-label={label ? undefined : state}
      />
      {label && (
        <span className="text-xs font-medium text-text-muted">
          {label}
        </span>
      )}
    </span>
  );
}
