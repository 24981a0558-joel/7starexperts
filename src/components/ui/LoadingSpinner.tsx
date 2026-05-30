import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

export function LoadingSpinner({ fullScreen }: { fullScreen?: boolean }) {
  return (
    <View style={[styles.c, fullScreen && styles.full]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  full: { flex: 1, backgroundColor: Colors.background },
});
