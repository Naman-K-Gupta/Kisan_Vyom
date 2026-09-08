import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface AuditEntry {
  userId: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        role: entry.role,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        previousValue: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        ipAddress: entry.ipAddress || null,
      },
    });
  } catch (error: any) {
    logger.error('Failed to write audit log:', error.message || error);
    // Never throw to avoid interrupting business logic
  }
}
