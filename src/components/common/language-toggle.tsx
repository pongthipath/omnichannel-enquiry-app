import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { LANGUAGES, setLanguage } from '../../i18n/language';
import { cn } from '../../utils/cn';

/** TH | EN switch. `tone="dark"` for the dark sidebar / blue headers. */
export function LanguageToggle({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { t, i18n } = useTranslation();
  const dark = tone === 'dark';
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.language')}
      className={cn('flex-row rounded-md p-0.5', dark ? 'bg-white/10' : 'bg-gray-2 dark:bg-dark-3')}
    >
      {LANGUAGES.map((lng) => {
        const on = i18n.language === lng;
        return (
          <Pressable
            key={lng}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={lng === 'th' ? 'ภาษาไทย' : 'English'}
            onPress={() => void setLanguage(lng)}
            className={cn(
              'min-h-7 min-w-9 items-center justify-center rounded px-2',
              on && (dark ? 'bg-white/20' : 'bg-white shadow-card dark:bg-dark-2'),
            )}
          >
            <Text
              className={cn(
                'font-latin text-xs font-bold',
                on ? (dark ? 'text-white' : 'text-primary') : dark ? 'text-gray-5' : 'text-body',
              )}
            >
              {lng.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
