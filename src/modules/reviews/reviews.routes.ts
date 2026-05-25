// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Route ordering is critical here:
//   /mine            → must come BEFORE /:id (otherwise 'mine' matches as an id)
//   /can-review/:bookingId → same reason
//   /provider/:id    → public, no auth
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createReview,
  getProviderReviews,
  getMyReviews,
  canReview,
  getAllReviews,
  deleteReview,
} from './reviews.controller';
import { createReviewSchema } from './reviews.validation';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/provider/:providerId', getProviderReviews);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(protect);

// Static named routes BEFORE param routes
router.get('/mine', getMyReviews);                          // GET /api/reviews/mine
router.get('/can-review/:bookingId', canReview);            // GET /api/reviews/can-review/:id

router.post('/', restrictTo('CUSTOMER'), validate(createReviewSchema), createReview);

// Admin
router.get('/', restrictTo('ADMIN'), getAllReviews);
router.delete('/:id', restrictTo('ADMIN'), deleteReview);

export default router;
