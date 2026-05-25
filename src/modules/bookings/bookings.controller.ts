import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import bookingsService from './bookings.service';
import { BookingStatus } from '@prisma/client';

// POST /api/bookings — customer creates a booking
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await bookingsService.createBooking(req.user!.id, req.body);
  return sendSuccess(res, booking, 'Booking created successfully', 201);
});

// GET /api/bookings — customer or provider sees their bookings
export const getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;

  const result = await bookingsService.getMyBookings(
    req.user!.id,
    req.user!.role,
    {
      status: status as BookingStatus,
      page: Number(page),
      limit: Number(limit),
    }
  );

  return sendPaginated(res, result.bookings, result.total, result.page, result.limit);
});

// GET /api/bookings/:id — get single booking detail
export const getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await bookingsService.getBookingById(
    req.params['id'] as string,
    req.user!.id
  );
  return sendSuccess(res, booking, 'Booking fetched successfully');
});

// PATCH /api/bookings/:id/status — update booking status
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await bookingsService.updateBookingStatus(
    req.params['id'] as string,
    req.user!.id,
    req.user!.role,
    req.body
  );
  return sendSuccess(res, booking, `Booking status updated to ${booking.status}`);
});

// GET /api/bookings/admin/all — admin sees all bookings
export const getAllBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;
  const result = await bookingsService.getAllBookings(
    status as BookingStatus,
    Number(page),
    Number(limit)
  );
  return sendPaginated(res, result.bookings, result.total, result.page, result.limit);
});

// GET /api/bookings/admin/stats — dashboard stats
export const getBookingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await bookingsService.getBookingStats();
  return sendSuccess(res, stats, 'Stats fetched');
});
