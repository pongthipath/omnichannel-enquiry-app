import { Redirect, Stack } from 'expo-router';
import { usePermissions } from '../../../hooks/use-permissions';

/** Customer app (design CustomerHome / CustomerChat). Staff are sent to the console. */
export default function CustomerLayout() {
  const { isStaff } = usePermissions();
  if (isStaff) return <Redirect href="/inbox" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
