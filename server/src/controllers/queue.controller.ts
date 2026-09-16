import { Request, Response } from 'express';
import { QueueService } from '../services/queue.service';
import { prisma } from '../utils/prisma';
import { joinQueueSchema, queueActionSchema, completeProcurementSchema, rejectConsignmentSchema } from '../validators';
import { getIO } from '../sockets/socketHandler';

export class QueueController {
  /**
   * Farmer joins digital queue to receive token
   */
  static async joinQueue(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validated = joinQueueSchema.parse(req.body);

    const token = await QueueService.joinQueue({
      farmerId: req.user.id,
      centreId: validated.centreId,
      cropId: validated.cropId,
      quantity: validated.quantity,
      unit: validated.unit,
      vehicleNumber: validated.vehicleNumber,
      vehicleType: validated.vehicleType,
    });

    res.status(201).json({
      success: true,
      message: `Queue token ${token.tokenNumber} issued successfully!`,
      token,
    });
  }

  /**
   * Get active token for authenticated farmer
   */
  static async getActiveToken(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const activeToken = await prisma.queueToken.findFirst({
      where: {
        farmerId: req.user.id,
        status: { in: ['WAITING', 'CALLED', 'PROCESSING'] },
      },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
            processingRate: true,
            contactNumber: true,
          },
        },
        crop: {
          select: { id: true, name: true, defaultUnit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeToken) {
      return res.json({ success: true, token: null });
    }

    // Calculate farmers ahead
    const farmersAhead =
      activeToken.status === 'WAITING'
        ? await prisma.queueToken.count({
            where: {
              centreId: activeToken.centreId,
              status: 'WAITING',
              createdAt: { lt: activeToken.createdAt },
            },
          })
        : 0;

    res.json({
      success: true,
      token: {
        ...activeToken,
        farmersAhead,
      },
    });
  }

  /**
   * Get Live Queue for a Centre (Used by Centre Managers and Public Live Board)
   */
  static async getCentreQueue(req: Request, res: Response) {
    const { centreId } = req.params;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      select: { id: true, name: true, status: true, totalCapacity: true, currentUsage: true, processingRate: true },
    });

    if (!centre) {
      return res.status(404).json({ success: false, message: 'Centre not found' });
    }

    const tokens = await prisma.queueToken.findMany({
      where: {
        centreId,
        status: { in: ['WAITING', 'CALLED', 'PROCESSING', 'COMPLETED', 'SKIPPED'] },
      },
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            village: true,
            district: true,
            state: true,
            farmerProfile: {
              select: {
                profilePictureUrl: true,
                landAreaTotal: true,
              },
            },
          },
        },
        crop: { select: { id: true, name: true, defaultUnit: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const mappedTokens = tokens.map((t: any) => ({
      ...t,
      farmer: t.farmer
        ? {
            id: t.farmer.id,
            fullName: t.farmer.fullName,
            mobile: t.farmer.mobile,
            village: t.farmer.village,
            district: t.farmer.district,
            state: t.farmer.state,
            profilePictureUrl: t.farmer.farmerProfile?.profilePictureUrl || null,
            landAreaTotal: t.farmer.farmerProfile?.landAreaTotal || 0,
          }
        : undefined,
    }));

    const waiting = mappedTokens.filter((t) => t.status === 'WAITING');
    const called = mappedTokens.filter((t) => t.status === 'CALLED');
    const processing = mappedTokens.filter((t) => t.status === 'PROCESSING');
    const completedToday = mappedTokens.filter((t) => t.status === 'COMPLETED');

    res.json({
      success: true,
      centre,
      queue: {
        waiting,
        called,
        processing,
        completedTodayCount: completedToday.length,
        totalActiveCount: waiting.length + called.length + processing.length,
      },
    });
  }

  /**
   * Manager calls next waiting token
   */
  static async callToken(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;

    const token = await QueueService.callToken(id, req.user.id);
    res.json({ success: true, message: `Token ${token.tokenNumber} called!`, token });
  }

  /**
   * Manager starts processing farmer's consignment
   */
  static async startProcessing(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;

    const token = await QueueService.startProcessing(id, req.user.id);
    res.json({ success: true, message: `Processing started for Token ${token.tokenNumber}`, token });
  }

  /**
   * Manager completes procurement with quality assay & weighment
   */
  static async completeProcurement(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    const validated = completeProcurementSchema.parse(req.body || {});

    const result = await QueueService.completeProcurement(id, req.user.id, validated);
    res.json({
      success: true,
      message: `Procurement completed for Token ${result.token.tokenNumber}! Official receipt issued.`,
      token: result.token,
      payment: result.payment,
      centre: result.centre,
    });
  }

  /**
   * Manager rejects consignment due to high moisture or impurities
   */
  static async rejectConsignment(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    const validated = rejectConsignmentSchema.parse(req.body);

    const token = await QueueService.rejectConsignment(id, req.user.id, validated);
    res.json({
      success: true,
      message: `Consignment for Token ${token.tokenNumber} rejected with advisory issued.`,
      token,
    });
  }

  /**
   * Manager skips absent farmer
   */
  static async skipToken(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;

    const token = await QueueService.skipToken(id, req.user.id);
    res.json({ success: true, message: `Token ${token.tokenNumber} marked as skipped.`, token });
  }

  /**
   * Cancel Token (Farmer or Manager)
   */
  static async cancelToken(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    const { reason } = req.body;

    const token = await QueueService.cancelToken(id, req.user.id, req.user.role, reason);
    res.json({ success: true, message: `Token ${token.tokenNumber} cancelled.`, token });
  }

  /**
   * Pause / Resume Centre Queue
   */
  static async toggleQueuePause(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { centreId } = req.params;
    const { pause } = req.body; // boolean

    const newStatus = pause ? 'TEMPORARILY_UNAVAILABLE' : 'OPEN';
    const centre = await prisma.procurementCentre.update({
      where: { id: centreId },
      data: { status: newStatus as any },
    });

    const io = getIO();
    if (io) {
      io.emit('centre:statusUpdated', { centreId, status: newStatus });
    }

    res.json({
      success: true,
      message: `Queue ${pause ? 'paused' : 'resumed'}.`,
      status: centre.status,
    });
  }
}
