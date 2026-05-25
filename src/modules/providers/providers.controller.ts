import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import providersService from './providers.service';

// GET /api/providers/me — provider sees own profile
export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await providersService.getMyProfile(req.user!.id);
  return sendSuccess(res, profile, 'Provider profile fetched');
});

// PUT /api/providers/me — provider updates own profile
export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await providersService.updateProfile(req.user!.id, req.body);
  return sendSuccess(res, profile, 'Profile updated successfully');
});

// POST /api/providers/services — provider adds a service they offer
export const addService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serviceId, price } = req.body;
  const result = await providersService.addService(req.user!.id, serviceId, price);
  return sendSuccess(res, result, 'Service added to your offerings', 201);
});

// DELETE /api/providers/services/:serviceId — provider removes a service
export const removeService = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await providersService.removeService(
    req.user!.id,
    req.params['serviceId'] as string
  );
  return sendSuccess(res, result, 'Service removed');
});

// PUT /api/providers/availability — set working hours
export const setAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await providersService.setAvailability(req.user!.id, req.body.availability);
  return sendSuccess(res, result, 'Availability updated');
});

// PATCH /api/providers/toggle-availability — go online/offline
export const toggleAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await providersService.toggleAvailability(req.user!.id, req.body.isAvailable);
  return sendSuccess(res, result, result.message);
});

// GET /api/providers/search?serviceId=&lat=&lng=&sortBy=
export const searchProviders = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId, lat, lng, page = 1, limit = 10, sortBy = 'rating' } = req.query;

  const result = await providersService.searchProviders({
    serviceId: serviceId as string,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
  });

  return sendPaginated(res, result.providers, result.total, result.page, result.limit);
});

// GET /api/providers/:id — public profile (for customers to view)
export const getProviderPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await providersService.getProviderPublicProfile(req.params['id'] as string);
  return sendSuccess(res, profile, 'Provider profile fetched');
});

// PATCH /api/providers/:id/status — admin: verify/reject/suspend provider
export const updateProviderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const result = await providersService.updateProviderStatus(
    req.params['id'] as string,
    status
  );
  return sendSuccess(res, result, `Provider status updated to ${status}`);
});

// GET /api/providers — admin: list all providers
export const getAllProviders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;
  const result = await providersService.getAllProviders(
    status as string,
    Number(page),
    Number(limit)
  );
  return sendPaginated(res, result.providers, result.total, result.page, result.limit);
});
