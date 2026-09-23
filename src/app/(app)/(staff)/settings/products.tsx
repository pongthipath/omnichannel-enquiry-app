import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  TextField,
} from '../../../../components/common';
import { PageHeader } from '../../../../components/layout/page-header';
import { Permission } from '../../../../constants/permissions';
import { errorMessage } from '../../../../helpers/error.helper';
import { useProductMutations, useProductsSettings } from '../../../../hooks/queries/use-catalog';
import { usePermissions } from '../../../../hooks/use-permissions';
import { ProductSettings } from '../../../../services/catalog.service';
import colors from '../../../../theme/colors';
import { cn } from '../../../../utils/cn';

interface Form {
  code: string;
  name: string;
  category: string;
  brand: string;
  packSize: string;
  unit: string;
}
const EMPTY: Form = { code: '', name: '', category: '', brand: '', packSize: '', unit: '' };

/**
 * Settings › Products. Same shape as the other master-data pages: a list on the left, the form on
 * the right. Products are switched off rather than deleted, so enquiries that already mention one
 * keep showing it while it disappears from the pickers.
 */
export default function ProductSettingsScreen() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(Permission.SETTINGS_PRODUCT_MANAGE);
  const products = useProductsSettings(canManage);
  const { create, update } = useProductMutations();
  const [editing, setEditingState] = useState<ProductSettings | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [search, setSearch] = useState('');
  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  /** Opening the panel fills the form from the row (or blank for "new") and clears old errors. */
  const setEditing = (next: ProductSettings | 'new' | null) => {
    setEditingState(next);
    setForm(
      next && next !== 'new'
        ? {
            code: next.code,
            name: next.name,
            category: next.category ?? '',
            brand: next.brand ?? '',
            packSize: next.packSize ?? '',
            unit: next.unit ?? '',
          }
        : EMPTY,
    );
    create.reset();
    update.reset();
  };

  if (!canManage) return <EmptyState icon="lock" title={t('common.noAccess')} />;

  const save = () => {
    const input = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      packSize: form.packSize.trim(),
      unit: form.unit.trim(),
    };
    if (!input.code || !input.name) return;
    if (editing === 'new') create.mutate(input, { onSuccess: () => setEditing(null) });
    else if (editing) update.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  };

  const term = search.trim().toLowerCase();
  const list = (products.data ?? []).filter((p) =>
    term ? `${p.code} ${p.name} ${p.brand ?? ''} ${p.category ?? ''}`.toLowerCase().includes(term) : true,
  );

  return (
    <View className="flex-1 gap-3 p-4">
      <PageHeader
        title={t('productSettings.title')}
        subtitle={t('productSettings.subtitle', { count: products.data?.length ?? 0 })}
        actions={<Button title={`+ ${t('productSettings.create')}`} onPress={() => setEditing('new')} />}
      />
      {Boolean(error) && <Alert tone="error" message={errorMessage(error, t)} />}

      <View className="flex-1 flex-row gap-4">
        <Card className="flex-1 overflow-hidden">
          <View className="border-b border-stroke p-3 dark:border-stroke-dark">
            <TextField
              label={t('common.search')}
              value={search}
              onChangeText={setSearch}
              placeholder={t('productSettings.searchPlaceholder')}
            />
          </View>
          <View className="flex-row bg-gray-1 px-4 py-2.5 dark:bg-dark">
            <Text className="flex-[1.2] font-semibold text-xs text-body">{t('productSettings.code')}</Text>
            <Text className="flex-[3] font-semibold text-xs text-body">{t('productSettings.name')}</Text>
            <Text className="flex-[1.2] font-semibold text-xs text-body">{t('productSettings.brand')}</Text>
            <Text className="flex-1 font-semibold text-xs text-body">{t('productSettings.packSize')}</Text>
            <Text className="w-16 text-right font-semibold text-xs text-body">{t('productSettings.enquiries')}</Text>
            <Text className="w-20 text-right font-semibold text-xs text-body">{t('productSettings.active')}</Text>
          </View>
          {products.isPending ? (
            <Spinner />
          ) : list.length === 0 ? (
            <EmptyState icon="package" title={t('productSettings.empty')} />
          ) : (
            <ScrollView>
              {list.map((p) => {
                const on = editing !== 'new' && editing?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('productSettings.editOne', { name: p.name })}
                    onPress={() => setEditing(p)}
                    className={cn(
                      'flex-row items-center border-t border-gray-2 px-4 py-2.5 dark:border-dark-3',
                      on ? 'bg-primary-light dark:bg-dark-3' : 'active:bg-gray-1',
                      !p.isActive && 'opacity-50',
                    )}
                  >
                    <Text className="flex-[1.2] font-latin text-xs text-body">{p.code}</Text>
                    <View className="flex-[3] pr-2">
                      <Text numberOfLines={1} className="font-semibold text-sm text-dark dark:text-white">
                        {p.name}
                      </Text>
                      {p.category ? <Badge label={p.category} tone="gray" /> : null}
                    </View>
                    <Text numberOfLines={1} className="flex-[1.2] font-sans text-sm text-dark-4 dark:text-dark-6">
                      {p.brand ?? '—'}
                    </Text>
                    <Text className="flex-1 font-sans text-sm text-body">
                      {[p.packSize, p.unit].filter(Boolean).join(' / ') || '—'}
                    </Text>
                    <Text className="w-16 text-right font-bold text-sm text-dark dark:text-white">{p.enquiries}</Text>
                    <View className="w-20 items-end">
                      <Switch
                        value={p.isActive}
                        onValueChange={(isActive) => update.mutate({ id: p.id, input: { isActive } })}
                        trackColor={{ true: colors.green.DEFAULT }}
                        accessibilityLabel={t('productSettings.active')}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Card>

        {editing && (
          <Card className="w-[320px] gap-3 p-4">
            <Text className="font-bold text-base text-dark dark:text-white">
              {editing === 'new' ? t('productSettings.create') : t('productSettings.edit')}
            </Text>
            <TextField
              label={t('productSettings.code')}
              hint={t('productSettings.codeHint')}
              value={form.code}
              onChangeText={(code) => setForm((f) => ({ ...f, code }))}
              autoCapitalize="characters"
              maxLength={40}
            />
            <TextField
              label={t('productSettings.name')}
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              maxLength={200}
            />
            <TextField
              label={t('productSettings.category')}
              value={form.category}
              onChangeText={(category) => setForm((f) => ({ ...f, category }))}
              maxLength={80}
            />
            <TextField
              label={t('productSettings.brand')}
              value={form.brand}
              onChangeText={(brand) => setForm((f) => ({ ...f, brand }))}
              maxLength={80}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextField
                  label={t('productSettings.packSize')}
                  value={form.packSize}
                  onChangeText={(packSize) => setForm((f) => ({ ...f, packSize }))}
                  maxLength={40}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t('productSettings.unit')}
                  value={form.unit}
                  onChangeText={(unit) => setForm((f) => ({ ...f, unit }))}
                  maxLength={20}
                />
              </View>
            </View>
            {editing !== 'new' && editing.enquiries > 0 && (
              <Alert tone="info" message={t('productSettings.inUse', { count: editing.enquiries })} />
            )}
            <View className="flex-row gap-2">
              <Button
                title={t('common.save')}
                onPress={save}
                loading={saving}
                disabled={!form.code.trim() || !form.name.trim()}
              />
              <Button title={t('common.cancel')} variant="outline" onPress={() => setEditing(null)} />
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}
