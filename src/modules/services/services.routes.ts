import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getAllServices,
  searchServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from './services.controller';
import { createServiceSchema, updateServiceSchema } from './services.validation';

const router = Router();

// ── Public routes (no login needed) ──────────────────────────────────────────
router.get('/', getAllServices);
router.get('/search', searchServices);  // NOTE: /search must come BEFORE /:id
router.get('/:id', getServiceById);     // otherwise 'search' would match /:id

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('ADMIN'), validate(createServiceSchema), createService);
router.put('/:id', protect, restrictTo('ADMIN'), validate(updateServiceSchema), updateService);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteService);

export default router;
