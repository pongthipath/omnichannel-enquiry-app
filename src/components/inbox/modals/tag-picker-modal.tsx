import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Permission } from '../../../constants/permissions';
import { tagTone } from '../../../helpers/enquiry-status.helper';
import { errorMessage } from '../../../helpers/error.helper';
import { useTagMutations, useTags } from '../../../hooks/queries/use-catalog';
import { useEnquiryActions } from '../../../hooks/queries/use-enquiries';
import { usePermissions } from '../../../hooks/use-permissions';
import { Enquiry } from '../../../services/enquiry.service';
import colors from '../../../theme/colors';
import { useTheme } from '../../../theme/use-theme';
import { cn } from '../../../utils/cn';
import { Alert, Badge, Button, Icon, Modal } from '../../common';
import { whileOpen } from '../../common/while-open';

/** Tick the enquiry's tags; people with the inline-create permission can add a new tag by typing it. */
export const TagPickerModal = whileOpen(function TagPickerModalContent({ enquiry, visible, onClose }: { enquiry: Enquiry; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const c = useTheme();
  const { can } = usePermissions();
  const tags = (useTags().data ?? []).filter((tag) => tag.appliesTo !== 'CUSTOMER');
  const { create } = useTagMutations();
  const actions = useEnquiryActions(enquiry.id);
  const [picked, setPicked] = useState<string[]>(() => enquiry.tags.map((tag) => tag.id));
  const [q, setQ] = useState('');


  const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(q.trim().toLowerCase()));
  const canCreate =
    (can(Permission.INBOX_TAG_CREATE_INLINE) || can(Permission.SETTINGS_TAG_MANAGE)) &&
    q.trim() &&
    !tags.some((tag) => tag.name.toLowerCase() === q.trim().toLowerCase());
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('inbox.tagModal.title')}
      width="sm"
      footer={
        <>
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button title={t('common.save')} loading={actions.setTags.isPending} onPress={() => actions.setTags.mutate(picked, { onSuccess: onClose })} />
        </>
      }
    >
      <View className="min-h-9 flex-row items-center gap-2 rounded-md border border-stroke px-3 dark:border-stroke-dark">
        <Icon name="search" size={16} color={colors.dark[5]} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('inbox.tagModal.search')}
          placeholderTextColor={c.placeholder}
          className="flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white"
        />
      </View>
      <View className="gap-1">
        {filtered.map((tag) => {
          const on = picked.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(tag.id)}
              className="min-h-9 flex-row items-center gap-3 rounded-md px-2 active:bg-gray-2 dark:active:bg-dark-3"
            >
              <View className={cn('h-5 w-5 items-center justify-center rounded border', on ? 'border-primary bg-primary' : 'border-stroke dark:border-stroke-dark')}>
                {on && <Icon name="check" size={12} color={colors.white} strokeWidth={3} />}
              </View>
              <Badge label={tag.name} tone={tagTone[tag.color]} />
              <Text className="flex-1 font-sans text-xs text-body dark:text-body-dark" numberOfLines={1}>
                {tag.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {canCreate ? (
        <Button
          title={t('inbox.tagModal.create', { name: q.trim() })}
          variant="outline"
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { name: q.trim() },
              {
                onSuccess: (tag) => {
                  setPicked((p) => [...p, tag.id]);
                  setQ('');
                },
              },
            )
          }
        />
      ) : null}
      {(actions.setTags.isError || create.isError) && (
        <Alert tone="error" message={errorMessage(actions.setTags.error ?? create.error, t)} />
      )}
    </Modal>
  );
});
