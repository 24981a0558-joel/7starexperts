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
import { socketAuthMiddleware } from './socket/socket.middleware';
import { registerSocketGateway } from './socket/socket.gateway';

// Create HTTP server from Express app
// We need the raw HTTP server (not just Express) to attach Socket.io
const httpServer = createServer(app);

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO SETUP
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Socket.io enables real-time bidirectional communication.
// Unlike HTTP (request → response → done), WebSockets keep a persistent
// connection open (WebSocket protocol).
// Used for: live chat, real-time location tracking, live notifications.
// ─────────────────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: [env.CUSTOMER_APP_URL, env.ADMIN_PANEL_URL, '*'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,   // disconnect if no response in 60s
  pingInterval: 25000,  // ping every 25s to keep connection alive
});

// 1. Apply auth middleware to ALL socket connections
//    Every connection must have a valid JWT token
io.use(socketAuthMiddleware as any);

// 2. Register all socket event handlers
//    Chat, location, booking events all wired up in the gateway
registerSocketGateway(io);

// 3. Make io accessible anywhere via req.app.get('io')
//    Use this in controllers to push real-time events to clients
//    Example: req.app.get('io').to('user_abc123').emit('booking_update', data)
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
