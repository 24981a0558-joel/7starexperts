import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { Booking } from '@/lib/api';

interface JobCardProps {
  booking: Booking;
  onPress: () => void;
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso));
}

export function JobCard({ booking, onPress }: JobCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Ionicons name="construct-outline" size={22} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{booking.service.name}</Text>
          <Text style={styles.customer}>{booking.customer.name ?? booking.customer.phone}</Text>
        </View>
        <Badge status={booking.status} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.meta}>
        <Row icon="calendar-outline" text={fmt(booking.scheduledAt)} />
        <Row icon="location-outline" text={booking.address?.fullAddress ?? 'No address'} />
        <Row icon="time-outline" text={`${booking.service.duration} min`} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.earning}>
          Your earning: <Text style={styles.earningAmt}>₹{booking.providerEarning.toLocaleString('en-IN')}</Text>
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function Row({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.rowText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07,
    shadowRadius: 8, elevation: 3, gap: 12,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  customer: { fontSize: 12, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.divider },
  meta: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earning: { fontSize: 13, color: Colors.textSecondary },
  earningAmt: { fontWeight: '700', color: Colors.primary, fontSize: 15 },
});
