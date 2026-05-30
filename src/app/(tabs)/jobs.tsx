import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobCard } from '@/components/JobCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/colors';
import { bookingsApi, Booking } from '@/lib/api';

type Filter = 'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const ACTIVE_STATUSES = ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'];

export default function JobsScreen() {
  const [all, setAll] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchJobs() {
    try {
      const res = await bookingsApi.getMine();
      setAll(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchJobs(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filtered = all.filter(b => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(b.status);
    if (filter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return b.status === filter;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.count}>{filtered.length} jobs</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <FlatList
          data={FILTERS}
          keyExtractor={i => i.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Job List */}
      <FlatList
        data={filtered}
        keyExtractor={b => b.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <JobCard
            booking={item}
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySub}>
              {filter === 'ALL' ? 'New job requests will appear here' : `No ${filter.toLowerCase()} jobs`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  filterWrap: { marginBottom: 4 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  filterLabelActive: { color: '#fff' },

  list: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
