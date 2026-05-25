// ─────────────────────────────────────────────────────────────────────────────
// AUTH VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────
// 📘 These Joi schemas define what the request body must look like.
// They run BEFORE the controller, so invalid data never reaches business logic.
// ─────────────────────────────────────────────────────────────────────────────

import Joi from 'joi';
import { schemas } from '../../middleware/validate.middleware';

// POST /auth/send-otp
export const sendOtpSchema = Joi.object({
  phone: schemas.phone!.required(),
});

// POST /auth/verify-otp
export const verifyOtpSchema = Joi.object({
  phone: schemas.phone!.required(),
  otp: schemas.otp!.required(),
  role: Joi.string().valid('CUSTOMER', 'PROVIDER').default('CUSTOMER'),
  // role is optional — if not provided, defaults to CUSTOMER
  // This lets providers register by passing role: "PROVIDER"
});

// POST /auth/refresh-token
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// POST /auth/update-profile (after registration)
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  email: schemas.email,
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  avatar: Joi.string().uri(), // must be a valid URL
});
