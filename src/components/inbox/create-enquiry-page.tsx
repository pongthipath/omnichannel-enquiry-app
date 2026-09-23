import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { Enquiry, EnquiryType } from '../../services/enquiry.service';
import { Button, IconButton } from '../common';
import { EnquiryDraftFields, EnquiryDraftProductPicker, useEnquiryDraft } from './enquiry-draft';

/**
 * New enquiry as a full page (phone app): the create button pushes this on top of the list, and
 * back returns to where you were. The browser opens the same form in a dialog instead.
 */
export function CreateEnquiryPage({ asStaff, initialType, fallback, edges = ['top', 'bottom'], onCreated }: {
  asStaff: boolean;
  initialType?: EnquiryType;
  /** where back goes when this page was opened directly (deep link, reload) */
  fallback: string;
  /** insets this page owns — none of them when the shell around it already keeps clear */
  edges?: readonly Edge[];
  onCreated?: (enquiry: Enquiry) => void;
}) {
  const { t } = useTranslation();
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback as never));
  const draft = useEnquiryDraft({ asStaff, initialType, onCreated, onDone: back });

  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={edges}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center gap-1 border-b border-stroke bg-white px-1 py-2 dark:border-stroke-dark dark:bg-dark-2">
          <IconButton icon="chevronLeft" label={t('common.back')} onPress={back} />
          <View className="min-w-0 flex-1 pr-2">
            <Text accessibilityRole="header" numberOfLines={1} className="font-bold text-base text-dark dark:text-white">
              {asStaff ? t('inbox.createModal.titleStaff') : t('inbox.createModal.title')}
            </Text>
            <Text numberOfLines={2} className="font-sans text-xs text-body dark:text-body-dark">
              {asStaff ? t('inbox.createModal.descriptionStaff') : t('inbox.createModal.description')}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
          <EnquiryDraftFields draft={draft} />
        </ScrollView>

        <View className="flex-row gap-2 border-t border-stroke bg-white px-4 py-3 dark:border-stroke-dark dark:bg-dark-2">
          <View className="flex-1">
            <Button title={t('common.cancel')} variant="outline" onPress={back} />
          </View>
          <View className="flex-[2]">
            <Button title={t('inbox.createModal.submit')} disabled={!draft.valid} loading={draft.create.isPending} onPress={draft.submit} />
          </View>
        </View>
      </KeyboardAvoidingView>
      <EnquiryDraftProductPicker draft={draft} visible={draft.pickProduct} />
    </SafeAreaView>
  );
}
