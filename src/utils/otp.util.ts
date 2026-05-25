// ─────────────────────────────────────────────────────────────────────────────
// OTP UTILITY
// ─────────────────────────────────────────────────────────────────────────────
// 📘 OTP = One Time Password. A 6-digit code sent via SMS to verify phone number.
// It's valid for only 10 minutes and can only be used once.
//
// Flow:
// 1. User enters phone number
// 2. Server generates OTP → saves to DB → sends via Twilio SMS
// 3. User enters OTP
// 4. Server checks DB → if valid & not expired → login/register user
// ─────────────────────────────────────────────────────────────────────────────

import twilio from 'twilio';
import { env } from '../config/env';
import prisma from '../config/database';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
  // Math.random() → 0.0 to 0.999...
  // * 900000 → 0 to 899999
  // + 100000 → 100000 to 999999
  // .toString() → "123456"
};

// Save OTP to database and send via SMS
export const sendOTP = async (phone: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Invalidate any previous unused OTPs for this phone
    await prisma.otp.updateMany({
      where: { phone, isUsed: false },
      data: { isUsed: true },
    });

    // 2. Generate new OTP
    const code = generateOTP();

    // 3. Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save to database
    await prisma.otp.create({
      data: { phone, code, expiresAt },
    });

    // 5. Send SMS via Twilio
    // In development, we skip sending SMS to save costs — just log to terminal
    if (env.isDev) {
      console.log(`📱 OTP for ${phone}: ${code}`); // shows in terminal during dev
      return { success: true, message: 'OTP sent (check terminal in dev mode)' };
    }

    await twilioClient.messages.create({
      body: `Your 7StarExperts OTP is: ${code}. Valid for 10 minutes. Do not share with anyone.`,
      from: env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`, // +91 is India country code
    });

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('OTP send error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Verify OTP against database
export const verifyOTP = async (
  phone: string,
  code: string
): Promise<{ valid: boolean; message: string }> => {
  // Find the latest unused OTP for this phone
  const otp = await prisma.otp.findFirst({
    where: {
      phone,
      code,
      isUsed: false,
      expiresAt: { gt: new Date() }, // gt = greater than (not expired)
    },
    orderBy: { createdAt: 'desc' }, // get the most recent one
  });

  if (!otp) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as used (can't be used again)
  await prisma.otp.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return { valid: true, message: 'OTP verified successfully' };
};
