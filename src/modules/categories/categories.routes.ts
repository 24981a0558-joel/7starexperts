// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Route = URL + HTTP method + handler chain
//
// Public routes: anyone can read categories (no login needed)
// Admin routes: only ADMIN role can create/edit/delete categories
//
// protect     → checks JWT token (user must be logged in)
// restrictTo  → checks user role (must be ADMIN)
// validate    → checks request body shape
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.validation';

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('ADMIN'), validate(createCategorySchema), createCategory);
router.put('/:id', protect, restrictTo('ADMIN'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteCategory);

export default router;
