import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getStatusColor } from '@/constants/colors';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function Badge({ status, size = 'md' }: BadgeProps) {
  const { text, bg } = getStatusColor(status);
  const label = STATUS_LABELS[status.toUpperCase()] ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.text, { color: text }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
});
