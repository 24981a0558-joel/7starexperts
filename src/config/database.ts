// ─────────────────────────────────────────────────────────────────────────────
// DATABASE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// 📘 PrismaClient is the main object that connects to your PostgreSQL database.
// We create ONE instance and reuse it throughout the app (singleton pattern).
// Creating multiple instances can exhaust database connections.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

// In development, hot-reloading can create multiple Prisma instances.
// This pattern prevents that by storing the instance on the global object.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // 'query' → logs every SQL query to terminal in dev mode (great for debugging!)
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
