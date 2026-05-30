import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getStatusColor, getStatusLabel } from '@/constants/colors';

export function Badge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const { text, bg } = getStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.text, { color: text }, size === 'sm' && styles.textSm]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
  textSm: { fontSize: 11 },
});
