import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useMe } from '../../hooks/queries/use-session';
import { useRealtime } from '../../hooks/use-realtime';
import colors from '../../theme/colors';

/**
 * Signed-in area. /auth/me decides: a 401 triggers one silent refresh with the stored refresh token
 * (http-client), so reopening the app keeps the session; if that fails, back to login.
 * The realtime socket lives here so every signed-in screen stays live.
 */
export default function AppLayout() {
  const me = useMe();
  useRealtime(Boolean(me.data));

  if (me.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-1 dark:bg-dark">
        <ActivityIndicator color={colors.primary.DEFAULT} />
      </View>
    );
  }
  if (me.isError) return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
