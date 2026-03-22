import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const PlusIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M12 5v14M5 12h14" />
  </svg>
);

export const SendIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const ChatBubbleIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.5} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const RobotIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
    <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path strokeWidth={2} d="M12 8V4h2" />
        <rect x="4" y="8" width="16" height="12" rx="2" strokeWidth={1.5} />
        <circle cx="9" cy="13" r="1" fill={color} />
        <circle cx="15" cy="13" r="1" fill={color} />
        <path strokeWidth={2} d="M9 17h6" />
    </svg>
);

export const SettingsIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
    <path strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const TrashIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const ChevronDownIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const CloseIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SidebarToggleIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
    <path strokeWidth={1.5} d="M9 3v18" />
  </svg>
);

export const DotIcon = ({ size = 8, className = '', color = '#10b981' }: IconProps) => (
  <svg className={className} width={size} height={size} viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill={color} />
  </svg>
);

export const NeuralNetworkIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2" strokeWidth={1.5} />
    <circle cx="6" cy="18" r="2" strokeWidth={1.5} />
    <circle cx="18" cy="6" r="2" strokeWidth={1.5} />
    <circle cx="18" cy="18" r="2" strokeWidth={1.5} />
    <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
    <path strokeWidth={1.5} d="M8 6h2.5M13.5 6H16M8 18h2.5M13.5 18H16M6 8v2.5M6 13.5V16M18 8v2.5M18 13.5V16" />
  </svg>
);

export const PythonIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.5} d="M12 2c-1.5 0-5 .5-5 3.5v3c0 1.5 1.5 3 3.5 3h3c2 0 3.5 1.5 3.5 3v3c0 3-3.5 3.5-5 3.5s-5-.5-5-3.5" />
    <path strokeWidth={1.5} d="M12 22c1.5 0 5-.5 5-3.5v-3c0-1.5-1.5-3-3.5-3h-3c-2 0-3.5-1.5-3.5-3v-3C7 3 10.5 2.5 12 2.5s5 .5 5 3.5" />
    <circle cx="9" cy="5.5" r="0.75" fill={color} strokeWidth={0} />
    <circle cx="15" cy="18.5" r="0.75" fill={color} strokeWidth={0} />
  </svg>
);

export const DockerIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.5} d="M22 12.5c-.5-1-1.5-1.5-3-1.5h-1v-2h-3V7h-3V5H9v2H6v2H3v2H1.5s.5 3 3.5 4.5c2 1 4.5 1 6.5.5 2.5-.5 5-2 6.5-3.5h1c1 0 2-.5 3-1.5z" />
    <rect x="6" y="9" width="2" height="2" strokeWidth={1} />
    <rect x="9" y="9" width="2" height="2" strokeWidth={1} />
    <rect x="12" y="9" width="2" height="2" strokeWidth={1} />
    <rect x="9" y="7" width="2" height="2" strokeWidth={1} />
    <rect x="12" y="7" width="2" height="2" strokeWidth={1} />
    <rect x="12" y="5" width="2" height="2" strokeWidth={1} />
    <rect x="15" y="9" width="2" height="2" strokeWidth={1} />
  </svg>
);

export const SolidIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" strokeWidth={1.5} />
    <path strokeWidth={1.5} d="M12 22V15.5M12 15.5L2 8.5M12 15.5L22 8.5" />
  </svg>
);

export const CodeIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

export const LightBulbIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
  </svg>
);

export const PenIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export const LoaderIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={`${className} animate-spin`} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

export const CheckIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M20 6L9 17l-5-5" />
  </svg>
);

export const XIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const SearchIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
  </svg>
);
