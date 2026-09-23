import { Redirect, Stack, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomTabs, TabItem } from '../../../components/layout/bottom-tabs';
import { usePermissions } from '../../../hooks/use-permissions';
import { NATIVE } from '../../../utils/platform';

/**
 * Customer app (design CustomerHome / CustomerChat). Staff are sent to the console.
 *
 * On iOS / Android the three sections sit in a bottom tab bar and everything else — an enquiry,
 * the new-enquiry form — is pushed on top, so the tabs disappear while you are inside one.
 * The browser keeps the plain stack it always had.
 */
export default function CustomerLayout() {
  const { t } = useTranslation();
  const { isStaff } = usePermissions();
  const pathname = usePathname();
  if (isStaff) return <Redirect href="/inbox" />;

  const tabs: TabItem[] = [
    { href: '/my', match: '/my', icon: 'home', label: t('my.tabs.home') },
    { href: '/my/new', match: '/my/new', icon: 'plusCircle', label: t('my.tabs.new') },
    { href: '/profile', match: '/profile', icon: 'user', label: t('my.tabs.profile') },
  ];
  const root = NATIVE && tabs.some((tab) => pathname === tab.match);

  return (
    <View className="flex-1">
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      {root && <BottomTabs items={tabs} />}
    </View>
  );
}
