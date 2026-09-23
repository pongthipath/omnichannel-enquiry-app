import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { LocalStore } from '../offline/local-store.interface';
import { openStore } from '../offline/store';
import { SyncEngine } from '../offline/sync-engine';
import { newId } from '../utils/id';
import { qk } from './queries/keys';

interface OfflineValue {
  /** null until the first NetInfo answer — treated as online, so nothing is blocked at startup */
  online: boolean;
  /** items still waiting to reach the server */
  pending: number;
  /** queue a write for later; returns the clientId used as the idempotency key */
  enqueue: (op: 'conversation.create' | 'message.create', payload: unknown, clientId?: string) => Promise<string>;
  /** send whatever is waiting now (pull-to-refresh, "try again") */
  sync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineValue | null>(null);

const RETRY_TICK_MS = 30_000;

/**
 * Connection state and the outbox, in one place (design §13–15). Whatever the user writes offline is
 * stored on the device and sent when the connection comes back — on reconnect, when the app returns
 * to the foreground, and on a slow tick for items waiting out their backoff.
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const store = useRef<LocalStore | null>(null);
  const engine = useRef<SyncEngine | null>(null);

  const refreshPending = useCallback(async () => {
    if (store.current) setPending(await store.current.countPending());
  }, []);

  const sync = useCallback(async () => {
    if (!engine.current) return;
    const outcome = await engine.current.run();
    await refreshPending();
    if (outcome && (outcome.sent || outcome.duplicates)) {
      void qc.invalidateQueries({ queryKey: qk.enquiries });
    }
  }, [qc, refreshPending]);

  useEffect(() => {
    let cancelled = false;
    void openStore().then(async (opened) => {
      if (cancelled) return;
      store.current = opened;
      engine.current = new SyncEngine(opened);
      await refreshPending();
      void sync();
    });
    return () => {
      cancelled = true;
    };
  }, [refreshPending, sync]);

  // reconnect → send; the first event also settles the initial state
  useEffect(() => {
    const stop = NetInfo.addEventListener((state) => {
      const next = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(next);
      if (next) void sync();
    });
    return stop;
  }, [sync]);

  // the browser knows first when the network drops; NetInfo's web build does not always pass it on
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [sync]);

  // back from the background, plus a slow tick so items in backoff eventually go out
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (s) => {
      if (s === 'active') void sync();
    });
    const timer = setInterval(() => void sync(), RETRY_TICK_MS);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [sync]);

  const enqueue = useCallback<OfflineValue['enqueue']>(
    async (op, payload, clientId) => {
      const id = clientId ?? newId();
      const opened = store.current ?? (await openStore());
      store.current = opened;
      await opened.enqueue({ clientId: id, op, payload, createdAt: Date.now() });
      await refreshPending();
      void sync();
      return id;
    },
    [refreshPending, sync],
  );

  const value = useMemo<OfflineValue>(() => ({ online, pending, enqueue, sync }), [online, pending, enqueue, sync]);
  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

/** Outside the provider (tests, storybook) everything is online and nothing queues. */
export function useOffline(): OfflineValue {
  return (
    useContext(OfflineContext) ?? {
      online: true,
      pending: 0,
      enqueue: async () => newId(),
      sync: async () => undefined,
    }
  );
}
