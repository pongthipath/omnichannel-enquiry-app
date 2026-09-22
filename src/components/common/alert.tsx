import { Text, View } from 'react-native';
import { cn } from '../../utils/cn';

type Tone = 'error' | 'success' | 'warning' | 'info';

const tones: Record<Tone, { box: string; bar: string; text: string }> = {
  error: { box: 'bg-red-light dark:bg-dark-3', bar: 'bg-red', text: 'text-red dark:text-red-dark' },
  success: { box: 'bg-green-light dark:bg-dark-3', bar: 'bg-green', text: 'text-green dark:text-green-dark' },
  warning: { box: 'bg-yellow-light dark:bg-dark-3', bar: 'bg-yellow-dark', text: 'text-yellow dark:text-yellow-dark' },
  info: { box: 'bg-cyan-light dark:bg-dark-3', bar: 'bg-cyan', text: 'text-cyan dark:text-white' },
};

/** Tailgrids "Alert" — tinted box with a left accent bar. */
export function Alert({ tone = 'info', title, message }: { tone?: Tone; title?: string; message?: string }) {
  const s = tones[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn('flex-row overflow-hidden rounded-md', s.box)}
    >
      <View className={cn('w-1.5', s.bar)} />
      <View className="flex-1 gap-0.5 px-4 py-3">
        {title && <Text className={cn('font-semibold text-sm', s.text)}>{title}</Text>}
        {!!message && <Text className={cn('font-sans text-sm', s.text)}>{message}</Text>}
      </View>
    </View>
  );
}
