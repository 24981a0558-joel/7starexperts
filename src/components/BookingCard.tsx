import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { Booking, bookingsApi } from '@/lib/api';

interface BookingCardProps {
  booking: Booking;
  onRefresh: () => void;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function BookingCard({ booking, onRefresh }: BookingCardProps) {
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  async function handleCancel() {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingsApi.cancel(booking.id, 'Cancelled by customer');
            onRefresh();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Could not cancel booking');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {/* Service image */}
        <View style={styles.imgWrapper}>
          {booking.service.image ? (
            <Image
              source={{ uri: booking.service.image }}
              style={styles.img}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="construct-outline" size={20} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* Service name + status */}
        <View style={styles.headerText}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {booking.service.name}
          </Text>
          <Badge status={booking.status} size="sm" />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <DetailRow icon="calendar-outline" text={formatDate(booking.scheduledAt)} />
        <DetailRow icon="location-outline" text={booking.address?.fullAddress ?? 'No address'} />
        {booking.provider && (
          <DetailRow icon="person-outline" text={booking.provider.user.name} />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>₹{booking.totalAmount.toLocaleString('en-IN')}</Text>

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.75}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={Colors.textMuted} />
      <Text style={styles.detailText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  imgWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
});
