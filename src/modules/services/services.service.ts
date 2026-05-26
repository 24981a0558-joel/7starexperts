// ─────────────────────────────────────────────────────────────────────────────
// SERVICES SERVICE — Business Logic
// ─────────────────────────────────────────────────────────────────────────────
// 📘 "Services" here means the home services offered on the platform
// (Cleaning, Plumbing etc.) — NOT Node.js/Express services.
//
// This module handles:
// - Listing all services
// - Searching/filtering services
// - Getting providers available for a service
// - Admin: create/update/delete services
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class ServicesService {
  // ── List all services (with optional category filter) ─────────────────────
  async getAllServices(query: {
    category?: string;
    page: number;
    limit: number;
    showAll?: boolean; // admin-only: include inactive/suspended services
  }) {
    const { category, page, limit, showAll } = query;
    const skip = (page - 1) * limit; // pagination offset
    // e.g. page=2, limit=10 → skip first 10, get next 10

    const where = {
      ...(!showAll && { isActive: true }), // customers only see active; admin sees all
      ...(category && { categoryId: category }),
    };

    const [services, total] = await Promise.all([
      // Promise.all → runs both queries IN PARALLEL (faster!)
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: { select: { id: true, name: true, icon: true } },
          _count: { select: { providers: true } }, // how many providers offer this
        },
      }),
      prisma.service.count({ where }),
    ]);

    return { services, total, page, limit };
  }

  // ── Search services by keyword + filters ─────────────────────────────────
  async searchServices(query: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
  }) {
    const { q, category, minPrice, maxPrice, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(category && { categoryId: category }),
      // Price range filter
      ...(minPrice !== undefined || maxPrice !== undefined) && {
        basePrice: {
          ...(minPrice !== undefined && { gte: minPrice }), // gte = greater than or equal
          ...(maxPrice !== undefined && { lte: maxPrice }), // lte = less than or equal
        },
      },
      // Keyword search across name AND description
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },         // case-insensitive search
          { description: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          _count: { select: { providers: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    return { services, total, page, limit };
  }

  // ── Get one service with available providers ──────────────────────────────
  async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        providers: {
          where: {
            isActive: true,
            provider: {
              status: 'VERIFIED',    // only show verified providers
              isAvailable: true,     // only show providers who are online
            },
          },
          include: {
            provider: {
              select: {
                id: true,
                rating: true,
                totalReviews: true,
                experience: true,
                bio: true,
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
          orderBy: {
            provider: { rating: 'desc' }, // best rated first
          },
        },
      },
    });

    if (!service) throw new AppError('Service not found', 404);
    return service;
  }

  // ── Admin: Create service ─────────────────────────────────────────────────
  async createService(data: {
    categoryId: string;
    name: string;
    description?: string;
    image?: string;
    basePrice: number;
    duration: number;
  }) {
    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Category not found', 404);

    return prisma.service.create({
      data,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  // ── Admin: Update service ─────────────────────────────────────────────────
  async updateService(id: string, data: {
    categoryId?: string;
    name?: string;
    description?: string;
    image?: string;
    basePrice?: number;
    duration?: number;
    isActive?: boolean;
  }) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError('Service not found', 404);

    return prisma.service.update({ where: { id }, data });
  }

  // ── Admin: Delete service (soft delete) ───────────────────────────────────
  async deleteService(id: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError('Service not found', 404);

    await prisma.service.update({ where: { id }, data: { isActive: false } });
    return { message: 'Service deactivated successfully' };
  }
}

export default new ServicesService();
