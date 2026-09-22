import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { errorMessage } from '../../helpers/error.helper';
import { useEnquiry, useEnquiryActions } from '../../hooks/queries/use-enquiries';
import { usePermissions } from '../../hooks/use-permissions';
import { Alert, Button, EmptyState, IconButton, Spinner } from '../common';
import { Composer } from './composer';
import { MessageList } from './message-list';
import { AssignModal } from './modals/assign-modal';
import { EscalateModal } from './modals/escalate-modal';
import { StatusModal } from './modals/status-modal';
import { StatusStepper } from './status-stepper';

type ModalName = 'status' | 'escalate' | 'assign' | null;

/** Middle column of the inbox: header with actions, status progress, thread and composer. */
export function ChatPane({
  enquiryId,
  onBack,
  onTogglePanel,
}: {
  enquiryId?: string;
  onBack?: () => void;
  onTogglePanel?: () => void;
}) {
  const { t } = useTranslation();
  const { can, me } = usePermissions();
  const enquiry = useEnquiry(enquiryId);
  const actions = useEnquiryActions(enquiryId ?? '');
  const [modal, setModal] = useState<ModalName>(null);

  if (!enquiryId) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-1 dark:bg-dark">
        <EmptyState title={t('inbox.selectPrompt')} message={t('inbox.selectHint')} />
      </View>
    );
  }
  if (enquiry.isPending) return <Spinner className="flex-1" />;
  if (enquiry.isError || !enquiry.data) {
    return (
      <View className="flex-1 p-6">
        <Alert tone="error" message={errorMessage(enquiry.error, t)} />
      </View>
    );
  }

  const e = enquiry.data;
  const isOwner = e.assignedStaffId === me?.id;
  const canTake = !e.assignedStaffId && can(Permission.INBOX_ASSIGN_SELF) && e.status !== 'CLOSED';
  const canChange = (isOwner && can(Permission.INBOX_STATUS_CHANGE)) || can(Permission.INBOX_STATUS_CHANGE_ANY) || can(Permission.INBOX_STATUS_REOPEN);
  const canEscalate = can(Permission.INBOX_STATUS_ESCALATE) && (isOwner || can(Permission.INBOX_STATUS_CHANGE_ANY)) && !['RESOLVED', 'CLOSED'].includes(e.status);
  const disabledReason = !can(Permission.INBOX_CHAT_REPLY)
    ? t('inbox.noReplyPermission')
    : e.status === 'CLOSED'
      ? t('inbox.closedNotice')
      : undefined;

  return (
    <View className="flex-1 bg-gray-1 dark:bg-dark">
      <View className="gap-3 border-b border-stroke bg-white px-5 py-3.5 dark:border-stroke-dark dark:bg-dark-2">
        <View className="flex-row flex-wrap items-start gap-2">
          {onBack && <IconButton icon="chevronLeft" label={t('common.back')} onPress={onBack} />}
          <View className="min-w-[200px] flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-sans text-xs text-body dark:text-body-dark">
              <Text className="font-latin">{e.reference}</Text> · {e.customer?.companyName} · {t(`enquiry.channel.${e.originChannel}`)}
            </Text>
            <Text accessibilityRole="header" numberOfLines={2} className="font-bold text-lg text-dark dark:text-white">
              {e.subject}
            </Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            {canTake && (
              <Button title={t('inbox.take')} size="sm" loading={actions.assign.isPending} onPress={() => me && actions.assign.mutate(me.id)} />
            )}
            {can(Permission.INBOX_ASSIGN_OTHERS) && e.status !== 'CLOSED' && (
              <Button title={e.assignedStaffId ? t('inbox.reassign') : t('inbox.assign')} size="sm" variant="outline" onPress={() => setModal('assign')} />
            )}
            {canEscalate && <Button title={t('inbox.escalate')} size="sm" variant="outline" onPress={() => setModal('escalate')} />}
            {canChange && <Button title={`${t('inbox.changeStatus')} ▾`} size="sm" onPress={() => setModal('status')} />}
            {onTogglePanel && <IconButton icon="panelRight" label={t('inbox.togglePanel')} onPress={onTogglePanel} />}
          </View>
        </View>
        <StatusStepper status={e.status} />
        {actions.assign.isError && <Alert tone="error" message={errorMessage(actions.assign.error, t)} />}
      </View>

      <MessageList chatId={e.id} mySide="STAFF" />
      <Composer chatId={e.id} staff disabledReason={disabledReason} />

      <StatusModal enquiry={e} visible={modal === 'status'} onClose={() => setModal(null)} />
      <EscalateModal enquiry={e} visible={modal === 'escalate'} onClose={() => setModal(null)} />
      <AssignModal enquiry={e} visible={modal === 'assign'} onClose={() => setModal(null)} />
    </View>
  );
}
