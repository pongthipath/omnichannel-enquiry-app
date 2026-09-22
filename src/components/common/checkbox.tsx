import { Pressable, Text, View } from 'react-native';
import { cn } from '../../utils/cn';

/** Tailgrids "Checkbox" with its label — the whole row is the touch target. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className="min-h-11 flex-row items-center gap-3 self-start"
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded border',
          checked ? 'border-primary bg-primary' : 'border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2',
        )}
      >
        {checked && <Text className="font-bold text-xs text-white">✓</Text>}
      </View>
      <Text className="font-sans text-sm text-body dark:text-body-dark">{label}</Text>
    </Pressable>
  );
}
