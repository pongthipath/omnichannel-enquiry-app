import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { errorMessage } from '../../helpers/error.helper';
import { newClientMessageId, useSendMessage } from '../../hooks/queries/use-messages';
import colors from '../../theme/colors';
import { useTheme } from '../../theme/use-theme';
import { cn } from '../../utils/cn';
import { Icon, SegmentedTabs } from '../common';

type Mode = 'reply' | 'internal';

/**
 * Reply box. Staff can switch to an internal note (yellow, hidden from the customer) and use quick replies.
 * Enter sends on web, Shift+Enter makes a new line.
 */
export function Composer({
  chatId,
  staff,
  disabledReason,
}: {
  chatId: string;
  staff: boolean;
  /** shown instead of the box (e.g. closed enquiry, no reply permission) */
  disabledReason?: string;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const [mode, setMode] = useState<Mode>('reply');
  const [body, setBody] = useState('');
  const send = useSendMessage(chatId, staff ? 'STAFF' : 'CUSTOMER');
  const internal = mode === 'internal';

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate({ body: text, isInternal: internal, clientMessageId: newClientMessageId() });
    setBody('');
  };

  if (disabledReason) {
    return (
      <View className="border-t border-stroke bg-gray-1 px-5 py-4 dark:border-stroke-dark dark:bg-dark-2">
        <Text className="text-center font-sans text-sm text-body dark:text-body-dark">{disabledReason}</Text>
      </View>
    );
  }

  const quick = [t('inbox.quick.sorry'), t('inbox.quick.morePhoto'), t('inbox.quick.checking')];

  return (
    <View className="gap-2 border-t border-stroke bg-white px-5 pb-4 pt-3 dark:border-stroke-dark dark:bg-dark-2">
      {staff && (
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="w-[220px]">
            <SegmentedTabs
              options={[
                { value: 'reply' as const, label: t('inbox.reply') },
                { value: 'internal' as const, label: t('inbox.internal') },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
          <View className="flex-1" />
          {!internal &&
            quick.map((q) => (
              <Pressable
                key={q}
                accessibilityRole="button"
                onPress={() => setBody((b) => (b ? `${b} ${q}` : q))}
                className="min-h-8 justify-center rounded-full border border-stroke px-3 active:bg-gray-2 dark:border-stroke-dark"
              >
                <Text className="font-sans text-xs text-dark-3 dark:text-gray-3">{q}</Text>
              </Pressable>
            ))}
        </View>
      )}
      {send.isError && <Text className="font-sans text-xs text-red">{errorMessage(send.error, t)}</Text>}
      <View
        className={cn(
          'flex-row items-end gap-2 rounded-lg border py-2 pl-3.5 pr-2',
          internal ? 'border-yellow-dark bg-yellow-light dark:bg-dark-3' : 'border-primary bg-white dark:bg-dark-2',
        )}
      >
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder={internal ? t('inbox.internalPlaceholder') : staff ? t('inbox.replyPlaceholder') : t('inbox.customerPlaceholder')}
          placeholderTextColor={c.placeholder}
          accessibilityLabel={internal ? t('inbox.internalPlaceholder') : staff ? t('inbox.replyPlaceholder') : t('inbox.customerPlaceholder')}
          onKeyPress={(e) => {
            const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
            if (ev.key === 'Enter' && !ev.shiftKey) {
              (e as unknown as { preventDefault?: () => void }).preventDefault?.();
              submit();
            }
          }}
          className="max-h-32 min-h-[44px] flex-1 py-2 font-sans text-base text-dark outline-none dark:text-white"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('inbox.send')}
          disabled={!body.trim()}
          onPress={submit}
          className={cn('h-10 w-10 items-center justify-center rounded-md', internal ? 'bg-yellow' : 'bg-primary', !body.trim() && 'opacity-40')}
        >
          <Icon name="send" color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
