import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSansThaiLooped_400Regular,
  NotoSansThaiLooped_600SemiBold,
  NotoSansThaiLooped_700Bold,
} from '@expo-google-fonts/noto-sans-thai-looped';

/**
 * Thai uses a looped face (easier to read on screen — ux-ui.md v9). Latin uses Noto Sans.
 * One file for all type tokens: changing the font later touches only this file.
 */
export const fontAssets = {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
  NotoSansThaiLooped_400Regular,
  NotoSansThaiLooped_600SemiBold,
  NotoSansThaiLooped_700Bold,
};

// The Thai face is the primary family; glyphs it lacks fall back to the OS font on iOS/Android.
// Latin-only UI (codes, numbers) can use `latin` explicitly.
export const fontFamily = {
  regular: 'NotoSansThaiLooped_400Regular',
  semibold: 'NotoSansThaiLooped_600SemiBold',
  bold: 'NotoSansThaiLooped_700Bold',
  latin: 'NotoSans_400Regular',
} as const;

/** Sizes in px — smallest text in the system is 12 (ux-ui.md v9). Thai body line-height ≥ 1.6. */
export const typeScale = {
  caption: { fontSize: 12, lineHeight: 18 },
  bodySm: { fontSize: 15, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 26 },
  title: { fontSize: 22, lineHeight: 30 },
  display: { fontSize: 28, lineHeight: 36 },
} as const;
