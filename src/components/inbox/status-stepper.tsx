import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { statusStep } from '../../helpers/enquiry-status.helper';
import { ChatStatus, STATUS_FLOW } from '../../services/enquiry.service';
import { cn } from '../../utils/cn';

/** Six-step progress bar: done steps and the current one are blue. */
export function StatusStepper({ status, compact }: { status: ChatStatus; compact?: boolean }) {
  const { t } = useTranslation();
  const current = statusStep(status);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('inbox.stepperLabel', { status: t(`enquiry.status.${status}`) })}
      className="flex-row gap-1"
    >
      {STATUS_FLOW.map((s, i) => (
        <View key={s} className="flex-1 gap-1">
          <View className={cn('h-1 rounded-full', i <= current ? 'bg-primary' : 'bg-gray-3 dark:bg-dark-3')} />
          {!compact && (
            <Text
              numberOfLines={1}
              className={cn('text-[11px]', i === current ? 'font-bold text-primary-dark dark:text-white' : 'font-sans text-dark-5')}
            >
              {t(`enquiry.statusShort.${s}`)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
