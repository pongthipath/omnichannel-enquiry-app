import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert, Badge, Button, Card, Checkbox, EmptyState, Spinner, TextField } from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { Permission } from '../../../../constants/permissions';
import { errorMessage } from '../../../../helpers/error.helper';
import { useDashboard } from '../../../../hooks/queries/use-catalog';
import { useDepartmentsSettings, useSettingsMutations, useStaffSettings } from '../../../../hooks/queries/use-settings';
import { usePermissions } from '../../../../hooks/use-permissions';
import { Department } from '../../../../services/settings.service';
import { cn } from '../../../../utils/cn';

/** Departments (design Departments.dc.html): cards with staff / open counts + edit panel. */
export default function DepartmentsScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const departments = useDepartmentsSettings();
  const staff = useStaffSettings();
  const dashboard = useDashboard(undefined);
  const { createDepartment, updateDepartment } = useSettingsMutations();
  const [editing, setEditingState] = useState<Department | 'new' | null>(null);
  const [form, setForm] = useState({ code: '', nameTh: '', nameEn: '', isDefault: false, isActive: true });
  const openOf = (id: string) => dashboard.data?.byDepartment.find((d) => d.departmentId === id)?.count ?? 0;
  const error = createDepartment.error ?? updateDepartment.error;

  /** Opening the panel fills the form from the row (or blank for "new") and clears old errors. */
  const setEditing = (editing: Department | 'new' | null) => {
    setEditingState(editing);
    if (editing && editing !== 'new') setForm({ code: editing.code, nameTh: editing.nameTh, nameEn: editing.nameEn, isDefault: editing.isDefault, isActive: editing.isActive });
    else setForm({ code: '', nameTh: '', nameEn: '', isDefault: false, isActive: true });
    createDepartment.reset();
    updateDepartment.reset();
  };

  if (!can(Permission.SETTINGS_DEPARTMENT_MANAGE)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const save = () => {
    const input = { nameTh: form.nameTh.trim(), nameEn: form.nameEn.trim(), isDefault: form.isDefault, isActive: form.isActive };
    if (editing === 'new') createDepartment.mutate({ ...input, code: form.code.trim().toUpperCase() }, { onSuccess: () => setEditing(null) });
    else if (editing) updateDepartment.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  };
  const members = editing && editing !== 'new' ? (staff.data ?? []).filter((s) => s.departmentId === editing.id && s.isActive) : [];

  return (
    <View className="flex-1 gap-4 p-6">
      <PageHeader title={t('departments.title')} subtitle={t('departments.subtitle')} actions={<Button title={`+ ${t('departments.create')}`} onPress={() => setEditing('new')} />} />
      <View className="flex-1 flex-row gap-4">
        {departments.isPending ? (
          <Spinner className="flex-1" />
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="flex-row flex-wrap gap-3">
            {(departments.data ?? []).map((d) => {
              const on = editing !== 'new' && editing?.id === d.id;
              return (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={d.nameTh}
                  onPress={() => setEditing(d)}
                  className={cn(
                    'min-w-[280px] flex-1 basis-[45%] gap-3.5 rounded-xl bg-white p-4 dark:bg-dark-2',
                    on || d.isDefault ? 'border-2 border-primary' : 'border border-stroke dark:border-stroke-dark',
                    !d.isActive && 'opacity-60',
                  )}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                      <Text className="font-latin text-xs font-bold text-primary-dark">{d.code.slice(0, 2)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-[15px] text-dark dark:text-white">{d.nameTh}</Text>
                      <Text className="font-sans text-xs text-body">{d.nameEn} · {d.code}</Text>
                    </View>
                    {d.isDefault && <Badge label={t('departments.default')} tone="green" />}
                    {!d.isActive && <Badge label={t('departments.inactive')} tone="gray" />}
                  </View>
                  <View className="flex-row">
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-body">{t('departments.staff')}</Text>
                      <Text className="font-bold text-lg text-dark dark:text-white">{d.staffCount ?? 0}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-body">{t('departments.open')}</Text>
                      <Text className="font-bold text-lg text-dark dark:text-white">{openOf(d.id)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {editing && (
          <Card className="w-[340px] gap-3.5 p-5">
            <Text className="font-bold text-base text-dark dark:text-white">{editing === 'new' ? t('departments.create') : editing.nameTh}</Text>
            <TextField label={t('departments.nameTh')} value={form.nameTh} onChangeText={(nameTh) => setForm((f) => ({ ...f, nameTh }))} />
            <TextField label={t('departments.nameEn')} value={form.nameEn} onChangeText={(nameEn) => setForm((f) => ({ ...f, nameEn }))} />
            <TextField
              label={t('departments.code')}
              value={form.code}
              editable={editing === 'new'}
              autoCapitalize="characters"
              onChangeText={(code) => setForm((f) => ({ ...f, code }))}
              hint={editing === 'new' ? t('departments.codeHint') : t('departments.codeLocked')}
            />
            <Checkbox checked={form.isDefault} onChange={(isDefault) => setForm((f) => ({ ...f, isDefault }))} label={t('departments.makeDefault')} />
            {editing !== 'new' && !editing.isDefault && (
              <Checkbox checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} label={t('departments.active')} />
            )}
            {members.length > 0 && (
              <View className="gap-1.5">
                <Text className="font-semibold text-sm text-dark dark:text-white">{t('departments.members', { count: members.length })}</Text>
                {members.map((m) => (
                  <View key={m.id} className="flex-row justify-between">
                    <Text className="font-sans text-[13px] text-dark dark:text-white">{m.name}</Text>
                    <Text className="font-sans text-[13px] text-body">{m.roleName}</Text>
                  </View>
                ))}
              </View>
            )}
            {error && <Alert tone="error" message={errorMessage(error, t)} />}
            <View className="mt-auto flex-row justify-end gap-2">
              <Button title={t('common.cancel')} variant="outline" onPress={() => setEditing(null)} />
              <Button
                title={t('common.save')}
                disabled={!form.nameTh.trim() || !form.nameEn.trim() || (editing === 'new' && !/^[A-Za-z0-9_]{2,40}$/.test(form.code.trim()))}
                loading={createDepartment.isPending || updateDepartment.isPending}
                onPress={save}
              />
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}
