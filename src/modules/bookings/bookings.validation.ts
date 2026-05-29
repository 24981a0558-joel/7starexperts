// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Bookings are the CORE of this app.
// Every validation here is strict because bookings involve money & scheduling.
// ─────────────────────────────────────────────────────────────────────────────

import Joi from 'joi';

// POST /api/bookings — customer creates a booking
// Either addressId (saved address) OR address text (auto-creates address) is accepted
export const createBookingSchema = Joi.object({
  serviceId: Joi.string().uuid().required(),
  providerId: Joi.string().uuid().optional(),  // optional: customer can choose a specific provider
  addressId: Joi.string().uuid().optional(),   // use existing saved address
  address: Joi.string().max(500).optional(),   // or provide plain text address (auto-saved)
  scheduledAt: Joi.date().greater('now').required(), // must be in the future!
  notes: Joi.string().max(300).optional(),
}).or('addressId', 'address'); // at least one of addressId or address is required

// PATCH /api/bookings/:id/status — provider accepts/rejects or marks complete
export const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ACCEPTED', 'REJECTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    .required(),
  cancellationReason: Joi.when('status', {
    // cancellationReason is REQUIRED only when status is CANCELLED
    is: 'CANCELLED',
    then: Joi.string().max(200).required(),
    otherwise: Joi.forbidden(), // not allowed for other statuses
  }),
});

// GET /api/bookings — query params for filtering bookings list
export const getBookingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'ACCEPTED', 'REJECTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
