import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { errorMessage } from '../../helpers/error.helper';
import { useCustomers } from '../../hooks/queries/use-catalog';
import { useCreateEnquiry } from '../../hooks/queries/use-enquiries';
import { Product } from '../../services/catalog.service';
import { Channel, Enquiry, ENQUIRY_TYPES, EnquiryType, Priority, PRIORITIES } from '../../services/enquiry.service';
import colors from '../../theme/colors';
import { newId } from '../../utils/id';
import { Alert, Icon, Select, TextField } from '../common';
import { ProductPickerModal } from './modals/product-picker-modal';

/**
 * The new-enquiry form, without a shell around it. The browser opens it in a dialog, the phone app
 * pushes it as its own page — same fields, same submit, so the two can never drift apart.
 *
 * The clientRequestId is fixed for the life of the form, so double taps or a retry after a timeout
 * never create two enquiries.
 */
export function useEnquiryDraft({ asStaff, initialType, onCreated, onDone }: {
  asStaff: boolean;
  initialType?: EnquiryType;
  onCreated?: (enquiry: Enquiry) => void;
  onDone: () => void;
}) {
  const create = useCreateEnquiry();
  const customers = useCustomers('', asStaff);
  const requestId = useRef(newId());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>('PHONE');
  const [type, setType] = useState<EnquiryType>(initialType ?? 'GENERAL');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [pickProduct, setPickProduct] = useState(false);

  const valid = Boolean(subject.trim() && description.trim() && (!asStaff || customerId));
  const submit = () =>
    create.mutate(
      {
        clientRequestId: requestId.current,
        enquiryType: type,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        productId: product?.id,
        ...(asStaff ? { customerId: customerId!, channel } : { channel: 'MOBILE_APP' as const }),
      },
      {
        onSuccess: (result) => {
          onDone();
          // queued offline: there is no enquiry to open yet, the outbox banner takes it from here
          if (!('queued' in result)) onCreated?.(result.enquiry);
        },
      },
    );

  return {
    asStaff,
    create,
    valid,
    submit,
    pickProduct,
    customers,
    state: { customerId, channel, type, priority, subject, description, product },
    set: { setCustomerId, setChannel, setType, setPriority, setSubject, setDescription, setProduct, setPickProduct },
  };
}

export type EnquiryDraft = ReturnType<typeof useEnquiryDraft>;

export function EnquiryDraftFields({ draft }: { draft: EnquiryDraft }) {
  const { t } = useTranslation();
  const { asStaff, create, customers, state, set } = draft;

  return (
    <>
      {asStaff && (
        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[220px] flex-[2]">
            <Select
              label={t('inbox.createModal.customer')}
              value={state.customerId}
              onChange={set.setCustomerId}
              options={(customers.data?.items ?? []).map((c) => ({ value: c.id, label: c.companyName, hint: `${c.code} · ${c.contactName ?? ''}` }))}
            />
          </View>
          <View className="min-w-[150px] flex-1">
            <Select
              label={t('inbox.createModal.channel')}
              value={state.channel}
              onChange={set.setChannel}
              options={(['PHONE', 'WEB_CHAT', 'LINE', 'FACEBOOK', 'MOBILE_APP'] as Channel[]).map((c) => ({ value: c, label: t(`enquiry.channel.${c}`) }))}
            />
          </View>
        </View>
      )}
      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[200px] flex-[2]">
          <Select
            label={t('inbox.createModal.type')}
            value={state.type}
            onChange={set.setType}
            options={ENQUIRY_TYPES.map((v) => ({ value: v, label: t(`enquiry.type.${v}`) }))}
          />
        </View>
        <View className="min-w-[140px] flex-1">
          <Select
            label={t('inbox.createModal.priority')}
            value={state.priority}
            onChange={set.setPriority}
            options={PRIORITIES.map((v) => ({ value: v, label: t(`enquiry.priority.${v}`) }))}
          />
        </View>
      </View>
      <TextField label={t('inbox.createModal.subject')} value={state.subject} onChangeText={set.setSubject} maxLength={200} placeholder={t('inbox.createModal.subjectPlaceholder')} />
      <TextField
        label={t('inbox.createModal.details')}
        value={state.description}
        onChangeText={set.setDescription}
        multiline
        maxLength={5000}
        placeholder={t('inbox.createModal.detailsPlaceholder')}
        className="min-h-[96px]"
      />
      <View className="gap-2">
        <Text className="font-semibold text-sm text-dark dark:text-white">{t('inbox.createModal.product')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => set.setPickProduct(true)}
          className="min-h-10 flex-row items-center gap-3 rounded-md border border-dashed border-gray-5 px-3 active:bg-gray-1"
        >
          <Icon name="package" size={16} color={colors.dark[5]} />
          <Text className="flex-1 font-sans text-sm text-dark dark:text-white" numberOfLines={1}>
            {state.product ? `${state.product.name} · ${state.product.code}` : t('inbox.createModal.productPlaceholder')}
          </Text>
        </Pressable>
      </View>
      {create.isError && <Alert tone="error" message={errorMessage(create.error, t)} />}
    </>
  );
}

/** Rendered next to the fields; kept separate because the dialog hides it behind the picker. */
export function EnquiryDraftProductPicker({ draft, visible }: { draft: EnquiryDraft; visible: boolean }) {
  const { state, set } = draft;
  return (
    <ProductPickerModal
      visible={visible}
      onClose={() => set.setPickProduct(false)}
      onPick={(p) => {
        set.setProduct(p);
        set.setPickProduct(false);
      }}
      onClear={
        state.product
          ? () => {
              set.setProduct(null);
              set.setPickProduct(false);
            }
          : undefined
      }
    />
  );
}
