import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import reviewsService from './reviews.service';

// POST /api/reviews
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewsService.createReview(req.user!.id, req.body);
  return sendSuccess(res, review, 'Review submitted successfully', 201);
});

// GET /api/reviews/provider/:providerId
export const getProviderReviews = asyncHandler(async (req: Request, res: Response) => {
  const { rating, page = 1, limit = 10, sortBy = 'recent' } = req.query;
  const result = await reviewsService.getProviderReviews(
    req.params['providerId'] as string,
    {
      rating: rating ? Number(rating) : undefined,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
    }
  );
  return sendPaginated(res, result.reviews, result.total, result.page, result.limit);
});

// GET /api/reviews/mine — reviews I've written
export const getMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewsService.getMyReviews(req.user!.id, Number(page), Number(limit));
  return sendPaginated(res, result.reviews, result.total, result.page, result.limit);
});

// GET /api/reviews/can-review/:bookingId
export const canReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reviewsService.canReview(
    req.params['bookingId'] as string,
    req.user!.id
  );
  return sendSuccess(res, result, 'Review eligibility checked');
});

// GET /api/reviews — admin: all reviews
export const getAllReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewsService.getAllReviews(Number(page), Number(limit));
  return sendPaginated(res, result.reviews, result.total, result.page, result.limit);
});

// DELETE /api/reviews/:id — admin: delete review
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reviewsService.deleteReview(req.params['id'] as string);
  return sendSuccess(res, result, result.message);
});
