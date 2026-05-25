// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
// 📘 The webhook route is SPECIAL — it must receive the raw request body
// (not parsed JSON) because Razorpay signature verification uses the exact
// raw bytes. We use express.raw() middleware only on the webhook route.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import paymentsService from './payments.service';
import { PaymentMethod } from '@prisma/client';

// POST /api/payments/create-order
// Customer initiates payment
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId, method } = req.body;
  const result = await paymentsService.createOrder(
    req.user!.id,
    bookingId,
    method as PaymentMethod
  );
  return sendSuccess(res, result, 'Payment order created', 201);
});

// POST /api/payments/verify
// Called after Razorpay checkout succeeds on device
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await paymentsService.verifyPayment(req.body);
  return sendSuccess(res, result, 'Payment verified successfully');
});

// POST /api/payments/cash-collected
// Provider marks cash as received after service is done
export const confirmCashPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.body;
  const result = await paymentsService.confirmCashPayment(req.user!.id, bookingId);
  return sendSuccess(res, result, 'Cash payment confirmed');
});

// POST /api/payments/refund — admin only
export const refundPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId, amount } = req.body;
  const result = await paymentsService.refundPayment(bookingId, amount);
  return sendSuccess(res, result, 'Refund processed');
});

// POST /api/payments/webhook — Razorpay server-to-server callback
// Note: express.raw() middleware applied in routes file for this endpoint
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody as string;

  const result = await paymentsService.handleWebhook(rawBody, signature);

  // Always respond 200 quickly — Razorpay retries if you respond slowly/with error
  return sendSuccess(res, result, 'Webhook received');
});

// GET /api/payments/booking/:bookingId
export const getPaymentByBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await paymentsService.getPaymentByBooking(
    req.params['bookingId'] as string,
    req.user!.id
  );
  return sendSuccess(res, payment, 'Payment fetched');
});

// GET /api/payments — admin only
export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await paymentsService.getAllPayments(Number(page), Number(limit));
  return sendPaginated(res, result.payments, result.total, result.page, result.limit);
});
