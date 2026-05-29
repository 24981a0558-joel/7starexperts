import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, getCategoryColor } from '@/constants/colors';
import { Category } from '@/lib/api';

interface CategoryCardProps {
  category: Category;
  index: number;
  onPress: () => void;
}

export function CategoryCard({ category, index, onPress }: CategoryCardProps) {
  const color = getCategoryColor(index);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
        <Text style={styles.emoji}>{category.icon ?? '🔧'}</Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>

      {category._count !== undefined && (
        <Text style={styles.count}>{category._count.services} services</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  count: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
