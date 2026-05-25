// ─────────────────────────────────────────────────────────────────────────────
// SOCKET AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Just like HTTP has auth middleware (protect), Socket.io also needs
// authentication. This runs once when a client CONNECTS (not on every event).
//
// How the client sends the token:
//   const socket = io('http://localhost:5000', {
//     auth: { token: 'Bearer eyJhbGci...' }
//   })
//
// Flow:
// Client connects → this middleware runs → verifies JWT
//   → if valid: attach user to socket.data.user → allow connection
//   → if invalid: emit error → reject connection
// ─────────────────────────────────────────────────────────────────────────────

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import { Role } from '@prisma/client';

// Extend Socket type to include our custom user data
export interface AuthSocket extends Socket {
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      role: Role;
    };
  };
}

// Socket.io middleware signature: (socket, next) — similar to Express (req, res, next)
export const socketAuthMiddleware = async (
  socket: AuthSocket,
  next: (err?: Error) => void
) => {
  try {
    // 1. Get token from socket handshake
    // Client sends: socket = io(URL, { auth: { token: 'Bearer eyJ...' } })
    const token = socket.handshake.auth?.token as string;

    if (!token || !token.startsWith('Bearer ')) {
      return next(new Error('Authentication error: No token provided'));
    }

    // 2. Extract and verify token
    const rawToken = token.split(' ')[1] as string;
    const decoded = jwt.verify(rawToken, env.JWT_SECRET) as {
      id: string;
      phone: string;
      role: Role;
    };

    // 3. Check user exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, phone: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not found'));
    }

    // 4. Attach user to socket — available in all event handlers as socket.data.user
    socket.data.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    next(); // ✅ allow connection
  } catch {
    next(new Error('Authentication error: Invalid token'));
  }
};
