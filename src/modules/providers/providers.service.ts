// ─────────────────────────────────────────────────────────────────────────────
// PROVIDERS SERVICE — Business Logic
// ─────────────────────────────────────────────────────────────────────────────
// 📘 This module handles everything from the PROVIDER's side:
// - Provider profile setup
// - Which services they offer (and at what price)
// - Their availability schedule
// - Search: finding providers for a given service near the customer
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class ProvidersService {
  // ── Get provider's own profile ────────────────────────────────────────────
  async getMyProfile(userId: string) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        services: {
          where: { isActive: true },
          include: {
            service: {
              select: { id: true, name: true, category: { select: { name: true } } },
            },
          },
        },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!provider) throw new AppError('Provider profile not found', 404);
    return provider;
  }

  // ── Update provider profile ───────────────────────────────────────────────
  async updateProfile(userId: string, data: {
    bio?: string;
    experience?: number;
    bankDetails?: object;
  }) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new AppError('Provider profile not found', 404);

    return prisma.provider.update({
      where: { userId },
      data,
    });
  }

  // ── Add a service to provider's offerings ─────────────────────────────────
  // Provider says "I offer Full Home Cleaning at ₹1200"
  async addService(userId: string, serviceId: string, price: number) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new AppError('Provider profile not found', 404);

    // Check service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new AppError('Service not found', 404);

    // upsert = create if doesn't exist, update if it does
    return prisma.providerService.upsert({
      where: { providerId_serviceId: { providerId: provider.id, serviceId } },
      update: { price, isActive: true },
      create: { providerId: provider.id, serviceId, price },
    });
  }

  // ── Remove a service from provider's offerings ────────────────────────────
  async removeService(userId: string, serviceId: string) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new AppError('Provider profile not found', 404);

    await prisma.providerService.updateMany({
      where: { providerId: provider.id, serviceId },
      data: { isActive: false },
    });

    return { message: 'Service removed from your offerings' };
  }

  // ── Set weekly availability ────────────────────────────────────────────────
  // Provider sets their working hours for each day
  async setAvailability(userId: string, availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOff: boolean;
  }>) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new AppError('Provider profile not found', 404);

    // Delete existing availability and recreate
    // This is simpler than updating each day individually
    await prisma.providerAvailability.deleteMany({ where: { providerId: provider.id } });

    const created = await prisma.providerAvailability.createMany({
      data: availability.map((slot) => ({
        providerId: provider.id,
        ...slot,
      })),
    });

    return { message: `Availability set for ${created.count} days` };
  }

  // ── Toggle online/offline status ──────────────────────────────────────────
  // Provider can go "online" to receive bookings or "offline" to stop
  async toggleAvailability(userId: string, isAvailable: boolean) {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new AppError('Provider profile not found', 404);

    // Verified providers can go online; pending/rejected cannot
    if (isAvailable && provider.status !== 'VERIFIED') {
      throw new AppError('Your profile must be verified before going online', 403);
    }

    await prisma.provider.update({ where: { userId }, data: { isAvailable } });
    return { isAvailable, message: isAvailable ? 'You are now online' : 'You are now offline' };
  }

  // ── Search providers for a service ────────────────────────────────────────
  // Customer wants "Full Home Cleaning" near their location
  async searchProviders(query: {
    serviceId: string;
    lat?: number;
    lng?: number;
    page: number;
    limit: number;
    sortBy: string;
  }) {
    const { serviceId, page, limit, sortBy } = query;
    const skip = (page - 1) * limit;

    // Find all verified, available providers who offer this service
    const [providerServices, total] = await Promise.all([
      prisma.providerService.findMany({
        where: {
          serviceId,
          isActive: true,
          provider: {
            status: 'VERIFIED',
            isAvailable: true,
          },
        },
        skip,
        take: limit,
        orderBy: sortBy === 'price'
          ? { price: 'asc' }
          : sortBy === 'experience'
          ? { provider: { experience: 'desc' } }
          : { provider: { rating: 'desc' } }, // default: best rated first
        include: {
          provider: {
            select: {
              id: true,
              bio: true,
              experience: true,
              rating: true,
              totalReviews: true,
              currentLat: true,
              currentLng: true,
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
        },
      }),
      prisma.providerService.count({
        where: {
          serviceId,
          isActive: true,
          provider: { status: 'VERIFIED', isAvailable: true },
        },
      }),
    ]);

    // Format response for mobile app
    const providers = providerServices.map((ps) => ({
      providerServiceId: ps.id,
      price: ps.price,
      providerId: ps.provider.id,
      name: ps.provider.user.name,
      avatar: ps.provider.user.avatar,
      bio: ps.provider.bio,
      experience: ps.provider.experience,
      rating: ps.provider.rating,
      totalReviews: ps.provider.totalReviews,
      // Distance calculation would go here if we had PostGIS
      // For now we return null; frontend can calculate using lat/lng
      location: ps.provider.currentLat
        ? { lat: ps.provider.currentLat, lng: ps.provider.currentLng }
        : null,
    }));

    return { providers, total, page, limit };
  }

  // ── Get provider public profile (for customers to view) ───────────────────
  async getProviderPublicProfile(providerId: string) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        bio: true,
        experience: true,
        rating: true,
        totalReviews: true,
        status: true,
        user: { select: { id: true, name: true, avatar: true } },
        services: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                image: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        // Latest 5 reviews
        bookings: {
          where: { status: 'COMPLETED' },
          take: 5,
          orderBy: { completedAt: 'desc' },
          select: {
            review: {
              select: { rating: true, comment: true, createdAt: true, fromUser: { select: { name: true, avatar: true } } },
            },
          },
        },
      },
    });

    if (!provider) throw new AppError('Provider not found', 404);
    return provider;
  }

  // ── Admin: Verify or reject a provider ────────────────────────────────────
  async updateProviderStatus(providerId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) throw new AppError('Provider not found', 404);

    return prisma.provider.update({ where: { id: providerId }, data: { status } });
  }

  // ── Admin: Get all providers with filters ─────────────────────────────────
  async getAllProviders(status?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.provider.count({ where }),
    ]);

    return { providers, total, page, limit };
  }
}

export default new ProvidersService();
