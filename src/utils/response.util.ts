// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE UTILITY
// ─────────────────────────────────────────────────────────────────────────────
// 📘 All API responses follow a consistent format:
// {
//   "success": true/false,
//   "message": "Human readable message",
//   "data": { ... }        ← actual data (optional)
//   "pagination": { ... }  ← for list endpoints (optional)
// }
//
// Using helper functions ensures every response looks the same.
// ─────────────────────────────────────────────────────────────────────────────

import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any = null,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,                                    // total number of records
      page,                                     // current page
      limit,                                    // records per page
      totalPages: Math.ceil(total / limit),     // how many pages total
      hasNext: page * limit < total,            // is there a next page?
      hasPrev: page > 1,                        // is there a previous page?
    },
  });
};
