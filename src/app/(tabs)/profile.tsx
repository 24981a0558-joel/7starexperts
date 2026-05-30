import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const { user, providerProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = (user?.name ?? user?.phone ?? '??')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function confirmLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'star-outline',
      label: 'My Ratings',
      sub: providerProfile?.rating ? `${providerProfile.rating.toFixed(1)} / 5.0` : 'No ratings yet',
      onPress: () => {},
    },
    {
      icon: 'construct-outline',
      label: 'My Services',
      sub: `${providerProfile?.services?.length ?? 0} services listed`,
      onPress: () => {},
    },
    {
      icon: 'time-outline',
      label: 'Working Hours',
      sub: 'Set your availability',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Documents & KYC',
      sub: 'Verification status',
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      label: 'Bank Account',
      sub: 'Payout details',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      label: 'About 7Star',
      onPress: () => {},
    },
    {
      icon: 'log-out-outline',
      label: loggingOut ? 'Logging out…' : 'Log Out',
      onPress: confirmLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar + Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {providerProfile?.isAvailable && (
              <View style={styles.onlineDot} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Service Provider'}</Text>
            <Text style={styles.profilePhone}>+91 {user?.phone}</Text>
            {providerProfile?.rating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {providerProfile.rating.toFixed(1)} · {providerProfile.totalJobs ?? 0} jobs completed
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBox icon="briefcase-outline" label="Total Jobs" value={providerProfile?.totalJobs ?? 0} />
          <StatBox icon="star-outline" label="Rating" value={providerProfile?.rating?.toFixed(1) ?? '—'} />
          <StatBox icon="people-outline" label="Reviews" value={providerProfile?.totalReviews ?? 0} />
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
                disabled={item.label.includes('…')}
              >
                <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                  <Ionicons name={item.icon} size={18} color={item.danger ? Colors.error : Colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                    {item.label}
                  </Text>
                  {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                </View>
                {!item.danger && (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
              {idx < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.version}>7Star Worker v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },

  profileCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 20,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: '#fff',
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  profilePhone: { fontSize: 14, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: Colors.textSecondary },

  statsRow: {
    flexDirection: 'row', gap: 10,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  menuCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEF2F2' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  menuLabelDanger: { color: Colors.error },
  menuSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 62 },

  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted },
});
