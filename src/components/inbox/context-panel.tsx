import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Permission } from '../../constants/permissions';
import { slaMinutesLeft, statusTone, tagTone } from '../../helpers/enquiry-status.helper';
import { errorMessage } from '../../helpers/error.helper';
import { formatDateTime, formatDuration } from '../../helpers/format.helper';
import { eventText, eventTone } from '../../helpers/message.helper';
import { useCustomer, useProduct } from '../../hooks/queries/use-catalog';
import { useEnquiries, useEnquiry, useEnquiryActions } from '../../hooks/queries/use-enquiries';
import { useMessages } from '../../hooks/queries/use-messages';
import { usePermissions } from '../../hooks/use-permissions';
import { ChatStatus, Enquiry, ENQUIRY_TYPES, PRIORITIES } from '../../services/enquiry.service';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Alert, Avatar, Badge, Button, Icon, IconButton, InfoRow, SectionLabel, Select, Spinner, UnderlineTabs } from '../common';
import { Composer } from './composer';
import { CustomerEditModal } from './modals/customer-edit-modal';
import { ProductPickerModal } from './modals/product-picker-modal';
import { TagPickerModal } from './modals/tag-picker-modal';

type Tab = 'customer' | 'detail' | 'notes' | 'history';

/**
 * Right column (design Main.dc.html): tabs for the open enquiry only — customer, details,
 * internal notes (the team's own thread, never sent to the customer) and history.
 */
export function ContextPanel({
  enquiryId,
  onOpenEnquiry,
  onClose,
}: {
  enquiryId?: string;
  onOpenEnquiry: (id: string) => void;
  /** phone: the panel is a full screen with a close button */
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [tab, setTab] = useState<Tab>('customer');
  const enquiry = useEnquiry(enquiryId);
  const showNotes = can(Permission.INBOX_CHAT_INTERNAL_VIEW) || can(Permission.INBOX_CHAT_REPLY);

  return (
    <View className="flex-1 bg-white dark:bg-dark-2">
      {onClose && (
        <View className="flex-row items-center gap-2 border-b border-stroke px-2 py-1.5 dark:border-stroke-dark">
          <Text className="flex-1 font-bold text-base text-dark dark:text-white">{t('inbox.panel.title')}</Text>
          <IconButton icon="x" label={t('common.close')} onPress={onClose} />
        </View>
      )}
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'customer', label: t('inbox.panel.customer') },
          { value: 'detail', label: t('inbox.panel.detail') },
          ...(showNotes ? [{ value: 'notes' as const, label: t('inbox.panel.notes') }] : []),
          { value: 'history', label: t('inbox.panel.history') },
        ]}
      />
      {!enquiry.data ? (
        enquiryId ? <Spinner /> : null
      ) : tab === 'notes' ? (
        <NotesTab enquiry={enquiry.data} />
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-3">
          {tab === 'customer' && <CustomerTab enquiry={enquiry.data} onOpenEnquiry={onOpenEnquiry} />}
          {tab === 'detail' && <DetailTab enquiry={enquiry.data} />}
          {tab === 'history' && <HistoryTab enquiry={enquiry.data} />}
        </ScrollView>
      )}
    </View>
  );
}

/** The team's internal thread: notes + events the customer never sees. */
function NotesTab({ enquiry }: { enquiry: Enquiry }) {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const messages = useMessages(enquiry.id);
  const notes = (messages.data ?? []).filter((m) => m.isInternal);

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-2.5 p-3">
        <Alert tone="warning" message={t('inbox.panel.notesHint')} />
        {notes.map((m) => (
          <View key={m.id} className="gap-1 rounded-lg border border-yellow-dark bg-yellow-light p-2.5 dark:bg-dark-3">
            <Text className="font-sans text-sm text-dark dark:text-white">
              {m.messageType === 'EVENT' ? eventText(m, t) : m.body}
            </Text>
            <Text className="font-sans text-xs text-body">
              {[m.senderName, formatDateTime(m.createdAt, i18n.language)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
        {!notes.length && !messages.isPending && (
          <Text className="py-6 text-center font-sans text-sm text-body">{t('inbox.panel.noNotes')}</Text>
        )}
      </ScrollView>
      {can(Permission.INBOX_CHAT_REPLY) && <Composer chatId={enquiry.id} staff internal />}
    </View>
  );
}

function CustomerTab({ enquiry, onOpenEnquiry }: { enquiry: Enquiry; onOpenEnquiry: (id: string) => void }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canView = can(Permission.CUSTOMER_PANEL_CONTACT_VIEW);
  const customer = useCustomer(canView ? enquiry.customerId : null);
  const others = useEnquiries({ customerId: enquiry.customerId, limit: 10 });
  const [edit, setEdit] = useState(false);
  const list = (others.data ?? []).filter((o) => o.id !== enquiry.id);
  const open = (others.data ?? []).filter((o) => o.status !== 'RESOLVED' && o.status !== 'CLOSED');
  const canEdit =
    can(Permission.CUSTOMER_PANEL_CONTACT_EDIT) || can(Permission.CUSTOMER_PANEL_NOTE_EDIT) || can(Permission.CUSTOMER_PANEL_SALESPERSON_ASSIGN);

  return (
    <>
      <View className="flex-row items-center gap-3">
        <Avatar name={enquiry.customer?.companyName ?? '?'} size={48} />
        <View className="flex-1">
          <Text className="font-bold text-base text-dark dark:text-white">{enquiry.customer?.companyName}</Text>
          <Text className="font-sans text-sm text-body dark:text-body-dark">
            {customer.data?.code ?? ''} {enquiry.customer?.contactName ? `· ${enquiry.customer.contactName}` : ''}
          </Text>
        </View>
        {canEdit && customer.data && <Button title={t('common.edit')} size="sm" variant="outline" onPress={() => setEdit(true)} />}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1 rounded-lg border border-stroke bg-gray-1 p-2.5 dark:border-stroke-dark dark:bg-dark">
          <Text className="font-sans text-xs text-body dark:text-body-dark">{t('inbox.panel.openEnquiries')}</Text>
          <Text className="font-bold text-xl text-dark dark:text-white">{open.length}</Text>
        </View>
        <View className={cn('flex-1 rounded-lg p-2.5', open.some((o) => o.isSlaBreached) ? 'bg-red-light' : 'border border-stroke bg-gray-1 dark:border-stroke-dark dark:bg-dark')}>
          <Text className={cn('font-sans text-xs', open.some((o) => o.isSlaBreached) ? 'text-red' : 'text-body')}>{t('enquiry.slaBreached')}</Text>
          <Text className={cn('font-bold text-xl', open.some((o) => o.isSlaBreached) ? 'text-red' : 'text-dark dark:text-white')}>
            {open.filter((o) => o.isSlaBreached).length}
          </Text>
        </View>
      </View>

      {canView ? (
        customer.data ? (
          <View className="gap-2">
            <SectionLabel>{t('inbox.panel.contact')}</SectionLabel>
            <InfoRow label={t('customers.phone')} value={customer.data.phone ?? '—'} />
            <InfoRow label={t('customers.email')} value={customer.data.email ?? '—'} />
            <InfoRow label={t('customers.salesperson')} value={customer.data.salespersonName ?? t('customers.noSalesperson')} />
            {customer.data.channels.length > 0 && (
              <>
                <SectionLabel>{t('inbox.panel.channels')}</SectionLabel>
                {customer.data.channels.map((ch) => (
                  <InfoRow key={ch.id} label={t(`enquiry.channel.${ch.channel}`)} value={ch.displayName ?? t('inbox.panel.linked')} valueClassName="text-green font-semibold" />
                ))}
              </>
            )}
            {customer.data.internalNote ? (
              <View className="rounded-lg bg-yellow-light p-3">
                <Text className="font-semibold text-xs text-yellow">{t('customers.note')}</Text>
                <Text className="font-sans text-sm text-dark">{customer.data.internalNote}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Spinner />
        )
      ) : (
        <Alert tone="info" message={t('inbox.panel.noContactPermission')} />
      )}

      <View className="gap-2">
        <SectionLabel>{t('inbox.panel.otherEnquiries')}</SectionLabel>
        {list.length === 0 && <Text className="font-sans text-sm text-body">{t('inbox.panel.noOther')}</Text>}
        {list.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => onOpenEnquiry(o.id)}
            className="gap-1 rounded-lg border border-stroke p-2.5 active:bg-gray-1 dark:border-stroke-dark"
          >
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Text className="font-latin text-xs text-body">{o.reference}</Text>
              <Badge label={t(`enquiry.status.${o.status}`)} tone={statusTone[o.status]} />
              {o.isSlaBreached && <Badge label={t('enquiry.slaBreached')} tone="red" />}
            </View>
            <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">
              {o.subject}
            </Text>
          </Pressable>
        ))}
      </View>
      {customer.data && <CustomerEditModal customer={customer.data} visible={edit} onClose={() => setEdit(false)} />}
    </>
  );
}

function DetailTab({ enquiry: e }: { enquiry: Enquiry }) {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const actions = useEnquiryActions(e.id);
  const product = useProduct(e.productId);
  const [modal, setModal] = useState<'tags' | 'product' | null>(null);
  const canEdit = can(Permission.INBOX_ENQUIRY_EDIT);
  const left = slaMinutesLeft(e);
  const overdue = left !== null && left < 0;

  return (
    <>
      <View className={cn('gap-1.5 rounded-lg p-3', overdue ? 'bg-red-light' : left === null ? 'bg-gray-2 dark:bg-dark-3' : 'bg-yellow-light')}>
        <Text className={cn('font-semibold text-xs', overdue ? 'text-red' : left === null ? 'text-dark-4' : 'text-yellow')}>
          {e.reopenCount > 0 ? t('inbox.sla.reopenCycle') : t('inbox.sla.title')}
        </Text>
        <Text className={cn('font-bold text-xl', overdue ? 'text-red' : left === null ? 'text-dark-4 dark:text-white' : 'text-yellow')}>
          {left === null
            ? e.slaPausedAt
              ? t('inbox.sla.paused')
              : t('inbox.sla.done')
            : overdue
              ? t('inbox.sla.overdue', { time: formatDuration(left, t) })
              : t('inbox.sla.left', { time: formatDuration(left, t) })}
        </Text>
        <Text className="font-sans text-xs text-body">{t('inbox.sla.target', { minutes: e.slaMinutes })}</Text>
      </View>

      <Select
        label={t('inbox.createModal.type')}
        value={e.enquiryType}
        disabled={!canEdit}
        onChange={(v) => actions.update.mutate({ enquiryType: v })}
        options={ENQUIRY_TYPES.map((v) => ({ value: v, label: t(`enquiry.type.${v}`) }))}
      />
      <Select
        label={t('inbox.createModal.priority')}
        value={e.priority}
        disabled={!canEdit}
        onChange={(v) => actions.update.mutate({ priority: v })}
        options={PRIORITIES.map((v) => ({ value: v, label: t(`enquiry.priority.${v}`) }))}
      />
      <InfoRow label={t('inbox.panel.department')} value={e.departmentName ?? '—'} />
      <InfoRow label={t('inbox.panel.owner')} value={e.assignedStaffName ?? t('inbox.panel.unassigned')} />
      <InfoRow label={t('inbox.panel.created')} value={formatDateTime(e.createdAt, i18n.language)} />

      <View className="gap-2">
        <SectionLabel>{t('inbox.panel.tags')}</SectionLabel>
        <View className="flex-row flex-wrap gap-1.5">
          {e.tags.map((tag) => (
            <Badge key={tag.id} label={tag.name} tone={tagTone[tag.color]} />
          ))}
          {can(Permission.INBOX_TAG_APPLY) && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setModal('tags')}
              className="rounded-full border border-dashed border-gray-5 px-2.5 py-0.5 active:bg-gray-1"
            >
              <Text className="font-sans text-xs text-body">+ {t('inbox.panel.addTag')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel>{t('inbox.createModal.product')}</SectionLabel>
        <Pressable
          accessibilityRole="button"
          disabled={!canEdit}
          onPress={() => setModal('product')}
          className="flex-row items-center gap-2.5 rounded-lg border border-stroke p-2.5 dark:border-stroke-dark"
        >
          <View className="h-10 w-10 items-center justify-center rounded-md bg-gray-2 dark:bg-dark-3">
            <Icon name="package" size={16} color={colors.dark[5]} />
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">
              {product.data?.name ?? t('inbox.panel.noProduct')}
            </Text>
            {product.data && (
              <Text className="font-latin text-xs text-body">
                {product.data.code} · {product.data.brand}
              </Text>
            )}
          </View>
          {canEdit && <Icon name="edit" size={14} color={colors.dark[5]} />}
        </Pressable>
      </View>
      {actions.update.isError && <Alert tone="error" message={errorMessage(actions.update.error, t)} />}

      <TagPickerModal enquiry={e} visible={modal === 'tags'} onClose={() => setModal(null)} />
      <ProductPickerModal
        visible={modal === 'product'}
        onClose={() => setModal(null)}
        onPick={(p) => actions.update.mutate({ productId: p.id }, { onSuccess: () => setModal(null) })}
        onClear={e.productId ? () => actions.update.mutate({ productId: null }, { onSuccess: () => setModal(null) }) : undefined}
      />
    </>
  );
}

const DOT: Record<string, string> = { blue: 'bg-primary', green: 'bg-green', yellow: 'bg-yellow-dark', gray: 'bg-gray-5' };

/** Everything that happened, newest first: every event row (internal ones too) plus the status it moved to. */
function HistoryTab({ enquiry }: { enquiry: Enquiry }) {
  const { t, i18n } = useTranslation();
  const messages = useMessages(enquiry.id);
  const events = (messages.data ?? []).filter((m) => m.messageType === 'EVENT').slice().reverse();
  return (
    <View className="gap-3">
      {events.map((m) => {
        const from = m.eventData?.from as ChatStatus | undefined;
        const to = m.eventData?.to as ChatStatus | undefined;
        return (
          <View key={m.id} className="flex-row gap-2.5">
            <View className={cn('mt-1.5 h-2.5 w-2.5 rounded-full', DOT[eventTone(m)])} />
            <View className="flex-1 gap-1">
              <Text className="font-semibold text-sm text-dark dark:text-white">{eventText(m, t)}</Text>
              {to && (
                <View className="flex-row items-center gap-1">
                  {from && <Badge label={t(`enquiry.status.${from}`)} tone="gray" />}
                  {from && <Text className="font-sans text-xs text-body">→</Text>}
                  <Badge label={t(`enquiry.status.${to}`)} tone={statusTone[to]} />
                </View>
              )}
              <Text className="font-sans text-xs text-body">
                {[formatDateTime(m.createdAt, i18n.language), m.isInternal ? t('inbox.panel.internalOnly') : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
        );
      })}
      <View className="flex-row gap-2.5">
        <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-gray-5" />
        <View className="flex-1">
          <Text className="font-semibold text-sm text-dark dark:text-white">
            {t('inbox.panel.createdVia', { channel: t(`enquiry.channel.${enquiry.originChannel}`) })}
          </Text>
          <Text className="font-sans text-xs text-body">{formatDateTime(enquiry.createdAt, i18n.language)}</Text>
        </View>
      </View>
    </View>
  );
}
