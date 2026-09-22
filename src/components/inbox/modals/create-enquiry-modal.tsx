import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { errorMessage } from '../../../helpers/error.helper';
import { useCustomers } from '../../../hooks/queries/use-catalog';
import { useCreateEnquiry } from '../../../hooks/queries/use-enquiries';
import { Product } from '../../../services/catalog.service';
import { Channel, Enquiry, ENQUIRY_TYPES, EnquiryType, Priority, PRIORITIES } from '../../../services/enquiry.service';
import colors from '../../../theme/colors';
import { newId } from '../../../utils/id';
import { Alert, Button, Icon, Modal, Select, TextField } from '../../common';
import { whileOpen } from '../../common/while-open';
import { ProductPickerModal } from './product-picker-modal';

/**
 * New enquiry. Staff (INBOX_ENQUIRY_CREATE) pick the customer and channel (e.g. a phone call);
 * customers create for themselves. The clientRequestId is fixed per opened form, so double taps
 * or a retry after a timeout never create two enquiries.
 */
export const CreateEnquiryModal = whileOpen(function CreateEnquiryModalContent({
  visible,
  onClose,
  asStaff,
  onCreated,
  initialType,
}: {
  visible: boolean;
  onClose: () => void;
  asStaff: boolean;
  onCreated?: (enquiry: Enquiry) => void;
  initialType?: EnquiryType;
}) {
  const { t } = useTranslation();
  const create = useCreateEnquiry();
  const customers = useCustomers('', asStaff && visible);
  const requestId = useRef(newId());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>('PHONE');
  const [type, setType] = useState<EnquiryType>(initialType ?? 'GENERAL');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [pickProduct, setPickProduct] = useState(false);


  const valid = subject.trim() && description.trim() && (!asStaff || customerId);
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
        onSuccess: ({ enquiry }) => {
          onClose();
          onCreated?.(enquiry);
        },
      },
    );

  return (
    <>
      <Modal
        visible={visible && !pickProduct}
        onClose={onClose}
        title={asStaff ? t('inbox.createModal.titleStaff') : t('inbox.createModal.title')}
        description={asStaff ? t('inbox.createModal.descriptionStaff') : t('inbox.createModal.description')}
        width="md"
        footer={
          <>
            <Button title={t('common.cancel')} variant="outline" onPress={onClose} />
            <Button title={t('inbox.createModal.submit')} disabled={!valid} loading={create.isPending} onPress={submit} />
          </>
        }
      >
        {asStaff && (
          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[220px] flex-[2]">
              <Select
                label={t('inbox.createModal.customer')}
                value={customerId}
                onChange={setCustomerId}
                options={(customers.data?.items ?? []).map((c) => ({ value: c.id, label: c.companyName, hint: `${c.code} · ${c.contactName ?? ''}` }))}
              />
            </View>
            <View className="min-w-[150px] flex-1">
              <Select
                label={t('inbox.createModal.channel')}
                value={channel}
                onChange={setChannel}
                options={(['PHONE', 'WEB_CHAT', 'LINE', 'FACEBOOK', 'MOBILE_APP'] as Channel[]).map((c) => ({ value: c, label: t(`enquiry.channel.${c}`) }))}
              />
            </View>
          </View>
        )}
        <View className="flex-row flex-wrap gap-3">
          <View className="min-w-[200px] flex-[2]">
            <Select
              label={t('inbox.createModal.type')}
              value={type}
              onChange={setType}
              options={ENQUIRY_TYPES.map((v) => ({ value: v, label: t(`enquiry.type.${v}`) }))}
            />
          </View>
          <View className="min-w-[140px] flex-1">
            <Select
              label={t('inbox.createModal.priority')}
              value={priority}
              onChange={setPriority}
              options={PRIORITIES.map((v) => ({ value: v, label: t(`enquiry.priority.${v}`) }))}
            />
          </View>
        </View>
        <TextField label={t('inbox.createModal.subject')} value={subject} onChangeText={setSubject} maxLength={200} placeholder={t('inbox.createModal.subjectPlaceholder')} />
        <TextField
          label={t('inbox.createModal.details')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={5000}
          placeholder={t('inbox.createModal.detailsPlaceholder')}
          className="min-h-[96px]"
        />
        <View className="gap-2">
          <Text className="font-semibold text-sm text-dark dark:text-white">{t('inbox.createModal.product')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickProduct(true)}
            className="min-h-12 flex-row items-center gap-3 rounded-md border border-dashed border-gray-5 px-3 active:bg-gray-1"
          >
            <Icon name="package" size={16} color={colors.dark[5]} />
            <Text className="flex-1 font-sans text-sm text-dark dark:text-white" numberOfLines={1}>
              {product ? `${product.name} · ${product.code}` : t('inbox.createModal.productPlaceholder')}
            </Text>
          </Pressable>
        </View>
        {create.isError && <Alert tone="error" message={errorMessage(create.error, t)} />}
      </Modal>
      <ProductPickerModal
        visible={visible && pickProduct}
        onClose={() => setPickProduct(false)}
        onPick={(p) => {
          setProduct(p);
          setPickProduct(false);
        }}
        onClear={
          product
            ? () => {
                setProduct(null);
                setPickProduct(false);
              }
            : undefined
        }
      />
    </>
  );
});
