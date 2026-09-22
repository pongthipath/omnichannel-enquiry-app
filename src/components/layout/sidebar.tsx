import { Href, Link, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { useDashboard } from '../../hooks/queries/use-catalog';
import { useLogout } from '../../hooks/queries/use-session';
import { usePermissions } from '../../hooks/use-permissions';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Icon, IconName } from '../common/icon';

interface NavItem {
  href: Href;
  path: string;
  icon: IconName;
  label: string;
  permission: Permission;
  badge?: number;
}

/** Dark left menu from the design (Sidebar.dc.html). Items appear only when the role has the page permission. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { me, can } = usePermissions();
  const logout = useLogout();
  const dashboard = useDashboard(undefined, can(Permission.DASHBOARD_PAGE_VIEW));
  const openCount = dashboard.data?.totals.notClosed;

  const work: NavItem[] = [
    { href: '/inbox', path: '/inbox', icon: 'inbox', label: t('nav.inbox'), permission: Permission.INBOX_PAGE_VIEW, badge: openCount },
    { href: '/customers', path: '/customers', icon: 'users', label: t('nav.customers'), permission: Permission.CUSTOMERS_PAGE_VIEW },
    { href: '/products', path: '/products', icon: 'package', label: t('nav.products'), permission: Permission.INBOX_PAGE_VIEW },
    { href: '/dashboard', path: '/dashboard', icon: 'chart', label: t('nav.dashboard'), permission: Permission.DASHBOARD_PAGE_VIEW },
  ];
  const settings: NavItem[] = [
    { href: '/settings/tags', path: '/settings/tags', icon: 'tag', label: t('nav.tags'), permission: Permission.SETTINGS_TAG_MANAGE },
    { href: '/settings/departments', path: '/settings/departments', icon: 'building', label: t('nav.departments'), permission: Permission.SETTINGS_DEPARTMENT_MANAGE },
    { href: '/settings/roles', path: '/settings/roles', icon: 'shield', label: t('nav.roles'), permission: Permission.SETTINGS_ROLE_MANAGE },
    { href: '/settings/staff', path: '/settings/staff', icon: 'userPlus', label: t('nav.staff'), permission: Permission.SETTINGS_STAFF_MANAGE },
  ];
  const visibleSettings = settings.filter((i) => can(i.permission));

  const renderItem = (item: NavItem) => {
    const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return (
      <Link key={item.path} href={item.href} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: active }}
          className={cn(
            'min-h-11 flex-row items-center gap-3 rounded-md px-3',
            collapsed && 'justify-center px-0',
            active ? 'bg-dark-2' : 'active:bg-dark-2',
          )}
        >
          <Icon name={item.icon} color={active ? colors.white : '#D1D5DB'} />
          {!collapsed && (
            <Text numberOfLines={1} className={cn('flex-1 text-sm', active ? 'font-semibold text-white' : 'font-sans text-[#D1D5DB]')}>
              {item.label}
            </Text>
          )}
          {!collapsed && item.badge ? (
            <View className="min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5">
              <Text className="font-semibold text-xs text-white">{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      </Link>
    );
  };

  return (
    <View
      role="navigation"
      className={cn('h-full bg-dark px-3 py-4', collapsed ? 'w-[72px]' : 'w-[232px]')}
    >
      <View className={cn('flex-row items-center gap-2.5 pb-4', collapsed ? 'flex-col' : 'px-2')}>
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Text className="font-bold text-lg text-white">F</Text>
        </View>
        {!collapsed && (
          <View className="flex-1">
            <Text className="font-bold text-[15px] text-white">{t('appName')}</Text>
            <Text className="font-sans text-xs text-dark-6">Omnichannel</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? t('nav.expand') : t('nav.collapse')}
          onPress={onToggle}
          className="h-8 w-8 items-center justify-center rounded-md border border-dark-3 active:bg-dark-2"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} color={colors.dark[6]} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-1">
        {!collapsed && <Text className="px-3 pb-1 pt-2 font-semibold text-xs text-dark-5">{t('nav.work')}</Text>}
        {work.filter((i) => can(i.permission)).map(renderItem)}
        {visibleSettings.length > 0 && (
          <>
            {!collapsed ? (
              <Text className="px-3 pb-1 pt-4 font-semibold text-xs text-dark-5">{t('nav.settings')}</Text>
            ) : (
              <View className="my-2 h-px bg-dark-3" />
            )}
            {visibleSettings.map(renderItem)}
          </>
        )}
      </ScrollView>

      <View className={cn('flex-row items-center gap-2.5 rounded-lg bg-dark-2 p-3', collapsed && 'flex-col p-2')}>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-dark-3">
          <Text className="font-semibold text-sm text-white">{me?.name?.[0] ?? '?'}</Text>
        </View>
        {!collapsed && (
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-semibold text-sm text-white">
              {me?.name}
            </Text>
            <Text numberOfLines={1} className="font-sans text-xs text-green-dark">
              {t('nav.online')}
            </Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.logout')}
          onPress={() => logout.mutate()}
          className="h-8 w-8 items-center justify-center rounded-md active:bg-dark-3"
        >
          <Icon name="logout" color={colors.dark[6]} />
        </Pressable>
      </View>
    </View>
  );
}
