// ─────────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Middleware is a function that runs BETWEEN receiving a request and
// sending a response. Think of it as a security guard at the door.
//
// How it works:
// Request → [Auth Middleware] → Route Handler → Response
//
// If the user has a valid JWT token → let them through (call next())
// If not → block them with a 401 Unauthorized error
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { Role } from '@prisma/client';

// We extend Express's Request type to add our custom 'user' property
// So that after auth middleware runs, route handlers can access req.user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: Role;
    name: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// protect — verifies JWT token, attaches user to req.user
// Use on any route that requires login
// ─────────────────────────────────────────────────────────────────────────────
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from Authorization header
    // Header format: "Authorization: Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // 2. Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // 3. Verify the token using our JWT secret
    // jwt.verify() throws an error if token is invalid or expired
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      phone: string;
      role: Role;
    };

    // 4. Check if user still exists in DB (they may have been deactivated)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, phone: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
      });
      return;
    }

    // 5. Attach user info to request object for downstream use
    req.user = { id: user.id, phone: user.phone, role: user.role, name: user.name };

    next(); // ✅ pass control to the next middleware/route handler
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// restrictTo — role-based access control
// Use AFTER protect middleware to restrict routes to specific roles
//
// Example:
//   router.delete('/users/:id', protect, restrictTo('ADMIN'), deleteUser)
//   → Only admins can delete users
// ─────────────────────────────────────────────────────────────────────────────
export const restrictTo = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }
    next();
  };
};
