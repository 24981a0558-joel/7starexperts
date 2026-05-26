// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG UTILITY
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Call logActivity() from any controller to record an admin action.
// It never throws — logging failures are caught silently so they can't
// break the actual request.
//
// Usage:
//   await logActivity(req, { action: 'CREATE', entity: 'Service',
//                            entityId: service.id, entityName: service.name });
// ─────────────────────────────────────────────────────────────────────────────

import { Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export type LogParams = {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'ACTIVATE' | 'APPROVE' | 'REJECT' | 'LOGIN';
  entity: 'Service' | 'Category' | 'Provider' | 'User' | 'Booking' | 'Payment' | 'Review';
  entityId?: string;
  entityName?: string;
  changes?: Record<string, any>; // e.g. { before: { price: 100 }, after: { price: 200 } }
};

export const logActivity = async (
  req: Request | AuthRequest,
  params: LogParams
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const admin   = authReq.user;

    await prisma.activityLog.create({
      data: {
        adminId:    admin?.id   ?? null,
        adminName:  admin?.name ?? 'System',
        action:     params.action,
        entity:     params.entity,
        entityId:   params.entityId   ?? null,
        entityName: params.entityName ?? null,
        changes:    params.changes    ?? undefined,
        ip:         (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? null,
      },
    });
  } catch (err) {
    // Never let logging crash the actual request
    console.error('⚠️  Activity log write failed:', err);
  }
};
