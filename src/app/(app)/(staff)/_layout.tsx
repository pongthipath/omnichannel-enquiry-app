import { Redirect, Slot } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sidebar } from '../../../components/layout/sidebar';
import { usePermissions } from '../../../hooks/use-permissions';

/** Staff console shell: dark left menu (collapsible) + the page. Customers are sent to their app. */
export default function StaffLayout() {
  const { isStaff } = usePermissions();
  const { width } = useWindowDimensions();
  // follows the screen width until the user toggles it
  const [manual, setManual] = useState<boolean | null>(null);
  const collapsed = manual ?? width < 1100;

  if (!isStaff) return <Redirect href="/my" />;
  return (
    <SafeAreaView className="flex-1 flex-row bg-gray-1 dark:bg-dark" edges={['top', 'bottom']}>
      <Sidebar collapsed={collapsed} onToggle={() => setManual(!collapsed)} />
      <View className="flex-1">
        <Slot />
      </View>
    </SafeAreaView>
  );
}
