import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert, Avatar, Badge, Button, Card, ConfirmModal, EmptyState, Select, Spinner, TextField } from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { Permission } from '../../../../constants/permissions';
import { errorMessage } from '../../../../helpers/error.helper';
import { formatDateTime } from '../../../../helpers/format.helper';
import { useDashboard } from '../../../../hooks/queries/use-catalog';
import { useDepartments, useRoles, useSettingsMutations, useStaffSettings } from '../../../../hooks/queries/use-settings';
import { usePermissions } from '../../../../hooks/use-permissions';
import { StaffDetail } from '../../../../services/settings.service';
import { cn } from '../../../../utils/cn';
import { WideTable } from '../../../../components/layout/wide-table';

/** Staff (design Staff.dc.html): table with department, role, workload; edit panel; add account. */
export default function StaffScreen() {
  const { t, i18n } = useTranslation();
  const { can, me } = usePermissions();
  const staff = useStaffSettings();
  const departments = useDepartments().data ?? [];
  const roles = useRoles().data ?? [];
  const team = useDashboard(undefined).data?.team ?? [];
  const { createStaff, updateStaff } = useSettingsMutations();
  const [editing, setEditingState] = useState<StaffDetail | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentId: '', roleId: '' });
  const [confirmDisable, setConfirmDisable] = useState(false);
  const loadOf = (id: string) => team.find((m) => m.staffId === id)?.active ?? 0;
  const error = createStaff.error ?? updateStaff.error;

  /** Opening the panel fills the form from the row (or blank for "new") and clears old errors. */
  const setEditing = (editing: StaffDetail | 'new' | null) => {
    setEditingState(editing);
    if (editing && editing !== 'new') setForm({ name: editing.name, email: editing.email, password: '', departmentId: editing.departmentId, roleId: editing.roleId });
    else setForm({ name: '', email: '', password: '', departmentId: departments[0]?.id ?? '', roleId: roles.find((r) => r.code === 'AGENT')?.id ?? '' });
    createStaff.reset();
    updateStaff.reset();
  };

  if (!can(Permission.SETTINGS_STAFF_MANAGE)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const save = () => {
    if (editing === 'new') {
      createStaff.mutate({ ...form, email: form.email.trim(), name: form.name.trim() }, { onSuccess: () => setEditing(null) });
    } else if (editing) {
      updateStaff.mutate({ id: editing.id, input: { name: form.name.trim(), departmentId: form.departmentId, roleId: form.roleId } }, { onSuccess: () => setEditing(null) });
    }
  };
  const setActive = (active: boolean) =>
    editing && editing !== 'new' && updateStaff.mutate({ id: editing.id, input: { isActive: active } }, { onSuccess: () => { setConfirmDisable(false); setEditing(null); } });
  const valid = form.name.trim() && form.departmentId && form.roleId && (editing !== 'new' || (/\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8));

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader
        title={t('staff.title')}
        subtitle={t('staff.subtitle', { count: staff.data?.length ?? 0 })}
        actions={<Button title={`+ ${t('staff.create')}`} onPress={() => setEditing('new')} />}
      />
      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <WideTable width={820}>
            <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
              <Text className="flex-[3] font-semibold text-xs text-body">{t('staff.cols.person')}</Text>
              <Text className="flex-[2] font-semibold text-xs text-body">{t('staff.cols.department')}</Text>
              <Text className="flex-[1.5] font-semibold text-xs text-body">{t('staff.cols.role')}</Text>
              <Text className="flex-1 text-right font-semibold text-xs text-body">{t('staff.cols.load')}</Text>
              <Text className="flex-[1.2] pl-4 font-semibold text-xs text-body">{t('staff.cols.status')}</Text>
            </View>
            {staff.isPending ? (
              <Spinner />
            ) : (
              <ScrollView>
                {(staff.data ?? []).map((s) => {
                  const on = editing !== 'new' && editing?.id === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      accessibilityLabel={s.name}
                      onPress={() => setEditing(s)}
                      className={cn('flex-row items-center border-t border-gray-2 px-3 py-2.5 dark:border-dark-3', on ? 'bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1', !s.isActive && 'opacity-60')}
                    >
                      <View className="flex-[3] flex-row items-center gap-2.5">
                        <Avatar name={s.name} size={34} />
                        <View className="flex-1">
                          <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{s.name}</Text>
                          <Text numberOfLines={1} className="font-sans text-xs text-body">{s.email}</Text>
                        </View>
                      </View>
                      <Text numberOfLines={1} className="flex-[2] font-sans text-sm text-dark dark:text-white">{s.departmentName}</Text>
                      <View className="flex-[1.5]">
                        <Badge label={s.roleName} tone="primary" />
                      </View>
                      <Text className="flex-1 text-right font-bold text-sm text-dark dark:text-white">{loadOf(s.id)}</Text>
                      <View className="flex-[1.2] flex-row items-center gap-1.5 pl-4">
                        <View className={cn('h-2 w-2 rounded-full', s.isActive ? 'bg-green' : 'bg-dark-5')} />
                        <Text className={cn('font-sans text-sm', s.isActive ? 'text-green' : 'text-dark-5')}>{s.isActive ? t('staff.active') : t('staff.inactive')}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </WideTable>
        </Card>

        {editing && (
          <Card className="w-[300px] gap-3.5 p-5">
            {editing !== 'new' ? (
              <View className="flex-row items-center gap-3">
                <Avatar name={editing.name} size={48} />
                <View className="flex-1">
                  <Text className="font-bold text-base text-dark dark:text-white">{editing.name}</Text>
                  <Text className="font-sans text-sm text-body">{editing.email}</Text>
                </View>
              </View>
            ) : (
              <Text className="font-bold text-base text-dark dark:text-white">{t('staff.create')}</Text>
            )}
            <TextField label={t('staff.name')} value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
            {editing === 'new' && (
              <>
                <TextField label={t('customers.email')} value={form.email} onChangeText={(email) => setForm((f) => ({ ...f, email }))} autoCapitalize="none" keyboardType="email-address" />
                <TextField label={t('staff.password')} value={form.password} onChangeText={(password) => setForm((f) => ({ ...f, password }))} secureTextEntry hint={t('staff.passwordHint')} />
              </>
            )}
            <Select label={t('staff.cols.department')} value={form.departmentId} onChange={(departmentId) => setForm((f) => ({ ...f, departmentId }))} options={departments.map((d) => ({ value: d.id, label: d.nameTh }))} />
            <Select label={t('staff.cols.role')} value={form.roleId} onChange={(roleId) => setForm((f) => ({ ...f, roleId }))} options={roles.map((r) => ({ value: r.id, label: r.name }))} />
            {editing !== 'new' && (
              <View className="gap-1.5 rounded-lg bg-gray-1 p-3 dark:bg-dark">
                <Text className="font-sans text-sm text-body">{t('staff.lastLogin')}: {editing.lastLoginAt ? formatDateTime(editing.lastLoginAt, i18n.language) : '—'}</Text>
                <Text className="font-sans text-sm text-body">{t('staff.cols.load')}: {loadOf(editing.id)}</Text>
              </View>
            )}
            {error && <Alert tone="error" message={errorMessage(error, t)} />}
            <View className="mt-auto gap-2">
              {editing !== 'new' && editing.id !== me?.id && (
                editing.isActive ? (
                  <Button title={t('staff.disable')} variant="outline" onPress={() => setConfirmDisable(true)} />
                ) : (
                  <Button title={t('staff.enable')} variant="outline" loading={updateStaff.isPending} onPress={() => setActive(true)} />
                )
              )}
              <View className="flex-row justify-end gap-2">
                <Button title={t('common.cancel')} variant="outline" onPress={() => setEditing(null)} />
                <Button title={t('common.save')} disabled={!valid} loading={createStaff.isPending || updateStaff.isPending} onPress={save} />
              </View>
            </View>
          </Card>
        )}
      </View>
      <ConfirmModal
        visible={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title={t('staff.disableTitle')}
        message={editing && editing !== 'new' ? t('staff.disableMessage', { name: editing.name }) : ''}
        confirmLabel={t('staff.disable')}
        danger
        loading={updateStaff.isPending}
        onConfirm={() => setActive(false)}
      />
    </View>
  );
}
