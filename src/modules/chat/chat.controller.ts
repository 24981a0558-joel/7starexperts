import { Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import chatService from './chat.service';

// GET /api/chat/:bookingId/messages — load chat history
export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await chatService.getChatHistory(
    req.params['bookingId'] as string,
    req.user!.id,
    Number(page),
    Number(limit)
  );
  return sendPaginated(res, result.messages, result.total, result.page, result.limit);
});

// GET /api/chat/unread — total unread messages across all bookings
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await chatService.getUnreadCount(req.user!.id);
  return sendSuccess(res, result, 'Unread count fetched');
});
