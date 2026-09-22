import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { formatDay } from '../../helpers/format.helper';
import { isSameDay } from '../../helpers/message.helper';
import { useMessages } from '../../hooks/queries/use-messages';
import { SenderType } from '../../services/message.service';
import { Button, Spinner } from '../common';
import { MessageItem } from './message-item';

/** Scrollable thread with day separators; stays pinned to the newest message. */
export function MessageList({ chatId, mySide }: { chatId: string; mySide: SenderType }) {
  const { t, i18n } = useTranslation();
  const messages = useMessages(chatId);
  const scroll = useRef<ScrollView>(null);

  if (messages.isPending) return <Spinner className="flex-1" />;
  const items = messages.data ?? [];

  return (
    <ScrollView
      ref={scroll}
      className="flex-1"
      contentContainerClassName="gap-3.5 p-5"
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
    >
      {messages.hasNextPage && (
        <Button
          title={t('inbox.loadOlder')}
          variant="ghost"
          size="sm"
          loading={messages.isFetchingNextPage}
          onPress={() => void messages.fetchNextPage()}
          className="self-center"
        />
      )}
      {items.map((m, i) => (
        <View key={m.id} className="gap-3.5">
          {(i === 0 || !isSameDay(items[i - 1].createdAt, m.createdAt)) && (
            <View className="self-center rounded-full bg-gray-2 px-2.5 py-0.5 dark:bg-dark-3">
              <Text className="font-sans text-xs text-body dark:text-body-dark">{formatDay(m.createdAt, i18n.language, t)}</Text>
            </View>
          )}
          <MessageItem message={m} mine={m.senderType === mySide} />
        </View>
      ))}
    </ScrollView>
  );
}
