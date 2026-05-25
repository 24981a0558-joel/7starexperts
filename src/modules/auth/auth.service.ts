// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 The service layer contains the BUSINESS LOGIC.
// It's separated from the controller so that:
// - Logic can be reused across multiple controllers
// - It's easier to test in isolation
// - Code is cleaner and more organized
//
// Architecture layers:
// Request → Controller (handles HTTP) → Service (business logic) → Database
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { sendOTP, verifyOTP } from '../../utils/otp.util';
import { generateTokens } from '../../utils/jwt.util';
import { AppError } from '../../middleware/error.middleware';
import { Role } from '@prisma/client';

export class AuthService {
  // ─────────────────────────────────────────────────────────
  // Step 1: Send OTP to phone number
  // ─────────────────────────────────────────────────────────
  async sendOtp(phone: string) {
    const result = await sendOTP(phone);

    if (!result.success) {
      throw new AppError('Failed to send OTP. Please try again.', 500);
    }

    return { message: result.message };
  }

  // ─────────────────────────────────────────────────────────
  // Step 2: Verify OTP and login (or register new user)
  // ─────────────────────────────────────────────────────────
  async verifyOtpAndLogin(phone: string, otp: string, role: Role = 'CUSTOMER') {
    // 1. Verify the OTP
    const otpResult = await verifyOTP(phone, otp);
    if (!otpResult.valid) {
      throw new AppError(otpResult.message, 400);
    }

    // 2. Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        provider: true, // include provider profile if exists
      },
    });

    let isNewUser = false;

    // 3. If user doesn't exist → create new account
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          phone,
          name: `User${phone.slice(-4)}`, // default name, user can update later
          role,
          // If registering as provider, create Provider profile too
          ...(role === 'PROVIDER' && {
            provider: {
              create: {}, // empty provider profile, they'll fill it later
            },
          }),
        },
        include: {
          provider: true,
        },
      });
    }

    // 4. Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    // 5. Return tokens + user info
    return {
      isNewUser,
      tokens,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        // If provider, tell frontend whether profile is complete
        providerStatus: user.provider?.status ?? null,
      },
    };
  }

  // ─────────────────────────────────────────────────────────
  // Refresh access token using refresh token
  // ─────────────────────────────────────────────────────────
  async refreshAccessToken(refreshToken: string) {
    const { verifyRefreshToken, generateAccessToken } = await import('../../utils/jwt.util');

    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Check user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, phone: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or deactivated', 401);
      }

      const accessToken = generateAccessToken({
        id: user.id,
        phone: user.phone,
        role: user.role,
      });

      return { accessToken };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Update FCM token (for push notifications)
  // Called when app starts or when FCM token refreshes
  // ─────────────────────────────────────────────────────────
  async updateFcmToken(userId: string, fcmToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    return { message: 'FCM token updated' };
  }
}

export default new AuthService();
