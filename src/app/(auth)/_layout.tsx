import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/auth-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AuthLayout() {
  const { token, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (token) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
