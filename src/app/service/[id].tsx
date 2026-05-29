// ─────────────────────────────────────────────────────────────────────────────
// SERVICE DETAIL SCREEN
// ─────────────────────────────────────────────────────────────────────────────

import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { Service, servicesApi } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_WIDTH * 0.65;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    servicesApi
      .getById(id!)
      .then((res) => setService(res.data))
      .catch((e) => setError(e.message ?? 'Service not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (error || !service) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Service not found'}</Text>
          <Button title="Go Back" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* ── Hero image ── */}
        <View style={[styles.heroWrapper, { height: HERO_HEIGHT }]}>
          {service.image ? (
            <Image
              source={{ uri: service.image }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="construct-outline" size={64} color={Colors.textMuted} />
            </View>
          )}

          {/* Back button overlay */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Gradient overlay at bottom */}
          <View style={styles.heroGradient} />
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Category pill */}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{service.category.name}</Text>
          </View>

          <Text style={styles.serviceName}>{service.name}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatChip icon="time-outline" label={`${service.duration} min`} />
            <StatChip icon="cash-outline" label={`₹${service.basePrice.toLocaleString('en-IN')}`} highlighted />
          </View>

          {/* Description */}
          {service.description && (
            <View style={styles.descSection}>
              <Text style={styles.descTitle}>About this service</Text>
              <Text style={styles.descText}>{service.description}</Text>
            </View>
          )}

          {/* Includes */}
          <View style={styles.includesSection}>
            <Text style={styles.descTitle}>What's included</Text>
            {INCLUDES.map((item, i) => (
              <View key={i} style={styles.includeRow}>
                <View style={styles.includeDot} />
                <Text style={styles.includeText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.priceCardTitle}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base price</Text>
              <Text style={styles.priceValue}>₹{service.basePrice.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.priceValue}>₹0</Text>
            </View>
            <View style={[styles.priceRow, styles.priceRowTotal]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>₹{service.basePrice.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Book button ── */}
      <SafeAreaView edges={['bottom']} style={styles.stickyFooter}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.footerPriceLabel}>Starting from</Text>
            <Text style={styles.footerPrice}>₹{service.basePrice.toLocaleString('en-IN')}</Text>
          </View>
          <Button
            title="Book Now"
            size="lg"
            style={styles.bookBtn}
            onPress={() =>
              router.push({ pathname: '/booking/new', params: { serviceId: service.id } })
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatChip({
  icon,
  label,
  highlighted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.statChip, highlighted && styles.statChipHighlighted]}>
      <Ionicons
        name={icon}
        size={15}
        color={highlighted ? Colors.primary : Colors.textSecondary}
      />
      <Text style={[styles.statLabel, highlighted && styles.statLabelHighlighted]}>
        {label}
      </Text>
    </View>
  );
}

const INCLUDES = [
  'Professional & verified expert',
  'All tools and equipment provided',
  'Quality guaranteed or re-service free',
  '30-minute time window',
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrapper: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    padding: 20,
    gap: 16,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
  },
  statChipHighlighted: {
    backgroundColor: Colors.primaryLight,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  statLabelHighlighted: {
    color: Colors.primary,
    fontWeight: '700',
  },

  descSection: { gap: 8 },
  descTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  includesSection: { gap: 10 },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  includeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  includeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Price card ────────────────────────────────────────────────────────────
  priceCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 100, // space for sticky footer
  },
  priceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  priceRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  priceTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Sticky footer ─────────────────────────────────────────────────────────
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bookBtn: {
    flex: 1,
    maxWidth: 160,
    marginLeft: 16,
  },
});
