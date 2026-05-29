import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Service } from '@/lib/api';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  compact?: boolean;
}

export function ServiceCard({ service, onPress, compact = false }: ServiceCardProps) {
  return (
    <TouchableOpacity style={[styles.card, compact && styles.cardCompact]} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      <View style={[styles.imageWrapper, compact && styles.imageWrapperCompact]}>
        {service.image ? (
          <Image
            source={{ uri: service.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.imagePlaceholder]}>
            <Ionicons name="construct-outline" size={32} color={Colors.textMuted} />
          </View>
        )}

        {/* Category pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{service.category.name}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {service.name}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{service.duration} min</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>
            ₹{service.basePrice.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
  },
  cardCompact: {
    flexDirection: 'row',
    height: 90,
  },
  imageWrapper: {
    height: 130,
    position: 'relative',
  },
  imageWrapperCompact: {
    height: 90,
    width: 90,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  info: {
    padding: 12,
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
