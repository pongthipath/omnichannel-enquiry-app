import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { errorMessage } from '../../../helpers/error.helper';
import { useEnquiryActions } from '../../../hooks/queries/use-enquiries';
import { useStaffList } from '../../../hooks/queries/use-settings';
import { Enquiry } from '../../../services/enquiry.service';
import colors from '../../../theme/colors';
import { cn } from '../../../utils/cn';
import { Alert, Avatar, Icon, Modal, Spinner } from '../../common';

/** Choose the owner. The enquiry's own department is listed first. */
export function AssignModal({ enquiry, visible, onClose }: { enquiry: Enquiry; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const staff = useStaffList();
  const actions = useEnquiryActions(enquiry.id);
  const list = [...(staff.data ?? [])].sort(
    (a, b) => Number(b.departmentId === enquiry.departmentId) - Number(a.departmentId === enquiry.departmentId),
  );

  return (
    <Modal visible={visible} onClose={onClose} title={t('inbox.assignModal.title')} description={enquiry.departmentName ?? undefined} width="sm">
      {staff.isPending ? (
        <Spinner />
      ) : (
        <View className="gap-1">
          {list.map((s) => {
            const current = s.id === enquiry.assignedStaffId;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                disabled={actions.assign.isPending}
                onPress={() => actions.assign.mutate(s.id, { onSuccess: onClose })}
                className={cn('min-h-10 flex-row items-center gap-3 rounded-md px-3', current ? 'bg-primary-light dark:bg-dark-3' : 'active:bg-gray-2 dark:active:bg-dark-3')}
              >
                <Avatar name={s.name} size={32} />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-dark dark:text-white">{s.name}</Text>
                  {s.departmentId === enquiry.departmentId && (
                    <Text className="font-sans text-xs text-body dark:text-body-dark">{t('inbox.assignModal.sameDepartment')}</Text>
                  )}
                </View>
                {current && <Icon name="check" size={16} color={colors.primary.DEFAULT} />}
              </Pressable>
            );
          })}
        </View>
      )}
      {actions.assign.isError && <Alert tone="error" message={errorMessage(actions.assign.error, t)} />}
    </Modal>
  );
}
