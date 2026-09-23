import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Avatar, Badge, Button, ConfirmModal, IconButton, Spinner } from '../../../../components/common';
import { Composer } from '../../../../components/inbox/composer';
import { MessageList } from '../../../../components/inbox/message-list';
import { StatusStepper } from '../../../../components/inbox/status-stepper';
import { statusTone } from '../../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../../helpers/error.helper';
import { useEnquiry, useEnquiryActions } from '../../../../hooks/queries/use-enquiries';

/**
 * Customer chat (design CustomerChat.dc.html). A resolved enquiry can be confirmed (→ CLOSED);
 * writing into a resolved / closed one reopens it automatically.
 */
export default function MyEnquiryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enquiry = useEnquiry(id);
  const actions = useEnquiryActions(id);
  const [confirm, setConfirm] = useState(false);
  const e = enquiry.data;

  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['top', 'bottom']}>
      <View className="w-full max-w-[640px] flex-1 self-center">
        <View className="gap-2.5 border-b border-stroke bg-white px-2 pb-3 pt-2 dark:border-stroke-dark dark:bg-dark-2">
          <View className="flex-row items-center gap-1">
            <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/my'))} />
            <View className="min-w-0 flex-1">
              <Text className="font-latin text-xs text-body">{e?.reference ?? ''}</Text>
              <Text accessibilityRole="header" numberOfLines={1} className="font-bold text-base text-dark dark:text-white">
                {e?.subject ?? ''}
              </Text>
            </View>
            {e && <Badge label={t(`enquiry.status.${e.status}`)} tone={statusTone[e.status]} />}
          </View>
          {e && (
            <View className="gap-2.5 px-2">
              <View className="flex-row items-center gap-2 rounded-lg border border-stroke bg-gray-1 px-2.5 py-2 dark:border-stroke-dark dark:bg-dark">
                <Avatar name={e.assignedStaffName ?? e.departmentName ?? '?'} size={28} />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-dark dark:text-white">
                    {e.assignedStaffName ? `${e.assignedStaffName} · ${e.departmentName ?? ''}` : t('my.waitingForStaff', { department: e.departmentName ?? '' })}
                  </Text>
                  <Text className="font-sans text-xs text-body">{t(`enquiry.type.${e.enquiryType}`)} · {t(`enquiry.priority.${e.priority}`)}</Text>
                </View>
              </View>
              <StatusStepper status={e.status} compact />
              {e.status === 'RESOLVED' && (
                <View className="flex-row items-center gap-2 rounded-lg bg-green-light p-2.5">
                  <Text className="flex-1 font-sans text-sm text-green">{t('my.resolvedPrompt')}</Text>
                  <Button title={t('my.confirmResolved')} size="sm" onPress={() => setConfirm(true)} />
                </View>
              )}
            </View>
          )}
        </View>

        {enquiry.isError ? (
          <View className="p-4">
            <Alert tone="error" message={errorMessage(enquiry.error, t)} />
          </View>
        ) : !e ? (
          <Spinner className="flex-1" />
        ) : (
          <>
            <MessageList chatId={e.id} mySide="CUSTOMER" />
            <Composer chatId={e.id} staff={false} />
            <Text className="bg-white pb-3 text-center font-sans text-xs text-body dark:bg-dark-2">{t('my.offlineHint')}</Text>
          </>
        )}
      </View>
      <ConfirmModal
        visible={confirm}
        onClose={() => setConfirm(false)}
        title={t('my.confirmTitle')}
        message={t('my.confirmMessage')}
        confirmLabel={t('my.confirmResolved')}
        loading={actions.changeStatus.isPending}
        error={actions.changeStatus.isError ? errorMessage(actions.changeStatus.error, t) : undefined}
        onConfirm={() => e && actions.changeStatus.mutate({ status: 'CLOSED', version: e.version }, { onSuccess: () => setConfirm(false) })}
      />
    </SafeAreaView>
  );
}
