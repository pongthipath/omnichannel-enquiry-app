import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { CustomerPanel } from '../../../../components/inbox/customer-panel';

/** Phone app: one customer, pushed from the customers tab. */
export default function CustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1">
      <CustomerPanel
        id={id}
        full
        onOpenEnquiry={(enquiryId) => router.push({ pathname: '/enquiry/[id]', params: { id: enquiryId } })}
      />
    </View>
  );
}
