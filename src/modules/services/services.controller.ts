import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import servicesService from './services.service';

// GET /api/services?category=&page=&limit=
export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
  const { category, page = 1, limit = 10 } = req.query;

  const result = await servicesService.getAllServices({
    category: category as string,
    page: Number(page),
    limit: Number(limit),
  });

  return sendPaginated(res, result.services, result.total, result.page, result.limit);
});

// GET /api/services/search?q=clean&minPrice=200&maxPrice=1000
export const searchServices = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

  const result = await servicesService.searchServices({
    q: q as string,
    category: category as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  return sendPaginated(res, result.services, result.total, result.page, result.limit);
});

// GET /api/services/:id
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.getServiceById(req.params['id'] as string);
  return sendSuccess(res, service, 'Service fetched successfully');
});

// POST /api/services — admin only
export const createService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const service = await servicesService.createService(req.body);
  return sendSuccess(res, service, 'Service created successfully', 201);
});

// PUT /api/services/:id — admin only
export const updateService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const service = await servicesService.updateService(req.params['id'] as string, req.body);
  return sendSuccess(res, service, 'Service updated successfully');
});

// DELETE /api/services/:id — admin only
export const deleteService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await servicesService.deleteService(req.params['id'] as string);
  return sendSuccess(res, result, 'Service deleted');
});
