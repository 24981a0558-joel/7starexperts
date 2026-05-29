// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 All booking routes require authentication.
// Customers and providers both use these routes — the service layer
// checks the role and applies the correct logic.
//
// Important: /admin/all and /admin/stats must come BEFORE /:id
// Otherwise Express would try to match 'admin' as a booking ID
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
  getBookingStats,
} from './bookings.controller';
import {
  createBookingSchema,
  updateBookingStatusSchema,
} from './bookings.validation';

const router = Router();

// All booking routes require login
router.use(protect);

// ── Admin routes (must come before /:id) ─────────────────────────────────────
router.get('/admin/all', restrictTo('ADMIN'), getAllBookings);
router.get('/admin/stats', restrictTo('ADMIN'), getBookingStats);

// ── Customer + Provider routes ────────────────────────────────────────────────
// Customer (or ADMIN testing the app) creates booking
router.post('/', restrictTo('CUSTOMER', 'ADMIN'), validate(createBookingSchema), createBooking);

// Both customer and provider can see their own bookings
router.get('/', getMyBookings);

// Both customer and provider can view booking detail
router.get('/:id', getBookingById);

// Provider accepts/rejects/completes — customer can cancel
router.patch('/:id/status', validate(updateBookingStatusSchema), updateBookingStatus);

export default router;
