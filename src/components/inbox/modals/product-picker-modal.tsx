import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useProducts } from '../../../hooks/queries/use-catalog';
import { useDebounced } from '../../../hooks/use-debounced';
import { Product } from '../../../services/catalog.service';
import colors from '../../../theme/colors';
import { useTheme } from '../../../theme/use-theme';
import { Button, Icon, Modal, Spinner } from '../../common';

/** Search the catalog (typos tolerated) and pick one product; `onClear` removes the current one. */
export function ProductPickerModal({
  visible,
  onClose,
  onPick,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (product: Product) => void;
  onClear?: () => void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const [q, setQ] = useState('');
  const products = useProducts(useDebounced(q, 250));

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('inbox.productModal.title')}
      width="md"
      footer={onClear ? <Button title={t('inbox.productModal.clear')} variant="outline" onPress={onClear} /> : undefined}
    >
      <View className="min-h-9 flex-row items-center gap-2 rounded-md border border-primary px-3">
        <Icon name="search" size={16} color={colors.dark[5]} />
        <TextInput
          value={q}
          onChangeText={setQ}
          autoFocus
          placeholder={t('inbox.productModal.search')}
          placeholderTextColor={c.placeholder}
          className="flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white"
        />
      </View>
      <Text className="font-sans text-xs text-body dark:text-body-dark">{t('inbox.productModal.hint')}</Text>
      {products.isPending ? (
        <Spinner />
      ) : (
        <View className="gap-1">
          {(products.data ?? []).map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => onPick(p)}
              className="min-h-10 flex-row items-center gap-3 rounded-md px-2 active:bg-gray-2 dark:active:bg-dark-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-md bg-gray-2 dark:bg-dark-3">
                <Icon name="package" size={16} color={colors.dark[5]} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm text-dark dark:text-white">{p.name}</Text>
                <Text className="font-latin text-xs text-body dark:text-body-dark">
                  {p.code} · {p.brand} · {p.packSize}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Modal>
  );
}
