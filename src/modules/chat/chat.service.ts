// ─────────────────────────────────────────────────────────────────────────────
// CHAT SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Chat flow:
//
// SENDING a message (real-time path):
//   App → socket.emit('send_message', {bookingId, content})
//     → Socket gateway saves to DB → broadcasts to booking room
//     → Other party's socket receives 'new_message' event instantly
//
// LOADING history (REST path):
//   App → GET /api/chat/:bookingId/messages
//     → Returns last N messages from DB (for initial load / scroll up)
//
// This is the same pattern used by WhatsApp, Slack, etc.
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class ChatService {
  // ── Save a message to the database ────────────────────────────────────────
  // Called by Socket.io gateway when a message is sent
  async saveMessage(bookingId: string, senderId: string, content: string) {
    // Verify booking exists and sender is part of it
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { customerId: senderId },                          // sender is customer
          { provider: { userId: senderId } },               // sender is provider
        ],
      },
      include: {
        provider: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found or access denied', 403);
    }

    // Cannot chat after booking is completed or cancelled
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
      throw new AppError('Cannot send messages for completed/cancelled bookings', 400);
    }

    // Save message to DB
    const message = await prisma.message.create({
      data: { bookingId, senderId, content },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    return { message, booking };
  }

  // ── Get chat history for a booking ────────────────────────────────────────
  async getChatHistory(bookingId: string, userId: string, page = 1, limit = 50) {
    // Verify user has access to this booking's chat
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { customerId: userId },
          { provider: { userId } },
        ],
      },
    });

    if (!booking) throw new AppError('Booking not found or access denied', 403);

    const skip = (page - 1) * limit;
    const total = await prisma.message.count({ where: { bookingId } });

    const messages = await prisma.message.findMany({
      where: { bookingId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' }, // oldest first (chat order)
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Mark all messages as read for this user
    await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: userId }, // only messages FROM other person
        isRead: false,
      },
      data: { isRead: true },
    });

    return { messages, total, page, limit };
  }

  // ── Get unread message count per booking (for badge) ─────────────────────
  async getUnreadCount(userId: string) {
    // Count unread messages in all bookings where user is customer or provider
    const result = await prisma.message.groupBy({
      by: ['bookingId'],
      where: {
        isRead: false,
        senderId: { not: userId },  // messages not sent by this user
        booking: {
          OR: [
            { customerId: userId },
            { provider: { userId } },
          ],
        },
      },
      _count: { id: true },
    });

    // Total unread across all chats
    const total = result.reduce((sum, r) => sum + r._count.id, 0);
    return { total, perBooking: result };
  }
}

export default new ChatService();
