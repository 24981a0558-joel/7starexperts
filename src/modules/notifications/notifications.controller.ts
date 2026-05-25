import { Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import notificationsService from './notifications.service';

// GET /api/notifications — get my notifications
export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await notificationsService.getMyNotifications(
    req.user!.id,
    Number(page),
    Number(limit)
  );
  return sendPaginated(res, result.notifications, result.total, result.page, result.limit, `${result.unreadCount} unread`);
});

// GET /api/notifications/unread-count — badge count for notification bell icon
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationsService.getUnreadCount(req.user!.id);
  return sendSuccess(res, result, 'Unread count fetched');
});

// PATCH /api/notifications/:id/read — mark one as read
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationsService.markAsRead(
    req.params['id'] as string,
    req.user!.id
  );
  return sendSuccess(res, result, 'Marked as read');
});

// PATCH /api/notifications/read-all — mark all as read
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationsService.markAllAsRead(req.user!.id);
  return sendSuccess(res, result, result.message);
});
