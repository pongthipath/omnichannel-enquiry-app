import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import i18n from './index';

export type Language = 'th' | 'en';
export const LANGUAGES: Language[] = ['th', 'en'];
const KEY = 'omni.lang';

/** The chosen UI language survives restarts (web: localStorage, native: SecureStore). */
async function read(): Promise<Language | null> {
  try {
    const v = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return v === 'th' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

export async function restoreLanguage(): Promise<void> {
  const saved = await read();
  if (saved && saved !== i18n.language) await i18n.changeLanguage(saved);
}

export async function setLanguage(lng: Language): Promise<void> {
  await i18n.changeLanguage(lng);
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, lng);
    else await SecureStore.setItemAsync(KEY, lng);
  } catch {
    // storage unavailable — the choice lasts for this session only
  }
}
