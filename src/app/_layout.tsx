// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT — 7StarExperts Customer App
// ─────────────────────────────────────────────────────────────────────────────

import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Service detail — custom back button in screen, no nav header */}
        <Stack.Screen
          name="service/[id]"
          options={{ headerShown: false }}
        />
        {/* Booking — show header with back button */}
        <Stack.Screen
          name="booking/new"
          options={{
            headerShown: true,
            headerTitle: 'Book Service',
            headerBackTitle: 'Back',
            headerTintColor: Colors.textPrimary,
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
