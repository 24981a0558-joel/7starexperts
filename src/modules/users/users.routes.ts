import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getProfile, updateProfile, getAddresses, addAddress, deleteAddress } from './users.controller';

const router = Router();

// All user routes require authentication
router.use(protect); // 📘 router.use(protect) applies protect middleware to ALL routes below

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
