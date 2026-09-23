import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { errorMessage } from '../../helpers/error.helper';
import { newClientMessageId, useSendMessage } from '../../hooks/queries/use-messages';
import colors from '../../theme/colors';
import { useTheme } from '../../theme/use-theme';
import { cn } from '../../utils/cn';
import { Icon, IconButton } from '../common';

/**
 * Reply box: one compact row. Staff get quick replies behind the ⚡ button, and can fold the whole box
 * away (chevron) when they are only reading. `internal` = the notes box of the right panel.
 * Enter sends on web, Shift+Enter makes a new line.
 */
export function Composer({
  chatId,
  staff,
  internal = false,
  disabledReason,
  startCollapsed = false,
}: {
  chatId: string;
  staff: boolean;
  internal?: boolean;
  /** shown instead of the box (e.g. closed enquiry, no reply permission) */
  disabledReason?: string;
  startCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const [body, setBody] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const send = useSendMessage(chatId, staff ? 'STAFF' : 'CUSTOMER');
  const placeholder = internal ? t('inbox.internalPlaceholder') : staff ? t('inbox.replyPlaceholder') : t('inbox.customerPlaceholder');

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    send.mutate({ body: text, isInternal: internal, clientMessageId: newClientMessageId() });
    setBody('');
  };

  if (disabledReason) {
    return (
      <View className="border-t border-stroke bg-gray-1 px-4 py-3 dark:border-stroke-dark dark:bg-dark-2">
        <Text className="text-center font-sans text-sm text-body dark:text-body-dark">{disabledReason}</Text>
      </View>
    );
  }

  if (collapsed) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setCollapsed(false)}
        className="flex-row items-center gap-2 border-t border-stroke bg-white px-4 py-2.5 active:bg-gray-1 dark:border-stroke-dark dark:bg-dark-2"
      >
        <Icon name="edit" size={14} color={colors.primary.DEFAULT} />
        <Text className="flex-1 font-sans text-sm text-body">{placeholder}</Text>
        <Icon name="chevronUp" size={14} color={colors.dark[5]} />
      </Pressable>
    );
  }

  const quick = [t('inbox.quick.sorry'), t('inbox.quick.morePhoto'), t('inbox.quick.checking')];
  const showTools = staff && !internal;

  return (
    <View className={cn('gap-1.5 border-t border-stroke px-3 py-2 dark:border-stroke-dark', internal ? 'bg-yellow-light dark:bg-dark-3' : 'bg-white dark:bg-dark-2')}>
      {showTools && quickOpen && (
        <View className="flex-row flex-wrap gap-1.5">
          {quick.map((q) => (
            <Pressable
              key={q}
              accessibilityRole="button"
              onPress={() => {
                setBody((b) => (b ? `${b} ${q}` : q));
                setQuickOpen(false);
              }}
              className="min-h-7 justify-center rounded-full border border-stroke bg-white px-2.5 active:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2"
            >
              <Text className="font-sans text-xs text-dark-3 dark:text-gray-3">{q}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {send.isError && <Text className="font-sans text-xs text-red">{errorMessage(send.error, t)}</Text>}
      <View className="flex-row items-end gap-1">
        {showTools && (
          <IconButton icon="zap" label={t('inbox.quickReplies')} size="sm" color={quickOpen ? colors.primary.DEFAULT : undefined} onPress={() => setQuickOpen((o) => !o)} />
        )}
        <View
          className={cn(
            'flex-1 flex-row items-end rounded-lg border px-2.5',
            internal ? 'border-yellow-dark bg-white dark:bg-dark-2' : 'border-stroke bg-white focus-within:border-primary dark:border-stroke-dark dark:bg-dark-2',
          )}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            placeholder={placeholder}
            placeholderTextColor={c.placeholder}
            accessibilityLabel={placeholder}
            onKeyPress={(e) => {
              const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
              if (ev.key === 'Enter' && !ev.shiftKey) {
                (e as unknown as { preventDefault?: () => void }).preventDefault?.();
                submit();
              }
            }}
            className="max-h-28 min-h-[36px] flex-1 py-1.5 font-sans text-base text-dark outline-none dark:text-white"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('inbox.send')}
          disabled={!body.trim()}
          onPress={submit}
          className={cn('h-9 w-9 items-center justify-center rounded-md', internal ? 'bg-yellow' : 'bg-primary', !body.trim() && 'opacity-40')}
        >
          <Icon name="send" size={16} color={colors.white} />
        </Pressable>
        {staff && !internal && (
          <IconButton icon="chevronDown" label={t('inbox.hideComposer')} size="sm" onPress={() => setCollapsed(true)} />
        )}
      </View>
    </View>
  );
}
