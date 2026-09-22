import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert, Button, Card, EmptyState, Icon, Modal, Spinner, TextField } from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { PERMISSION_GROUPS, PERMISSION_IMPLIES } from '../../../../constants/permission-groups';
import { Permission } from '../../../../constants/permissions';
import { errorMessage } from '../../../../helpers/error.helper';
import { hasPermission } from '../../../../helpers/permission.helper';
import { useRoles, useSettingsMutations } from '../../../../hooks/queries/use-settings';
import { usePermissions } from '../../../../hooks/use-permissions';
import colors from '../../../../theme/colors';
import { cn } from '../../../../utils/cn';

const bit = (p: Permission) => 1n << BigInt(p);
const TOTAL = PERMISSION_GROUPS.reduce((n, g) => n + g.items.length, 0);

/** Adds "view" when "edit" is ticked, like the API does on save. */
function withImplied(mask: bigint): bigint {
  let m = mask;
  for (const [p, implied] of Object.entries(PERMISSION_IMPLIES)) {
    if (hasPermission(m, Number(p) as Permission)) for (const i of implied ?? []) m |= bit(i);
  }
  return m;
}

/** Roles & permissions (design Roles.dc.html): pick a role, tick what it may do, save. */
export default function RolesScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const roles = useRoles();
  const { updateRole, createRole } = useSettingsMutations();
  const [roleId, setRoleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<bigint | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const list = roles.data ?? [];
  const role = list.find((r) => r.id === roleId) ?? list[0];
  const saved = role ? BigInt(role.permissions) : 0n;
  const mask = draft ?? saved;
  const dirty = draft !== null && draft !== saved;
  const count = (m: bigint) => PERMISSION_GROUPS.reduce((n, g) => n + g.items.filter((p) => hasPermission(m, p)).length, 0);

  const pickRole = (id: string) => {
    setRoleId(id);
    setDraft(null);
  };

  const columns = useMemo(() => [0, 1, 2].map((col) => PERMISSION_GROUPS.filter((g) => g.column === col)), []);

  if (!can(Permission.SETTINGS_ROLE_MANAGE)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const toggle = (p: Permission) => setDraft(withImplied(hasPermission(mask, p) ? mask & ~bit(p) : mask | bit(p)));

  return (
    <View className="flex-1 gap-4 p-6">
      <PageHeader
        title={t('roles.title')}
        subtitle={t('roles.subtitle')}
        actions={
          <>
            <Button title={`+ ${t('roles.create')}`} variant="outline" onPress={() => setNewOpen(true)} />
            <Button
              title={t('roles.save')}
              disabled={!dirty || !role}
              loading={updateRole.isPending}
              onPress={() => role && updateRole.mutate({ id: role.id, input: { permissions: mask.toString() } }, { onSuccess: () => setDraft(null) })}
            />
          </>
        }
      />
      {updateRole.isError && <Alert tone="error" message={errorMessage(updateRole.error, t)} />}
      {roles.isPending ? (
        <Spinner />
      ) : (
        <View className="flex-1 flex-row gap-4">
          <View className="w-[240px] gap-2">
            {list.map((r) => {
              const on = r.id === role?.id;
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => pickRole(r.id)}
                  className={cn('gap-0.5 rounded-xl px-3.5 py-3', on ? 'border-2 border-primary bg-primary-light dark:bg-dark-3' : 'border border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2')}
                >
                  <Text className="font-bold text-[15px] text-dark dark:text-white">{r.name}</Text>
                  <Text className="font-sans text-xs text-body">
                    {t('roles.meta', { people: r.staffCount, count: count(BigInt(r.permissions)), total: TOTAL })}
                  </Text>
                  {r.isSystem && <Text className="font-sans text-xs text-body">{t(`roles.desc.${r.code}`, { defaultValue: '' })}</Text>}
                </Pressable>
              );
            })}
            <View className="mt-auto rounded-lg bg-cyan-light p-3">
              <Text className="font-sans text-xs leading-5 text-cyan">{t('roles.note')}</Text>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="flex-row flex-wrap items-start gap-3">
            {columns.map((groups, i) => (
              <View key={i} className="min-w-[260px] flex-1 gap-3">
                {groups.map((g) => (
                  <Card key={g.id} className="px-3.5 py-3">
                    <View className="flex-row justify-between pb-1.5">
                      <Text className="font-bold text-sm text-dark dark:text-white">{t(`permissions.group.${g.id}`)}</Text>
                      <Text className="font-sans text-xs text-body">
                        {g.items.filter((p) => hasPermission(mask, p)).length}/{g.items.length}
                      </Text>
                    </View>
                    {g.items.map((p) => {
                      const on = hasPermission(mask, p);
                      return (
                        <Pressable
                          key={p}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          onPress={() => toggle(p)}
                          className="min-h-8 flex-row items-center gap-2"
                        >
                          <View className={cn('h-4 w-4 items-center justify-center rounded border', on ? 'border-primary bg-primary' : 'border-gray-5 bg-white dark:bg-dark-2')}>
                            {on && <Icon name="check" size={10} color={colors.white} strokeWidth={3.5} />}
                          </View>
                          <Text className={cn('flex-1 font-sans text-[13px]', on ? 'text-dark dark:text-white' : 'text-dark-5')}>
                            {t(`permissions.${Permission[p]}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Card>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      <Modal
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        title={t('roles.create')}
        width="sm"
        footer={
          <>
            <Button title={t('common.cancel')} variant="outline" onPress={() => setNewOpen(false)} />
            <Button
              title={t('common.create')}
              disabled={!newName.trim()}
              loading={createRole.isPending}
              onPress={() =>
                createRole.mutate(
                  { name: newName.trim(), permissions: role ? role.permissions : '0' },
                  {
                    onSuccess: (r) => {
                      setNewOpen(false);
                      setNewName('');
                      pickRole(r.id);
                    },
                  },
                )
              }
            />
          </>
        }
      >
        <TextField label={t('roles.name')} value={newName} onChangeText={setNewName} hint={t('roles.copyHint', { role: role?.name ?? '' })} />
        {createRole.isError && <Alert tone="error" message={errorMessage(createRole.error, t)} />}
      </Modal>
    </View>
  );
}
