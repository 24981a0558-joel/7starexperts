import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { bookingsApi, providerApi, Booking, WalletInfo } from '@/lib/api';

export default function DashboardScreen() {
  const { user, providerProfile, refreshProfile } = useAuth();

  const [todaysJobs, setTodaysJobs] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function fetchData() {
    try {
      const [jobsRes, walletRes] = await Promise.all([
        bookingsApi.getMine(),
        providerApi.getWallet(),
      ]);
      // Filter today's jobs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todays = jobsRes.data.filter((b: Booking) => {
        const d = new Date(b.scheduledAt);
        return d >= today && d < tomorrow;
      });
      setTodaysJobs(todays);
      setWallet(walletRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshProfile()]);
    setRefreshing(false);
  }, []);

  async function toggleAvailability(val: boolean) {
    setToggling(true);
    try {
      await providerApi.toggleAvailability(val);
      await refreshProfile();
    } catch {
      Alert.alert('Error', 'Could not update availability. Try again.');
    } finally {
      setToggling(false);
    }
  }

  const isAvailable = providerProfile?.isAvailable ?? false;
  const firstName = user?.name?.split(' ')[0] ?? 'Provider';

  const pending = todaysJobs.filter(j => j.status === 'PENDING').length;
  const active = todaysJobs.filter(j =>
    ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'].includes(j.status)
  ).length;
  const done = todaysJobs.filter(j => j.status === 'COMPLETED').length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()}, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Here's your day at a glance</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Availability Toggle Card */}
        <View style={[styles.availCard, isAvailable ? styles.availOn : styles.availOff]}>
          <View style={styles.availLeft}>
            <View style={[styles.availDot, { backgroundColor: isAvailable ? Colors.success : Colors.textMuted }]} />
            <View>
              <Text style={styles.availTitle}>
                {isAvailable ? 'You are Available' : 'You are Offline'}
              </Text>
              <Text style={styles.availSub}>
                {isAvailable ? 'Accepting new job requests' : 'Not receiving new jobs'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: Colors.divider, true: Colors.primaryLight }}
            thumbColor={isAvailable ? Colors.primary : Colors.textMuted}
            disabled={toggling}
          />
        </View>

        {/* Today's Stats */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="Pending" value={pending} color={Colors.warning} icon="time-outline" />
          <StatCard label="Active" value={active} color={Colors.primary} icon="flash-outline" />
          <StatCard label="Done" value={done} color={Colors.success} icon="checkmark-circle-outline" />
        </View>

        {/* Wallet Summary */}
        {wallet && (
          <>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.walletCard}>
              <View style={styles.walletMain}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletAmt}>₹{wallet.balance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.walletDivider} />
              <View style={styles.walletStats}>
                <WalletStat label="Total Earned" value={wallet.totalEarned} />
                <WalletStat label="Total Paid" value={wallet.totalPaid} />
              </View>
              <TouchableOpacity
                style={styles.earningsBtn}
                onPress={() => router.push('/(tabs)/earnings')}
              >
                <Text style={styles.earningsBtnText}>View Earnings & Payouts</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Today's Jobs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Jobs</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {todaysJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No jobs scheduled for today</Text>
            <Text style={styles.emptySub}>New requests will appear here</Text>
          </View>
        ) : (
          todaysJobs.slice(0, 3).map(job => (
            <TouchableOpacity
              key={job.id}
              style={styles.miniJobCard}
              onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
              activeOpacity={0.8}
            >
              <View style={styles.miniJobLeft}>
                <View style={styles.miniJobIcon}>
                  <Ionicons name="construct-outline" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.miniJobName} numberOfLines={1}>{job.service.name}</Text>
                  <Text style={styles.miniJobTime}>{fmt(job.scheduledAt)}</Text>
                </View>
              </View>
              <View style={styles.miniJobRight}>
                <Text style={styles.miniJobAmt}>₹{job.providerEarning.toLocaleString('en-IN')}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {todaysJobs.length > 3 && (
          <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/(tabs)/jobs')}>
            <Text style={styles.moreBtnText}>+{todaysJobs.length - 3} more jobs today</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WalletStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.walletStat}>
      <Text style={styles.walletStatAmt}>₹{value.toLocaleString('en-IN')}</Text>
      <Text style={styles.walletStatLabel}>{label}</Text>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, gap: 16, paddingBottom: 32 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.cardBackground, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },

  availCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
  },
  availOn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  availOff: { backgroundColor: Colors.cardBackground, borderColor: Colors.border },
  availLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  availSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  walletCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  walletMain: { alignItems: 'center', gap: 4 },
  walletLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  walletAmt: { fontSize: 30, fontWeight: '700', color: Colors.primary },
  walletDivider: { height: 1, backgroundColor: Colors.divider },
  walletStats: { flexDirection: 'row', justifyContent: 'space-around' },
  walletStat: { alignItems: 'center', gap: 2 },
  walletStatAmt: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  walletStatLabel: { fontSize: 11, color: Colors.textSecondary },
  earningsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  earningsBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  miniJobCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.border,
  },
  miniJobLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  miniJobIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  miniJobName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  miniJobTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  miniJobRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniJobAmt: { fontSize: 14, fontWeight: '700', color: Colors.success },

  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted },

  moreBtn: {
    alignItems: 'center', padding: 12,
    backgroundColor: Colors.primaryLight, borderRadius: 12,
  },
  moreBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
