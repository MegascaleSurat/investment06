// System design tokens including visual themes, colors, typography and layouts
export const THEME = {
  colors: {
    primary: {
      light: '#3b82f6',
      dark: '#2563eb',
    },
    success: {
      light: '#10b981',
      dark: '#059669',
    },
    warning: {
      light: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#ef4444',
      dark: '#dc2626',
    },
    background: {
      light: '#ffffff',
      dark: '#171717',
    },
  },
  typography: {
    fontFamily: {
      sans: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
  layout: {
    sidebarWidth: '260px',
    topbarHeight: '64px',
  },
} as const
