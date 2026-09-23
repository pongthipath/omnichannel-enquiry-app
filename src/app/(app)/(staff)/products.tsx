import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Badge, Card, Chip, EmptyState, Icon, SectionLabel, Spinner } from '../../../components/common';
import { PageHeader } from '../../../components/layout/page-header';
import { statusTone } from '../../../helpers/enquiry-status.helper';
import { useProducts } from '../../../hooks/queries/use-catalog';
import { useEnquiries } from '../../../hooks/queries/use-enquiries';
import { useDebounced } from '../../../hooks/use-debounced';
import { Product } from '../../../services/catalog.service';
import colors from '../../../theme/colors';
import { useTheme } from '../../../theme/use-theme';
import { cn } from '../../../utils/cn';

/** Products (design Products.dc.html): typo-tolerant search, category chips, enquiries about the product. */
export default function ProductsScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const products = useProducts(useDebounced(search, 250));
  const [selected, setSelected] = useState<Product | null>(null);
  const all = useMemo(() => products.data ?? [], [products.data]);
  const categories = useMemo(() => [...new Set(all.map((p) => p.category).filter(Boolean))] as string[], [all]);
  const list = category ? all.filter((p) => p.category === category) : all;
  const current = selected && list.some((p) => p.id === selected.id) ? selected : list[0];

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader title={t('products.title')} subtitle={t('products.subtitle', { count: all.length })} />
      <Card className="gap-2.5 p-4">
        <View className="min-h-9 flex-row items-center gap-2 rounded-md border border-primary px-3">
          <Icon name="search" color={colors.dark[5]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('products.searchPlaceholder')}
            placeholderTextColor={c.placeholder}
            accessibilityLabel={t('products.searchPlaceholder')}
            className="flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white"
          />
          <Text className="font-sans text-xs text-body">{t('products.typoHint')}</Text>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          <Chip label={t('common.all')} selected={!category} onPress={() => setCategory(null)} />
          {categories.map((cat) => (
            <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </View>
      </Card>

      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
            <Text className="flex-[3] font-semibold text-xs text-body">{t('products.cols.product')}</Text>
            <Text className="flex-1 font-semibold text-xs text-body">{t('products.cols.category')}</Text>
            <Text className="flex-1 font-semibold text-xs text-body">{t('products.cols.size')}</Text>
          </View>
          {products.isPending ? (
            <Spinner />
          ) : (
            <ScrollView>
              {list.map((p) => {
                const on = p.id === current?.id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setSelected(p)}
                    className={cn('flex-row items-center border-t border-gray-2 px-4 py-2.5 dark:border-dark-3', on ? 'border-l-[3px] border-l-primary bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1')}
                  >
                    <View className="flex-[3] flex-row items-center gap-2.5">
                      <View className="h-9 w-9 items-center justify-center rounded-md bg-gray-2 dark:bg-dark-3">
                        <Icon name="package" size={16} color={colors.dark[5]} />
                      </View>
                      <View className="flex-1">
                        <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">{p.name}</Text>
                        <Text className="font-latin text-xs text-body">{p.code} · {p.brand}</Text>
                      </View>
                    </View>
                    <Text className="flex-1 font-sans text-sm text-dark-4 dark:text-dark-6">{p.category}</Text>
                    <Text className="flex-1 font-sans text-sm text-dark-4 dark:text-dark-6">{p.packSize} / {p.unit}</Text>
                  </Pressable>
                );
              })}
              {!list.length && <EmptyState icon="package" title={t('products.empty')} message={t('products.emptyHint')} />}
            </ScrollView>
          )}
        </Card>
        {width >= 1100 && current && <ProductPanel product={current} />}
      </View>
    </View>
  );
}

function ProductPanel({ product }: { product: Product }) {
  const { t } = useTranslation();
  const enquiries = useEnquiries({ productId: product.id, limit: 20 });
  const rows = enquiries.data ?? [];
  return (
    <Card className="w-[300px] gap-3.5 p-5">
      <View className="h-[120px] items-center justify-center rounded-lg bg-gray-2 dark:bg-dark-3">
        <Icon name="package" size={36} color={colors.dark[6]} />
      </View>
      <View>
        <Text className="font-latin text-xs text-body">{product.code}</Text>
        <Text className="font-bold text-lg text-dark dark:text-white">{product.name}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {[
          [t('products.brand'), product.brand],
          [t('products.cols.category'), product.category],
          [t('products.cols.size'), `${product.packSize ?? ''} / ${product.unit ?? ''}`],
        ].map(([label, value]) => (
          <View key={label} className="min-w-[130px] flex-1 rounded-lg bg-gray-1 p-2.5 dark:bg-dark">
            <Text className="font-sans text-xs text-body">{label}</Text>
            <Text className="font-semibold text-sm text-dark dark:text-white">{value ?? '—'}</Text>
          </View>
        ))}
      </View>
      <SectionLabel>{t('products.relatedEnquiries', { count: rows.length })}</SectionLabel>
      <ScrollView contentContainerClassName="gap-2">
        {rows.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/inbox', params: { id: e.id } })}
            className="gap-0.5 rounded-lg border border-stroke px-3 py-2.5 active:bg-gray-1 dark:border-stroke-dark"
          >
            <View className="flex-row items-center gap-1.5">
              <Text className="font-latin text-xs text-body">{e.reference}</Text>
              <Badge label={t(`enquiry.status.${e.status}`)} tone={statusTone[e.status]} />
            </View>
            <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">
              {e.customer?.companyName} · {e.subject}
            </Text>
          </Pressable>
        ))}
        {!rows.length && <Text className="font-sans text-sm text-body">{t('products.noEnquiries')}</Text>}
      </ScrollView>
    </Card>
  );
}
