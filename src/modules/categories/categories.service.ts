// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES SERVICE — Business Logic
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Service layer = WHERE the actual work happens.
// The controller just says "do this thing" and the service figures out HOW.
//
// Categories are the top-level groupings: "Cleaning", "Plumbing", "Beauty"
// Each category has many Services under it.
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class CategoriesService {
  // ── Get all active categories (for the home screen grid) ─────────────────
  async getAllCategories(showAll = false) {
    return prisma.category.findMany({
      where: showAll ? undefined : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        isActive: true,
        sortOrder: true,
        _count: {
          select: { services: true },
        },
      },
    });
  }

  // ── Get one category with all its services ────────────────────────────────
  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            basePrice: true,
            duration: true,
          },
        },
      },
    });

    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  // ── Create category (ADMIN only) ──────────────────────────────────────────
  async createCategory(data: {
    name: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
  }) {
    // Check for duplicate name
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Category with this name already exists', 409);

    return prisma.category.create({ data });
  }

  // ── Update category (ADMIN only) ──────────────────────────────────────────
  async updateCategory(id: string, data: {
    name?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError('Category not found', 404);

    return prisma.category.update({ where: { id }, data });
  }

  // ── Delete category (ADMIN only — soft delete by deactivating) ────────────
  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError('Category not found', 404);

    // Soft delete: set isActive = false instead of actually deleting
    // This preserves data integrity (services still reference this category)
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    return { message: 'Category deactivated successfully' };
  }
}

export default new CategoriesService();
