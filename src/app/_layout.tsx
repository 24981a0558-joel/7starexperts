import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from '@/context/auth-context';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="job/[id]"
          options={{
            headerShown: true, headerTitle: 'Job Details', headerBackTitle: 'Back',
            headerTintColor: Colors.textPrimary,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
