// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL ROUTES INDEX
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Instead of importing all routes in app.ts (gets messy),
// we collect them all here and export a single router.
// app.ts just does: app.use('/api', routes)
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';

// These will be added in Phase 2+:
// import categoriesRoutes from '../modules/categories/categories.routes';
// import servicesRoutes from '../modules/services/services.routes';
// import bookingsRoutes from '../modules/bookings/bookings.routes';
// import paymentsRoutes from '../modules/payments/payments.routes';
// import reviewsRoutes from '../modules/reviews/reviews.routes';
// import providersRoutes from '../modules/providers/providers.routes';

const router = Router();

// ─── Mount routes ───────────────────────────────────────────────────────────
// Each route group is prefixed:
// /api/auth/...    → auth routes
// /api/users/...   → user routes
// etc.

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

// Health check — quick way to check if API is running
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '7StarExperts API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
