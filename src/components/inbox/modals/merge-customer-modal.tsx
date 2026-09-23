import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { errorMessage } from '../../../helpers/error.helper';
import { useCustomers } from '../../../hooks/queries/use-catalog';
import { useMergeCustomer } from '../../../hooks/queries/use-customer-360';
import { useDebounced } from '../../../hooks/use-debounced';
import { CustomerProfile } from '../../../services/customer.service';
import { cn } from '../../../utils/cn';
import { Alert, Avatar, Button, Modal, Spinner, TextField } from '../../common';
import { whileOpen } from '../../common/while-open';

/**
 * Same person, two records: an unverified customer created from a channel, and the real one
 * (design §8.5). Merging moves their channels, enquiries, orders and messages across and removes
 * the unverified record, so the team keeps one history per customer.
 */
export const MergeCustomerModal = whileOpen(function MergeCustomerModal({
  placeholder,
  onClose,
  onMerged,
}: {
  placeholder: CustomerProfile;
  visible: boolean;
  onClose: () => void;
  onMerged?: (targetId: string) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const candidates = useCustomers(useDebounced(q, 300));
  const merge = useMergeCustomer();

  const options = (candidates.data?.items ?? []).filter((c) => !c.isPlaceholder && c.id !== placeholder.id);

  const submit = () => {
    if (!targetId) return;
    merge.mutate(
      { placeholderId: placeholder.id, targetCustomerId: targetId },
      {
        onSuccess: () => {
          onMerged?.(targetId);
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible title={t('customers.merge.title')} onClose={onClose}>
      <View className="gap-3">
        <Alert tone="warning" message={t('customers.merge.warning')} />

        <View className="flex-row items-center gap-2.5 rounded-lg border border-stroke p-2.5 dark:border-stroke-dark">
          <Avatar name={placeholder.companyName} size={36} />
          <View className="flex-1">
            <Text className="font-semibold text-sm text-dark dark:text-white">{placeholder.companyName}</Text>
            <Text className="font-sans text-xs text-body">
              {placeholder.channels.map((ch) => t(`enquiry.channelShort.${ch.channel}`)).join(' · ') ||
                t('customers.merge.noChannel')}
            </Text>
          </View>
        </View>

        <TextField
          label={t('customers.merge.searchTarget')}
          value={q}
          onChangeText={setQ}
          placeholder={t('customers.searchPlaceholder')}
        />

        <ScrollView className="max-h-64">
          {candidates.isPending && <Spinner />}
          {options.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: c.id === targetId }}
              onPress={() => setTargetId(c.id)}
              className={cn(
                'mb-1.5 flex-row items-center gap-2.5 rounded-lg border p-2.5',
                c.id === targetId ? 'border-primary bg-primary-light dark:bg-dark-3' : 'border-stroke active:bg-gray-1 dark:border-stroke-dark',
              )}
            >
              <Avatar name={c.companyName} size={32} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{c.companyName}</Text>
                <Text className="font-latin text-xs text-body">{c.code}{c.phone ? ` · ${c.phone}` : ''}</Text>
              </View>
            </Pressable>
          ))}
          {!candidates.isPending && options.length === 0 && (
            <Text className="py-4 text-center font-sans text-sm text-body">{t('common.noResults')}</Text>
          )}
        </ScrollView>

        {merge.isError && <Alert tone="error" message={errorMessage(merge.error, t)} />}
        <View className="flex-row justify-end gap-2">
          <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
          <Button title={t('customers.merge.confirm')} onPress={submit} disabled={!targetId} loading={merge.isPending} />
        </View>
      </View>
    </Modal>
  );
});
