import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, onRightIconPress, style, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View
          style={[
            styles.container,
            focused && styles.containerFocused,
            error ? styles.containerError : null,
          ]}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? Colors.primary : Colors.textMuted}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
            placeholderTextColor={Colors.textMuted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  containerFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  containerError: {
    borderColor: Colors.error,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputWithLeft: {
    // extra left padding handled by icon margin
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 2,
  },
});
