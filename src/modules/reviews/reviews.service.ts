// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Review rules:
//   ✅ Only customers can leave reviews
//   ✅ Only for COMPLETED bookings
//   ✅ One review per booking (enforced by DB unique constraint)
//   ✅ Provider's average rating auto-recalculates after each review
//
// RATING CALCULATION:
//   We use a RUNNING AVERAGE approach (efficient — no need to re-read all reviews):
//   newAvg = ((oldAvg × oldCount) + newRating) / (oldCount + 1)
//
//   Example:
//   Provider has avg 4.0 from 10 reviews
//   New review is 5 stars
//   newAvg = ((4.0 × 10) + 5) / 11 = 45/11 = 4.09
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class ReviewsService {
  // ── Create a new review ───────────────────────────────────────────────────
  async createReview(customerId: string, data: {
    bookingId: string;
    rating: number;
    comment?: string;
  }) {
    // 1. Get the booking — must be COMPLETED and owned by this customer
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, customerId, status: 'COMPLETED' },
      include: { provider: { select: { id: true, rating: true, totalReviews: true } } },
    });

    if (!booking) {
      throw new AppError('Booking not found or not completed yet', 404);
    }

    if (!booking.providerId || !booking.provider) {
      throw new AppError('No provider assigned to this booking', 400);
    }

    // 2. Check review doesn't already exist (extra safety beyond DB unique constraint)
    const existing = await prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) {
      throw new AppError('You have already reviewed this booking', 409);
    }

    // 3. Get provider's userId first
    const providerUser = await prisma.provider.findUnique({
      where: { id: booking.providerId },
      select: { userId: true },
    });

    if (!providerUser) throw new AppError('Provider not found', 404);

    // 4. Create the review
    const review = await prisma.review.create({
      data: {
        bookingId: data.bookingId,
        fromUserId: customerId,
        toUserId: providerUser.userId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // 4. Recalculate provider's average rating (running average)
    const oldAvg = booking.provider.rating;
    const oldCount = booking.provider.totalReviews;
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + data.rating) / newCount;

    await prisma.provider.update({
      where: { id: booking.providerId },
      data: {
        rating: Math.round(newAvg * 10) / 10,  // round to 1 decimal: 4.09 → 4.1
        totalReviews: newCount,
      },
    });

    return prisma.review.findUnique({
      where: { id: review.id },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        booking: { select: { service: { select: { name: true } } } },
      },
    });
  }

  // ── Get reviews for a provider ────────────────────────────────────────────
  // Used on provider profile page — shows customer reviews with ratings
  async getProviderReviews(providerId: string, query: {
    rating?: number;
    page: number;
    limit: number;
    sortBy: string;
  }) {
    const { rating, page, limit, sortBy } = query;
    const skip = (page - 1) * limit;

    // Get provider's userId to query reviews
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { userId: true, rating: true, totalReviews: true },
    });
    if (!provider) throw new AppError('Provider not found', 404);

    const where = {
      toUserId: provider.userId,
      ...(rating && { rating }),
    };

    // Sort order based on query param
    const orderBy =
      sortBy === 'highest' ? { rating: 'desc' as const } :
      sortBy === 'lowest'  ? { rating: 'asc' as const }  :
                             { createdAt: 'desc' as const }; // 'recent' = default

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          fromUser: { select: { id: true, name: true, avatar: true } },
          booking: { select: { service: { select: { name: true } } } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // Rating breakdown: count of each star (1-5)
    const breakdown = await prisma.review.groupBy({
      by: ['rating'],
      where: { toUserId: provider.userId },
      _count: { rating: true },
      orderBy: { rating: 'desc' },
    });

    // Format breakdown as { "5": 120, "4": 45, "3": 10, "2": 3, "1": 2 }
    const ratingBreakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    breakdown.forEach((b) => {
      ratingBreakdown[String(b.rating)] = b._count.rating;
    });

    return {
      reviews,
      total,
      page,
      limit,
      averageRating: provider.rating,
      totalReviews: provider.totalReviews,
      ratingBreakdown,
    };
  }

  // ── Get reviews written BY a customer ─────────────────────────────────────
  async getMyReviews(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { fromUserId: customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          toUser: { select: { id: true, name: true, avatar: true } },
          booking: { select: { service: { select: { name: true, image: true } } } },
        },
      }),
      prisma.review.count({ where: { fromUserId: customerId } }),
    ]);

    return { reviews, total, page, limit };
  }

  // ── Check if customer can review a booking ────────────────────────────────
  // App calls this to show/hide the "Leave Review" button
  async canReview(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, customerId, status: 'COMPLETED' },
    });

    if (!booking) return { canReview: false, reason: 'Booking not completed' };

    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) return { canReview: false, reason: 'Already reviewed' };

    return { canReview: true };
  }

  // ── Admin: Get all reviews (for moderation) ───────────────────────────────
  async getAllReviews(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { name: true } },
          toUser: { select: { name: true } },
          booking: { select: { service: { select: { name: true } } } },
        },
      }),
      prisma.review.count(),
    ]);

    return { reviews, total, page, limit };
  }

  // ── Admin: Delete a review (moderation) ───────────────────────────────────
  async deleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: { select: { providerId: true } } },
    });
    if (!review) throw new AppError('Review not found', 404);

    // Delete the review
    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate provider's rating from scratch after deletion
    if (review.booking.providerId) {
      const stats = await prisma.review.aggregate({
        where: { toUserId: review.toUserId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.provider.update({
        where: { id: review.booking.providerId },
        data: {
          rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          totalReviews: stats._count.id,
        },
      });
    }

    return { message: 'Review deleted and provider rating recalculated' };
  }
}

export default new ReviewsService();
