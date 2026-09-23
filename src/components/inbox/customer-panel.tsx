import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { statusTone } from '../../helpers/enquiry-status.helper';
import { useCustomer } from '../../hooks/queries/use-catalog';
import { useEnquiries } from '../../hooks/queries/use-enquiries';
import { usePermissions } from '../../hooks/use-permissions';
import { cn } from '../../utils/cn';
import { Avatar, Badge, Button, Card, InfoRow, SectionLabel, Spinner } from '../common';
import { CustomerEditModal } from './modals/customer-edit-modal';
import { CreateEnquiryModal } from './modals/create-enquiry-modal';
import { MergeCustomerModal } from './modals/merge-customer-modal';

/**
 * Everything we know about one customer: who they are, the channels they write from, the note the
 * team keeps and their recent enquiries. A column beside the table on a wide screen, a page of its
 * own on a phone — `full` drops the fixed width and lets it fill.
 */
export function CustomerPanel({ id, full, onOpenEnquiry }: {
  id: string;
  full?: boolean;
  /** how an enquiry row opens — the console selects it in the inbox, the phone pushes its page */
  onOpenEnquiry?: (enquiryId: string) => void;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const customer = useCustomer(id);
  const enquiries = useEnquiries({ customerId: id, limit: 20 });
  const [edit, setEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [merging, setMerging] = useState(false);
  const x = customer.data;

  return (
    <Card className={cn('gap-4 p-5', full ? 'flex-1 rounded-none border-0' : 'w-[300px]')}>
      {!x ? (
        <Spinner />
      ) : (
        <ScrollView contentContainerClassName="gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={x.companyName} size={52} />
            <View className="flex-1">
              <Text className="font-bold text-base text-dark dark:text-white">{x.companyName}</Text>
              <Text className="font-latin text-sm text-body">{x.code}</Text>
            </View>
            <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => setEdit(true)} />
          </View>
          {x.isPlaceholder && (
            <View className="gap-2 rounded-lg bg-yellow-light p-3 dark:bg-dark-3">
              <Text className="font-semibold text-xs text-yellow">{t('customers.merge.placeholder')}</Text>
              <Text className="font-sans text-sm text-dark dark:text-white">{t('customers.merge.placeholderHint')}</Text>
              {can(Permission.CUSTOMERS_PLACEHOLDER_MERGE) && (
                <Button title={t('customers.merge.action')} size="sm" onPress={() => setMerging(true)} />
              )}
            </View>
          )}
          <View className="gap-2">
            <InfoRow label={t('customers.contact')} value={x.contactName ?? '—'} />
            <InfoRow label={t('customers.phone')} value={x.phone ?? '—'} />
            <InfoRow label={t('customers.email')} value={x.email ?? '—'} />
            <InfoRow label={t('customers.salesperson')} value={x.salespersonName ?? t('customers.none')} />
          </View>
          <View className="gap-2">
            <SectionLabel>{t('inbox.panel.channels')}</SectionLabel>
            {x.channels.map((ch) => (
              <View key={ch.id} className="flex-row items-center gap-2 rounded-lg border border-stroke px-2.5 py-2 dark:border-stroke-dark">
                <Text className="font-bold text-sm text-green">{t(`enquiry.channelShort.${ch.channel}`)}</Text>
                <Text className="flex-1 font-sans text-sm text-dark dark:text-white">{ch.displayName ?? t('inbox.panel.linked')}</Text>
              </View>
            ))}
          </View>
          {x.internalNote ? (
            <View className="rounded-lg bg-yellow-light p-3">
              <Text className="font-semibold text-xs text-yellow">{t('customers.note')}</Text>
              <Text className="font-sans text-sm text-dark">{x.internalNote}</Text>
            </View>
          ) : null}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <SectionLabel>{t('customers.enquiries')}</SectionLabel>
              {can(Permission.INBOX_ENQUIRY_CREATE) && <Button title={`+ ${t('inbox.create')}`} size="sm" variant="ghost" onPress={() => setCreating(true)} />}
            </View>
            {(enquiries.data ?? []).map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="link"
                onPress={() => (onOpenEnquiry ? onOpenEnquiry(e.id) : router.push({ pathname: '/inbox', params: { id: e.id } }))}
                className="gap-0.5 rounded-lg border border-stroke px-3 py-2.5 active:bg-gray-1 dark:border-stroke-dark"
              >
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-latin text-xs text-body">{e.reference}</Text>
                  <Badge label={t(`enquiry.status.${e.status}`)} tone={statusTone[e.status]} />
                </View>
                <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{e.subject}</Text>
              </Pressable>
            ))}
          </View>
          <CustomerEditModal customer={x} visible={edit} onClose={() => setEdit(false)} />
          <CreateEnquiryModal visible={creating} onClose={() => setCreating(false)} asStaff onCreated={(e) => (onOpenEnquiry ? onOpenEnquiry(e.id) : router.push({ pathname: '/inbox', params: { id: e.id } }))} />
          <MergeCustomerModal visible={merging} placeholder={x} onClose={() => setMerging(false)} />
        </ScrollView>
      )}
    </Card>
  );
}
