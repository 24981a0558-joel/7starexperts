import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
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
import { providerApi, WalletInfo, EarningEntry } from '@/lib/api';

export default function EarningsScreen() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutAmt, setPayoutAmt] = useState('');
  const [requesting, setRequesting] = useState(false);

  async function fetchData() {
    try {
      const [walletRes, earningsRes] = await Promise.all([
        providerApi.getWallet(),
        providerApi.getEarnings(),
      ]);
      setWallet(walletRes.data);
      setEarnings(earningsRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function requestPayout() {
    const amt = parseFloat(payoutAmt);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid payout amount.');
      return;
    }
    if (wallet && amt > wallet.balance) {
      Alert.alert('Insufficient Balance', `Available balance: ₹${wallet.balance}`);
      return;
    }
    setRequesting(true);
    try {
      await providerApi.requestPayout(amt);
      await fetchData();
      setPayoutAmt('');
      Alert.alert('Payout Requested', 'Your payout request has been submitted successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not process payout. Try again.');
    } finally {
      setRequesting(false);
    }
  }

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={earnings}
        keyExtractor={e => e.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Text style={styles.pageTitle}>Earnings</Text>

            {/* Wallet Card */}
            {wallet && (
              <View style={styles.walletCard}>
                <View style={styles.walletGradientTop}>
                  <Text style={styles.balLabel}>Available Balance</Text>
                  <Text style={styles.balAmt}>₹{wallet.balance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.walletBottom}>
                  <WalletStat icon="trending-up-outline" label="Total Earned" value={wallet.totalEarned} color={Colors.success} />
                  <View style={styles.vertDivider} />
                  <WalletStat icon="arrow-forward-circle-outline" label="Total Paid" value={wallet.totalPaid} color={Colors.primary} />
                </View>
              </View>
            )}

            {/* Payout Request */}
            <View style={styles.payoutCard}>
              <Text style={styles.payoutTitle}>Request Payout</Text>
              <Text style={styles.payoutSub}>Minimum ₹100. Transfers to your registered bank account.</Text>
              <View style={styles.payoutRow}>
                <View style={styles.amtInputWrap}>
                  <Text style={styles.rupee}>₹</Text>
                  <TextInput
                    style={styles.amtInput}
                    value={payoutAmt}
                    onChangeText={setPayoutAmt}
                    placeholder="Enter amount"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <Button
                  label="Request"
                  onPress={requestPayout}
                  loading={requesting}
                  disabled={!payoutAmt || parseFloat(payoutAmt) <= 0}
                  style={styles.payoutBtn}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Transaction History</Text>
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <EarningRow entry={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function WalletStat({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={styles.walletStat}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.walletStatAmt, { color }]}>₹{value.toLocaleString('en-IN')}</Text>
      <Text style={styles.walletStatLabel}>{label}</Text>
    </View>
  );
}

function EarningRow({ entry }: { entry: EarningEntry }) {
  const isCredit = entry.type === 'CREDIT';
  return (
    <View style={styles.earningRow}>
      <View style={[styles.earningIcon, { backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={isCredit ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.earningInfo}>
        <Text style={styles.earningDesc} numberOfLines={1}>{entry.description}</Text>
        <Text style={styles.earningDate}>{fmtDate(entry.createdAt)}</Text>
      </View>
      <Text style={[styles.earningAmt, { color: isCredit ? Colors.success : Colors.error }]}>
        {isCredit ? '+' : '-'}₹{Math.abs(entry.amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, gap: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },

  walletCard: {
    backgroundColor: Colors.primary, borderRadius: 20, overflow: 'hidden',
  },
  walletGradientTop: { padding: 24, alignItems: 'center', gap: 6 },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  balAmt: { fontSize: 36, fontWeight: '700', color: '#fff' },
  walletBottom: {
    backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row',
    justifyContent: 'space-around', padding: 16,
  },
  walletStat: { alignItems: 'center', gap: 4 },
  walletStatAmt: { fontSize: 16, fontWeight: '700' },
  walletStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  vertDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  payoutCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, gap: 10, borderWidth: 1, borderColor: Colors.border,
  },
  payoutTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  payoutSub: { fontSize: 12, color: Colors.textSecondary },
  payoutRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  amtInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: Colors.background, paddingHorizontal: 12, height: 46,
  },
  rupee: { fontSize: 16, color: Colors.textSecondary, marginRight: 4 },
  amtInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  payoutBtn: { width: 100 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  earningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardBackground, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  earningIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  earningInfo: { flex: 1 },
  earningDesc: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  earningDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  earningAmt: { fontSize: 15, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
