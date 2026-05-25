// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Two types of notifications:
//
// 1. PUSH NOTIFICATION → sent via FCM to device even when app is closed
//    Device shows a system notification banner with sound
//    Example: "Your provider is on the way!"
//
// 2. IN-APP NOTIFICATION → saved to DB, shown inside the app as a badge/list
//    Visible when the user opens the notification bell in the app
//
// We always do BOTH — save to DB (in-app) and send via FCM (push).
// ─────────────────────────────────────────────────────────────────────────────

import prisma from '../../config/database';
import { NotificationType } from '@prisma/client';

// We lazy-load firebase to avoid crash if credentials aren't set in dev
let fcm: any = null;
const getFCM = async () => {
  if (!fcm) {
    const firebase = await import('../../config/firebase');
    fcm = firebase.fcm;
  }
  return fcm;
};

interface SendNotificationParams {
  userId: string;          // recipient user ID (for in-app + to find their fcmToken)
  title: string;           // notification title
  body: string;            // notification body text
  type: NotificationType;  // type for routing (e.g. tap → open booking screen)
  data?: Record<string, string>; // extra data (e.g. { bookingId: '123' })
}

export class NotificationsService {
  // ── Core: Save + Send a notification ─────────────────────────────────────
  async send(params: SendNotificationParams) {
    const { userId, title, body, type, data } = params;

    // 1. Save to DB (in-app notification)
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: data ?? {},
        isRead: false,
      },
    });

    // 2. Get user's FCM token for push notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    // 3. Send push notification if user has a FCM token
    if (user?.fcmToken) {
      try {
        const messaging = await getFCM();
        await messaging.send({
          token: user.fcmToken,  // unique device token
          notification: { title, body },
          // data payload → received in app even in background (for navigation)
          data: {
            type,
            notificationId: notification.id,
            ...(data ?? {}),
          },
          // Android specific settings
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: '7starexperts_channel',
            },
          },
          // iOS specific settings
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        });
      } catch (fcmError: any) {
        // Don't crash the app if FCM fails — just log it
        // Common error: token expired (user uninstalled app)
        console.error('FCM push notification failed:', fcmError?.message);

        // If token is invalid, clear it from DB
        if (fcmError?.code === 'messaging/registration-token-not-registered') {
          await prisma.user.update({
            where: { id: userId },
            data: { fcmToken: null },
          });
        }
      }
    }

    return notification;
  }

  // ── Booking notification templates ────────────────────────────────────────
  // These are pre-built messages for each booking event

  async notifyNewBooking(providerId_userId: string, booking: any) {
    return this.send({
      userId: providerId_userId,
      title: '🔔 New Booking Request',
      body: `New booking for ${booking.service?.name} on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
      type: 'BOOKING_REQUEST',
      data: { bookingId: booking.id },
    });
  }

  async notifyBookingAccepted(customerId: string, booking: any) {
    return this.send({
      userId: customerId,
      title: '✅ Booking Accepted!',
      body: `${booking.provider?.user?.name} accepted your booking for ${booking.service?.name}`,
      type: 'BOOKING_ACCEPTED',
      data: { bookingId: booking.id },
    });
  }

  async notifyBookingRejected(customerId: string, booking: any) {
    return this.send({
      userId: customerId,
      title: '❌ Booking Declined',
      body: `Your booking for ${booking.service?.name} was declined. You can rebook with another provider.`,
      type: 'BOOKING_REJECTED',
      data: { bookingId: booking.id },
    });
  }

  async notifyProviderEnRoute(customerId: string, providerName: string, bookingId: string) {
    return this.send({
      userId: customerId,
      title: '🚗 Provider is on the way!',
      body: `${providerName} is heading to your location. Track them on the map.`,
      type: 'BOOKING_ACCEPTED',
      data: { bookingId, screen: 'tracking' },
    });
  }

  async notifyBookingCompleted(customerId: string, booking: any) {
    return this.send({
      userId: customerId,
      title: '🌟 Service Completed!',
      body: `Your ${booking.service?.name} service is done. Please rate your experience!`,
      type: 'BOOKING_COMPLETED',
      data: { bookingId: booking.id, screen: 'review' },
    });
  }

  async notifyNewChatMessage(recipientId: string, senderName: string, bookingId: string) {
    return this.send({
      userId: recipientId,
      title: `💬 Message from ${senderName}`,
      body: 'You have a new message',
      type: 'CHAT_MESSAGE',
      data: { bookingId, screen: 'chat' },
    });
  }

  async notifyPaymentSuccess(userId: string, amount: number, bookingId: string) {
    return this.send({
      userId,
      title: '💳 Payment Successful',
      body: `₹${amount} paid successfully. Thank you!`,
      type: 'PAYMENT_SUCCESS',
      data: { bookingId },
    });
  }

  // ── Get notifications for a user ──────────────────────────────────────────
  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // newest first
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  // ── Mark a single notification as read ───────────────────────────────────
  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId }, // userId check = security
      data: { isRead: true },
    });
    return { message: 'Notification marked as read' };
  }

  // ── Mark ALL notifications as read ───────────────────────────────────────
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: `${result.count} notifications marked as read` };
  }

  // ── Get unread count (for badge on notification bell) ────────────────────
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }
}

export default new NotificationsService();
