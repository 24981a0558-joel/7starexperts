import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { authApi } from '@/lib/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formatted = phone.replace(/\D/g, '').slice(-10);
  const valid = /^[6-9]\d{9}$/.test(formatted);

  async function handleSend() {
    if (!valid) return;
    setLoading(true);
    try {
      await authApi.sendOtp(formatted);
      router.push({ pathname: '/(auth)/otp', params: { phone: formatted } });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#059669', '#047857']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoRing}>
              <Ionicons name="construct" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>7Star Worker</Text>
            <Text style={styles.tagline}>Professional service, simplified</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Provider Login</Text>
            <Text style={styles.cardSub}>Enter your registered mobile number</Text>

            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>

            {phone.length > 0 && !valid && (
              <Text style={styles.hint}>Enter a valid 10-digit Indian mobile number</Text>
            )}

            <Button
              label="Send OTP"
              onPress={handleSend}
              loading={loading}
              disabled={!valid}
              style={styles.btn}
            />

            <View style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.noteText}>
                OTP is for verified service providers only
              </Text>
            </View>
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
  hero: { alignItems: 'center', paddingBottom: 48, gap: 10 },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  card: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40, gap: 14,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 14, color: Colors.textSecondary, marginTop: -6 },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 50, justifyContent: 'center',
  },
  prefixText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  input: {
    flex: 1, height: 50, backgroundColor: Colors.background,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, fontSize: 16, color: Colors.textPrimary,
  },
  hint: { fontSize: 12, color: Colors.error, marginTop: -6 },
  btn: { marginTop: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  noteText: { fontSize: 12, color: Colors.textMuted },
});
