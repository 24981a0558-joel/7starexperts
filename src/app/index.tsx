import { Redirect } from 'expo-router';

// Root index → redirect to auth flow
// (auth)/_layout.tsx will redirect to (tabs) if already logged in
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
