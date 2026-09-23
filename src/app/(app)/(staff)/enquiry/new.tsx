import { router } from 'expo-router';
import { CreateEnquiryPage } from '../../../../components/inbox/create-enquiry-page';

/**
 * Phone app: "+ new enquiry" from the inbox pushes this, and the new enquiry opens on success.
 * The staff shell already keeps clear of the notch and the home bar, so this page claims no insets.
 */
export default function NewEnquiryScreen() {
  return (
    <CreateEnquiryPage
      asStaff
      fallback="/inbox"
      edges={[]}
      onCreated={(e) => router.replace({ pathname: '/enquiry/[id]', params: { id: e.id } })}
    />
  );
}
