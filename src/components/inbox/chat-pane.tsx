import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { statusTone } from '../../helpers/enquiry-status.helper';
import { errorMessage } from '../../helpers/error.helper';
import { useEnquiry, useEnquiryActions } from '../../hooks/queries/use-enquiries';
import { usePermissions } from '../../hooks/use-permissions';
import colors from '../../theme/colors';
import { Alert, Badge, Button, EmptyState, Icon, IconButton, IconName, Spinner } from '../common';
import { Composer } from './composer';
import { MessageList } from './message-list';
import { AssignModal } from './modals/assign-modal';
import { EscalateModal } from './modals/escalate-modal';
import { StatusModal } from './modals/status-modal';
import { StatusStepper } from './status-stepper';

type ModalName = 'status' | 'escalate' | 'assign' | 'actions' | null;

/**
 * Middle column of the inbox: header, status progress, thread and reply box.
 * The header folds away (chevron) to give the chat more room; on phones (`compact`) the actions
 * live in a ⋯ menu and the header starts folded. Internal notes are in the right panel, not here.
 */
export function ChatPane({
  enquiryId,
  compact,
  onBack,
  onTogglePanel,
}: {
  enquiryId?: string;
  compact?: boolean;
  onBack?: () => void;
  onTogglePanel?: () => void;
}) {
  const { t } = useTranslation();
  const { can, me } = usePermissions();
  const enquiry = useEnquiry(enquiryId);
  const actions = useEnquiryActions(enquiryId ?? '');
  const [modal, setModal] = useState<ModalName>(null);
  const [headerOpen, setHeaderOpen] = useState<boolean | null>(null);
  const expanded = headerOpen ?? !compact;

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
  const canAssign = can(Permission.INBOX_ASSIGN_OTHERS) && e.status !== 'CLOSED';
  const canChange =
    (isOwner && can(Permission.INBOX_STATUS_CHANGE)) || can(Permission.INBOX_STATUS_CHANGE_ANY) || can(Permission.INBOX_STATUS_REOPEN);
  const canEscalate =
    can(Permission.INBOX_STATUS_ESCALATE) && (isOwner || can(Permission.INBOX_STATUS_CHANGE_ANY)) && !['RESOLVED', 'CLOSED'].includes(e.status);
  const disabledReason = !can(Permission.INBOX_CHAT_REPLY)
    ? t('inbox.noReplyPermission')
    : e.status === 'CLOSED'
      ? t('inbox.closedNotice')
      : undefined;
  const take = () => me && actions.assign.mutate(me.id);

  const menu: { icon: IconName; label: string; onPress: () => void }[] = [
    ...(canTake ? [{ icon: 'check' as const, label: t('inbox.take'), onPress: take }] : []),
    ...(canAssign ? [{ icon: 'userPlus' as const, label: e.assignedStaffId ? t('inbox.reassign') : t('inbox.assign'), onPress: () => setModal('assign') }] : []),
    ...(canChange ? [{ icon: 'arrowRight' as const, label: t('inbox.changeStatus'), onPress: () => setModal('status') }] : []),
    ...(canEscalate ? [{ icon: 'building' as const, label: t('inbox.escalate'), onPress: () => setModal('escalate') }] : []),
    ...(onTogglePanel ? [{ icon: 'panelRight' as const, label: t('inbox.togglePanel'), onPress: onTogglePanel }] : []),
  ];

  return (
    <View className="flex-1 bg-gray-1 dark:bg-dark">
      <View className="gap-2 border-b border-stroke bg-white px-3 py-2 dark:border-stroke-dark dark:bg-dark-2">
        <View className="flex-row items-center gap-1.5">
          {onBack && <IconButton icon="chevronLeft" label={t('common.back')} onPress={onBack} />}
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-sans text-xs text-body dark:text-body-dark">
              <Text className="font-latin">{e.reference}</Text> · {e.customer?.companyName}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text accessibilityRole="header" numberOfLines={1} className="flex-shrink font-bold text-base text-dark dark:text-white">
                {e.subject}
              </Text>
              {!expanded && <Badge label={t(`enquiry.status.${e.status}`)} tone={statusTone[e.status]} />}
            </View>
          </View>
          {!compact && canTake && <Button title={t('inbox.take')} size="sm" loading={actions.assign.isPending} onPress={take} />}
          {!compact && canChange && <Button title={t('inbox.changeStatus')} size="sm" onPress={() => setModal('status')} />}
          {menu.length > 0 && <IconButton icon="more" label={t('inbox.moreActions')} onPress={() => setModal('actions')} />}
          <IconButton
            icon={expanded ? 'chevronUp' : 'chevronDown'}
            label={expanded ? t('inbox.hideHeader') : t('inbox.showHeader')}
            onPress={() => setHeaderOpen(!expanded)}
          />
        </View>
        {expanded && <StatusStepper status={e.status} compact={compact} />}
        {actions.assign.isError && <Alert tone="error" message={errorMessage(actions.assign.error, t)} />}
      </View>

      <MessageList chatId={e.id} mySide="STAFF" hideInternal />
      <Composer chatId={e.id} staff disabledReason={disabledReason} startCollapsed={compact} />

      {/* ⋯ action sheet */}
      <RNModal visible={modal === 'actions'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <Pressable onPress={() => setModal(null)} className="flex-1 items-center justify-end bg-black/40 p-3 md:justify-center">
          <View className="w-full max-w-[360px] overflow-hidden rounded-xl bg-white dark:bg-dark-2">
            {menu.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => {
                  setModal(null);
                  item.onPress();
                }}
                className="min-h-11 flex-row items-center gap-3 border-b border-gray-2 px-4 active:bg-gray-1 dark:border-dark-3"
              >
                <Icon name={item.icon} size={16} color={colors.body.DEFAULT} />
                <Text className="font-sans text-base text-dark dark:text-white">{item.label}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setModal(null)} className="min-h-11 items-center justify-center">
              <Text className="font-semibold text-base text-body">{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </RNModal>

      <StatusModal enquiry={e} visible={modal === 'status'} onClose={() => setModal(null)} />
      <EscalateModal enquiry={e} visible={modal === 'escalate'} onClose={() => setModal(null)} />
      <AssignModal enquiry={e} visible={modal === 'assign'} onClose={() => setModal(null)} />
    </View>
  );
}
