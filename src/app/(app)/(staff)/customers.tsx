import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Alert, Avatar, Card, EmptyState, Icon, Spinner } from '../../../components/common';
import { CustomerPanel } from '../../../components/inbox/customer-panel';
import { PageHeader, StatTile } from '../../../components/layout/page-header';
import { Permission } from '../../../constants/permissions';
import { errorMessage } from '../../../helpers/error.helper';
import { formatListTime } from '../../../helpers/format.helper';
import { useCustomers } from '../../../hooks/queries/use-catalog';
import { useDebounced } from '../../../hooks/use-debounced';
import { usePermissions } from '../../../hooks/use-permissions';
import colors from '../../../theme/colors';
import { useTheme } from '../../../theme/use-theme';
import { cn } from '../../../utils/cn';
import { NATIVE } from '../../../utils/platform';

/**
 * Customers (design Customers.dc.html): searchable table + detail panel of the selected customer.
 * A table needs width, so on a phone the same rows are cards and the detail panel is its own page.
 */
export default function CustomersScreen() {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const { can } = usePermissions();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const customers = useCustomers(useDebounced(search, 300));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = customers.data?.items ?? [];
  const selected = selectedId ?? items[0]?.id ?? null;
  const showPanel = width >= 1100;

  if (!can(Permission.CUSTOMERS_PAGE_VIEW)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const searchBox = (
    <View className="min-h-10 flex-row items-center gap-2 rounded-md border border-stroke bg-gray-1 px-3 dark:border-stroke-dark dark:bg-dark">
      <Icon name="search" size={16} color={colors.dark[5]} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('customers.searchPlaceholder')}
        placeholderTextColor={c.placeholder}
        accessibilityLabel={t('customers.searchPlaceholder')}
        className="flex-1 py-2 font-sans text-sm text-dark outline-none dark:text-white"
      />
    </View>
  );

  if (NATIVE) {
    return (
      <View className="flex-1">
        <View className="gap-3 border-b border-stroke bg-white px-4 py-3 dark:border-stroke-dark dark:bg-dark-2">
          <PageHeader title={t('customers.title')} subtitle={t('customers.subtitle')} />
          {searchBox}
        </View>
        {customers.isError && (
          <View className="p-4">
            <Alert tone="error" message={errorMessage(customers.error, t)} />
          </View>
        )}
        {customers.isPending ? (
          <Spinner className="flex-1" />
        ) : (
          <ScrollView contentContainerClassName="gap-2.5 p-4">
            {items.map((x) => (
              <Pressable
                key={x.id}
                accessibilityRole="button"
                accessibilityLabel={x.companyName + ' ' + x.code}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: x.id } })}
                className="gap-2 rounded-xl border border-stroke bg-white p-3.5 active:bg-gray-1 dark:border-stroke-dark dark:bg-dark-2"
              >
                <View className="flex-row items-center gap-2.5">
                  <Avatar name={x.companyName} size={38} />
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-semibold text-base text-dark dark:text-white">
                      {x.companyName}
                    </Text>
                    <Text numberOfLines={1} className="font-latin text-xs text-body">
                      {[x.code, x.contactName, x.phone].filter(Boolean).join(' \u00b7 ')}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={16} color={colors.dark[6]} />
                </View>
                <View className="flex-row flex-wrap items-center gap-1.5">
                  {x.channels.slice(0, 5).map((ch) => (
                    <View key={ch.id} className="rounded border border-stroke px-1.5 dark:border-stroke-dark">
                      <Text className="font-semibold text-xs text-dark-4">{t('enquiry.channelShort.' + ch.channel)}</Text>
                    </View>
                  ))}
                  {x.channels.length > 5 && (
                    <Text className="font-sans text-xs text-body">+{x.channels.length - 5}</Text>
                  )}
                </View>
                <View className="flex-row items-center gap-2 border-t border-gray-2 pt-2 dark:border-dark-3">
                  <Text numberOfLines={1} className={cn('flex-1 font-sans text-xs', x.salespersonName ? 'text-body' : 'text-yellow')}>
                    {x.salespersonName ?? t('customers.none')}
                  </Text>
                  <Text className="font-semibold text-xs text-dark dark:text-white">
                    {t('customers.cols.open')} {x.openEnquiries}
                  </Text>
                  <Text className="font-sans text-xs text-body">
                    {x.lastContactAt ? formatListTime(x.lastContactAt, i18n.language, t) : '\u2014'}
                  </Text>
                </View>
              </Pressable>
            ))}
            {!items.length && <EmptyState icon="users" title={t('customers.empty')} />}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader title={t('customers.title')} subtitle={t('customers.subtitle')} />
      <View className="flex-row flex-wrap gap-3">
        <StatTile label={t('customers.total')} value={customers.data?.total ?? '—'} />
        <StatTile label={t('customers.withOpen')} value={items.filter((x) => x.openEnquiries > 0).length} />
        <StatTile label={t('customers.linked')} value={items.filter((x) => x.channels.some((ch) => ch.channel === 'LINE' || ch.channel === 'FACEBOOK')).length} />
        <StatTile label={t('customers.noSalesperson')} value={items.filter((x) => !x.salespersonStaffId).length} tone="yellow" />
      </View>

      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <View className="border-b border-stroke p-3 dark:border-stroke-dark">{searchBox}</View>
          <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
            <Text className="flex-[3] font-semibold text-xs text-body">{t('customers.cols.company')}</Text>
            <Text className="flex-[2] font-semibold text-xs text-body">{t('customers.cols.contact')}</Text>
            <Text className="flex-[2] font-semibold text-xs text-body">{t('customers.cols.channels')}</Text>
            <Text className="flex-[2] font-semibold text-xs text-body">{t('customers.salesperson')}</Text>
            <Text className="flex-1 text-right font-semibold text-xs text-body">{t('customers.cols.open')}</Text>
            <Text className="flex-[1.4] pl-4 font-semibold text-xs text-body">{t('customers.cols.last')}</Text>
          </View>
          {customers.isError && <Alert tone="error" message={errorMessage(customers.error, t)} />}
          {customers.isPending ? (
            <Spinner />
          ) : (
            <ScrollView>
              {items.map((x) => {
                const on = x.id === selected;
                return (
                  <Pressable
                    key={x.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setSelectedId(x.id)}
                    className={cn('flex-row items-center border-t border-gray-2 px-3 py-2.5 dark:border-dark-3', on ? 'border-l-[3px] border-l-primary bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1')}
                  >
                    <View className="flex-[3] flex-row items-center gap-2.5">
                      <Avatar name={x.companyName} size={34} />
                      <View className="flex-1">
                        <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{x.companyName}</Text>
                        <Text className="font-latin text-xs text-body">{x.code}</Text>
                      </View>
                    </View>
                    <View className="flex-[2]">
                      <Text numberOfLines={1} className="font-sans text-sm text-dark dark:text-white">{x.contactName ?? '—'}</Text>
                      <Text className="font-sans text-xs text-body">{x.phone ?? ''}</Text>
                    </View>
                    <View className="flex-[2] flex-row flex-wrap gap-1">
                      {x.channels.map((ch) => (
                        <View key={ch.id} className="rounded border border-stroke px-1.5 dark:border-stroke-dark">
                          <Text className="font-semibold text-xs text-dark-4">{t(`enquiry.channelShort.${ch.channel}`)}</Text>
                        </View>
                      ))}
                    </View>
                    <Text numberOfLines={1} className={cn('flex-[2] font-sans text-sm', x.salespersonName ? 'text-dark dark:text-white' : 'text-yellow')}>
                      {x.salespersonName ?? t('customers.none')}
                    </Text>
                    <Text className="flex-1 text-right font-bold text-sm text-dark dark:text-white">{x.openEnquiries}</Text>
                    <Text className="flex-[1.4] pl-4 font-sans text-sm text-body">
                      {x.lastContactAt ? formatListTime(x.lastContactAt, i18n.language, t) : '—'}
                    </Text>
                  </Pressable>
                );
              })}
              {!items.length && <EmptyState icon="users" title={t('customers.empty')} />}
            </ScrollView>
          )}
        </Card>
        {showPanel && selected && <CustomerPanel id={selected} />}
      </View>
    </View>
  );
}
