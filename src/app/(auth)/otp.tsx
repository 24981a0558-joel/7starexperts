// ─────────────────────────────────────────────────────────────────────────────
// OTP SCREEN — 6-digit OTP verification
// ─────────────────────────────────────────────────────────────────────────────

import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/colors';
import { authApi } from '@/lib/api';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH && !digits.includes('');

  // ── Handle digit input ─────────────────────────────────────────────────
  const handleChange = useCallback(
    (text: string, index: number) => {
      const val = text.replace(/\D/g, '').slice(-1); // last digit only
      const newDigits = [...digits];
      newDigits[index] = val;
      setDigits(newDigits);

      if (val && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace') {
        if (!digits[index] && index > 0) {
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          setDigits(newDigits);
          inputRefs.current[index - 1]?.focus();
        }
      }
    },
    [digits]
  );

  // ── Verify OTP ─────────────────────────────────────────────────────────
  async function handleVerify() {
    if (!isComplete) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone!, otp);
      await login(res.data.tokens.accessToken, res.data.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.message ?? 'Please check the code and try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────
  async function handleResend() {
    if (countdown > 0) return;
    try {
      await authApi.sendOtp(phone!);
      setCountdown(30);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to resend OTP');
    }
  }

  // Mask phone: +91 98765 *****  (phone is raw 10-digit e.g. "6300908637")
  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 5)} *****`
    : '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>📱</Text>
          </View>
          <Text style={styles.heroTitle}>Verify your number</Text>
          <Text style={styles.heroSubtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneText}>{maskedPhone}</Text>
          </Text>
        </View>
      </View>

      {/* Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrapper}>
        <SafeAreaView edges={['bottom']} style={styles.card}>
          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                caretHidden
                autoFocus={i === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          <Button
            title="Verify OTP"
            onPress={handleVerify}
            loading={loading}
            disabled={!isComplete}
            fullWidth
            size="lg"
          />

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            {countdown > 0 ? (
              <Text style={styles.resendCountdown}>Resend in {countdown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
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
  hero: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backBtn: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'flex-start',
  },
  backText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Card ─────────────────────────────────────────────────────────────────
  cardWrapper: {},
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 20,
  },

  // ── OTP boxes ─────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  // ── Resend ─────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  resendCountdown: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
