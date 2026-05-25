// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Payment validation is critical — always validate payment data strictly.
// Bad data here = wrong amounts charged or fraudulent payments accepted.
// ─────────────────────────────────────────────────────────────────────────────

import Joi from 'joi';

// POST /api/payments/create-order
// Customer initiates payment for a booking
export const createOrderSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  method: Joi.string()
    .valid('CARD', 'UPI', 'WALLET', 'NET_BANKING', 'CASH')
    .required(),
});

// POST /api/payments/verify
// Called AFTER Razorpay checkout completes on device
// We verify the signature to confirm the payment is genuine (not tampered)
export const verifyPaymentSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  razorpayOrderId: Joi.string().required(),       // from Razorpay: "order_Oxxxxx"
  razorpayPaymentId: Joi.string().required(),      // from Razorpay: "pay_Oxxxxx"
  razorpaySignature: Joi.string().required(),      // HMAC signature to verify
});

// POST /api/payments/refund (admin only)
export const refundSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  amount: Joi.number().positive().optional(), // omit for full refund
  reason: Joi.string().max(200).optional(),
});

// POST /api/payments/cash-collected (provider marks cash payment collected)
export const cashCollectedSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
});
