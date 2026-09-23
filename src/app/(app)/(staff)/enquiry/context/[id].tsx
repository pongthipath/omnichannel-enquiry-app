import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContextPanel } from '../../../../../components/inbox/context-panel';

/** Phone app: the 360 view of the customer behind an enquiry — inbox → enquiry → customer. */
export default function EnquiryContextScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['bottom']}>
      <ContextPanel
        enquiryId={id}
        onOpenEnquiry={(next) => router.replace({ pathname: '/enquiry/[id]', params: { id: next } })}
        onClose={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/enquiry/[id]', params: { id } }))}
      />
    </SafeAreaView>
  );
}
