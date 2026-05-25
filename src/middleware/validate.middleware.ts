// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Before processing any request, we validate the incoming data.
// We use the Joi library to define schemas (rules) for what data looks like.
//
// Example: For "send OTP", we validate:
//   - phone must be a string
//   - phone must match Indian mobile number format
//   - phone is required
//
// If validation fails → 400 Bad Request (never reaches the route handler)
// If validation passes → next() (continues to route handler)
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// validate — takes a Joi schema and returns middleware
// Usage: router.post('/send-otp', validate(sendOtpSchema), sendOtpHandler)
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // collect ALL errors, not just the first one
      stripUnknown: true, // remove fields not in schema (security!)
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace req.body with validated & sanitized data
    req.body = value;
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Common Joi schemas — reusable validation rules
// ─────────────────────────────────────────────────────────────────────────────
export const schemas = {
  // Phone number (Indian format)
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number',
    }),

  // OTP
  otp: Joi.string().length(6).pattern(/^\d{6}$/).messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),

  // Password
  password: Joi.string().min(8).max(50).messages({
    'string.min': 'Password must be at least 8 characters',
  }),

  // Email
  email: Joi.string().email().lowercase().trim(),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  },

  // Location coordinates
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
};
