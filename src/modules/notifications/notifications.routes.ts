import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notifications.controller';

const router = Router();
router.use(protect); // all notification routes require login

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);      // /read-all BEFORE /:id (routing order matters!)
router.patch('/:id/read', markAsRead);

export default router;
