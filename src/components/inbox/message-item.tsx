import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { eventText, eventTone } from '../../helpers/message.helper';
import { formatTime } from '../../helpers/format.helper';
import { Message } from '../../services/message.service';
import { cn } from '../../utils/cn';
import { Avatar } from '../common';
import { AttachmentList } from './attachment-list';

const pill = {
  blue: { box: 'bg-primary-light dark:bg-dark-3', text: 'text-dark-4 dark:text-gray-3' },
  green: { box: 'bg-green-light dark:bg-dark-3', text: 'text-green dark:text-green-dark' },
  yellow: { box: 'bg-yellow-light dark:bg-dark-3', text: 'text-yellow dark:text-yellow-dark' },
  gray: { box: 'bg-gray-2 dark:bg-dark-3', text: 'text-dark-4 dark:text-dark-6' },
};

/**
 * One row of a thread. `mine` = right side (the viewer's side: staff for the console, customer for the app).
 * Internal notes are yellow and labelled — customers never receive them.
 */
export function MessageItem({ message: m, mine }: { message: Message; mine: boolean }) {
  const { t, i18n } = useTranslation();

  if (m.messageType === 'EVENT') {
    const tone = pill[eventTone(m)];
    return (
      <View className={cn('max-w-[90%] self-center rounded-xl px-3 py-1', tone.box)}>
        <Text className={cn('text-center font-sans text-xs', tone.text)}>
          {eventText(m, t)} · {formatTime(m.createdAt, i18n.language)}
        </Text>
      </View>
    );
  }

  const pending = m.id.startsWith('pending-');
  const meta = [
    !mine || m.senderType === 'STAFF' ? m.senderName : null,
    formatTime(m.createdAt, i18n.language),
    t(`enquiry.channel.${m.channel}`),
    pending ? t('inbox.sending') : m.readAt && mine ? t('inbox.read') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (m.isInternal) {
    return (
      <View className="max-w-[85%] gap-1 self-end">
        <View className="rounded-xl border border-dashed border-yellow-dark bg-yellow-light px-3.5 py-2.5 dark:bg-dark-3">
          <Text className="pb-0.5 font-semibold text-xs text-yellow dark:text-yellow-dark">{t('inbox.internalNote')}</Text>
          {Boolean(m.body) && <Text className="font-sans text-sm text-dark dark:text-white">{m.body}</Text>}
          <AttachmentList attachments={m.attachments} mine={false} />
        </View>
        <Text className="self-end font-sans text-xs text-body dark:text-body-dark">{meta}</Text>
      </View>
    );
  }

  if (mine) {
    return (
      <View className={cn('max-w-[80%] gap-1 self-end', pending && 'opacity-60')}>
        <View className="rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5">
          {Boolean(m.body) && <Text className="font-sans text-sm leading-[22px] text-white">{m.body}</Text>}
          <AttachmentList attachments={m.attachments} mine />
        </View>
        <Text className="self-end font-sans text-xs text-body dark:text-body-dark">{meta}</Text>
      </View>
    );
  }

  return (
    <View className="max-w-[80%] flex-row items-end gap-2 self-start">
      <Avatar name={m.senderName ?? '?'} size={28} />
      <View className="flex-shrink gap-1">
        <View className="rounded-2xl rounded-bl-md border border-stroke bg-white px-3.5 py-2.5 dark:border-stroke-dark dark:bg-dark-2">
          {Boolean(m.body) && <Text className="font-sans text-sm leading-[22px] text-dark dark:text-white">{m.body}</Text>}
          <AttachmentList attachments={m.attachments} mine={false} />
        </View>
        <Text className="font-sans text-xs text-body dark:text-body-dark">{meta}</Text>
      </View>
    </View>
  );
}
