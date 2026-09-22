import { Redirect } from 'expo-router';

// The (app) layout checks the session and sends signed-out users to /login.
// TODO: staff → first page their permissions allow once the staff console has more pages.
export default function Index() {
  return <Redirect href="/enquiries" />;
}
