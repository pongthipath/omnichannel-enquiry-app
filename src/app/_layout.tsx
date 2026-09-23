import '../../global.css';
import '../i18n';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { restoreLanguage } from '../i18n/language';
import { fontAssets } from '../theme/typography';

void SplashScreen.preventAutoHideAsync(); // keep splash until fonts + saved language are ready (no jumping)
colorScheme.set('system'); // dark: classes follow the device setting
const languageReady = restoreLanguage();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [langLoaded, setLangLoaded] = useState(false);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  const ready = (fontsLoaded || Boolean(fontError)) && langLoaded;

  useEffect(() => {
    void languageReady.finally(() => setLangLoaded(true));
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
