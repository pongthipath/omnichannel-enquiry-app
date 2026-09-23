import { Platform } from 'react-native';
import { LocalStore } from './local-store.interface';
import { MemoryStore } from './memory-store';

let opening: Promise<LocalStore> | null = null;

/**
 * The one outbox of the app. SQLite on a phone, memory on web — the console is used online and
 * expo-sqlite needs cross-origin isolation headers there, which are not worth it for this.
 * Falling back to memory also keeps the app usable if the database cannot be opened at all.
 */
export function openStore(): Promise<LocalStore> {
  opening ??= (async () => {
    if (Platform.OS === 'web') return new MemoryStore();
    try {
      const { SqliteStore } = await import('./sqlite-store');
      const store = await SqliteStore.open();
      await store.resetInterrupted();
      return store;
    } catch {
      return new MemoryStore();
    }
  })();
  return opening;
}

/** Tests open their own store. */
export function resetStoreForTests(): void {
  opening = null;
}
