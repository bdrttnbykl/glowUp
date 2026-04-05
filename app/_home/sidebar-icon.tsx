type SidebarIconProps = {
  name: string
}

export function SidebarIcon({ name }: SidebarIconProps) {
  const baseProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M4 11.5 12 5l8 6.5" />
          <path {...baseProps} d="M6.5 10.5V19h11v-8.5" />
          <path {...baseProps} d="M10 19v-5h4v5" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <rect {...baseProps} x="4" y="5" width="16" height="15" rx="2" />
          <path {...baseProps} d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <circle {...baseProps} cx="12" cy="12" r="8" />
          <path {...baseProps} d="M12 8v5l3 2" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M16.5 19a4.5 4.5 0 0 0-9 0" />
          <circle {...baseProps} cx="12" cy="10" r="3" />
          <path {...baseProps} d="M20 18a3.5 3.5 0 0 0-2.8-3.4M4 18a3.5 3.5 0 0 1 2.8-3.4" />
        </svg>
      )
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M3 12V5h7l8.5 8.5a2 2 0 0 1 0 2.8l-2.2 2.2a2 2 0 0 1-2.8 0L5 10z" />
          <circle {...baseProps} cx="8" cy="8" r="1" />
        </svg>
      )
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <rect {...baseProps} x="4" y="4" width="16" height="16" rx="2" />
          <path {...baseProps} d="M12 4v16M4 12h16" />
        </svg>
      )
    case 'pos':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M7 4h7v16H7zM14 8h4v12h-4zM4 10h3v10H4z" />
          <path {...baseProps} d="M8.5 7h4" />
        </svg>
      )
    case 'report':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M4 19h16M6 17V7M12 17v-4M18 17V10" />
          <path {...baseProps} d="m6 7 4-3 4 2 4-2" />
        </svg>
      )
    case 'expense':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M7 5.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
          <path {...baseProps} d="M9 9h6M9 12h6M9 15h3" />
          <path {...baseProps} d="M8 3.5h8" />
        </svg>
      )
    case 'message':
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path {...baseProps} d="M6 18.5 4.5 20v-4A7.5 7.5 0 1 1 8 19.5z" />
          <path {...baseProps} d="M9 10h6M9 13h4" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <circle {...baseProps} cx="12" cy="5" r="1.5" />
          <circle {...baseProps} cx="12" cy="12" r="1.5" />
          <circle {...baseProps} cx="12" cy="19" r="1.5" />
        </svg>
      )
  }
}
