import { useId } from 'react';

interface StarLogoProps {
  size?: number;
  className?: string;
  /** Applique le dégradé signature (accent → violet) sur le trait. */
  gradient?: boolean;
  /** Couleur de trait fixe si non dégradé (défaut : currentColor). */
  color?: string;
  strokeWidth?: number;
}

export default function StarLogo({
  size = 24,
  className = '',
  gradient = false,
  color = 'currentColor',
  strokeWidth = 2,
}: StarLogoProps) {
  const id = useId();
  const gradientId = `star-gradient-${id}`;
  const stroke = gradient ? `url(#${gradientId})` : color;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
      )}
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M21 17v4" />
      <path d="M19 19h4" />
    </svg>
  );
}
