import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Alert, Badge, Button, Card, Checkbox, ConfirmModal, EmptyState, Spinner, TextField } from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { Permission } from '../../../../constants/permissions';
import { tagTone } from '../../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../../helpers/error.helper';
import { useTagMutations, useTags } from '../../../../hooks/queries/use-catalog';
import { usePermissions } from '../../../../hooks/use-permissions';
import { Tag, TAG_COLORS, TagAppliesTo, TagColor } from '../../../../services/tag.service';
import { cn } from '../../../../utils/cn';
import { WideTable } from '../../../../components/layout/wide-table';

const SWATCH: Record<TagColor, string> = {
  yellow: '#FBBF24',
  blue: '#3758F9',
  red: '#E10E0E',
  green: '#22AD5C',
  cyan: '#0B76B7',
  gray: '#9CA3AF',
  purple: '#8B5CF6',
};

interface Form {
  name: string;
  color: TagColor;
  enquiry: boolean;
  customer: boolean;
  description: string;
}
const EMPTY: Form = { name: '', color: 'blue', enquiry: true, customer: false, description: '' };
const appliesTo = (f: Form): TagAppliesTo => (f.enquiry && f.customer ? 'BOTH' : f.customer ? 'CUSTOMER' : 'ENQUIRY');

/** Tags (design Tags.dc.html): list with usage + create / edit panel. */
export default function TagsScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const tags = useTags();
  const { create, update, remove } = useTagMutations();
  const [editing, setEditingState] = useState<Tag | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error ?? remove.error;

  /** Opening the panel fills the form from the row (or blank for "new") and clears old errors. */
  const setEditing = (editing: Tag | 'new' | null) => {
    setEditingState(editing);
    if (editing === 'new' || editing === null) setForm(EMPTY);
    else
      setForm({
        name: editing.name,
        color: editing.color,
        enquiry: editing.appliesTo !== 'CUSTOMER',
        customer: editing.appliesTo !== 'ENQUIRY',
        description: editing.description ?? '',
      });
    create.reset();
    update.reset();
  };

  if (!can(Permission.SETTINGS_TAG_MANAGE)) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const save = () => {
    const input = { name: form.name.trim(), color: form.color, appliesTo: appliesTo(form), description: form.description.trim() };
    if (editing === 'new') create.mutate(input, { onSuccess: () => setEditing(null) });
    else if (editing) update.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  };

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader title={t('tags.title')} subtitle={t('tags.subtitle')} actions={<Button title={`+ ${t('tags.create')}`} onPress={() => setEditing('new')} />} />
      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <WideTable width={720}>
            <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
              <Text className="flex-[2] font-semibold text-xs text-body">{t('tags.cols.tag')}</Text>
              <Text className="flex-[1.5] font-semibold text-xs text-body">{t('tags.cols.appliesTo')}</Text>
              <Text className="flex-[3] font-semibold text-xs text-body">{t('tags.cols.description')}</Text>
              <Text className="flex-1 text-right font-semibold text-xs text-body">{t('tags.cols.usage')}</Text>
            </View>
            {tags.isPending ? (
              <Spinner />
            ) : (
              <ScrollView>
                {(tags.data ?? []).map((tag) => {
                  const on = editing !== 'new' && editing?.id === tag.id;
                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityRole="button"
                      accessibilityLabel={t('tags.editOne', { name: tag.name })}
                      onPress={() => setEditing(tag)}
                      className={cn('flex-row items-center border-t border-gray-2 px-3 py-2.5 dark:border-dark-3', on ? 'bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1')}
                    >
                      <View className="flex-[2]">
                        <Badge label={tag.name} tone={tagTone[tag.color]} />
                      </View>
                      <Text className="flex-[1.5] font-sans text-sm text-dark-4 dark:text-dark-6">{t(`tags.appliesTo.${tag.appliesTo}`)}</Text>
                      <Text numberOfLines={1} className="flex-[3] font-sans text-sm text-body">{tag.description ?? '—'}</Text>
                      <Text className="flex-1 text-right font-bold text-sm text-dark dark:text-white">{tag.usageCount}</Text>
                    </Pressable>
                  );
                })}
                {!tags.data?.length && <EmptyState icon="tag" title={t('tags.empty')} />}
              </ScrollView>
            )}
          </WideTable>
        </Card>

        {editing && (
          <Card className="w-[300px] gap-4 p-5">
            <Text className="font-bold text-base text-dark dark:text-white">{editing === 'new' ? t('tags.create') : t('tags.edit')}</Text>
            <TextField label={t('tags.name')} value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} maxLength={60} />
            <View className="gap-2">
              <Text className="font-semibold text-sm text-dark dark:text-white">{t('tags.color')}</Text>
              <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    accessibilityRole="radio"
                    accessibilityLabel={t(`tags.colors.${color}`)}
                    accessibilityState={{ checked: form.color === color }}
                    onPress={() => setForm((f) => ({ ...f, color }))}
                    style={{ backgroundColor: SWATCH[color] }}
                    className={cn(
                      'h-8 w-8 rounded-full',
                      form.color === color ? 'border-[3px] border-white shadow-[0_0_0_2px_#111928]' : 'shadow-none',
                    )}
                  />
                ))}
              </View>
            </View>
            <View className="gap-1">
              <Text className="font-semibold text-sm text-dark dark:text-white">{t('tags.cols.appliesTo')}</Text>
              <Checkbox checked={form.enquiry} onChange={(enquiry) => setForm((f) => ({ ...f, enquiry: enquiry || !f.customer }))} label={t('tags.appliesTo.ENQUIRY')} />
              <Checkbox checked={form.customer} onChange={(customer) => setForm((f) => ({ ...f, customer, enquiry: f.enquiry || !customer }))} label={t('tags.appliesTo.CUSTOMER')} />
            </View>
            <TextField label={t('tags.cols.description')} value={form.description} onChangeText={(description) => setForm((f) => ({ ...f, description }))} multiline maxLength={300} />
            <View className="gap-1.5 rounded-lg bg-gray-1 p-3 dark:bg-dark">
              <Text className="font-sans text-xs text-body">{t('tags.preview')}</Text>
              <View className="flex-row gap-1.5">
                <Badge label={t('enquiry.status.OPEN')} tone="cyan" />
                <Badge label={form.name || t('tags.name')} tone={tagTone[form.color]} />
              </View>
            </View>
            {error && <Alert tone="error" message={errorMessage(error, t)} />}
            <View className="mt-auto flex-row gap-2">
              {editing !== 'new' && <Button title={t('common.delete')} variant="outline" onPress={() => setConfirmDelete(true)} />}
              <View className="flex-1" />
              <Button title={t('common.cancel')} variant="outline" onPress={() => setEditing(null)} />
              <Button title={t('common.save')} disabled={!form.name.trim()} loading={saving} onPress={save} />
            </View>
          </Card>
        )}
      </View>
      <ConfirmModal
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('tags.deleteTitle')}
        message={editing && editing !== 'new' ? t('tags.deleteMessage', { name: editing.name, count: editing.usageCount }) : ''}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onConfirm={() =>
          editing &&
          editing !== 'new' &&
          remove.mutate(editing.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              setEditing(null);
            },
          })
        }
      />
    </View>
  );
}
