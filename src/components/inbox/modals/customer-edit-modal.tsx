import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Permission } from '../../../constants/permissions';
import { errorMessage } from '../../../helpers/error.helper';
import { useUpdateCustomer } from '../../../hooks/queries/use-catalog';
import { useStaffList } from '../../../hooks/queries/use-settings';
import { usePermissions } from '../../../hooks/use-permissions';
import { CustomerProfile, UpdateCustomerInput } from '../../../services/customer.service';
import { Alert, Button, Modal, Select, TextField } from '../../common';
import { whileOpen } from '../../common/while-open';

const NO_SALES = '__none__';

/** Edit a customer. Each group of fields shows only with its permission (contact / note / salesperson). */
export const CustomerEditModal = whileOpen(function CustomerEditModalContent({ customer, visible, onClose }: { customer: CustomerProfile; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const update = useUpdateCustomer(customer.id);
  const staff = useStaffList().data ?? [];
  const [form, setForm] = useState(() => ({
    companyName: customer.companyName,
    contactName: customer.contactName ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    internalNote: customer.internalNote ?? '',
    sales: customer.salespersonStaffId ?? NO_SALES,
  }));
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));


  const canContact = can(Permission.CUSTOMER_PANEL_CONTACT_EDIT);
  const canNote = can(Permission.CUSTOMER_PANEL_NOTE_EDIT);
  const canSales = can(Permission.CUSTOMER_PANEL_SALESPERSON_ASSIGN);

  const save = () => {
    const input: UpdateCustomerInput = { version: customer.version };
    if (canContact) Object.assign(input, { companyName: form.companyName, contactName: form.contactName, phone: form.phone, email: form.email });
    if (canNote) input.internalNote = form.internalNote;
    if (canSales) input.salespersonStaffId = form.sales === NO_SALES ? null : form.sales;
    update.mutate(input, { onSuccess: onClose });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('customers.editTitle')}
      description={`${customer.code} · ${customer.companyName}`}
      footer={
        <>
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button title={t('common.save')} loading={update.isPending} onPress={save} />
        </>
      }
    >
      {canContact && (
        <>
          <TextField label={t('customers.company')} value={form.companyName} onChangeText={set('companyName')} />
          <TextField label={t('customers.contact')} value={form.contactName} onChangeText={set('contactName')} />
          <TextField label={t('customers.phone')} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <TextField label={t('customers.email')} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        </>
      )}
      {canSales && (
        <Select
          label={t('customers.salesperson')}
          value={form.sales}
          onChange={set('sales')}
          options={[{ value: NO_SALES, label: t('customers.noSalesperson') }, ...staff.map((s) => ({ value: s.id, label: s.name }))]}
        />
      )}
      {canNote && (
        <TextField label={t('customers.note')} value={form.internalNote} onChangeText={set('internalNote')} multiline hint={t('customers.noteHint')} />
      )}
      {update.isError && <Alert tone="error" message={errorMessage(update.error, t)} />}
    </Modal>
  );
});
