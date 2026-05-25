// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS SERVICE — The Heart of the App
// ─────────────────────────────────────────────────────────────────────────────
// 📘 The booking lifecycle:
//
//  Customer                Provider               System
//  ────────────────────────────────────────────────────────
//  Creates booking ──────► PENDING
//                          Provider notified
//                          ACCEPTED ◄──── Provider accepts
//                          REJECTED ◄──── Provider rejects
//  If rejected → can rebook with another provider
//                          EN_ROUTE ◄──── Provider starts traveling
//                          IN_PROGRESS ◄─ Provider arrives, starts work
//                          COMPLETED ◄─── Provider marks done
//  Pays & reviews ─────────────────────────────────────────►
//
// OR:
//  CANCELLED ◄──── Customer/Provider cancels (with reason)
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { BookingStatus } from '@prisma/client';
import notificationsService from '../notifications/notifications.service';

// Platform commission rate (15%)
const PLATFORM_FEE_PERCENTAGE = 0.15;

export class BookingsService {
  // ── Create a new booking ───────────────────────────────────────────────────
  async createBooking(customerId: string, data: {
    serviceId: string;
    providerId?: string;
    addressId: string;
    scheduledAt: Date;
    notes?: string;
  }) {
    // 1. Verify the service exists and is active
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, isActive: true },
    });
    if (!service) throw new AppError('Service not found or unavailable', 404);

    // 2. Verify the address belongs to this customer
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId: customerId },
    });
    if (!address) throw new AppError('Address not found', 404);

    // 3. If provider specified, verify they offer this service
    let providerId = data.providerId;
    if (providerId) {
      const providerService = await prisma.providerService.findFirst({
        where: { provider: { id: providerId }, serviceId: data.serviceId, isActive: true },
        include: { provider: true },
      });
      if (!providerService) {
        throw new AppError('This provider does not offer this service', 400);
      }
      if (providerService.provider.status !== 'VERIFIED') {
        throw new AppError('Provider is not verified', 400);
      }
    }

    // 4. Calculate prices
    const totalAmount = service.basePrice;
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
    const providerEarning = totalAmount - platformFee;

    // 5. Create the booking
    const booking = await prisma.booking.create({
      data: {
        customerId,
        providerId: data.providerId ?? null,
        serviceId: data.serviceId,
        addressId: data.addressId,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        totalAmount,
        platformFee,
        providerEarning,
        status: 'PENDING',
      },
      include: {
        service: { select: { id: true, name: true, duration: true } },
        address: true,
        provider: data.providerId
          ? { select: { user: { select: { name: true, phone: true, avatar: true } } } }
          : false,
      },
    });

    // 6. Send push notification to provider (if a specific provider was chosen)
    if (data.providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: data.providerId },
        select: { userId: true },
      });
      if (provider) {
        // Fire-and-forget — don't await, don't block booking creation
        notificationsService.notifyNewBooking(provider.userId, booking).catch(console.error);
      }
    }

    return booking;
  }

  // ── Get bookings for the logged-in user ────────────────────────────────────
  // Works for both customer (sees their bookings) and provider (sees assigned bookings)
  async getMyBookings(userId: string, role: string, query: {
    status?: BookingStatus;
    page: number;
    limit: number;
  }) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    // Different where clause based on role
    const where: any = {
      ...(status && { status }),
      ...(role === 'CUSTOMER' && { customerId: userId }),
      ...(role === 'PROVIDER' && {
        provider: { userId }, // join through provider to match userId
      }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // newest first
        include: {
          service: { select: { id: true, name: true, image: true, duration: true } },
          customer: { select: { id: true, name: true, avatar: true, phone: true } },
          provider: {
            select: { user: { select: { id: true, name: true, avatar: true, phone: true } } },
          },
          address: { select: { fullAddress: true, lat: true, lng: true } },
          payment: { select: { status: true, method: true, amount: true } },
          review: { select: { rating: true, comment: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit };
  }

  // ── Get a single booking detail ────────────────────────────────────────────
  async getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: { id: true, name: true, description: true, image: true, duration: true },
        },
        customer: { select: { id: true, name: true, avatar: true, phone: true } },
        provider: {
          select: {
            id: true,
            currentLat: true,
            currentLng: true,
            user: { select: { id: true, name: true, avatar: true, phone: true } },
          },
        },
        address: true,
        payment: true,
        review: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // last 50 messages
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);

    // Security: only the customer or provider can see this booking
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.provider?.user
      ? (booking.provider as any).userId === userId
      : false;

    if (!isCustomer && !isProvider) {
      throw new AppError('Access denied', 403);
    }

    return booking;
  }

  // ── Update booking status ──────────────────────────────────────────────────
  // This single method handles the ENTIRE booking lifecycle transitions
  async updateBookingStatus(bookingId: string, userId: string, role: string, data: {
    status: BookingStatus;
    cancellationReason?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) throw new AppError('Booking not found', 404);

    // ── Validate who can do what ───────────────────────────────────────────
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.provider?.userId === userId;

    // Define allowed transitions per role
    const customerAllowed: BookingStatus[] = ['CANCELLED'];
    const providerAllowed: BookingStatus[] = ['ACCEPTED', 'REJECTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (isCustomer && !customerAllowed.includes(data.status)) {
      throw new AppError('Customers can only cancel bookings', 403);
    }

    if (isProvider && !providerAllowed.includes(data.status)) {
      throw new AppError('Invalid status update for provider', 403);
    }

    if (!isCustomer && !isProvider) {
      throw new AppError('Access denied', 403);
    }

    // ── Validate status transitions (prevent jumping stages) ──────────────
    const validTransitions: Record<string, BookingStatus[]> = {
      PENDING:      ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED:     ['EN_ROUTE', 'CANCELLED'],
      EN_ROUTE:     ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS:  ['COMPLETED', 'CANCELLED'],
      COMPLETED:    [], // terminal state — no further changes
      REJECTED:     [], // terminal state
      CANCELLED:    [], // terminal state
    };

    const allowed = validTransitions[booking.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw new AppError(
        `Cannot change status from ${booking.status} to ${data.status}`,
        400
      );
    }

    // ── Build update data ──────────────────────────────────────────────────
    const updateData: any = {
      status: data.status,
      ...(data.cancellationReason && { cancellationReason: data.cancellationReason }),
      ...(data.status === 'IN_PROGRESS' && { startedAt: new Date() }),
      ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
    };

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // ── Post-completion: update provider earnings ──────────────────────────
    if (data.status === 'COMPLETED' && booking.provider) {
      await prisma.provider.update({
        where: { id: booking.provider.id },
        data: {
          totalEarnings: { increment: booking.providerEarning },
          walletBalance: { increment: booking.providerEarning },
        },
      });
    }

    // ── Send push notification based on new status ─────────────────────────
    const fullBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true } },
        provider: { select: { userId: true, user: { select: { name: true } } } },
      },
    });

    if (fullBooking) {
      switch (data.status) {
        case 'ACCEPTED':
          notificationsService.notifyBookingAccepted(fullBooking.customerId, fullBooking).catch(console.error);
          break;
        case 'REJECTED':
          notificationsService.notifyBookingRejected(fullBooking.customerId, fullBooking).catch(console.error);
          break;
        case 'EN_ROUTE':
          if (fullBooking.provider?.user?.name) {
            notificationsService.notifyProviderEnRoute(fullBooking.customerId, fullBooking.provider.user.name, bookingId).catch(console.error);
          }
          break;
        case 'COMPLETED':
          notificationsService.notifyBookingCompleted(fullBooking.customerId, fullBooking).catch(console.error);
          break;
      }
    }

    return updated;
  }

  // ── Admin: Get all bookings ────────────────────────────────────────────────
  async getAllBookings(status?: BookingStatus, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          provider: { select: { user: { select: { name: true, phone: true } } } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit };
  }

  // ── Get booking stats (for dashboard) ─────────────────────────────────────
  async getBookingStats() {
    const [total, pending, completed, cancelled, revenue] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      pending,
      completed,
      cancelled,
      totalRevenue: revenue._sum.amount ?? 0,
    };
  }
}

export default new BookingsService();
