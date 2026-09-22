import { Text, View } from 'react-native';
import { cn } from '../../utils/cn';

export type BadgeTone = 'gray' | 'primary' | 'green' | 'yellow' | 'red' | 'cyan';

// Text colors meet 4.5:1 on their tint
const tones: Record<BadgeTone, { box: string; text: string }> = {
  gray: { box: 'bg-gray-2 dark:bg-dark-3', text: 'text-dark-4 dark:text-dark-6' },
  primary: { box: 'bg-primary-light dark:bg-dark-3', text: 'text-primary-dark dark:text-white' },
  green: { box: 'bg-green-light dark:bg-dark-3', text: 'text-green dark:text-green-dark' },
  yellow: { box: 'bg-yellow-light dark:bg-dark-3', text: 'text-yellow dark:text-yellow-dark' },
  red: { box: 'bg-red-light dark:bg-dark-3', text: 'text-red dark:text-red-dark' },
  cyan: { box: 'bg-cyan-light dark:bg-dark-3', text: 'text-cyan dark:text-white' },
};

/** Tailgrids "Badge" — small rounded label. */
export function Badge({ label, tone = 'gray', className }: { label: string; tone?: BadgeTone; className?: string }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-0.5', tones[tone].box, className)}>
      <Text className={cn('font-semibold text-xs', tones[tone].text)}>{label}</Text>
    </View>
  );
}
