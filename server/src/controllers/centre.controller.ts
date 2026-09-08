import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createCentreSchema, updateCentreCapacitySchema } from '../validators';
import { getIO } from '../sockets/socketHandler';
import { logAudit } from '../services/audit.service';

export class CentreController {
  /**
   * Get all procurement centres with live status, waiting tokens, and remaining capacity
   */
  static async getAllCentres(req: Request, res: Response) {
    const { state, district, cropId, status, search } = req.query;

    const centres = await prisma.procurementCentre.findMany({
      where: {
        ...(state ? { state: String(state) } : {}),
        ...(district ? { district: String(district) } : {}),
        ...(status ? { status: status as any } : {}),
        ...(cropId
          ? {
              supportedCrops: {
                some: { cropId: String(cropId), isAccepting: true },
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { district: { contains: String(search), mode: 'insensitive' } },
                { address: { contains: String(search), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        supportedCrops: {
          include: { crop: true },
        },
        _count: {
          select: {
            queueTokens: { where: { status: 'WAITING' } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = centres.map((c) => ({
      ...c,
      remainingCapacity: Math.max(0, c.totalCapacity - c.currentUsage),
      waitingTokensCount: c._count.queueTokens,
      estimatedWaitTimeMinutes: Math.round(
        c._count.queueTokens * (60 / (c.processingRate > 0 ? c.processingRate : 10))
      ),
    }));

    res.json({ success: true, count: formatted.length, centres: formatted });
  }

  /**
   * Get single centre by ID
   */
  static async getCentreById(req: Request, res: Response) {
    const { id } = req.params;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id },
      include: {
        supportedCrops: {
          include: { crop: true },
        },
        managers: {
          include: {
            user: {
              select: { id: true, fullName: true, mobile: true, email: true },
            },
          },
        },
        queueTokens: {
          where: { status: { in: ['WAITING', 'CALLED', 'PROCESSING'] } },
          include: {
            farmer: { select: { id: true, fullName: true, mobile: true, village: true } },
            crop: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!centre) {
      return res.status(404).json({ success: false, message: 'Procurement centre not found' });
    }

    const waitingTokens = centre.queueTokens.filter((t) => t.status === 'WAITING');
    const calledTokens = centre.queueTokens.filter((t) => t.status === 'CALLED');
    const processingTokens = centre.queueTokens.filter((t) => t.status === 'PROCESSING');

    res.json({
      success: true,
      centre: {
        ...centre,
        remainingCapacity: Math.max(0, centre.totalCapacity - centre.currentUsage),
        waitingTokens,
        calledTokens,
        processingTokens,
      },
    });
  }

  /**
   * Create Procurement Centre (Admin only)
   */
  static async createCentre(req: Request, res: Response) {
    const validated = createCentreSchema.parse(req.body);

    const centre = await prisma.procurementCentre.create({
      data: {
        name: validated.name,
        address: validated.address,
        state: validated.state,
        district: validated.district,
        village: validated.village,
        latitude: validated.latitude,
        longitude: validated.longitude,
        contactNumber: validated.contactNumber,
        openingHours: validated.openingHours,
        totalCapacity: validated.totalCapacity,
        processingRate: validated.processingRate,
        status: validated.status as any,
        supportedCrops: validated.supportedCropIds?.length
          ? {
              create: validated.supportedCropIds.map((cropId) => ({
                cropId,
                maxDailyCapacity: 500,
                isAccepting: true,
              })),
            }
          : undefined,
        managers: validated.managerUserId
          ? {
              create: {
                userId: validated.managerUserId,
              },
            }
          : undefined,
      },
      include: { supportedCrops: true },
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'CENTRE_CREATED',
        entity: 'ProcurementCentre',
        entityId: centre.id,
        newValue: centre,
      });
    }

    res.status(201).json({ success: true, message: 'Procurement centre created.', centre });
  }

  /**
   * Update Centre Capacity, Status, and Processing Rate (Manager or Admin)
   */
  static async updateCapacity(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    const validated = updateCentreCapacitySchema.parse(req.body);

    const centre = await prisma.procurementCentre.findUnique({ where: { id } });
    if (!centre) {
      return res.status(404).json({ success: false, message: 'Centre not found' });
    }

    // Authorization: Admin can update any centre; Manager can only update assigned centre
    if (req.user.role === 'PROCUREMENT_CENTRE_MANAGER') {
      const assignment = await prisma.centreManager.findUnique({
        where: {
          userId_centreId: {
            userId: req.user.id,
            centreId: id,
          },
        },
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to manage this procurement centre.',
        });
      }
    }

    const updated = await prisma.procurementCentre.update({
      where: { id },
      data: {
        currentUsage: validated.currentUsage !== undefined ? validated.currentUsage : undefined,
        totalCapacity: validated.totalCapacity !== undefined ? validated.totalCapacity : undefined,
        processingRate: validated.processingRate !== undefined ? validated.processingRate : undefined,
        status: validated.status ? (validated.status as any) : undefined,
      },
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'CENTRE_CAPACITY_UPDATED',
      entity: 'ProcurementCentre',
      entityId: id,
      previousValue: {
        currentUsage: centre.currentUsage,
        totalCapacity: centre.totalCapacity,
        processingRate: centre.processingRate,
        status: centre.status,
      },
      newValue: {
        currentUsage: updated.currentUsage,
        totalCapacity: updated.totalCapacity,
        processingRate: updated.processingRate,
        status: updated.status,
      },
    });

    // Real-time Socket.IO Broadcast to all clients
    const io = getIO();
    if (io) {
      io.emit('centre:capacityUpdated', {
        centreId: id,
        currentUsage: updated.currentUsage,
        totalCapacity: updated.totalCapacity,
        remainingCapacity: Math.max(0, updated.totalCapacity - updated.currentUsage),
        processingRate: updated.processingRate,
      });

      if (validated.status) {
        io.emit('centre:statusUpdated', {
          centreId: id,
          status: updated.status,
        });
      }
    }

    res.json({
      success: true,
      message: 'Procurement centre capacity and parameters updated.',
      centre: {
        ...updated,
        remainingCapacity: Math.max(0, updated.totalCapacity - updated.currentUsage),
      },
    });
  }
}
