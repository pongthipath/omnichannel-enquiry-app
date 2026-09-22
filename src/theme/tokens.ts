import colors from './colors';

/**
 * Raw color values for props that can't take a className (placeholderTextColor, Switch, icons).
 * Everything else styles with Tailwind classes — both read src/theme/colors.js (Tailgrids palette).
 */
export const palette = {
  light: {
    background: colors.gray[1],
    card: colors.white,
    foreground: colors.dark.DEFAULT,
    mutedForeground: colors.body.DEFAULT,
    placeholder: colors.dark[6],
    border: colors.stroke.DEFAULT,
    primary: colors.dark.DEFAULT,
    accent: colors.primary.DEFAULT,
    onAccent: colors.white,
    destructive: colors.red.DEFAULT,
    ok: colors.green.DEFAULT,
    warn: colors.yellow.DEFAULT,
  },
  dark: {
    background: colors.dark.DEFAULT,
    card: colors.dark[2],
    foreground: colors.gray[2],
    mutedForeground: colors.body.dark,
    placeholder: colors.dark[5],
    border: colors.stroke.dark,
    primary: colors.gray[2],
    accent: colors.primary.DEFAULT,
    onAccent: colors.white,
    destructive: colors.red.dark,
    ok: colors.green.dark,
    warn: colors.yellow.dark,
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { input: 6, card: 8, sheet: 16 } as const;
