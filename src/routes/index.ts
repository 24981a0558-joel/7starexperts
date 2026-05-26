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
import categoriesRoutes from '../modules/categories/categories.routes';
import servicesRoutes from '../modules/services/services.routes';
import providersRoutes from '../modules/providers/providers.routes';
import bookingsRoutes from '../modules/bookings/bookings.routes';
import chatRoutes from '../modules/chat/chat.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import reviewsRoutes from '../modules/reviews/reviews.routes';
import logsRoutes from '../modules/logs/logs.routes';

const router = Router();

// ─── Mount routes ───────────────────────────────────────────────────────────
// /api/auth/...              → auth routes
// /api/users/...             → user profile & addresses
// /api/categories/...        → service categories
// /api/services/...          → service listings + search
// /api/providers/...         → provider profiles + search
// /api/bookings/...          → booking management
// /api/chat/...              → chat history (real-time via Socket.io)
// /api/notifications/...     → in-app notifications
// /api/payments/...          → Razorpay payments, webhook, refunds
// /api/reviews/...           → ratings & reviews

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/services', servicesRoutes);
router.use('/providers', providersRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/logs', logsRoutes);

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
