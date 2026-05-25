// ─────────────────────────────────────────────────────────────────────────────
// WALLET & PAYOUT SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Provider Wallet:
//   After each completed booking, the provider's earning is credited to their
//   in-app wallet balance. They can then request a PAYOUT (withdrawal) to
//   their bank account.
//
// Payout flow:
//   Provider requests withdrawal → Admin reviews → Admin approves
//   → Bank transfer (via Razorpay Payouts or NEFT) → Balance deducted
//
// Wallet transactions are tracked in the Booking table (providerEarning field)
// For production you'd add a separate WalletTransaction table for full audit trail.
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class WalletService {
  // ── Get provider wallet balance + transaction history ─────────────────────
  async getWallet(userId: string) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: {
        id: true,
        walletBalance: true,
        totalEarnings: true,
        bankDetails: true,
      },
    });

    if (!provider) throw new AppError('Provider not found', 404);

    // Get recent completed bookings as "transactions"
    const transactions = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: 'COMPLETED',
        payment: { status: 'SUCCESS' },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        providerEarning: true,
        totalAmount: true,
        platformFee: true,
        completedAt: true,
        service: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });

    return {
      walletBalance: provider.walletBalance,
      totalEarnings: provider.totalEarnings,
      bankDetails: provider.bankDetails,
      recentTransactions: transactions.map((t) => ({
        bookingId: t.id,
        serviceName: t.service.name,
        customerName: t.customer.name,
        grossAmount: t.totalAmount,
        platformFee: t.platformFee,
        netEarning: t.providerEarning,  // what provider got
        date: t.completedAt,
        type: 'CREDIT',
      })),
    };
  }

  // ── Provider requests a payout ────────────────────────────────────────────
  async requestPayout(userId: string, amount: number) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: {
        id: true,
        walletBalance: true,
        bankDetails: true,
        status: true,
      },
    });

    if (!provider) throw new AppError('Provider not found', 404);
    if (provider.status !== 'VERIFIED') throw new AppError('Provider not verified', 403);
    if (!provider.bankDetails) throw new AppError('Please add bank details first', 400);

    // Minimum payout ₹100
    if (amount < 100) throw new AppError('Minimum payout amount is ₹100', 400);

    if (amount > provider.walletBalance) {
      throw new AppError(
        `Insufficient balance. Available: ₹${provider.walletBalance}`,
        400
      );
    }

    // Deduct from wallet immediately (hold amount)
    await prisma.provider.update({
      where: { id: provider.id },
      data: { walletBalance: { decrement: amount } },
    });

    // In a real app you'd:
    // 1. Create a PayoutRequest record in DB
    // 2. Admin approves → triggers Razorpay Payout API
    // For now we just simulate it
    return {
      message: `Payout of ₹${amount} requested successfully`,
      newBalance: provider.walletBalance - amount,
      estimatedDays: '2-3 business days',
    };
  }

  // ── Earnings stats for provider dashboard ─────────────────────────────────
  async getEarningsStats(userId: string) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) throw new AppError('Provider not found', 404);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of this week

    const [
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalCompletedBookings,
      pendingBookings,
    ] = await Promise.all([
      // Today's earnings
      prisma.booking.aggregate({
        where: {
          providerId: provider.id,
          status: 'COMPLETED',
          completedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
        _sum: { providerEarning: true },
      }),
      // This week
      prisma.booking.aggregate({
        where: {
          providerId: provider.id,
          status: 'COMPLETED',
          completedAt: { gte: startOfWeek },
        },
        _sum: { providerEarning: true },
      }),
      // This month
      prisma.booking.aggregate({
        where: {
          providerId: provider.id,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
        _sum: { providerEarning: true },
      }),
      // Total completed jobs
      prisma.booking.count({
        where: { providerId: provider.id, status: 'COMPLETED' },
      }),
      // Active/pending jobs right now
      prisma.booking.count({
        where: {
          providerId: provider.id,
          status: { in: ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return {
      today: todayEarnings._sum.providerEarning ?? 0,
      thisWeek: weekEarnings._sum.providerEarning ?? 0,
      thisMonth: monthEarnings._sum.providerEarning ?? 0,
      totalCompletedBookings,
      pendingBookings,
    };
  }
}

export default new WalletService();
