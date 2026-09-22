import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'omni.refreshToken';

/**
 * Where the refresh token lives between app launches.
 * Native: SecureStore (Keychain / Keystore). Web: localStorage for now — the API returns the token in the
 * body; moving web to an httpOnly cookie is tracked in design §16.12. Only persisted when "remember me" is on.
 */
export const sessionStore = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
      return await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, token);
      else await SecureStore.setItemAsync(KEY, token);
    } catch {
      // storage unavailable (private window) — the session simply won't survive a restart
    }
  },
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.removeItem(KEY);
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      // nothing to clear
    }
  },
};
