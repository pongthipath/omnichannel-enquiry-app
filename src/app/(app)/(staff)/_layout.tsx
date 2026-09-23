import { Redirect, router, Slot, Stack, usePathname } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, LanguageToggle } from '../../../components/common';
import { BottomTabs, TabItem } from '../../../components/layout/bottom-tabs';
import { Sidebar } from '../../../components/layout/sidebar';
import { Permission } from '../../../constants/permissions';
import { useDashboard } from '../../../hooks/queries/use-catalog';
import { usePermissions } from '../../../hooks/use-permissions';
import colors from '../../../theme/colors';
import { NATIVE } from '../../../utils/platform';

const PHONE = 760;

/** Title for a pushed page, so the back bar says where you are. */
const PUSHED_TITLES: Record<string, string> = {
  '/products': 'nav.products',
  '/simulator': 'nav.simulator',
  '/settings/sla': 'nav.sla',
  '/settings/products': 'nav.productSettings',
  '/settings/tags': 'nav.tags',
  '/settings/departments': 'nav.departments',
  '/settings/roles': 'nav.roles',
  '/settings/staff': 'nav.staff',
  '/customer': 'customers.title',
};

/** Longest key that the path starts with, so `/customer/<id>` still finds its title. */
const pushedTitle = (pathname: string) =>
  Object.keys(PUSHED_TITLES)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];

/**
 * Staff console shell. Tablet / desktop: dark left menu (collapsible, follows the width until toggled).
 * Phone browser: the menu is hidden behind a ☰ button in a slim top bar and opens as a drawer.
 * iOS / Android: a separate shell — bottom tabs for the four sections, everything else pushed on
 * top with a back bar. Gated on the platform, so the browser console is untouched at any width.
 */
export default function StaffLayout() {
  const { t } = useTranslation();
  const { isStaff, can } = usePermissions();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [manual, setManual] = useState<boolean | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null); // path the drawer was opened on
  const collapsed = manual ?? width < 1100;
  const phone = width < PHONE;
  const openCount = useDashboard(undefined, NATIVE && isStaff && can(Permission.DASHBOARD_PAGE_VIEW)).data?.totals.notClosed;

  if (!isStaff) return <Redirect href="/my" />;

  if (NATIVE) {
    // "me" is always there: it is the way out to the settings pages, the profile and logout
    const tabs: (TabItem & { permission?: Permission })[] = [
      { href: '/inbox', match: '/inbox', icon: 'inbox', label: t('nav.inbox'), badge: openCount, permission: Permission.INBOX_PAGE_VIEW },
      { href: '/dashboard', match: '/dashboard', icon: 'chart', label: t('nav.dashboard'), permission: Permission.DASHBOARD_PAGE_VIEW },
      { href: '/customers', match: '/customers', icon: 'users', label: t('nav.customers'), permission: Permission.CUSTOMERS_PAGE_VIEW },
      { href: '/menu', match: '/menu', icon: 'user', label: t('nav.me') },
    ];
    const visible = tabs.filter((tab) => !tab.permission || can(tab.permission));

    const root = visible.some((tab) => pathname === tab.match);
    // the enquiry screens bring their own header with a back button, so the shell bar stays out
    const bare = pathname.startsWith('/enquiry');
    const title = pushedTitle(pathname);

    return (
      <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={root ? ['top'] : ['top', 'bottom']}>
        {root ? (
          <View className="h-11 flex-row items-center gap-2 bg-dark px-3">
            <Text className="flex-1 font-bold text-base text-white">{t('appName')}</Text>
            <LanguageToggle tone="dark" />
          </View>
        ) : bare ? null : (
          <View className="h-11 flex-row items-center gap-1 border-b border-stroke bg-white px-1 dark:border-stroke-dark dark:bg-dark-2">
            <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/inbox'))} />
            <Text numberOfLines={1} accessibilityRole="header" className="flex-1 font-bold text-base text-dark dark:text-white">
              {title ? t(PUSHED_TITLES[title]) : t('appName')}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        {root && <BottomTabs items={visible} />}
      </SafeAreaView>
    );
  }

  if (phone) {
    // navigating from the drawer changes the path → the drawer closes by itself
    const drawerOpen = drawer === pathname;
    return (
      <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['top', 'bottom']}>
        <View className="h-11 flex-row items-center gap-2 bg-dark px-2">
          <IconButton icon="menu" label={t('nav.openMenu')} color={colors.white} onPress={() => setDrawer(pathname)} />
          <Text className="flex-1 font-bold text-base text-white">{t('appName')}</Text>
          <LanguageToggle tone="dark" />
        </View>
        <View className="flex-1">
          <Slot />
        </View>
        <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawer(null)}>
          <View className="flex-1 flex-row">
            <Sidebar collapsed={false} onToggle={() => setDrawer(null)} closeIcon />
            <Pressable accessibilityLabel={t('common.close')} onPress={() => setDrawer(null)} className="flex-1 bg-black/50" />
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 flex-row bg-gray-1 dark:bg-dark" edges={['top', 'bottom']}>
      <Sidebar collapsed={collapsed} onToggle={() => setManual(!collapsed)} />
      <View className="flex-1">
        <Slot />
      </View>
    </SafeAreaView>
  );
}
