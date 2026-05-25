// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
// 📘 These schemas validate data BEFORE it reaches the controller.
// Joi.object() defines what shape req.body must have.
// .required() = field must be present
// .optional() = field can be skipped
// ─────────────────────────────────────────────────────────────────────────────

import Joi from 'joi';

// POST /api/categories — create a category (admin only)
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  icon: Joi.string().uri().optional(),         // must be a valid URL if provided
  description: Joi.string().max(300).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

// PUT /api/categories/:id — update a category (admin only)
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional(),
  icon: Joi.string().uri().optional(),
  description: Joi.string().max(300).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(), // admin can deactivate a category
});
