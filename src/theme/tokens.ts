/**
 * Design tokens from docs/ux-ui.md §5 — the only place colors are defined.
 * Components read tokens through useTheme(); never hard-code hex values in components.
 */
export const palette = {
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    foreground: '#020617',
    mutedForeground: '#475569',
    border: '#E2E8F0',
    primary: '#0F172A',
    accent: '#0369A1',
    onAccent: '#FFFFFF',
    destructive: '#DC2626',
    ok: '#15803D',
    warn: '#B45309',
  },
  dark: {
    background: '#0B1220',
    card: '#111A2E',
    foreground: '#E2E8F0',
    mutedForeground: '#94A3B8',
    border: '#22304A',
    primary: '#E2E8F0',
    accent: '#38BDF8',
    onAccent: '#0B1220',
    destructive: '#F87171',
    ok: '#4ADE80',
    warn: '#FBBF24',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { input: 6, card: 10, sheet: 16 } as const;
