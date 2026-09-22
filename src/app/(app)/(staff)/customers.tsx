import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Alert, Avatar, Badge, Button, Card, EmptyState, Icon, InfoRow, SectionLabel, Spinner } from '../../../components/common';
import { CreateEnquiryModal } from '../../../components/inbox/modals/create-enquiry-modal';
import { CustomerEditModal } from '../../../components/inbox/modals/customer-edit-modal';
import { PageHeader, StatTile } from '../../../components/layout/page-header';
import { Permission } from '../../../constants/permissions';
import { statusTone } from '../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../helpers/error.helper';
import { formatListTime } from '../../../helpers/format.helper';
import { useCustomer, useCustomers } from '../../../hooks/queries/use-catalog';
import { useEnquiries } from '../../../hooks/queries/use-enquiries';
import { useDebounced } from '../../../hooks/use-debounced';
import { usePermissions } from '../../../hooks/use-permissions';
import colors from '../../../theme/colors';
import { useTheme } from '../../../theme/use-theme';
import { cn } from '../../../utils/cn';

/** Customers (design Customers.dc.html): searchable table + detail panel of the selected customer. */
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

  return (
    <View className="flex-1 gap-4 p-6">
      <PageHeader title={t('customers.title')} subtitle={t('customers.subtitle')} />
      <View className="flex-row flex-wrap gap-3">
        <StatTile label={t('customers.total')} value={customers.data?.total ?? '—'} />
        <StatTile label={t('customers.withOpen')} value={items.filter((x) => x.openEnquiries > 0).length} />
        <StatTile label={t('customers.linked')} value={items.filter((x) => x.channels.some((ch) => ch.channel === 'LINE' || ch.channel === 'FACEBOOK')).length} />
        <StatTile label={t('customers.noSalesperson')} value={items.filter((x) => !x.salespersonStaffId).length} tone="yellow" />
      </View>

      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <View className="border-b border-stroke p-3 dark:border-stroke-dark">
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
          </View>
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
                    className={cn('flex-row items-center border-t border-gray-2 px-4 py-3 dark:border-dark-3', on ? 'border-l-[3px] border-l-primary bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1')}
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
                          <Text className="font-semibold text-[11px] text-dark-4">{t(`enquiry.channelShort.${ch.channel}`)}</Text>
                        </View>
                      ))}
                    </View>
                    <Text numberOfLines={1} className={cn('flex-[2] font-sans text-sm', x.salespersonName ? 'text-dark dark:text-white' : 'text-yellow')}>
                      {x.salespersonName ?? t('customers.none')}
                    </Text>
                    <Text className="flex-1 text-right font-bold text-sm text-dark dark:text-white">{x.openEnquiries}</Text>
                    <Text className="flex-[1.4] pl-4 font-sans text-[13px] text-body">
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

function CustomerPanel({ id }: { id: string }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const customer = useCustomer(id);
  const enquiries = useEnquiries({ customerId: id, limit: 20 });
  const [edit, setEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const x = customer.data;

  return (
    <Card className="w-[340px] gap-4 p-5">
      {!x ? (
        <Spinner />
      ) : (
        <ScrollView contentContainerClassName="gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={x.companyName} size={52} />
            <View className="flex-1">
              <Text className="font-bold text-base text-dark dark:text-white">{x.companyName}</Text>
              <Text className="font-latin text-[13px] text-body">{x.code}</Text>
            </View>
            <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => setEdit(true)} />
          </View>
          <View className="gap-2">
            <InfoRow label={t('customers.contact')} value={x.contactName ?? '—'} />
            <InfoRow label={t('customers.phone')} value={x.phone ?? '—'} />
            <InfoRow label={t('customers.email')} value={x.email ?? '—'} />
            <InfoRow label={t('customers.salesperson')} value={x.salespersonName ?? t('customers.none')} />
          </View>
          <View className="gap-2">
            <SectionLabel>{t('inbox.panel.channels')}</SectionLabel>
            {x.channels.map((ch) => (
              <View key={ch.id} className="flex-row items-center gap-2 rounded-lg border border-stroke px-2.5 py-2 dark:border-stroke-dark">
                <Text className="font-bold text-sm text-green">{t(`enquiry.channelShort.${ch.channel}`)}</Text>
                <Text className="flex-1 font-sans text-[13px] text-dark dark:text-white">{ch.displayName ?? t('inbox.panel.linked')}</Text>
              </View>
            ))}
          </View>
          {x.internalNote ? (
            <View className="rounded-lg bg-yellow-light p-3">
              <Text className="font-semibold text-xs text-yellow">{t('customers.note')}</Text>
              <Text className="font-sans text-sm text-dark">{x.internalNote}</Text>
            </View>
          ) : null}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <SectionLabel>{t('customers.enquiries')}</SectionLabel>
              {can(Permission.INBOX_ENQUIRY_CREATE) && <Button title={`+ ${t('inbox.create')}`} size="sm" variant="ghost" onPress={() => setCreating(true)} />}
            </View>
            {(enquiries.data ?? []).map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/inbox', params: { id: e.id } })}
                className="gap-0.5 rounded-lg border border-stroke px-3 py-2.5 active:bg-gray-1 dark:border-stroke-dark"
              >
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-latin text-xs text-body">{e.reference}</Text>
                  <Badge label={t(`enquiry.status.${e.status}`)} tone={statusTone[e.status]} />
                </View>
                <Text numberOfLines={1} className="font-semibold text-[13px] text-dark dark:text-white">{e.subject}</Text>
              </Pressable>
            ))}
          </View>
          <CustomerEditModal customer={x} visible={edit} onClose={() => setEdit(false)} />
          <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => router.push({ pathname: '/inbox', params: { id: e.id } })} />
        </ScrollView>
      )}
    </Card>
  );
}
