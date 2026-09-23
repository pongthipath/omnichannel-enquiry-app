import { router, useLocalSearchParams } from 'expo-router';
import { CreateEnquiryPage } from '../../../../components/inbox/create-enquiry-page';
import { EnquiryType } from '../../../../services/enquiry.service';

/**
 * Phone app: reporting something opens its own page, and the new enquiry opens on success.
 * `type` comes from the quick tiles on the home screen, so the form starts on the right kind.
 * This is also a tab, and the tab bar keeps clear of the home bar, so the page only claims the top.
 */
export default function NewMyEnquiryScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  return (
    <CreateEnquiryPage
      asStaff={false}
      initialType={(type as EnquiryType) || undefined}
      fallback="/my"
      edges={['top']}
      onCreated={(e) => router.replace(`/my/${e.id}`)}
    />
  );
}
