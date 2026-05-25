// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Instead of calling process.env.SOMETHING everywhere in the code,
// we load and validate all env variables HERE in one place.
// If a required variable is missing, the app crashes on startup
// with a clear error message — better than crashing mid-request!
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config(); // loads variables from .env file into process.env

// Helper: throws error if env variable is missing
const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  // Server
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),

  // JWT (JSON Web Token) — used for user authentication
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),

  // Twilio — for sending OTP via SMS
  TWILIO_ACCOUNT_SID: getEnv('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: getEnv('TWILIO_PHONE_NUMBER'),

  // Cloudinary — for image/file uploads
  CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getEnv('CLOUDINARY_API_SECRET'),

  // Razorpay — payment gateway
  RAZORPAY_KEY_ID: getEnv('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: getEnv('RAZORPAY_KEY_SECRET'),

  // Email
  EMAIL_FROM: getEnv('EMAIL_FROM'),
  EMAIL_PASS: getEnv('EMAIL_PASS'),

  // Firebase — push notifications
  FIREBASE_PROJECT_ID: getEnv('FIREBASE_PROJECT_ID'),
  FIREBASE_PRIVATE_KEY: getEnv('FIREBASE_PRIVATE_KEY'),
  FIREBASE_CLIENT_EMAIL: getEnv('FIREBASE_CLIENT_EMAIL'),

  // Google Maps
  GOOGLE_MAPS_API_KEY: getEnv('GOOGLE_MAPS_API_KEY'),

  // CORS — allowed frontend URLs
  CUSTOMER_APP_URL: getEnv('CUSTOMER_APP_URL', 'http://localhost:3000'),
  ADMIN_PANEL_URL: getEnv('ADMIN_PANEL_URL', 'http://localhost:3001'),

  // Helpers
  get isDev() { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};
