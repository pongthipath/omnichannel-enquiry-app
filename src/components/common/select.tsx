import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import colors from '../../theme/colors';
import { useTheme } from '../../theme/use-theme';
import { cn } from '../../utils/cn';
import { Icon } from './icon';
import { Modal } from './modal';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Tailgrids "Select" that works the same on web and phones: a field button that opens a list
 * (with search when there are many options).
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  compact,
}: {
  label?: string;
  value: T | null | undefined;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value);
  const filtered = useMemo(
    () => (q ? options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q],
  );

  return (
    <View className="gap-2">
      {label ? <Text className="font-semibold text-sm text-dark dark:text-white">{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${current?.label ?? placeholder ?? ''}` : current?.label}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          'flex-row items-center justify-between gap-2 rounded-md border border-stroke bg-white px-3 dark:border-stroke-dark dark:bg-dark-2',
          compact ? 'min-h-9' : 'min-h-11',
          disabled && 'opacity-50',
        )}
      >
        <Text
          numberOfLines={1}
          className={cn('flex-1 font-sans', compact ? 'text-sm' : 'text-base', current ? 'text-dark dark:text-white' : 'text-dark-6')}
        >
          {current?.label ?? placeholder ?? t('common.select')}
        </Text>
        <Icon name="chevronDown" size={16} color={colors.dark[5]} />
      </Pressable>

      <Modal visible={open} onClose={() => setOpen(false)} title={label ?? t('common.select')} width="sm">
        {options.length > 8 && (
          <View className="min-h-11 flex-row items-center gap-2 rounded-md border border-stroke px-3 dark:border-stroke-dark">
            <Icon name="search" size={16} color={colors.dark[5]} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('common.search')}
              placeholderTextColor={c.placeholder}
              className="flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white"
            />
          </View>
        )}
        <View className="gap-1">
          {filtered.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ('');
                }}
                className={cn(
                  'min-h-11 flex-row items-center gap-3 rounded-md px-3',
                  selected ? 'bg-primary-light dark:bg-dark-3' : 'active:bg-gray-2 dark:active:bg-dark-3',
                )}
              >
                <View className="flex-1">
                  <Text className={cn('text-base', selected ? 'font-semibold text-primary-dark dark:text-white' : 'font-sans text-dark dark:text-white')}>
                    {o.label}
                  </Text>
                  {o.hint ? <Text className="font-sans text-xs text-body dark:text-body-dark">{o.hint}</Text> : null}
                </View>
                {selected && <Icon name="check" size={16} color={colors.primary.DEFAULT} />}
              </Pressable>
            );
          })}
          {!filtered.length && (
            <Text className="py-6 text-center font-sans text-sm text-body dark:text-body-dark">{t('common.noResults')}</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}
