import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text, View } from 'react-native';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Icon, IconName } from './icon';

const avatarColors = ['#1B44C8', '#0B76B7', '#1A8245', '#9D5425', '#374151', '#6D28D9', '#B42318'];

/** Round initial avatar; the color is stable per name. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColors[hash % avatarColors.length] }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.4 }} className="font-bold text-white">
        {initial}
      </Text>
    </View>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <View className={cn('items-center justify-center py-10', className)}>
      <ActivityIndicator color={colors.primary.DEFAULT} />
    </View>
  );
}

export function EmptyState({ icon = 'inbox', title, message, action }: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-2 px-6 py-12">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-gray-2 dark:bg-dark-3">
        <Icon name={icon} size={22} color={colors.dark[5]} />
      </View>
      <Text className="text-center font-semibold text-base text-dark dark:text-white">{title}</Text>
      {message ? <Text className="text-center font-sans text-sm text-body dark:text-body-dark">{message}</Text> : null}
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  className,
  color,
  size = 'md',
  ...rest
}: Omit<PressableProps, 'children'> & { icon: IconName; label: string; className?: string; color?: string; size?: 'sm' | 'md' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={cn(
        'items-center justify-center rounded-md active:bg-gray-2 dark:active:bg-dark-3',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} color={color ?? colors.body.DEFAULT} />
    </Pressable>
  );
}

/** Filter chip (status filters, categories). */
export function Chip({ label, count, selected, onPress }: { label: string; count?: number; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={cn(
        'min-h-8 flex-row items-center gap-1 rounded-full border px-3',
        selected
          ? 'border-primary bg-primary-light dark:border-primary dark:bg-dark-3'
          : 'border-stroke bg-white active:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2',
      )}
    >
      <Text className={cn('text-xs', selected ? 'font-semibold text-primary-dark dark:text-white' : 'font-sans text-dark-4 dark:text-dark-6')}>
        {label}
      </Text>
      {count !== undefined && (
        <Text className={cn('font-bold text-xs', selected ? 'text-primary-dark dark:text-white' : 'text-dark-4 dark:text-dark-6')}>
          {count}
        </Text>
      )}
    </Pressable>
  );
}

/** Underline tabs (Context Panel, settings sub-views). */
export function UnderlineTabs<T extends string>({ tabs, value, onChange }: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" className="flex-row border-b border-stroke px-2 dark:border-stroke-dark">
      {tabs.map((tab) => {
        const on = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(tab.value)}
            className={cn('min-h-12 flex-1 items-center justify-center border-b-2', on ? 'border-primary' : 'border-transparent')}
          >
            <Text className={cn('text-sm', on ? 'font-bold text-primary' : 'font-sans text-body dark:text-body-dark')}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Section label inside panels. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text className="font-semibold text-xs text-body dark:text-body-dark">{children}</Text>;
}

/** Label / value row in detail panels. */
export function InfoRow({ label, value, valueClassName }: { label: string; value: ReactNode; valueClassName?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-sans text-sm text-body dark:text-body-dark">{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text numberOfLines={1} className={cn('flex-shrink font-sans text-sm text-dark dark:text-white', valueClassName)}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
