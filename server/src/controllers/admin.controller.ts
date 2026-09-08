import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logAudit } from '../services/audit.service';

export class AdminController {
  /**
   * System Dashboard Statistics (Real database metrics)
   */
  static async getStats(req: Request, res: Response) {
    const totalFarmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const activeFarmers = await prisma.user.count({ where: { role: 'FARMER', isActive: true } });
    const totalCentres = await prisma.procurementCentre.count();
    const activeCentres = await prisma.procurementCentre.count({ where: { status: 'OPEN' } });
    const activeQueueTokens = await prisma.queueToken.count({
      where: { status: { in: ['WAITING', 'CALLED', 'PROCESSING'] } },
    });
    const pendingProcurementRequests = await prisma.procurementRequest.count({
      where: { status: 'PENDING' },
    });
    const completedProcurements = await prisma.procurementRequest.count({
      where: { status: 'COMPLETED' },
    });

    // Calculate actual capacity utilization
    const centres = await prisma.procurementCentre.findMany({
      select: { totalCapacity: true, currentUsage: true },
    });

    let totalCap = 0;
    let totalUsage = 0;
    centres.forEach((c) => {
      totalCap += c.totalCapacity;
      totalUsage += c.currentUsage;
    });

    const averageCapacityUtilization =
      totalCap > 0 ? Math.round((totalUsage / totalCap) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalFarmers,
        activeFarmers,
        totalCentres,
        activeCentres,
        activeQueueTokens,
        pendingProcurementRequests,
        completedProcurements,
        averageCapacityUtilization,
        totalCapacityQuintals: totalCap,
        totalUsageQuintals: totalUsage,
      },
    });
  }

  /**
   * Search and List Farmers
   */
  static async getAllFarmers(req: Request, res: Response) {
    const { search, state, district, isActive } = req.query;

    const farmers = await prisma.user.findMany({
      where: {
        role: 'FARMER',
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
        ...(state ? { state: String(state) } : {}),
        ...(district ? { district: String(district) } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: String(search), mode: 'insensitive' } },
                { mobile: { contains: String(search) } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { village: { contains: String(search), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        farmerProfile: {
          include: {
            crops: { include: { crop: true } },
          },
        },
        _count: {
          select: {
            queueTokens: true,
            procurementRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, count: farmers.length, farmers });
  }

  /**
   * Toggle User Status (Enable/Disable account)
   */
  static async toggleUserStatus(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: Boolean(isActive) },
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'USER_STATUS_TOGGLED',
      entity: 'User',
      entityId: userId,
      previousValue: { isActive: user.isActive },
      newValue: { isActive: updated.isActive },
    });

    res.json({
      success: true,
      message: `User account ${updated.isActive ? 'activated' : 'deactivated'}.`,
      user: { id: updated.id, email: updated.email, isActive: updated.isActive },
    });
  }

  /**
   * Get Centre Managers
   */
  static async getAllManagers(req: Request, res: Response) {
    const managers = await prisma.user.findMany({
      where: { role: 'PROCUREMENT_CENTRE_MANAGER' },
      include: {
        managedCentres: {
          include: { centre: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json({ success: true, count: managers.length, managers });
  }

  /**
   * Assign Centre Manager
   */
  static async assignManager(req: Request, res: Response) {
    const { userId, centreId } = req.body;

    await prisma.centreManager.upsert({
      where: {
        userId_centreId: { userId, centreId },
      },
      create: { userId, centreId },
      update: {},
    });

    res.json({ success: true, message: 'Manager assigned to centre successfully.' });
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs(req: Request, res: Response) {
    const { entity, action, take = '50' } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entity ? { entity: String(entity) } : {}),
        ...(action ? { action: String(action) } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(take), 10) || 50, 100),
    });

    res.json({ success: true, count: logs.length, logs });
  }
}
