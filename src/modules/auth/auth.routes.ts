// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Routes define the URL paths and HTTP methods for your API.
// Each route is: METHOD + PATH → [middleware chain] → controller function
//
// Middleware chain runs left-to-right:
// validate(schema) → runs first → checks request body
// protect → runs second → checks JWT token
// restrictTo('ADMIN') → runs third → checks user role
// controller → runs last → handles business logic
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { protect } from '../../middleware/auth.middleware';
import {
  sendOtp,
  verifyOtp,
  refreshToken,
  updateFcmToken,
  getMe,
} from './auth.controller';
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from './auth.validation';

const router = Router();

// ─── Public Routes (no authentication required) ───────────────────────────

// Send OTP to phone number
// POST /api/auth/send-otp
// Body: { phone: "9876543210" }
router.post('/send-otp', validate(sendOtpSchema), sendOtp);

// Verify OTP and login/register
// POST /api/auth/verify-otp
// Body: { phone: "9876543210", otp: "123456", role: "CUSTOMER" }
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

// Get new access token using refresh token
// POST /api/auth/refresh-token
// Body: { refreshToken: "eyJ..." }
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// ─── Protected Routes (authentication required) ───────────────────────────

// Get current user's profile
// GET /api/auth/me
// Header: Authorization: Bearer <access_token>
router.get('/me', protect, getMe);

// Update FCM token for push notifications
// POST /api/auth/fcm-token
// Header: Authorization: Bearer <access_token>
// Body: { fcmToken: "firebase_token" }
router.post('/fcm-token', protect, updateFcmToken);

export default router;
