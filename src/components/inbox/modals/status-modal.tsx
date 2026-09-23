import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Permission } from '../../../constants/permissions';
import { nextStatuses, statusTone } from '../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../helpers/error.helper';
import { useEnquiryActions } from '../../../hooks/queries/use-enquiries';
import { usePermissions } from '../../../hooks/use-permissions';
import { ChatStatus, Enquiry } from '../../../services/enquiry.service';
import { cn } from '../../../utils/cn';
import { Alert, Badge, Button, Modal } from '../../common';
import { whileOpen } from '../../common/while-open';

/**
 * Pick the next status. Only moves the policy allows are offered; the version guards against someone
 * else changing it at the same time (409 chat.statusChanged → message + refreshed data).
 */
export const StatusModal = whileOpen(function StatusModalContent({ enquiry, visible, onClose }: { enquiry: Enquiry; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { can, me } = usePermissions();
  const actions = useEnquiryActions(enquiry.id);
  const isOwner = enquiry.assignedStaffId === me?.id && can(Permission.INBOX_STATUS_CHANGE);
  // a reopened enquiry is OPEN but keeps its owner: "ASSIGNED" re-confirms the owner (done by assigning)
  const reconfirmOwner =
    enquiry.status === 'OPEN' &&
    Boolean(enquiry.assignedStaffId) &&
    (enquiry.assignedStaffId === me?.id ? can(Permission.INBOX_ASSIGN_SELF) : can(Permission.INBOX_ASSIGN_OTHERS));
  const options: ChatStatus[] = [
    ...(reconfirmOwner ? (['ASSIGNED'] as const) : []),
    ...nextStatuses(enquiry, {
      canChange: isOwner || can(Permission.INBOX_STATUS_CHANGE_ANY),
      canReopen: can(Permission.INBOX_STATUS_REOPEN),
    }),
  ];
  const [picked, setPicked] = useState<ChatStatus | null>(options[0] ?? null);
  const error = actions.changeStatus.error ?? actions.assign.error;


  const save = () => {
    if (!picked) return;
    if (picked === 'ASSIGNED' && enquiry.assignedStaffId) {
      actions.assign.mutate(enquiry.assignedStaffId, { onSuccess: onClose });
      return;
    }
    actions.changeStatus.mutate({ status: picked, version: enquiry.version }, { onSuccess: onClose });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('inbox.statusModal.title')}
      description={t('inbox.statusModal.current', { status: t(`enquiry.status.${enquiry.status}`) })}
      width="sm"
      footer={
        <>
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button
            title={t('inbox.statusModal.confirm')}
            disabled={!picked}
            loading={actions.changeStatus.isPending || actions.assign.isPending}
            onPress={save}
          />
        </>
      }
    >
      {!options.length ? (
        <Alert tone="info" message={enquiry.assignedStaffId ? t('inbox.statusModal.none') : t('inbox.statusModal.assignFirst')} />
      ) : (
        <View accessibilityRole="radiogroup" className="gap-2">
          {options.map((s) => {
            const on = s === picked;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPicked(s)}
                className={cn(
                  'min-h-10 flex-row items-center gap-3 rounded-lg border px-4',
                  on ? 'border-2 border-primary bg-primary-light dark:bg-dark-3' : 'border-stroke dark:border-stroke-dark',
                )}
              >
                <View className={cn('h-5 w-5 items-center justify-center rounded-full border-2', on ? 'border-primary' : 'border-stroke')}>
                  {on && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </View>
                <View className="flex-1 gap-0.5">
                  <Badge label={t(`enquiry.status.${s}`)} tone={statusTone[s]} />
                  <Text className="font-sans text-xs text-body dark:text-body-dark">{t(`inbox.statusHint.${s}`)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      {error && <Alert tone="error" message={errorMessage(error, t)} />}
    </Modal>
  );
});
