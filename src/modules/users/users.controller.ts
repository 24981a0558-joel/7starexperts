import { Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response.util';
import usersService from './users.service';

// GET /api/users/profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.getUserById(req.user!.id);
  return sendSuccess(res, user, 'Profile fetched successfully');
});

// PUT /api/users/profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  return sendSuccess(res, user, 'Profile updated successfully');
});

// GET /api/users/addresses
export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const addresses = await usersService.getAddresses(req.user!.id);
  return sendSuccess(res, addresses, 'Addresses fetched');
});

// POST /api/users/addresses
export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const address = await usersService.addAddress(req.user!.id, req.body);
  return sendSuccess(res, address, 'Address added successfully', 201);
});

// DELETE /api/users/addresses/:addressId
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await usersService.deleteAddress(req.user!.id, req.params['addressId'] as string);
  return sendSuccess(res, result, 'Address deleted');
});
