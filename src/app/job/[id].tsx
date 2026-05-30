import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { bookingsApi, Booking, BookingStatus } from '@/lib/api';

type ActionConfig = {
  label: string;
  nextStatus: BookingStatus;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  confirm?: string;
};

const STATUS_ACTIONS: Partial<Record<BookingStatus, ActionConfig>> = {
  PENDING: {
    label: 'Accept Job',
    nextStatus: 'ACCEPTED',
    icon: 'checkmark-circle-outline',
    color: Colors.success,
    confirm: 'Accept this job request?',
  },
  ACCEPTED: {
    label: 'I\'m On My Way',
    nextStatus: 'EN_ROUTE',
    icon: 'navigate-outline',
    color: Colors.primary,
  },
  EN_ROUTE: {
    label: 'Start Job',
    nextStatus: 'IN_PROGRESS',
    icon: 'play-circle-outline',
    color: Colors.warning,
  },
  IN_PROGRESS: {
    label: 'Mark Complete',
    nextStatus: 'COMPLETED',
    icon: 'checkmark-done-circle-outline',
    color: Colors.success,
    confirm: 'Confirm job is completed?',
  },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    bookingsApi.getById(id!)
      .then(res => setBooking(res.data))
      .catch(() => Alert.alert('Error', 'Could not load job details.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: BookingStatus, reason?: string) {
    setUpdating(true);
    try {
      const res = await bookingsApi.updateStatus(id!, status, reason);
      setBooking(res.data);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not update job status.');
    } finally {
      setUpdating(false);
      setRejecting(false);
    }
  }

  function handleAction(action: ActionConfig) {
    if (action.confirm) {
      Alert.alert('Confirm', action.confirm, [
        { text: 'Cancel', style: 'cancel' },
        { text: action.label, onPress: () => updateStatus(action.nextStatus) },
      ]);
    } else {
      updateStatus(action.nextStatus);
    }
  }

  function handleReject() {
    Alert.prompt(
      'Reject Job',
      'Provide a reason for rejection (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: (reason?: string) => {
            setRejecting(true);
            updateStatus('REJECTED', reason ?? 'Provider unavailable');
          },
        },
      ],
      'plain-text',
    );
  }

  function callCustomer() {
    if (booking?.customer?.phone) {
      Linking.openURL(`tel:+91${booking.customer.phone}`);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!booking) return null;

  const action = STATUS_ACTIONS[booking.status as BookingStatus];
  const canReject = booking.status === 'PENDING';
  const isTerminal = ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Badge status={booking.status} size="lg" />
          <Text style={styles.bookingId}>#{booking.id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Service Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.serviceIcon}>
              <Ionicons name="construct-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{booking.service.name}</Text>
              <Text style={styles.serviceDuration}>{booking.service.duration} min · ₹{booking.service.price?.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <InfoRow icon="calendar-outline" label="Date & Time" value={fmtDate(booking.scheduledAt)} />
          <InfoRow icon="location-outline" label="Address" value={booking.address?.fullAddress ?? 'No address provided'} />
          <InfoRow icon="time-outline" label="Duration" value={`${booking.service.duration} minutes`} />
          {booking.notes && <InfoRow icon="document-text-outline" label="Notes" value={booking.notes} />}
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {(booking.customer.name ?? booking.customer.phone)[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customer.name ?? 'Customer'}</Text>
              <Text style={styles.customerPhone}>+91 {booking.customer.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.earningCard}>
          <View>
            <Text style={styles.earningLabel}>Your Earning</Text>
            <Text style={styles.earningAmt}>₹{booking.providerEarning.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.earningRight}>
            <Text style={styles.earningNote}>After 15% platform fee</Text>
            <Text style={styles.earningTotal}>Total: ₹{booking.totalAmount?.toLocaleString('en-IN') ?? '—'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {!isTerminal && (
          <View style={styles.actions}>
            {action && (
              <Button
                label={action.label}
                onPress={() => handleAction(action)}
                loading={updating && !rejecting}
                icon={<Ionicons name={action.icon} size={18} color="#fff" />}
              />
            )}
            {canReject && (
              <Button
                label="Reject Job"
                variant="outline"
                onPress={handleReject}
                loading={rejecting}
              />
            )}
          </View>
        )}

        {isTerminal && (
          <View style={styles.terminalBox}>
            <Ionicons
              name={booking.status === 'COMPLETED' ? 'checkmark-circle' : 'close-circle'}
              size={36}
              color={booking.status === 'COMPLETED' ? Colors.success : Colors.error}
            />
            <Text style={styles.terminalText}>
              This job is {booking.status.toLowerCase()}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={Colors.textMuted} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  bookingId: { fontSize: 13, color: Colors.textMuted, fontFamily: 'monospace' },

  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  serviceDuration: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, marginTop: 2, lineHeight: 20 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  customerPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  callBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  earningCard: {
    backgroundColor: Colors.primary, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  earningLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  earningAmt: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 2 },
  earningRight: { alignItems: 'flex-end', gap: 4 },
  earningNote: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  earningTotal: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  actions: { gap: 10 },

  terminalBox: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  terminalText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
});
