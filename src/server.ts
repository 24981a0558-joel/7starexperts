// ─────────────────────────────────────────────────────────────────────────────
// SERVER.TS — Entry Point
// ─────────────────────────────────────────────────────────────────────────────
// 📘 This is the file that actually STARTS the server.
// It creates an HTTP server from the Express app,
// attaches Socket.io for real-time features,
// and starts listening on the configured port.
// ─────────────────────────────────────────────────────────────────────────────

import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';

// Create HTTP server from Express app
// We need the raw HTTP server (not just Express) to attach Socket.io
const httpServer = createServer(app);

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO SETUP
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Socket.io enables real-time bidirectional communication.
// Unlike HTTP (request → response → done), WebSockets stay open.
// Used for: live chat, real-time location tracking, instant notifications.
// ─────────────────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: [env.CUSTOMER_APP_URL, env.ADMIN_PANEL_URL, '*'],
    methods: ['GET', 'POST'],
  },
  // pingTimeout — how long to wait before disconnecting (ms)
  pingTimeout: 60000,
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Join a booking room ──────────────────────────────────────────────────
  // When a booking starts, customer + provider join the same "room"
  // Messages/location updates are sent only to that room
  socket.on('join_booking', (bookingId: string) => {
    socket.join(`booking_${bookingId}`);
    console.log(`👥 Socket ${socket.id} joined booking_${bookingId}`);
  });

  // ── Chat message ──────────────────────────────────────────────────────────
  // Provider or customer sends a message
  socket.on('send_message', (data: { bookingId: string; message: string; senderId: string }) => {
    // Broadcast to everyone in the booking room except sender
    socket.to(`booking_${data.bookingId}`).emit('new_message', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Location update ───────────────────────────────────────────────────────
  // Provider sends their GPS coordinates every few seconds
  socket.on('update_location', (data: { bookingId: string; lat: number; lng: number }) => {
    socket.to(`booking_${data.bookingId}`).emit('location_updated', {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible in routes (for sending real-time events from controllers)
// Usage in controller: req.app.get('io').to('booking_123').emit('event', data)
app.set('io', io);

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Test database connection before starting
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    httpServer.listen(env.PORT, () => {
      console.log('');
      console.log('🌟 ─────────────────────────────────────');
      console.log(`🚀 7StarExperts API running!`);
      console.log(`📡 Port: ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${env.PORT}`);
      console.log(`🔗 API: http://localhost:${env.PORT}/api`);
      console.log(`💚 Health: http://localhost:${env.PORT}/api/health`);
      console.log('🌟 ─────────────────────────────────────');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // exit with error code
  }
};

// Graceful shutdown — properly close DB connections when server stops
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections (async errors not caught anywhere)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

export { io };
