import { Redirect } from 'expo-router';

// TODO: route by session — customer → enquiries, staff → inbox (first page their permissions allow)
export default function Index() {
  return <Redirect href="/login" />;
}
