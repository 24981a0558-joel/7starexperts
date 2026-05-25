// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 RAZORPAY PAYMENT FLOW — step by step:
//
//  1. Customer taps "Pay ₹999"
//  2. App calls POST /api/payments/create-order
//     → Server creates a Razorpay Order (a payment intent)
//     → Returns: { razorpayOrderId, amount, currency, keyId }
//
//  3. App opens Razorpay checkout modal with those details
//     → Customer enters card/UPI details inside Razorpay's secure UI
//     → Razorpay processes the payment
//     → On success, Razorpay gives app: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
//
//  4. App calls POST /api/payments/verify with those 3 values
//     → Server verifies the SIGNATURE (cryptographic proof payment is real)
//     → If valid: marks payment SUCCESS in DB, sends confirmation notification
//
//  5. (Optional) Razorpay also calls our WEBHOOK for server-to-server confirmation
//
// WHY signature verification?
//   Without it, a hacker could send fake "payment successful" data.
//   The signature is: HMAC-SHA256(orderId + "|" + paymentId, secret_key)
//   Only Razorpay knows the secret_key, so only they can produce a valid signature.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';   // Node.js built-in crypto module
import Razorpay from 'razorpay';
import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { PaymentMethod } from '@prisma/client';
import notificationsService from '../notifications/notifications.service';
import { env } from '../../config/env';

// Initialize Razorpay client (singleton)
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export class PaymentsService {

  // ── Step 1: Create a Razorpay Order ───────────────────────────────────────
  async createOrder(customerId: string, bookingId: string, method: PaymentMethod) {
    // 1. Get booking and validate
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId },
      include: { service: true, payment: true },
    });

    if (!booking) throw new AppError('Booking not found', 404);

    // Can only pay for ACCEPTED bookings
    if (booking.status !== 'ACCEPTED') {
      throw new AppError('Can only pay for accepted bookings', 400);
    }

    // Check no existing successful payment
    if (booking.payment?.status === 'SUCCESS') {
      throw new AppError('This booking is already paid', 400);
    }

    // Handle cash payment (no Razorpay needed)
    if (method === 'CASH') {
      const payment = await prisma.payment.upsert({
        where: { bookingId },
        create: { bookingId, amount: booking.totalAmount, method: 'CASH', status: 'PENDING' },
        update: { method: 'CASH', status: 'PENDING' },
      });
      return { type: 'CASH', payment, message: 'Pay cash to the provider on arrival' };
    }

    // 2. Create Razorpay order
    // Amount must be in PAISE (multiply ₹ by 100)
    // ₹999 → 99900 paise
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: 'INR',
      receipt: `booking_${bookingId}`,           // your reference ID
      notes: {
        bookingId,
        customerId,
        serviceName: booking.service.name,
      },
      payment_capture: 1,  // auto-capture payment (don't hold, charge immediately)
    });

    // 3. Save pending payment in DB
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalAmount,
        method,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
      },
      update: {
        method,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
      },
    });

    // 4. Return everything the mobile app needs to open Razorpay checkout
    return {
      type: 'RAZORPAY',
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,       // in paise
      currency: razorpayOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,         // public key (safe to send to client)
      payment,
      // Pre-fill customer info in Razorpay modal
      prefill: {
        name: 'Customer',
        contact: '', // fill from user profile
      },
    };
  }

  // ── Step 2: Verify Payment Signature ──────────────────────────────────────
  async verifyPayment(data: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    // 1. Verify the cryptographic signature
    // This PROVES the payment came from Razorpay, not a hacker
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Timing-safe comparison prevents timing attacks
    // (using === leaks info about how many chars matched)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpaySignature)
    );

    if (!isValid) {
      // Mark payment as failed for security audit trail
      await prisma.payment.updateMany({
        where: { bookingId },
        data: { status: 'FAILED' },
      });
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // 2. Mark payment as successful in DB
    const payment = await prisma.payment.update({
      where: { bookingId },
      data: {
        status: 'SUCCESS',
        razorpayOrderId,
        razorpayPaymentId,
        paidAt: new Date(),
      },
      include: { booking: { select: { customerId: true, totalAmount: true } } },
    });

    // 3. Send payment success notification
    notificationsService.notifyPaymentSuccess(
      payment.booking.customerId,
      payment.amount,
      bookingId
    ).catch(console.error);

    return { payment, message: 'Payment verified successfully' };
  }

  // ── Cash payment collected (provider confirms) ────────────────────────────
  async confirmCashPayment(providerId_userId: string, bookingId: string) {
    // Verify provider owns this booking
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, provider: { userId: providerId_userId } },
      include: { payment: true },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.payment?.method !== 'CASH') {
      throw new AppError('This booking is not a cash payment', 400);
    }
    if (booking.status !== 'COMPLETED') {
      throw new AppError('Mark the booking as completed before confirming cash', 400);
    }

    const payment = await prisma.payment.update({
      where: { bookingId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    });

    // Update provider wallet balance
    await prisma.provider.update({
      where: { userId: providerId_userId },
      data: { walletBalance: { increment: booking.providerEarning } },
    });

    return { payment, message: 'Cash payment confirmed' };
  }

  // ── Admin: Refund a payment ────────────────────────────────────────────────
  // 📘 Refund is issued when: service was terrible, provider no-showed, etc.
  async refundPayment(bookingId: string, refundAmount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { select: { customerId: true } } },
    });

    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status !== 'SUCCESS') {
      throw new AppError('Can only refund successful payments', 400);
    }
    if (!payment.razorpayPaymentId) {
      throw new AppError('No Razorpay payment ID found for this payment', 400);
    }

    const amount = refundAmount
      ? Math.round(refundAmount * 100)  // partial refund in paise
      : undefined;                       // undefined = full refund

    // Call Razorpay refund API
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      ...(amount && { amount }),
      notes: { reason: 'Customer refund via 7StarExperts admin' },
    });

    const refundAmt = refundAmount ?? payment.amount;

    // Update payment record
    await prisma.payment.update({
      where: { bookingId },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
        refundAmount: refundAmt,
      },
    });

    // Notify customer
    await notificationsService.send({
      userId: payment.booking.customerId,
      title: '💰 Refund Initiated',
      body: `₹${refundAmt} refund has been initiated. It will reflect in 5-7 business days.`,
      type: 'PAYMENT_SUCCESS',
      data: { bookingId },
    });

    return { refund, refundAmount: refundAmt, message: 'Refund initiated successfully' };
  }

  // ── Razorpay Webhook handler ───────────────────────────────────────────────
  // 📘 Webhook = Razorpay calls OUR server when payment events happen
  // (payment.captured, payment.failed, refund.created, etc.)
  // This is a server-to-server call, more reliable than waiting for the app
  // The webhook URL is set in Razorpay dashboard
  async handleWebhook(rawBody: string, signature: string) {
    // Verify webhook signature (same principle as payment verification)
    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';

    if (webhookSecret) {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSig !== signature) {
        throw new AppError('Invalid webhook signature', 400);
      }
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;

    console.log(`📩 Razorpay Webhook: ${eventType}`);

    // Handle different webhook events
    switch (eventType) {
      case 'payment.captured': {
        // Payment was captured (auto-capture fires this)
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          await prisma.payment.updateMany({
            where: { razorpayOrderId: paymentEntity.order_id },
            data: {
              status: 'SUCCESS',
              razorpayPaymentId: paymentEntity.id,
              paidAt: new Date(),
            },
          });
        }
        break;
      }
      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          await prisma.payment.updateMany({
            where: { razorpayOrderId: paymentEntity.order_id },
            data: { status: 'FAILED' },
          });
        }
        break;
      }
      case 'refund.created': {
        // Refund was created — already handled in refundPayment()
        break;
      }
    }

    return { received: true };
  }

  // ── Get payment details for a booking ─────────────────────────────────────
  async getPaymentByBooking(bookingId: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        booking: {
          OR: [{ customerId: userId }, { provider: { userId } }],
        },
      },
    });

    if (!payment) throw new AppError('Payment not found', 404);
    return payment;
  }

  // ── Admin: Get all payments with stats ────────────────────────────────────
  async getAllPayments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              service: { select: { name: true } },
              customer: { select: { name: true, phone: true } },
            },
          },
        },
      }),
      prisma.payment.count(),
      prisma.payment.aggregate({
        _sum: { amount: true, refundAmount: true },
        _count: { id: true },
        where: { status: 'SUCCESS' },
      }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      stats: {
        totalRevenue: stats._sum.amount ?? 0,
        totalRefunded: stats._sum.refundAmount ?? 0,
        successfulPayments: stats._count.id,
        netRevenue: (stats._sum.amount ?? 0) - (stats._sum.refundAmount ?? 0),
      },
    };
  }
}

export default new PaymentsService();
