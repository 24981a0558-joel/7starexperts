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
} from './providers.validation';
import walletService from './wallet.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { sendSuccess } from '../../utils/response.util';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/search', searchProviders);

// ── Provider routes (must come BEFORE /:id) ───────────────────────────────────
router.get('/me/profile', protect, restrictTo('PROVIDER'), getMyProfile);
router.put('/me/profile', protect, restrictTo('PROVIDER'), validate(updateProviderProfileSchema), updateMyProfile);
router.post('/me/services', protect, restrictTo('PROVIDER'), validate(addProviderServiceSchema), addService);
router.delete('/me/services/:serviceId', protect, restrictTo('PROVIDER'), removeService);
router.put('/me/availability', protect, restrictTo('PROVIDER'), validate(setAvailabilitySchema), setAvailability);
router.patch('/me/toggle', protect, restrictTo('PROVIDER'), validate(toggleAvailabilitySchema), toggleAvailability);

// ── Wallet routes (provider only) ─────────────────────────────────────────────
// 📘 GET /api/providers/me/wallet → balance + transaction history
router.get('/me/wallet', protect, restrictTo('PROVIDER'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const wallet = await walletService.getWallet(req.user!.id);
    return sendSuccess(res, wallet, 'Wallet fetched');
  })
);

// 📘 GET /api/providers/me/earnings → daily/weekly/monthly earnings stats
router.get('/me/earnings', protect, restrictTo('PROVIDER'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await walletService.getEarningsStats(req.user!.id);
    return sendSuccess(res, stats, 'Earnings stats fetched');
  })
);

// 📘 POST /api/providers/me/payout → request bank withdrawal
router.post('/me/payout', protect, restrictTo('PROVIDER'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid amount required' });
      return;
    }
    const result = await walletService.requestPayout(req.user!.id, Number(amount));
    return sendSuccess(res, result, result.message);
  })
);

// ── Public profile (LAST — after all /me routes) ──────────────────────────────
router.get('/:id', getProviderPublicProfile);

// ── Admin routes ───────────────────────────────────────────────────────────────
router.get('/', protect, restrictTo('ADMIN'), getAllProviders);
router.patch('/:id/status', protect, restrictTo('ADMIN'), updateProviderStatus);

export default router;
