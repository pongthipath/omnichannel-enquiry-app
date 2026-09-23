import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { useOffline } from '../../hooks/use-offline';
import colors from '../../theme/colors';
import { cn } from '../../utils/cn';
import { Icon } from './icon';

/**
 * One line across the top when the connection is gone, or when messages are still waiting to be sent
 * (design §14). Nothing is blocked while it shows — the user keeps writing and it all goes out later.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { online, pending, sync } = useOffline();
  if (online && pending === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('offline.retry')}
      onPress={() => void sync()}
      className={cn('flex-row items-center gap-2 px-3 py-1.5', online ? 'bg-yellow-light' : 'bg-dark-3')}
    >
      <Icon name={online ? 'clock' : 'wifiOff'} size={14} color={online ? colors.yellow.DEFAULT : colors.white} />
      <Text className={cn('flex-1 font-sans text-xs', online ? 'text-yellow' : 'text-white')}>
        {online ? t('offline.pending', { count: pending }) : t('offline.title')}
      </Text>
      {pending > 0 && (
        <Text className={cn('font-semibold text-xs', online ? 'text-yellow' : 'text-white')}>{t('offline.retry')}</Text>
      )}
    </Pressable>
  );
}
