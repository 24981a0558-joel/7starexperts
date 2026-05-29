import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  // If already logged in → redirect to main app
  if (!isLoading && token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
