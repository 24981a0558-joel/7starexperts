// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 The /webhook route is SPECIAL:
//   - It must NOT use JSON body parser (would corrupt the raw body)
//   - We capture the raw body using express.raw() middleware
//   - Razorpay signature is verified using the EXACT raw bytes sent
//   - This route is NOT authenticated (Razorpay calls it, not our users)
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createOrder,
  verifyPayment,
  confirmCashPayment,
  refundPayment,
  webhook,
  getPaymentByBooking,
  getAllPayments,
} from './payments.controller';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundSchema,
  cashCollectedSchema,
} from './payments.validation';

const router = Router();

// ── Webhook — MUST come first, before any JSON body parser ───────────────────
// express.raw() captures the body as a Buffer, then we convert to string
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, _res: Response, next: NextFunction) => {
    // Attach rawBody to request for signature verification
    (req as any).rawBody = req.body.toString('utf8');
    next();
  },
  webhook
);

// ── Protected routes ──────────────────────────────────────────────────────────
router.use(protect);

// Customer: create Razorpay order to start payment
router.post('/create-order', restrictTo('CUSTOMER'), validate(createOrderSchema), createOrder);

// Customer: verify payment after Razorpay checkout
router.post('/verify', restrictTo('CUSTOMER'), validate(verifyPaymentSchema), verifyPayment);

// Provider: confirm cash was received
router.post('/cash-collected', restrictTo('PROVIDER'), validate(cashCollectedSchema), confirmCashPayment);

// Get payment details for a booking
router.get('/booking/:bookingId', getPaymentByBooking);

// Admin: all payments + stats
router.get('/', restrictTo('ADMIN'), getAllPayments);

// Admin: issue refund
router.post('/refund', restrictTo('ADMIN'), validate(refundSchema), refundPayment);

export default router;
