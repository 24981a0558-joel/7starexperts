// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Controller = the "traffic manager".
// It receives HTTP requests, pulls out the data from req,
// calls the service, and sends back the HTTP response.
//
// Rule: controllers should be THIN (no business logic inside).
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import categoriesService from './categories.service';

// GET /api/categories — public, no auth needed
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoriesService.getAllCategories();
  return sendSuccess(res, categories, 'Categories fetched successfully');
});

// GET /api/categories/:id — public
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.getCategoryById(req.params['id'] as string);
  return sendSuccess(res, category, 'Category fetched successfully');
});

// POST /api/categories — admin only
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoriesService.createCategory(req.body);
  return sendSuccess(res, category, 'Category created successfully', 201);
});

// PUT /api/categories/:id — admin only
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoriesService.updateCategory(req.params['id'] as string, req.body);
  return sendSuccess(res, category, 'Category updated successfully');
});

// DELETE /api/categories/:id — admin only
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await categoriesService.deleteCategory(req.params['id'] as string);
  return sendSuccess(res, result, 'Category deleted');
});
