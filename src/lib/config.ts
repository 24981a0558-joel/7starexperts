// ─────────────────────────────────────────────────────────────────────────────
// API CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// iOS Simulator  → localhost works fine
// Android Emulator → use http://10.0.2.2:5001/api
// Physical Device → use your computer's local IP: http://192.168.x.x:5001/api
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

const DEV_IP = '192.168.1.100'; // ← Change to your computer's local IP for device testing

export const API_URL =
  Platform.OS === 'android'
    ? `http://10.0.2.2:5001/api`
    : `http://localhost:5001/api`;

export const SOCKET_URL =
  Platform.OS === 'android'
    ? `http://10.0.2.2:5001`
    : `http://localhost:5001`;
