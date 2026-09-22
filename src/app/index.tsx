import { Redirect } from 'expo-router';

// The (app) layout checks the session (signed out → /login); the staff layout sends customers to /my.
export default function Index() {
  return <Redirect href="/inbox" />;
}
