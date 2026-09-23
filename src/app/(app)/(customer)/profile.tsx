import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  InfoRow,
  LanguageToggle,
  SectionLabel,
  Spinner,
} from '../../../components/common';
import { orderTone } from '../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../helpers/error.helper';
import { formatDateTime, formatMoney } from '../../../helpers/format.helper';
import { useCustomerOrders, useMyProfile } from '../../../hooks/queries/use-customer-360';
import { useLogout } from '../../../hooks/queries/use-session';
import { useOffline } from '../../../hooks/use-offline';
import colors from '../../../theme/colors';
import { NATIVE } from '../../../utils/platform';

/**
 * The customer's own page (design C5): who we have on file, how they can be reached, and the orders
 * behind the questions they ask. Contact details are changed by the team, so this screen only reads.
 */
export default function CustomerProfileScreen() {
  const { t, i18n } = useTranslation();
  const logout = useLogout();
  const { pending } = useOffline();
  const profile = useMyProfile();
  const orders = useCustomerOrders(profile.data?.id);
  const me = profile.data;

  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['top']}>
      <View className="w-full max-w-[640px] flex-1 self-center">
        <View className="flex-row items-center gap-2 bg-primary px-3 py-3">
          {/* phone app: this is a tab, so there is nothing to go back to */}
          {!NATIVE && <IconButton icon="chevronLeft" label={t('common.back')} color={colors.white} onPress={() => router.back()} />}
          <Text className="flex-1 font-bold text-lg text-white">{t('profile.title')}</Text>
          <LanguageToggle tone="dark" />
        </View>

        {profile.isPending ? (
          <Spinner />
        ) : !me ? (
          <Alert tone="error" message={errorMessage(profile.error, t)} />
        ) : (
          <ScrollView contentContainerClassName="gap-3 p-4">
            <Card className="gap-3 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name={me.companyName} size={52} />
                <View className="flex-1">
                  <Text className="font-bold text-base text-dark dark:text-white">{me.companyName}</Text>
                  <Text className="font-latin text-sm text-body">{me.code}</Text>
                </View>
              </View>
              <View className="gap-2">
                <InfoRow label={t('customers.contact')} value={me.contactName ?? '—'} />
                <InfoRow label={t('customers.phone')} value={me.phone ?? '—'} />
                <InfoRow label={t('customers.email')} value={me.email ?? '—'} />
              </View>
              <Alert tone="info" message={t('profile.editHint')} />
            </Card>

            <Card className="gap-2 p-4">
              <SectionLabel>{t('orders.title')}</SectionLabel>
              {orders.isPending && <Spinner />}
              {orders.data?.length === 0 && (
                <Text className="font-sans text-sm text-body">{t('orders.empty')}</Text>
              )}
              {(orders.data ?? []).map((o) => (
                <View key={o.id} className="gap-1 rounded-lg border border-stroke p-3 dark:border-stroke-dark">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="flex-1 font-latin text-xs text-body">{o.orderNo}</Text>
                    <Badge label={t(`orders.status.${o.status}`)} tone={orderTone[o.status]} />
                  </View>
                  <Text className="font-semibold text-base text-dark dark:text-white">
                    {formatMoney(o.totalAmount, o.currency, i18n.language)}
                  </Text>
                  {o.itemsSummary ? (
                    <Text className="font-sans text-sm text-body dark:text-body-dark">{o.itemsSummary}</Text>
                  ) : null}
                  <Text className="font-sans text-xs text-body dark:text-body-dark">
                    {o.deliveredAt
                      ? `${t('orders.delivered')} ${formatDateTime(o.deliveredAt, i18n.language)}`
                      : formatDateTime(o.orderedAt, i18n.language)}
                  </Text>
                </View>
              ))}
            </Card>

            {pending > 0 && <Alert tone="warning" message={t('offline.pending', { count: pending })} />}

            <Button title={t('auth.logout')} variant="outline" onPress={() => logout.mutate()} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
