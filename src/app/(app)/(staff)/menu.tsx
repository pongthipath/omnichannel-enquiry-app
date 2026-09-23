import { Href, Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Icon, IconName, LanguageToggle } from '../../../components/common';
import { Permission } from '../../../constants/permissions';
import { useLogout } from '../../../hooks/queries/use-session';
import { usePermissions } from '../../../hooks/use-permissions';
import colors from '../../../theme/colors';
import { NATIVE } from '../../../utils/platform';

interface Row {
  href: Href;
  icon: IconName;
  label: string;
  permission?: Permission;
}

/**
 * The "me" tab of the phone app: who am I, then every page that is not one of the three work tabs,
 * grouped by topic. Each row pushes its page on top, so the way back is always the same gesture.
 * Phones only — in the browser these pages live in the sidebar.
 */
export default function MenuScreen() {
  const { t } = useTranslation();
  const { me, can } = usePermissions();
  const logout = useLogout();

  if (!NATIVE) return <Redirect href="/inbox" />;

  const work: Row[] = [
    { href: '/products', icon: 'package', label: t('nav.products'), permission: Permission.INBOX_PAGE_VIEW },
    { href: '/simulator', icon: 'zap', label: t('nav.simulator'), permission: Permission.SIMULATOR_PAGE_USE },
  ];
  const settings: Row[] = [
    { href: '/settings/sla', icon: 'clock', label: t('nav.sla'), permission: Permission.SETTINGS_SLA_VIEW },
    { href: '/settings/products', icon: 'package', label: t('nav.productSettings'), permission: Permission.SETTINGS_PRODUCT_MANAGE },
    { href: '/settings/tags', icon: 'tag', label: t('nav.tags'), permission: Permission.SETTINGS_TAG_MANAGE },
    { href: '/settings/departments', icon: 'building', label: t('nav.departments'), permission: Permission.SETTINGS_DEPARTMENT_MANAGE },
    { href: '/settings/roles', icon: 'shield', label: t('nav.roles'), permission: Permission.SETTINGS_ROLE_MANAGE },
    { href: '/settings/staff', icon: 'userPlus', label: t('nav.staff'), permission: Permission.SETTINGS_STAFF_MANAGE },
  ];

  const group = (title: string, rows: Row[]) => {
    const visible = rows.filter((row) => !row.permission || can(row.permission));
    if (visible.length === 0) return null;
    return (
      <View className="gap-2">
        <Text className="px-1 font-semibold text-xs text-body dark:text-body-dark">{title}</Text>
        <View className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2">
          {visible.map((row, i) => (
            <Pressable
              key={row.label}
              accessibilityRole="link"
              accessibilityLabel={row.label}
              onPress={() => router.push(row.href)}
              className={`min-h-12 flex-row items-center gap-3 px-3.5 active:bg-gray-1 dark:active:bg-dark ${i > 0 ? 'border-t border-stroke dark:border-stroke-dark' : ''}`}
            >
              <Icon name={row.icon} color={colors.dark[5]} />
              <Text className="flex-1 font-sans text-base text-dark dark:text-white">{row.label}</Text>
              <Icon name="chevronRight" size={16} color={colors.dark[6]} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <View className="flex-row items-center gap-3 rounded-xl border border-stroke bg-white p-3.5 dark:border-stroke-dark dark:bg-dark-2">
        <Avatar name={me?.name ?? '?'} size={44} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-bold text-lg text-dark dark:text-white">
            {me?.name}
          </Text>
          <Text numberOfLines={1} className="font-sans text-sm text-green-dark">
            {t('nav.online')}
          </Text>
        </View>
      </View>

      {group(t('nav.work'), work)}
      {group(t('nav.settings'), settings)}

      <View className="flex-row items-center justify-between rounded-xl border border-stroke bg-white px-3.5 py-3 dark:border-stroke-dark dark:bg-dark-2">
        <Text className="font-sans text-base text-dark dark:text-white">{t('common.language')}</Text>
        <LanguageToggle />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('auth.logout')}
        onPress={() => logout.mutate()}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-stroke bg-white active:bg-gray-1 dark:border-stroke-dark dark:bg-dark-2"
      >
        <Icon name="logout" size={16} color={colors.red.DEFAULT} />
        <Text className="font-semibold text-base text-red">{t('auth.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}
