import { Pressable, Text, View } from 'react-native';
import { cn } from '../../utils/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

/** Tailgrids "Tabs" (pill style) — switches between a few views of the same screen. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" className="flex-row rounded-lg bg-gray-2 p-1 dark:bg-dark-3">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            // shadow-none on the inactive pill is deliberate: a shadow is a CSS variable, and
            // NativeWind remounts (and warns) when a component gains its first variable later on
            className={cn(
              'min-h-8 flex-1 items-center justify-center rounded-md px-2',
              active ? 'bg-white shadow-card dark:bg-dark-2' : 'shadow-none',
            )}
          >
            <Text
              className={cn(
                'text-sm',
                active ? 'font-semibold text-primary dark:text-white' : 'font-sans text-body dark:text-body-dark',
              )}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
