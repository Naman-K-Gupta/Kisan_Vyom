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

  /**
   * Daily Procurement Records by Centre
   */
  static async getDailyProcurementRecords(req: Request, res: Response) {
    const { centreId, date, cropId, status } = req.query;

    // Default to today if no date provided
    const targetDateStr = date ? String(date) : new Date().toISOString().split('T')[0];
    const startDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endDate = new Date(`${targetDateStr}T23:59:59.999Z`);

    // Fetch centre details if centreId provided
    let centre = null;
    if (centreId && centreId !== 'ALL') {
      centre = await prisma.procurementCentre.findUnique({
        where: { id: String(centreId) },
        include: {
          managers: {
            include: {
              user: { select: { id: true, fullName: true, mobile: true, email: true } },
            },
          },
        },
      });
    }

    // Build filter for Payments
    const wherePayment: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(centreId && centreId !== 'ALL' ? { centreId: String(centreId) } : {}),
      ...(cropId ? { cropId: String(cropId) } : {}),
      ...(status ? { status: String(status) } : {}),
    };

    const payments = await prisma.payment.findMany({
      where: wherePayment,
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            village: true,
            district: true,
            state: true,
          },
        },
        crop: {
          select: {
            id: true,
            name: true,
            category: true,
            defaultUnit: true,
          },
        },
        centre: {
          select: {
            id: true,
            name: true,
            district: true,
            state: true,
            totalCapacity: true,
            currentUsage: true,
          },
        },
        queueToken: {
          select: {
            id: true,
            tokenNumber: true,
            calledAt: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregated summary
    let totalQuantity = 0;
    let totalGrossAmount = 0;
    let totalDeductions = 0;
    let totalNetAmount = 0;
    const cropMap: Record<string, { cropId: string; cropName: string; quantity: number; amount: number; count: number }> = {};
    const statusCounts = { paid: 0, processing: 0, pending: 0, failed: 0 };

    payments.forEach((p) => {
      totalQuantity += p.quantity;
      totalGrossAmount += p.grossAmount;
      totalDeductions += p.deductions;
      totalNetAmount += p.netAmount;

      const cId = p.cropId;
      const cName = p.crop?.name || 'Unknown Crop';
      if (!cropMap[cId]) {
        cropMap[cId] = { cropId: cId, cropName: cName, quantity: 0, amount: 0, count: 0 };
      }
      cropMap[cId].quantity += p.quantity;
      cropMap[cId].amount += p.netAmount;
      cropMap[cId].count += 1;

      if (p.status === 'PAID') statusCounts.paid++;
      else if (p.status === 'PROCESSING') statusCounts.processing++;
      else if (p.status === 'PENDING') statusCounts.pending++;
      else if (p.status === 'FAILED') statusCounts.failed++;
    });

    res.json({
      success: true,
      date: targetDateStr,
      centre,
      summary: {
        totalQuantity: Math.round(totalQuantity * 100) / 100,
        totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetAmount: Math.round(totalNetAmount * 100) / 100,
        totalVehicles: payments.length,
        cropBreakdown: Object.values(cropMap),
        statusBreakdown: statusCounts,
      },
      records: payments,
    });
  }
}
