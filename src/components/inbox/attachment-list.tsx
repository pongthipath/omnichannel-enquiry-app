import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { formatBytes } from '../../helpers/format.helper';
import { Attachment, fileUrl } from '../../services/attachment.service';
import { cn } from '../../utils/cn';
import colors from '../../theme/colors';
import { Icon } from '../common';

/**
 * Attachments under a message bubble (design §17). Images show as a thumbnail, anything else as a
 * row with its name and size. An image still being copied from the channel shows a quiet hint
 * instead of a broken picture.
 */
export function AttachmentList({ attachments, mine }: { attachments: Attachment[]; mine: boolean }) {
  const { t } = useTranslation();
  if (!attachments.length) return null;

  return (
    <View className="gap-1.5 pt-1.5">
      {attachments.map((a) => {
        const open = () => void Linking.openURL(fileUrl(a));

        if (a.kind === 'IMAGE') {
          if (a.status !== 'STORED') {
            return (
              <View key={a.id} className="h-20 w-32 items-center justify-center rounded-lg bg-gray-2 dark:bg-dark-3">
                <Text className="font-sans text-xs text-body dark:text-body-dark">
                  {a.status === 'PENDING' ? t('inbox.attachment.saving') : t('inbox.attachment.failed')}
                </Text>
              </View>
            );
          }
          return (
            <Pressable key={a.id} accessibilityRole="imagebutton" accessibilityLabel={a.fileName} onPress={open}>
              <Image
                source={{ uri: fileUrl(a) }}
                accessibilityLabel={a.fileName}
                resizeMode="cover"
                className="h-40 w-52 rounded-lg bg-gray-2 dark:bg-dark-3"
              />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={a.fileName}
            onPress={open}
            className={cn(
              'min-h-9 flex-row items-center gap-2 rounded-lg border px-2.5 py-1.5 active:opacity-70',
              mine ? 'border-white/30 bg-white/10' : 'border-stroke bg-gray-1 dark:border-stroke-dark dark:bg-dark-3',
            )}
          >
            <Icon name="paperclip" size={14} color={mine ? colors.white : colors.dark[5]} />
            <View className="flex-shrink">
              <Text numberOfLines={1} className={cn('font-sans text-xs', mine ? 'text-white' : 'text-dark dark:text-white')}>
                {a.fileName}
              </Text>
              <Text className={cn('font-sans text-xs', mine ? 'text-white/70' : 'text-body dark:text-body-dark')}>
                {formatBytes(a.sizeBytes)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
