import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import { logActivity } from '../../utils/activity-log.util';
import categoriesService from './categories.service';

// GET /api/categories?showAll=true — showAll is admin-only flag to include inactive
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoriesService.getAllCategories(req.query['showAll'] === 'true');
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
  await logActivity(req, { action: 'CREATE', entity: 'Category', entityId: category.id, entityName: category.name });
  return sendSuccess(res, category, 'Category created successfully', 201);
});

// PUT /api/categories/:id — admin only
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string;
  const category = await categoriesService.updateCategory(id, req.body);
  await logActivity(req, { action: 'UPDATE', entity: 'Category', entityId: category.id, entityName: category.name, changes: req.body });
  return sendSuccess(res, category, 'Category updated successfully');
});

// DELETE /api/categories/:id — admin only
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string;
  const result = await categoriesService.deleteCategory(id);
  await logActivity(req, { action: 'DELETE', entity: 'Category', entityId: id });
  return sendSuccess(res, result, 'Category deleted');
});
