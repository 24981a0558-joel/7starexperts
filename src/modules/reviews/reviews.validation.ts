import Joi from 'joi';

// POST /api/reviews — customer submits a review
export const createReviewSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  // 1 = ⭐, 2 = ⭐⭐, 3 = ⭐⭐⭐, 4 = ⭐⭐⭐⭐, 5 = ⭐⭐⭐⭐⭐
  comment: Joi.string().min(5).max(500).optional(),
});

// GET /api/reviews/provider/:providerId — query filters
export const getProviderReviewsSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(), // filter by star rating
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sortBy: Joi.string().valid('recent', 'highest', 'lowest').default('recent'),
});
