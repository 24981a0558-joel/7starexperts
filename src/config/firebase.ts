// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Firebase Admin SDK lets our SERVER send push notifications to devices.
// (firebase-admin is the server SDK — different from the client SDK in the app)
//
// How to get your credentials:
// 1. Go to https://console.firebase.google.com/
// 2. Create a project (or use existing)
// 3. Project Settings → Service Accounts → Generate new private key
// 4. Download the JSON file — copy values to .env
// ─────────────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin';
import type { Messaging } from 'firebase-admin/messaging';
import { env } from './env';

// Initialize only once (singleton pattern — same idea as Prisma)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      // Firebase private key contains literal \n — we convert to real newlines
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const fcm: Messaging = admin.messaging(); // FCM service instance
export default admin;
