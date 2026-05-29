// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN — Phone number entry
// ─────────────────────────────────────────────────────────────────────────────

import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { authApi } from '@/lib/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const formatted = phone.replace(/\D/g, '').slice(0, 10);
  const isValid = formatted.length === 10;

  async function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.sendOtp(formatted);  // backend expects 10 digits only: 6300908637
      router.push({ pathname: '/(auth)/otp', params: { phone: formatted } });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradient hero */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>⭐</Text>
        </View>
        <Text style={styles.appName}>7StarExperts</Text>
        <Text style={styles.tagline}>Home services, made simple</Text>
      </View>

      {/* White card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrapper}>
        <SafeAreaView edges={['bottom']} style={styles.card}>
          <Text style={styles.cardTitle}>Enter your phone number</Text>
          <Text style={styles.cardSubtitle}>
            We'll send a one-time password to verify your number
          </Text>

          {/* Phone input with +91 prefix */}
          <TouchableOpacity
            style={[styles.phoneBox, formatted.length > 0 && styles.phoneBoxActive]}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}>
            <View style={styles.prefix}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.prefixText}>+91</Text>
              <View style={styles.prefixDivider} />
            </View>
            <TextInput
              ref={inputRef}
              style={styles.phoneInput}
              value={formatted}
              onChangeText={setPhone}
              placeholder="98765 43210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              autoFocus
            />
          </TouchableOpacity>

          <Button
            title="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            disabled={!isValid}
            fullWidth
            size="lg"
            style={styles.sendBtn}
          />

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  // ── Hero ────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },

  // ── Card ────────────────────────────────────────────────────────────────
  cardWrapper: {
    // KeyboardAvoidingView wrapper
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },

  // ── Phone input ──────────────────────────────────────────────────────────
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    height: 58,
    paddingRight: 16,
    overflow: 'hidden',
  },
  phoneBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  flag: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  prefixDivider: {
    width: 1.5,
    height: 22,
    backgroundColor: Colors.border,
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 1,
    paddingVertical: 0,
  },

  sendBtn: {
    marginTop: 4,
  },

  terms: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
