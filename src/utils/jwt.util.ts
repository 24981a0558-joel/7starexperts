// ─────────────────────────────────────────────────────────────────────────────
// JWT UTILITY
// ─────────────────────────────────────────────────────────────────────────────
// 📘 JWT = JSON Web Token. It's a secure way to prove who you are.
//
// Analogy: Think of JWT like a hotel key card.
// - When you check in (login), the hotel gives you a key card (JWT token)
// - Every time you want to enter your room (API), you swipe the card
// - The door checks the card — if valid, it opens
// - The card expires after checkout (token expiry)
//
// JWT Structure: header.payload.signature
// - Header: algorithm used to sign
// - Payload: user data (id, role) — NOT secret, can be decoded!
// - Signature: proves the token wasn't tampered with — uses your JWT_SECRET
//
// Never put sensitive data (passwords) in payload!
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

interface TokenPayload {
  id: string;
  phone: string;
  role: Role;
}

// Generate access token (short-lived — 7 days)
// Sent with every API request in Authorization header
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// Generate refresh token (long-lived — 30 days)
// Used to get a new access token without logging in again
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

// Verify and decode a refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

// Generate both tokens at once
export const generateTokens = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
