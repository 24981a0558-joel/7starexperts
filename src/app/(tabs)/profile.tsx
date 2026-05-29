// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/colors';
import { usersApi } from '@/lib/api';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightText?: string;
}

function MenuRow({ icon, label, onPress, danger, rightText }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <View style={styles.menuRight}>
        {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={danger ? Colors.error : Colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const initials = (user?.name ?? user?.phone ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateProfile({ name: name.trim() });
      await refreshUser();
      setEditModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Avatar + info ── */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatar} onPress={() => setEditModal(true)}>
            <Text style={styles.initials}>{initials}</Text>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Set your name'}</Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModal(true)}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="calendar-outline"
              label="My Bookings"
              onPress={() => router.push('/(tabs)/bookings')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="location-outline"
              label="Saved Addresses"
              onPress={() => Alert.alert('Coming Soon', 'Address management is coming soon!')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings are coming soon!')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => Alert.alert('Support', 'Email us at support@7starexperts.com')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="star-outline"
              label="Rate the App"
              onPress={() => Alert.alert('Thank you!', 'Rating feature coming soon.')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="document-text-outline"
              label="Terms & Privacy"
              onPress={() => Alert.alert('Coming Soon')}
            />
          </View>
        </View>

        <View style={[styles.menuSection, styles.menuSectionLast]}>
          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>7StarExperts v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save"
                onPress={handleSaveName}
                loading={saving}
                disabled={!name.trim()}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Profile section ───────────────────────────────────────────────────────
  profileSection: {
    backgroundColor: Colors.cardBackground,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Menu ──────────────────────────────────────────────────────────────────
  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuSectionLast: {
    paddingBottom: 8,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: Colors.errorLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuLabelDanger: {
    color: Colors.error,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuRightText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 64,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    paddingVertical: 24,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inputWrapper: { gap: 8 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  textInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
