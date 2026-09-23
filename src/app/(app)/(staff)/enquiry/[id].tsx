import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatPane } from '../../../../components/inbox/chat-pane';

/** Phone app: the enquiry a row in the inbox opened, pushed on top of the list. */
export default function EnquiryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView className="flex-1 bg-gray-1 dark:bg-dark" edges={['bottom']}>
      <View className="flex-1">
        <ChatPane
          enquiryId={id}
          compact
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/inbox'))}
          onTogglePanel={() => router.push({ pathname: '/enquiry/context/[id]', params: { id } })}
        />
      </View>
    </SafeAreaView>
  );
}
