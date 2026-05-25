// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
// 📘 The controller handles HTTP requests and responses.
// It receives the request, extracts data, calls the service, and sends response.
//
// Controller's job:
// ✅ Extract data from req.body, req.params, req.query
// ✅ Call the appropriate service method
// ✅ Send the HTTP response
//
// Controller does NOT:
// ❌ Contain business logic (that's in service)
// ❌ Query the database directly (that's in service)
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import authService from './auth.service';
import { Role } from '@prisma/client';

// POST /api/auth/send-otp
// Body: { phone: "9876543210" }
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;

  const result = await authService.sendOtp(phone);

  return sendSuccess(res, result, 'OTP sent successfully');
});

// POST /api/auth/verify-otp
// Body: { phone: "9876543210", otp: "123456", role: "CUSTOMER" }
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp, role } = req.body;

  const result = await authService.verifyOtpAndLogin(phone, otp, role as Role);

  const statusCode = result.isNewUser ? 201 : 200; // 201 = Created, 200 = OK
  const message = result.isNewUser ? 'Account created successfully' : 'Login successful';

  return sendSuccess(res, result, message, statusCode);
});

// POST /api/auth/refresh-token
// Body: { refreshToken: "eyJ..." }
// Used when access token expires — get a new one without logging in again
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  return sendSuccess(res, result, 'Token refreshed successfully');
});

// POST /api/auth/fcm-token
// Body: { fcmToken: "firebase_token_here" }
// Called by mobile app to register for push notifications
export const updateFcmToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fcmToken } = req.body;
  const userId = req.user!.id; // ! = we know user exists because protect middleware ran

  const result = await authService.updateFcmToken(userId, fcmToken);

  return sendSuccess(res, result, 'FCM token updated');
});

// GET /api/auth/me
// Returns the currently logged-in user's profile
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, name, phone, role } = req.user!;

  return sendSuccess(res, { id, name, phone, role }, 'User profile fetched');
});
