import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { statusTone, tagTone } from '../../helpers/enquiry-status.helper';
import { errorMessage } from '../../helpers/error.helper';
import { formatListTime } from '../../helpers/format.helper';
import { useDashboard } from '../../hooks/queries/use-catalog';
import { useEnquiries } from '../../hooks/queries/use-enquiries';
import { usePermissions } from '../../hooks/use-permissions';
import { useDebounced } from '../../hooks/use-debounced';
import { ChatStatus, Enquiry, ScopeFilter, STATUS_FLOW } from '../../services/enquiry.service';
import colors from '../../theme/colors';
import { useTheme } from '../../theme/use-theme';
import { cn } from '../../utils/cn';
import { Alert, Avatar, Badge, Button, Chip, EmptyState, Icon, SegmentedTabs, Spinner } from '../common';

/** Left column of the inbox (design Main.dc.html): search, scope tabs, status chips, rows. */
export function EnquiryList({
  selectedId,
  onSelect,
  onCreate,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const c = useTheme();
  const { can } = usePermissions();
  const [scope, setScope] = useState<ScopeFilter>('visible');
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 300);
  const list = useEnquiries({ scope, status: status ? [status] : undefined, q });
  const counts = useDashboard(undefined, can(Permission.DASHBOARD_PAGE_VIEW)).data?.byStatus;
  const countOf = (s: ChatStatus) => counts?.find((x) => x.status === s)?.count;

  const scopes: { value: ScopeFilter; label: string }[] = [
    ...(can(Permission.INBOX_SCOPE_OWN) ? [{ value: 'mine' as const, label: t('inbox.scope.mine') }] : []),
    ...(can(Permission.INBOX_SCOPE_DEPARTMENT) ? [{ value: 'department' as const, label: t('inbox.scope.department') }] : []),
    { value: 'visible', label: can(Permission.INBOX_SCOPE_ALL) ? t('inbox.scope.all') : t('inbox.scope.visible') },
  ];

  const renderRow = ({ item }: { item: Enquiry }) => {
    const selected = item.id === selectedId;
    const unread = item.unreadByStaffCount;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${item.reference} ${item.customer?.companyName ?? ''} ${item.subject}`}
        onPress={() => onSelect(item.id)}
        className={cn(
          'flex-row gap-3 border-b border-gray-2 px-3 py-2.5 dark:border-dark-3',
          selected ? 'border-l-[3px] border-l-primary bg-primary-light dark:bg-dark-3' : 'bg-white active:bg-gray-1 dark:bg-dark-2',
        )}
      >
        <Avatar name={item.customer?.companyName ?? '?'} />
        <View className="min-w-0 flex-1 gap-0.5">
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className={cn('flex-1 text-sm text-dark dark:text-white', unread ? 'font-bold' : 'font-semibold')}>
              {item.customer?.companyName}
            </Text>
            <Text className="font-sans text-xs text-body dark:text-body-dark">{formatListTime(item.lastMessageAt, i18n.language, t)}</Text>
          </View>
          <Text numberOfLines={1} className="font-semibold text-sm text-dark-3 dark:text-gray-3">
            {item.subject}
          </Text>
          <Text numberOfLines={1} className="font-sans text-sm text-body dark:text-body-dark">
            {item.lastMessagePreview}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-1">
            <View className="rounded border border-stroke px-1.5 dark:border-stroke-dark">
              <Text className="font-semibold text-xs text-dark-4 dark:text-dark-6">{t(`enquiry.channelShort.${item.originChannel}`)}</Text>
            </View>
            <Badge label={t(`enquiry.status.${item.status}`)} tone={statusTone[item.status]} />
            {item.priority === 'URGENT' && <Badge label={t('enquiry.priority.URGENT')} tone="red" />}
            {item.isSlaBreached && <Badge label={t('enquiry.slaBreached')} tone="red" />}
            {item.reopenCount > 0 && <Badge label={t('enquiry.reopened')} tone="yellow" />}
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} label={tag.name} tone={tagTone[tag.color]} />
            ))}
            <View className="flex-1" />
            {unread > 0 && (
              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                <Text className="font-bold text-xs text-white">{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-dark-2">
      <View className="gap-3 border-b border-stroke px-4 pb-3 pt-4 dark:border-stroke-dark">
        <View className="flex-row items-center justify-between">
          <Text accessibilityRole="header" className="font-bold text-xl text-dark dark:text-white">
            {t('inbox.title')}
          </Text>
          {onCreate && can(Permission.INBOX_ENQUIRY_CREATE) && (
            <Button title={`+ ${t('inbox.create')}`} size="sm" onPress={onCreate} />
          )}
        </View>
        <View className="min-h-10 flex-row items-center gap-2 rounded-md border border-stroke bg-gray-1 px-3 dark:border-stroke-dark dark:bg-dark">
          <Icon name="search" size={16} color={colors.dark[5]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('inbox.searchPlaceholder')}
            placeholderTextColor={c.placeholder}
            accessibilityLabel={t('inbox.searchPlaceholder')}
            className="flex-1 py-2 font-sans text-sm text-dark outline-none dark:text-white"
          />
          {search ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="x" size={16} color={colors.dark[5]} />
            </Pressable>
          ) : null}
        </View>
        {scopes.length > 1 && <SegmentedTabs options={scopes} value={scope} onChange={setScope} />}
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={t('inbox.allStatuses')} selected={!status} onPress={() => setStatus(null)} />
          {STATUS_FLOW.map((s) => (
            <Chip
              key={s}
              label={t(`enquiry.statusShort.${s}`)}
              count={countOf(s)}
              selected={status === s}
              onPress={() => setStatus(status === s ? null : s)}
            />
          ))}
        </View>
      </View>

      {list.isError ? (
        <View className="p-4">
          <Alert tone="error" message={errorMessage(list.error, t)} />
        </View>
      ) : list.isPending ? (
        <Spinner />
      ) : (
        <FlatList
          data={list.data}
          keyExtractor={(e) => e.id}
          renderItem={renderRow}
          onEndReached={() => list.hasNextPage && !list.isFetchingNextPage && void list.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={list.isFetchingNextPage ? <Spinner className="py-4" /> : null}
          ListEmptyComponent={
            <EmptyState title={q ? t('inbox.noMatch') : t('inbox.empty')} message={q ? t('inbox.noMatchHint') : undefined} />
          }
        />
      )}
    </View>
  );
}
