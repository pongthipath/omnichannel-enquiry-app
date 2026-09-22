import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../../helpers/error.helper';
import { useEnquiryActions } from '../../../hooks/queries/use-enquiries';
import { useDepartments } from '../../../hooks/queries/use-settings';
import { Enquiry } from '../../../services/enquiry.service';
import { Alert, Button, Modal, Select, TextField } from '../../common';
import { whileOpen } from '../../common/while-open';

/** Send to another department: back to OPEN in that queue, owner cleared, reason kept as an internal event. */
export const EscalateModal = whileOpen(function EscalateModalContent({ enquiry, visible, onClose }: { enquiry: Enquiry; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const departments = useDepartments().data ?? [];
  const actions = useEnquiryActions(enquiry.id);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [reason, setReason] = useState('');


  const valid = Boolean(departmentId) && reason.trim().length > 0;
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('inbox.escalateModal.title')}
      description={t('inbox.escalateModal.description')}
      footer={
        <>
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button
            title={t('inbox.escalateModal.confirm')}
            disabled={!valid}
            loading={actions.escalate.isPending}
            onPress={() =>
              departmentId &&
              actions.escalate.mutate({ departmentId, reason: reason.trim() }, { onSuccess: onClose })
            }
          />
        </>
      }
    >
      <Select
        label={t('inbox.escalateModal.department')}
        value={departmentId}
        onChange={setDepartmentId}
        options={departments
          .filter((d) => d.id !== enquiry.departmentId)
          .map((d) => ({ value: d.id, label: d.nameTh, hint: d.nameEn }))}
      />
      <TextField
        label={t('inbox.escalateModal.reason')}
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder={t('inbox.escalateModal.reasonPlaceholder')}
        hint={t('inbox.escalateModal.reasonHint')}
      />
      {actions.escalate.isError && <Alert tone="error" message={errorMessage(actions.escalate.error, t)} />}
    </Modal>
  );
});
