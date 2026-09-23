import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Spinner,
  TextField,
} from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { Permission } from '../../../../constants/permissions';
import { errorMessage } from '../../../../helpers/error.helper';
import { formatDuration } from '../../../../helpers/format.helper';
import { useSlaMutations, useSlaPolicies } from '../../../../hooks/queries/use-sla';
import { usePermissions } from '../../../../hooks/use-permissions';
import { ENQUIRY_TYPES, PRIORITIES } from '../../../../services/enquiry.service';
import { SlaPolicy } from '../../../../services/sla.service';
import colors from '../../../../theme/colors';
import { cn } from '../../../../utils/cn';
import { WideTable } from '../../../../components/layout/wide-table';

const ANY = 'ANY';

interface Form {
  enquiryType: string;
  priority: string;
  targetMinutes: string;
  isPauseWhenWaiting: boolean;
}
const EMPTY: Form = { enquiryType: ANY, priority: ANY, targetMinutes: '240', isPauseWhenWaiting: true };

/**
 * First-reply targets (design A6). The most specific rule wins: type + priority beats type alone,
 * which beats the catch-all — the same order the API resolves them in.
 */
export default function SlaScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canEdit = can(Permission.SETTINGS_SLA_EDIT);
  const policies = useSlaPolicies(can(Permission.SETTINGS_SLA_VIEW));
  const { create, update } = useSlaMutations();
  const [creating, setCreatingState] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const error = create.error ?? update.error;

  const setCreating = (open: boolean) => {
    setCreatingState(open);
    setForm(EMPTY);
    create.reset();
    update.reset();
  };

  if (!can(Permission.SETTINGS_SLA_VIEW)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const save = () => {
    const minutes = Number(form.targetMinutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 20160) return;
    create.mutate(
      {
        enquiryType: form.enquiryType === ANY ? null : (form.enquiryType as SlaPolicy['enquiryType']),
        priority: form.priority === ANY ? null : (form.priority as SlaPolicy['priority']),
        targetMinutes: minutes,
        isPauseWhenWaiting: form.isPauseWhenWaiting,
      },
      { onSuccess: () => setCreating(false) },
    );
  };

  /** Specific rules first, so the list reads in the order the API applies them. */
  const sorted = [...(policies.data ?? [])].sort(
    (a, b) =>
      (b.enquiryType ? 2 : 0) + (b.priority ? 1 : 0) - ((a.enquiryType ? 2 : 0) + (a.priority ? 1 : 0)),
  );

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader
        title={t('sla.title')}
        subtitle={t('sla.subtitle')}
        actions={canEdit ? <Button title={`+ ${t('sla.create')}`} onPress={() => setCreating(true)} /> : undefined}
      />
      {Boolean(error) && <Alert tone="error" message={errorMessage(error, t)} />}

      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <WideTable width={720}>
            <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
              <Text className="flex-[2] font-semibold text-xs text-body">{t('sla.cols.scope')}</Text>
              <Text className="flex-1 font-semibold text-xs text-body">{t('sla.cols.target')}</Text>
              <Text className="flex-1 font-semibold text-xs text-body">{t('sla.cols.pause')}</Text>
              <Text className="w-24 text-right font-semibold text-xs text-body">{t('sla.cols.active')}</Text>
            </View>
            {policies.isPending ? (
              <Spinner />
            ) : sorted.length === 0 ? (
              <EmptyState icon="clock" title={t('sla.empty')} />
            ) : (
              <ScrollView>
                {sorted.map((p) => (
                  <SlaRow key={p.id} policy={p} canEdit={canEdit} onChange={(input) => update.mutate({ id: p.id, input })} />
                ))}
              </ScrollView>
            )}
          </WideTable>
        </Card>

        {creating && (
          <Card className="w-[320px] gap-3 p-4">
            <Text className="font-semibold text-base text-dark dark:text-white">{t('sla.create')}</Text>
            <Select
              label={t('sla.enquiryType')}
              value={form.enquiryType}
              onChange={(v) => setForm((f) => ({ ...f, enquiryType: v }))}
              options={[
                { value: ANY, label: t('sla.anyType') },
                ...ENQUIRY_TYPES.map((v) => ({ value: v, label: t(`enquiry.type.${v}`) })),
              ]}
            />
            <Select
              label={t('sla.priority')}
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              options={[
                { value: ANY, label: t('sla.anyPriority') },
                ...PRIORITIES.map((v) => ({ value: v, label: t(`enquiry.priority.${v}`) })),
              ]}
            />
            <TextField
              label={t('sla.targetMinutes')}
              hint={t('sla.targetHint')}
              value={form.targetMinutes}
              onChangeText={(v) => setForm((f) => ({ ...f, targetMinutes: v.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
            />
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-sans text-sm text-dark dark:text-white">{t('sla.pauseWhenWaiting')}</Text>
              <Switch
                value={form.isPauseWhenWaiting}
                onValueChange={(v) => setForm((f) => ({ ...f, isPauseWhenWaiting: v }))}
                trackColor={{ true: colors.primary.DEFAULT }}
                accessibilityLabel={t('sla.pauseWhenWaiting')}
              />
            </View>
            <View className="flex-row gap-2">
              <Button title={t('common.save')} onPress={save} loading={create.isPending} />
              <Button title={t('common.cancel')} variant="outline" onPress={() => setCreating(false)} />
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}

/** One rule. Editing is inline: the target in minutes, the pause switch and on/off. */
function SlaRow({
  policy,
  canEdit,
  onChange,
}: {
  policy: SlaPolicy;
  canEdit: boolean;
  onChange: (input: { targetMinutes?: number; isPauseWhenWaiting?: boolean; isActive?: boolean }) => void;
}) {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState(String(policy.targetMinutes));

  const commit = () => {
    const value = Number(minutes);
    if (Number.isInteger(value) && value >= 5 && value <= 20160 && value !== policy.targetMinutes) {
      onChange({ targetMinutes: value });
    } else {
      setMinutes(String(policy.targetMinutes));
    }
  };

  return (
    <View className={cn('flex-row items-center border-t border-stroke px-4 py-2.5 dark:border-stroke-dark', !policy.isActive && 'opacity-50')}>
      <View className="flex-[2] flex-row flex-wrap items-center gap-1.5">
        <Badge tone={policy.enquiryType ? 'primary' : 'gray'} label={policy.enquiryType ? t(`enquiry.type.${policy.enquiryType}`) : t('sla.anyType')} />
        <Badge tone={policy.priority ? 'yellow' : 'gray'} label={policy.priority ? t(`enquiry.priority.${policy.priority}`) : t('sla.anyPriority')} />
      </View>
      <View className="flex-1 flex-row items-center gap-2">
        {canEdit ? (
          <TextInput
            value={minutes}
            onChangeText={(v) => setMinutes(v.replace(/[^0-9]/g, ''))}
            onBlur={commit}
            keyboardType="number-pad"
            accessibilityLabel={t('sla.targetMinutes')}
            className="w-16 rounded-md border border-stroke px-2 py-1 font-sans text-sm text-dark outline-none dark:border-stroke-dark dark:text-white"
          />
        ) : (
          <Text className="font-sans text-sm text-dark dark:text-white">{policy.targetMinutes}</Text>
        )}
        <Text className="font-sans text-xs text-body dark:text-body-dark">{formatDuration(policy.targetMinutes, t)}</Text>
      </View>
      <View className="flex-1">
        <Switch
          value={policy.isPauseWhenWaiting}
          disabled={!canEdit}
          onValueChange={(v) => onChange({ isPauseWhenWaiting: v })}
          trackColor={{ true: colors.primary.DEFAULT }}
          accessibilityLabel={t('sla.pauseWhenWaiting')}
        />
      </View>
      <View className="w-24 items-end">
        <Switch
          value={policy.isActive}
          disabled={!canEdit}
          onValueChange={(v) => onChange({ isActive: v })}
          trackColor={{ true: colors.green.DEFAULT }}
          accessibilityLabel={t('sla.cols.active')}
        />
      </View>
    </View>
  );
}
