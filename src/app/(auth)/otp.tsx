import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { authApi } from '@/lib/api';

const OTP_LEN = 6;
const RESEND_SECS = 30;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendSecs, setResendSecs] = useState(RESEND_SECS);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSecs]);

  function handleDigit(idx: number, val: string) {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < OTP_LEN - 1) refs.current[idx + 1]?.focus();
    if (next.every(d => d !== '')) verifyOtp(next.join(''));
  }

  function handleBackspace(idx: number, key: string) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
    }
  }

  async function verifyOtp(otp: string) {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone!, otp);
      await login(res.data.tokens.accessToken, res.data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.message ?? 'Please check the code and try again.');
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await authApi.sendOtp(phone!);
      setResendSecs(RESEND_SECS);
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Could not resend OTP. Try again.');
    }
  }

  const filled = digits.every(d => d !== '');

  return (
    <LinearGradient colors={['#059669', '#047857']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Verify your number</Text>
            <Text style={styles.heroSub}>
              OTP sent to <Text style={styles.phone}>+91 {phone}</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Enter 6-digit OTP</Text>

            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={r => { refs.current[i] = r; }}
                  style={[styles.cell, d ? styles.cellFilled : null]}
                  value={d}
                  onChangeText={v => handleDigit(i, v)}
                  onKeyPress={({ nativeEvent }) => handleBackspace(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <Button
              label="Verify OTP"
              onPress={() => verifyOtp(digits.join(''))}
              loading={loading}
              disabled={!filled}
              style={styles.btn}
            />

            <View style={styles.resendRow}>
              {resendSecs > 0 ? (
                <Text style={styles.resendTimer}>Resend OTP in {resendSecs}s</Text>
              ) : (
                <TouchableOpacity onPress={resend}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={() => router.back()} style={styles.changeRow}>
              <Text style={styles.changeText}>Change phone number</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1, justifyContent: 'flex-end' },
  hero: { alignItems: 'center', paddingBottom: 40, gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  phone: { fontWeight: '600', color: '#fff' },

  card: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40, gap: 16,
  },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  cell: {
    width: 46, height: 54, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
    textAlign: 'center', fontSize: 22, fontWeight: '700',
    color: Colors.textPrimary,
  },
  cellFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

  btn: { marginTop: 4 },
  resendRow: { alignItems: 'center' },
  resendTimer: { fontSize: 13, color: Colors.textMuted },
  resendLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  changeRow: { alignItems: 'center' },
  changeText: { fontSize: 13, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
