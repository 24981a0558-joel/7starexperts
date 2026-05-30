import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ title, variant = 'primary', size = 'md', loading, fullWidth, style, disabled, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`sz_${size}`], fullWidth && styles.full, (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading} activeOpacity={0.75} {...rest}>
      {loading
        ? <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#fff'} />
        : <Text style={[styles.text, styles[`t_${variant}`], styles[`ts_${size}`]]}>{title}</Text>}
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
