// ─────────────────────────────────────────────────────────────────────────────
// BOOKING SCREEN — Create a new booking
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { bookingsApi, Service, servicesApi } from '@/lib/api';

// ── Date/time helpers ──────────────────────────────────────────────────────

function getNext14Days() {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(d: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ──────────────────────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  const [service, setService] = useState<Service | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  const days = getNext14Days();
  const [selectedDay, setSelectedDay] = useState(0); // index into days[]
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load service info
  useEffect(() => {
    servicesApi
      .getById(serviceId!)
      .then((r) => setService(r.data))
      .catch(() => {})
      .finally(() => setLoadingService(false));
  }, [serviceId]);

  if (loadingService) return <LoadingSpinner fullScreen />;
  if (!service) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Service not found</Text>
          <Button title="Go Back" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleConfirm() {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter your service address.');
      return;
    }

    setSubmitting(true);
    try {
      const day = days[selectedDay];
      const [hours, minutes] = selectedTime.split(':').map(Number);
      day.setHours(hours, minutes, 0, 0);

      await bookingsApi.create({
        serviceId: service!.id,
        scheduledAt: day.toISOString(),
        address: address.trim(),
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Booking Confirmed! 🎉',
        'Your booking has been placed successfully. We will confirm soon.',
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Service summary card ── */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceCardInfo}>
            <Text style={styles.serviceCardLabel}>Booking for</Text>
            <Text style={styles.serviceCardName}>{service.name}</Text>
            <View style={styles.serviceCardMeta}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.serviceCardMetaText}>{service.duration} min</Text>
            </View>
          </View>
          <Text style={styles.serviceCardPrice}>
            ₹{service.basePrice.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.sections}>
          {/* ── Date picker ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
              {days.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayChip, i === selectedDay && styles.dayChipSelected]}
                  onPress={() => setSelectedDay(i)}>
                  <Text style={[styles.dayChipText, i === selectedDay && styles.dayChipTextSelected]}>
                    {formatDayLabel(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Time picker ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, t === selectedTime && styles.timeChipSelected]}
                  onPress={() => setSelectedTime(t)}>
                  <Text style={[styles.timeText, t === selectedTime && styles.timeTextSelected]}>
                    {formatTime(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Address ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Address</Text>
            <View style={styles.textAreaWrapper}>
              <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your complete address with flat/house no., area, landmark..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Notes ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.textArea, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any specific instructions for the service provider..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── Summary ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{service.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDayLabel(days[selectedDay])}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryTotalLabel}>Total Amount</Text>
              <Text style={styles.summaryTotal}>₹{service.basePrice.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Confirm button ── */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          title="Confirm Booking"
          size="lg"
          fullWidth
          onPress={handleConfirm}
          loading={submitting}
          disabled={!address.trim()}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

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

  // ── Service card ──────────────────────────────────────────────────────────
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: 20,
    margin: 20,
    borderRadius: 18,
  },
  serviceCardInfo: { gap: 4, flex: 1 },
  serviceCardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  serviceCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  serviceCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceCardMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  serviceCardPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },

  sections: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 24,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optional: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textMuted,
  },

  // ── Date picker ───────────────────────────────────────────────────────────
  datePicker: {
    marginHorizontal: -4,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dayChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // ── Time grid ─────────────────────────────────────────────────────────────
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  timeTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Text areas ────────────────────────────────────────────────────────────
  textAreaWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    minHeight: 72,
    paddingVertical: 0,
  },
  notesInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 72,
  },

  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
