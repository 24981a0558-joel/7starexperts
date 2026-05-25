import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getChatHistory, getUnreadCount } from './chat.controller';

const router = Router();
router.use(protect);

router.get('/unread', getUnreadCount);                       // /unread BEFORE /:bookingId
router.get('/:bookingId/messages', getChatHistory);          // chat history for a booking

export default router;
