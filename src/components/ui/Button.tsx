import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  /** @deprecated use label */
  title?: string;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  title,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  icon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const text = label ?? title ?? '';
  const isOutlineish = variant === 'outline' || variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`sz_${size}` as keyof typeof styles],
        fullWidth && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutlineish ? Colors.primary : '#fff'} />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, styles[`t_${variant}` as keyof typeof styles], styles[`ts_${size}` as keyof typeof styles]]}>
            {text}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%' },
  disabled: { opacity: 0.5 },
  primary: { backgroundColor: Colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  danger: { backgroundColor: Colors.error },
  ghost: { backgroundColor: 'transparent' },
  warning: { backgroundColor: Colors.warning },
  sz_sm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sz_md: { paddingHorizontal: 24, paddingVertical: 14 },
  sz_lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 14 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap: {},
  text: { fontWeight: '600' },
  t_primary: { color: '#fff' },
  t_outline: { color: Colors.primary },
  t_danger: { color: '#fff' },
  t_ghost: { color: Colors.primary },
  t_warning: { color: '#fff' },
  ts_sm: { fontSize: 13 },
  ts_md: { fontSize: 15 },
  ts_lg: { fontSize: 17 },
});
