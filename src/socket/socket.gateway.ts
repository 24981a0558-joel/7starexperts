// ─────────────────────────────────────────────────────────────────────────────
// SOCKET GATEWAY — Real-time Event Hub
// ─────────────────────────────────────────────────────────────────────────────
// 📘 This file handles ALL real-time events:
//
// CHAT EVENTS:
//   send_message      → client sends a message
//   new_message       → server broadcasts to booking room
//   typing            → "User is typing..."
//   stop_typing       → stopped typing
//
// LOCATION EVENTS:
//   update_location   → provider sends GPS coords (every 5 seconds)
//   location_updated  → server broadcasts to customer in that booking
//
// BOOKING EVENTS:
//   booking_status_changed → server broadcasts when booking status changes
//
// ROOM CONCEPT:
//   📦 A "room" is a group of sockets (connections).
//   When a booking starts, customer + provider join room "booking_<id>".
//   Anything emitted to that room goes to BOTH parties only.
//   Like a private WhatsApp group for each booking.
// ─────────────────────────────────────────────────────────────────────────────

import { Server as SocketServer } from 'socket.io';
import { AuthSocket } from './socket.middleware';
import chatService from '../modules/chat/chat.service';
import notificationsService from '../modules/notifications/notifications.service';
import prisma from '../config/database';

// Map: userId → socketId (to send to a specific user who is online)
// This lives in-memory — for multi-server you'd use Redis
const onlineUsers = new Map<string, string>();

export const registerSocketGateway = (io: SocketServer) => {
  io.on('connection', (socket: AuthSocket) => {
    const user = socket.data.user;
    console.log(`🔌 ${user.name} (${user.role}) connected — socket: ${socket.id}`);

    // Track online users
    onlineUsers.set(user.id, socket.id);

    // ── JOIN PERSONAL ROOM ───────────────────────────────────────────────────
    // Each user auto-joins their own room (userId as room name).
    // This lets us send notifications to a specific user even without knowing their socket ID.
    socket.join(`user_${user.id}`);

    // ── JOIN BOOKING ROOM ────────────────────────────────────────────────────
    // Client joins when opening a booking chat or tracking screen
    // Event: socket.emit('join_booking', bookingId)
    socket.on('join_booking', async (bookingId: string) => {
      // Verify user is part of this booking
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { customerId: user.id },
            { provider: { userId: user.id } },
          ],
        },
      });

      if (!booking) {
        socket.emit('error', { message: 'Booking not found or access denied' });
        return;
      }

      socket.join(`booking_${bookingId}`);
      console.log(`👥 ${user.name} joined booking_${bookingId}`);

      // Notify the other party that this user is online
      socket.to(`booking_${bookingId}`).emit('user_online', {
        userId: user.id,
        name: user.name,
      });
    });

    // ── LEAVE BOOKING ROOM ───────────────────────────────────────────────────
    socket.on('leave_booking', (bookingId: string) => {
      socket.leave(`booking_${bookingId}`);
      socket.to(`booking_${bookingId}`).emit('user_offline', { userId: user.id });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CHAT EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    // Client emits: socket.emit('send_message', { bookingId, content })
    socket.on('send_message', async (data: { bookingId: string; content: string }) => {
      try {
        if (!data.content?.trim()) return; // ignore empty messages

        // 1. Save to DB (persistent)
        const { message, booking } = await chatService.saveMessage(
          data.bookingId,
          user.id,
          data.content.trim()
        );

        // 2. Broadcast to booking room (real-time)
        // Both customer and provider in the room receive this
        io.to(`booking_${data.bookingId}`).emit('new_message', message);

        // 3. Push notification to the OTHER party (if they're not in the room)
        const recipientId =
          booking.customerId === user.id
            ? booking.provider?.userId  // sender is customer → notify provider
            : booking.customerId;       // sender is provider → notify customer

        if (recipientId) {
          // Check if recipient is CURRENTLY in the booking room (already sees message)
          const roomSockets = await io.in(`booking_${data.bookingId}`).fetchSockets();
          const recipientInRoom = roomSockets.some(
            (s: any) => s.data.user?.id === recipientId
          );

          // Only send push notification if they're not already in the chat
          if (!recipientInRoom) {
            await notificationsService.notifyNewChatMessage(
              recipientId,
              user.name,
              data.bookingId
            );
          }
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator — lightweight, not saved to DB
    // Client emits: socket.emit('typing', { bookingId })
    socket.on('typing', (data: { bookingId: string }) => {
      // Send to everyone in the room EXCEPT the person typing
      socket.to(`booking_${data.bookingId}`).emit('user_typing', {
        userId: user.id,
        name: user.name,
      });
    });

    // Client emits when they stop typing
    socket.on('stop_typing', (data: { bookingId: string }) => {
      socket.to(`booking_${data.bookingId}`).emit('user_stop_typing', { userId: user.id });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LOCATION TRACKING EVENTS
    // ─────────────────────────────────────────────────────────────────────────
    // 📘 Live location flow:
    // Provider's phone GPS → sends update every 5 seconds →
    // Socket broadcasts to booking room →
    // Customer's map updates the provider's marker in real-time
    //
    // Client (provider app) emits:
    //   socket.emit('update_location', { bookingId, lat, lng })

    socket.on('update_location', async (data: {
      bookingId: string;
      lat: number;
      lng: number;
    }) => {
      // Only providers can share location
      if (user.role !== 'PROVIDER') return;

      // 1. Save latest location to DB (for if customer disconnects and reconnects)
      await prisma.provider.updateMany({
        where: { userId: user.id },
        data: { currentLat: data.lat, currentLng: data.lng },
      });

      // 2. Broadcast to the booking room in real-time
      socket.to(`booking_${data.bookingId}`).emit('location_updated', {
        providerId: user.id,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 ${user.name} disconnected`);
      onlineUsers.delete(user.id);

      // If provider goes offline, clear their location
      if (user.role === 'PROVIDER') {
        await prisma.provider.updateMany({
          where: { userId: user.id },
          data: { currentLat: null, currentLng: null },
        }).catch(() => {}); // swallow error on disconnect
      }
    });
  });
};

// ── Helper: Send real-time event to a specific user by userId ─────────────────
// Use this from controllers to push events to online users
// Example: after booking status change → notify user instantly
export const emitToUser = (io: SocketServer, userId: string, event: string, data: any) => {
  // Since every user joins their personal room on connect, we can target them directly
  io.to(`user_${userId}`).emit(event, data);
};

export { onlineUsers };
