import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Badge, EmptyState, Icon, IconButton, LanguageToggle, SegmentedTabs, Spinner } from '../../../../components/common';
import { CreateEnquiryModal } from '../../../../components/inbox/modals/create-enquiry-modal';
import { StatusStepper } from '../../../../components/inbox/status-stepper';
import { statusTone } from '../../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../../helpers/error.helper';
import { formatListTime } from '../../../../helpers/format.helper';
import { useEnquiries } from '../../../../hooks/queries/use-enquiries';
import { useLogout, useMe } from '../../../../hooks/queries/use-session';
import { useDebounced } from '../../../../hooks/use-debounced';
import { ChatStatus, Enquiry, EnquiryType } from '../../../../services/enquiry.service';
import colors from '../../../../theme/colors';
import { useTheme } from '../../../../theme/use-theme';

type Filter = 'all' | 'active' | 'done';
const ACTIVE: ChatStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];
const DONE: ChatStatus[] = ['RESOLVED', 'CLOSED'];
const QUICK: { type: EnquiryType; key: string }[] = [
  { type: 'COMPLAINT', key: 'damaged' },
  { type: 'ORDER_DELIVERY', key: 'order' },
  { type: 'PRICING', key: 'pricing' },
  { type: 'INVOICE_PAYMENT', key: 'invoice' },
];

/** Customer home (design CustomerHome.dc.html): quick "report an issue" tiles + my enquiries. */
export default function MyEnquiriesScreen() {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const me = useMe().data;
  const logout = useLogout();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<EnquiryType | null>(null);
  const list = useEnquiries({ q: useDebounced(search, 300), status: filter === 'active' ? ACTIVE : filter === 'done' ? DONE : undefined });

  const renderItem = ({ item }: { item: Enquiry }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.reference} ${item.subject}`}
      onPress={() => router.push(`/my/${item.id}`)}
      className="gap-1.5 rounded-xl border border-stroke bg-white p-3.5 active:bg-gray-1 dark:border-stroke-dark dark:bg-dark-2"
    >
      <View className="flex-row items-center gap-1.5">
        <Text className="font-latin text-xs text-body">{item.reference}</Text>
        <Badge label={t(`enquiry.status.${item.status}`)} tone={statusTone[item.status]} />
        <View className="flex-1" />
        <Text className="font-sans text-xs text-body">{formatListTime(item.lastMessageAt, i18n.language, t)}</Text>
      </View>
      <Text className="font-semibold text-base text-dark dark:text-white">{item.subject}</Text>
      {item.lastMessagePreview ? (
        <Text numberOfLines={1} className="font-sans text-sm text-body">
          {item.lastMessagePreview}
        </Text>
      ) : null}
      {!DONE.includes(item.status) && (
        <View className="mt-1">
          <StatusStepper status={item.status} compact />
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['top']}>
      <View className="w-full max-w-[640px] flex-1 self-center">
        <View className="gap-3.5 bg-primary px-4 pb-4 pt-5">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="font-sans text-sm text-[#DDE3FE]">{t('appName')}</Text>
              <Text className="font-bold text-xl text-white">{t('my.hello', { name: me?.name ?? '' })}</Text>
            </View>
            <LanguageToggle tone="dark" />
            <IconButton icon="logout" label={t('auth.logout')} color={colors.white} onPress={() => logout.mutate()} className="rounded-full bg-white/15" />
          </View>
          <View className="min-h-9 flex-row items-center gap-2 rounded-lg bg-white px-3">
            <Icon name="search" color={colors.dark[5]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('my.searchPlaceholder')}
              placeholderTextColor={c.placeholder}
              accessibilityLabel={t('my.searchPlaceholder')}
              className="flex-1 py-2 font-sans text-base text-dark outline-none"
            />
          </View>
        </View>

        <FlatList
          data={list.data ?? []}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerClassName="gap-3 p-4"
          onEndReached={() => list.hasNextPage && void list.fetchNextPage()}
          ListHeaderComponent={
            <View className="gap-4 pb-1">
              <View className="gap-2.5">
                <Text className="font-bold text-base text-dark dark:text-white">{t('my.newTitle')}</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {QUICK.map((q) => (
                    <Pressable
                      key={q.key}
                      accessibilityRole="button"
                      onPress={() => setCreating(q.type)}
                      className="min-h-14 min-w-[45%] flex-1 gap-0.5 rounded-xl border border-stroke bg-white p-3 active:bg-gray-1 dark:border-stroke-dark dark:bg-dark-2"
                    >
                      <Text className="font-semibold text-sm text-dark dark:text-white">{t(`my.quick.${q.key}`)}</Text>
                      <Text className="font-sans text-xs text-body">{t(`my.quick.${q.key}Hint`)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-base text-dark dark:text-white">{t('my.title')}</Text>
                <Pressable accessibilityRole="button" onPress={() => setCreating('GENERAL')} className="min-h-9 justify-center px-2">
                  <Text className="font-semibold text-sm text-primary">+ {t('my.newOther')}</Text>
                </Pressable>
              </View>
              <SegmentedTabs
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: t('common.all') },
                  { value: 'active', label: t('my.filter.active') },
                  { value: 'done', label: t('my.filter.done') },
                ]}
              />
              {list.isError && <Alert tone="error" message={errorMessage(list.error, t)} />}
            </View>
          }
          ListEmptyComponent={list.isPending ? <Spinner /> : <EmptyState title={t('my.empty')} message={t('my.emptyHint')} />}
        />
      </View>
      <CreateEnquiryModal
        visible={creating !== null}
        onClose={() => setCreating(null)}
        asStaff={false}
        initialType={creating ?? undefined}
        onCreated={(e) => router.push(`/my/${e.id}`)}
      />
    </SafeAreaView>
  );
}
