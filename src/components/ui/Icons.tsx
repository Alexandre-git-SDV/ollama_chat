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

export const RefreshIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={2} d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  </svg>
);

export const InfoIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" strokeWidth={1.6} />
    <path strokeWidth={2} d="M12 11v5M12 8h.01" />
  </svg>
);

export const ExternalLinkIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.8} d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

export const UserIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.8} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" strokeWidth={1.8} />
  </svg>
);

export const MoonIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.8} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

export const SunIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" strokeWidth={1.8} />
    <path strokeWidth={1.8} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const DownloadIcon = ({ size = 16, className = '', color = 'currentColor' }: IconProps) => (
  <svg className={className} width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth={1.8} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
