// ─────────────────────────────────────────────────────────────────────────────
// PROVIDERS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Route Groups:
// Public        — anyone can search providers / view public profiles
// Provider only — only users with role=PROVIDER can access
// Admin only    — only ADMIN can verify providers, see all providers
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getMyProfile,
  updateMyProfile,
  addService,
  removeService,
  setAvailability,
  toggleAvailability,
  searchProviders,
  getProviderPublicProfile,
  updateProviderStatus,
  getAllProviders,
} from './providers.controller';
import {
  updateProviderProfileSchema,
  addProviderServiceSchema,
  setAvailabilitySchema,
  toggleAvailabilitySchema,
  searchProvidersSchema,
} from './providers.validation';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/search', searchProviders);
router.get('/:id', getProviderPublicProfile);

// ── Provider routes (must be logged in as PROVIDER) ───────────────────────────
router.get('/me/profile', protect, restrictTo('PROVIDER'), getMyProfile);
router.put('/me/profile', protect, restrictTo('PROVIDER'), validate(updateProviderProfileSchema), updateMyProfile);
router.post('/me/services', protect, restrictTo('PROVIDER'), validate(addProviderServiceSchema), addService);
router.delete('/me/services/:serviceId', protect, restrictTo('PROVIDER'), removeService);
router.put('/me/availability', protect, restrictTo('PROVIDER'), validate(setAvailabilitySchema), setAvailability);
router.patch('/me/toggle', protect, restrictTo('PROVIDER'), validate(toggleAvailabilitySchema), toggleAvailability);

// ── Admin routes ───────────────────────────────────────────────────────────────
router.get('/', protect, restrictTo('ADMIN'), getAllProviders);
router.patch('/:id/status', protect, restrictTo('ADMIN'), updateProviderStatus);

export default router;
