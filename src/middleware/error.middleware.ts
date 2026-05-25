// ─────────────────────────────────────────────────────────────────────────────
// ERROR MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 This is a global error handler. Instead of writing try/catch in every
// route, we use asyncHandler (below) to catch errors and pass them here.
// This single middleware formats ALL errors consistently.
//
// Error flow:
// Route throws error → asyncHandler catches it → calls next(error)
//         → this middleware formats and sends the response
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Custom error class — lets us create errors with a specific HTTP status code
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean; // operational = expected error (e.g. "user not found")

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// asyncHandler — wraps async route handlers to catch errors automatically
// WITHOUT this: every async route needs try/catch
// WITH this:    errors are auto-caught and forwarded to error middleware
//
// Usage: router.get('/users', asyncHandler(async (req, res) => { ... }))
// ─────────────────────────────────────────────────────────────────────────────
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// notFound — catches requests to non-existent routes
// ─────────────────────────────────────────────────────────────────────────────
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// ─────────────────────────────────────────────────────────────────────────────
// globalErrorHandler — formats all errors into consistent JSON responses
// Express recognizes this as error middleware because it has 4 parameters (err, req, res, next)
// ─────────────────────────────────────────────────────────────────────────────
export const globalErrorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle specific Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      // P2002 = unique constraint violation (e.g. duplicate phone number)
      statusCode = 409;
      message = `${prismaError.meta?.target} already exists.`;
    }
    if (prismaError.code === 'P2025') {
      // P2025 = record not found
      statusCode = 404;
      message = 'Record not found.';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  // Standard error response format
  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development (never expose in production!)
    ...(env.isDev && { stack: err.stack }),
  });
};
