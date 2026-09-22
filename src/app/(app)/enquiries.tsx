import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Badge, Button, Card } from '../../components/common';
import { errorMessage } from '../../helpers/error.helper';
import { statusTone } from '../../helpers/enquiry-status.helper';
import { useEnquiries } from '../../hooks/queries/use-enquiries';
import { useLogout, useMe } from '../../hooks/queries/use-session';
import { Enquiry } from '../../services/enquiry.service';

/** C1 (customer "my enquiries") / S1 (staff inbox, list part) — same list, the API applies the scope. */
export default function EnquiriesScreen() {
  const { t, i18n } = useTranslation();
  const me = useMe().data;
  const enquiries = useEnquiries();
  const logout = useLogout();
  const isStaff = me?.userType === 'staff';

  const renderItem = ({ item }: { item: Enquiry }) => (
    <Card className="gap-2 p-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-latin text-xs text-body dark:text-body-dark">{item.reference}</Text>
        <Badge label={t(`enquiry.status.${item.status}`)} tone={statusTone[item.status]} />
        {item.priority === 'URGENT' && <Badge label={t('enquiry.priority.URGENT')} tone="red" />}
        {item.isSlaBreached && <Badge label={t('enquiry.slaBreached')} tone="red" />}
        {item.reopenCount > 0 && <Badge label={t('enquiry.reopened')} tone="yellow" />}
      </View>
      <Text className="font-semibold text-base text-dark dark:text-white" numberOfLines={2}>
        {item.subject}
      </Text>
      {isStaff && item.customer && (
        <Text className="font-sans text-sm text-dark-4 dark:text-dark-6">{item.customer.companyName}</Text>
      )}
      {item.lastMessagePreview && (
        <Text className="font-sans text-sm text-body dark:text-body-dark" numberOfLines={1}>
          {item.lastMessagePreview}
        </Text>
      )}
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-xs text-body dark:text-body-dark">
          {new Date(item.lastMessageAt).toLocaleString(i18n.language === 'th' ? 'th-TH' : 'en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </Text>
        {isStaff && item.unreadByStaffCount > 0 && (
          <View className="min-w-6 items-center rounded-full bg-primary px-2 py-0.5">
            <Text className="font-semibold text-xs text-white">{item.unreadByStaffCount}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark">
      <View className="flex-row items-center justify-between gap-3 border-b border-stroke bg-white px-4 py-3 dark:border-stroke-dark dark:bg-dark-2">
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-bold text-lg text-dark dark:text-white">
            {t(isStaff ? 'enquiry.inboxTitle' : 'enquiry.myTitle')}
          </Text>
          <Text className="font-sans text-sm text-body dark:text-body-dark" numberOfLines={1}>
            {me?.name}
          </Text>
        </View>
        <Button title={t('auth.logout')} variant="outline" size="sm" loading={logout.isPending} onPress={() => logout.mutate()} />
      </View>

      <FlatList
        data={enquiries.data?.items ?? []}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerClassName="w-full max-w-[720px] self-center gap-3 p-4"
        refreshControl={<RefreshControl refreshing={enquiries.isRefetching} onRefresh={() => void enquiries.refetch()} />}
        ListHeaderComponent={
          enquiries.isError ? <Alert tone="error" message={errorMessage(enquiries.error, t)} /> : null
        }
        ListEmptyComponent={
          enquiries.isPending ? null : (
            <Text className="py-10 text-center font-sans text-sm text-body dark:text-body-dark">{t('enquiry.empty')}</Text>
          )
        }
      />
    </SafeAreaView>
  );
}
