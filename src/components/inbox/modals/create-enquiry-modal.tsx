import { useTranslation } from 'react-i18next';
import { Enquiry, EnquiryType } from '../../../services/enquiry.service';
import { Button, Modal } from '../../common';
import { whileOpen } from '../../common/while-open';
import { EnquiryDraftFields, EnquiryDraftProductPicker, useEnquiryDraft } from '../enquiry-draft';

/**
 * New enquiry, as a dialog (browser console). Staff (INBOX_ENQUIRY_CREATE) pick the customer and
 * channel (e.g. a phone call); customers create for themselves. The phone app pushes the same form
 * as a page instead — see enquiry-draft.
 */
export const CreateEnquiryModal = whileOpen(function CreateEnquiryModalContent({
  visible,
  onClose,
  asStaff,
  onCreated,
  initialType,
}: {
  visible: boolean;
  onClose: () => void;
  asStaff: boolean;
  onCreated?: (enquiry: Enquiry) => void;
  initialType?: EnquiryType;
}) {
  const { t } = useTranslation();
  const draft = useEnquiryDraft({ asStaff, initialType, onCreated, onDone: onClose });

  return (
    <>
      <Modal
        visible={visible && !draft.pickProduct}
        onClose={onClose}
        title={asStaff ? t('inbox.createModal.titleStaff') : t('inbox.createModal.title')}
        description={asStaff ? t('inbox.createModal.descriptionStaff') : t('inbox.createModal.description')}
        width="md"
        footer={
          <>
            <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
            <Button title={t('inbox.createModal.submit')} disabled={!draft.valid} loading={draft.create.isPending} onPress={draft.submit} />
          </>
        }
      >
        <EnquiryDraftFields draft={draft} />
      </Modal>
      <EnquiryDraftProductPicker draft={draft} visible={visible && draft.pickProduct} />
    </>
  );
});
