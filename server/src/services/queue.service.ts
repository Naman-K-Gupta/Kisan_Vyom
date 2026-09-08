import { prisma } from '../utils/prisma';
import { getIO } from '../sockets/socketHandler';
import { sendNotification } from './notification.service';
import { logAudit } from './audit.service';
import { logger } from '../utils/logger';

export class QueueService {
  /**
   * Generates a unique sequential token number for today: T-YYYYMMDD-XXXX
   */
  static async generateTokenNumber(centreId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Count tokens generated today for this centre
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const countToday = await prisma.queueToken.count({
      where: {
        centreId,
        createdAt: { gte: startOfDay },
      },
    });

    const seq = String(countToday + 1).padStart(4, '0');
    return `T-${dateStr}-${seq}`;
  }

  /**
   * Recalculates queue positions and wait times for all waiting tokens in a centre,
   * then broadcasts the updated state over Socket.IO.
   */
  static async recalculateAndBroadcast(centreId: string) {
    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      select: { processingRate: true, totalCapacity: true, currentUsage: true, status: true },
    });

    if (!centre) return;

    const waitingTokens = await prisma.queueToken.findMany({
      where: {
        centreId,
        status: 'WAITING',
      },
      orderBy: { createdAt: 'asc' },
    });

    const processingRate = centre.processingRate > 0 ? centre.processingRate : 10;
    // Minutes per farmer estimation: ~15 mins baseline or based on rate
    const minutesPerFarmer = Math.max(5, Math.round(60 / processingRate));

    // Update positions in parallel
    for (let index = 0; index < waitingTokens.length; index++) {
      const token = waitingTokens[index];
      const position = index + 1;
      const farmersAhead = index;
      const estimatedWaitMinutes = farmersAhead * minutesPerFarmer;

      await prisma.queueToken.update({
        where: { id: token.id },
        data: {
          position,
          estimatedWaitMinutes,
        },
      });

      // Notify when only 3 farmers are ahead
      if (farmersAhead === 3) {
        await sendNotification({
          userId: token.farmerId,
          title: 'Turn Approaching Soon',
          message: `There are only 3 farmers ahead of you for Token ${token.tokenNumber}. Please stay near the centre gate.`,
          type: 'TURN_APPROACHING',
          metadata: { tokenId: token.id, centreId },
        });
      }
    }

    // Broadcast to the centre room
    const io = getIO();
    if (io) {
      // Fetch full active queue state
      const activeQueue = await prisma.queueToken.findMany({
        where: {
          centreId,
          status: { in: ['WAITING', 'CALLED', 'PROCESSING'] },
        },
        include: {
          farmer: { select: { id: true, fullName: true, mobile: true, village: true } },
          crop: { select: { id: true, name: true, defaultUnit: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      io.to(`centre:${centreId}`).emit('queue:updated', {
        centreId,
        activeQueue,
        waitingCount: waitingTokens.length,
      });
    }
  }

  /**
   * Farmer joins the digital queue
   */
  static async joinQueue(params: {
    farmerId: string;
    centreId: string;
    cropId: string;
    quantity: number;
    unit?: string;
  }) {
    const { farmerId, centreId, cropId, quantity, unit = 'Quintal' } = params;

    // 1. Check if centre is open
    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      include: { supportedCrops: true },
    });

    if (!centre) {
      throw new Error('Procurement Centre not found.');
    }

    if (centre.status === 'CLOSED' || centre.status === 'TEMPORARILY_UNAVAILABLE') {
      throw new Error(`This centre is currently ${centre.status}. Queue tokens cannot be issued.`);
    }

    // 2. Check if crop is supported
    const isSupported = centre.supportedCrops.some((sc) => sc.cropId === cropId && sc.isAccepting);
    if (!isSupported) {
      throw new Error('This centre is not currently accepting the selected crop.');
    }

    // 3. Prevent multiple active tokens for the same farmer at the same centre
    const existingActiveToken = await prisma.queueToken.findFirst({
      where: {
        farmerId,
        centreId,
        status: { in: ['WAITING', 'CALLED', 'PROCESSING'] },
      },
    });

    if (existingActiveToken) {
      throw new Error(
        `You already have an active queue token (${existingActiveToken.tokenNumber}) at this centre.`
      );
    }

    // 4. Generate token number and calculate current position
    const tokenNumber = await this.generateTokenNumber(centreId);
    const waitingCount = await prisma.queueToken.count({
      where: { centreId, status: 'WAITING' },
    });

    const position = waitingCount + 1;
    const rate = centre.processingRate > 0 ? centre.processingRate : 10;
    const estimatedWaitMinutes = waitingCount * Math.max(5, Math.round(60 / rate));

    const token = await prisma.queueToken.create({
      data: {
        tokenNumber,
        farmerId,
        centreId,
        cropId,
        quantity,
        unit,
        status: 'WAITING',
        position,
        estimatedWaitMinutes,
      },
      include: {
        centre: { select: { id: true, name: true, address: true, status: true } },
        crop: { select: { id: true, name: true, defaultUnit: true } },
        farmer: { select: { id: true, fullName: true, mobile: true, village: true } },
      },
    });

    // 5. Notify farmer
    await sendNotification({
      userId: farmerId,
      title: 'Queue Token Issued',
      message: `Your token ${tokenNumber} has been generated at ${centre.name}. Position: #${position}. Estimated wait: ${estimatedWaitMinutes} mins.`,
      type: 'TOKEN_GENERATED',
      metadata: { tokenId: token.id, centreId },
    });

    // 6. Broadcast update
    await this.recalculateAndBroadcast(centreId);

    return token;
  }

  /**
   * Manager calls next farmer
   */
  static async callToken(tokenId: string, managerUserId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true },
    });

    if (!token) throw new Error('Queue token not found');
    if (token.status !== 'WAITING') {
      throw new Error(`Cannot call token with status ${token.status}`);
    }

    const updatedToken = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
      include: {
        farmer: { select: { id: true, fullName: true, mobile: true } },
        crop: true,
        centre: true,
      },
    });

    // Audit log
    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'QUEUE_CALLED',
      entity: 'QueueToken',
      entityId: tokenId,
      previousValue: { status: 'WAITING' },
      newValue: { status: 'CALLED' },
    });

    // Notify farmer
    await sendNotification({
      userId: token.farmerId,
      title: 'Your Token has been Called!',
      message: `Token ${token.tokenNumber}: Please proceed immediately to the inspection and procurement bay at ${token.centre.name}.`,
      type: 'TOKEN_CALLED',
      metadata: { tokenId: token.id, centreId: token.centreId },
    });

    // Broadcast
    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:called', updatedToken);
      io.to(`user:${token.farmerId}`).emit('queue:called', updatedToken);
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updatedToken;
  }

  /**
   * Manager starts processing farmer's crop
   */
  static async startProcessing(tokenId: string, managerUserId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true },
    });

    if (!token) throw new Error('Queue token not found');

    const updatedToken = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
      include: {
        farmer: { select: { id: true, fullName: true, mobile: true } },
        crop: true,
        centre: true,
      },
    });

    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'QUEUE_PROCESSING_STARTED',
      entity: 'QueueToken',
      entityId: tokenId,
      previousValue: { status: token.status },
      newValue: { status: 'PROCESSING' },
    });

    await sendNotification({
      userId: token.farmerId,
      title: 'Crop Inspection & Weighing Started',
      message: `Token ${token.tokenNumber}: Weighing and quality verification are now in progress.`,
      type: 'PROCESSING_STARTED',
      metadata: { tokenId: token.id, centreId: token.centreId },
    });

    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:processing', updatedToken);
      io.to(`user:${token.farmerId}`).emit('queue:processing', updatedToken);
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updatedToken;
  }

  /**
   * Manager completes procurement for this token
   */
  static async completeProcurement(tokenId: string, managerUserId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true, crop: true },
    });

    if (!token) throw new Error('Queue token not found');

    // Update token to COMPLETED
    const updatedToken = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        farmer: { select: { id: true, fullName: true, mobile: true } },
        crop: true,
        centre: true,
      },
    });

    // Automatically update centre currentUsage!
    const newUsage = Math.min(token.centre.totalCapacity, token.centre.currentUsage + token.quantity);
    const updatedCentre = await prisma.procurementCentre.update({
      where: { id: token.centreId },
      data: { currentUsage: newUsage },
    });

    // Also update or create procurement request record as COMPLETED
    await prisma.procurementRequest.create({
      data: {
        farmerId: token.farmerId,
        centreId: token.centreId,
        cropId: token.cropId,
        quantity: token.quantity,
        unit: token.unit,
        preferredDate: new Date(),
        status: 'COMPLETED',
        notes: `Procured via Digital Queue Token ${token.tokenNumber}`,
      },
    });

    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'PROCUREMENT_COMPLETED',
      entity: 'QueueToken',
      entityId: tokenId,
      previousValue: { status: token.status, currentUsage: token.centre.currentUsage },
      newValue: { status: 'COMPLETED', currentUsage: newUsage },
    });

    await sendNotification({
      userId: token.farmerId,
      title: 'Procurement Successfully Completed',
      message: `Token ${token.tokenNumber}: Successfully procured ${token.quantity} ${token.unit} of ${token.crop.name}. Thank you!`,
      type: 'PROCUREMENT_COMPLETED',
      metadata: { tokenId: token.id, centreId: token.centreId, quantity: token.quantity },
    });

    // Broadcast events
    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:completed', updatedToken);
      io.to(`user:${token.farmerId}`).emit('queue:completed', updatedToken);
      io.emit('centre:capacityUpdated', {
        centreId: token.centreId,
        currentUsage: updatedCentre.currentUsage,
        totalCapacity: updatedCentre.totalCapacity,
        remainingCapacity: updatedCentre.totalCapacity - updatedCentre.currentUsage,
      });
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updatedToken;
  }

  /**
   * Skip Token (farmer was absent when called)
   */
  static async skipToken(tokenId: string, managerUserId: string) {
    const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: { status: 'SKIPPED' },
    });

    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'QUEUE_SKIPPED',
      entity: 'QueueToken',
      entityId: tokenId,
    });

    await sendNotification({
      userId: token.farmerId,
      title: 'Token Skipped',
      message: `Your token ${token.tokenNumber} was skipped because you were not present when called. Please contact the centre manager.`,
      type: 'TOKEN_SKIPPED',
      metadata: { tokenId: token.id, centreId: token.centreId },
    });

    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:skipped', updated);
      io.to(`user:${token.farmerId}`).emit('queue:skipped', updated);
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updated;
  }

  /**
   * Cancel Token (farmer or manager cancels)
   */
  static async cancelToken(tokenId: string, userId: string, userRole: string, reason?: string) {
    const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) throw new Error('Token not found');

    // Only the farmer who owns it, or a manager/admin can cancel
    if (userRole === 'FARMER' && token.farmerId !== userId) {
      throw new Error('You can only cancel your own token.');
    }

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: { status: 'CANCELLED' },
    });

    await logAudit({
      userId,
      role: userRole,
      action: 'QUEUE_CANCELLED',
      entity: 'QueueToken',
      entityId: tokenId,
      newValue: { reason },
    });

    await sendNotification({
      userId: token.farmerId,
      title: 'Queue Token Cancelled',
      message: `Token ${token.tokenNumber} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'TOKEN_CANCELLED',
      metadata: { tokenId: token.id, centreId: token.centreId },
    });

    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:cancelled', updated);
      io.to(`user:${token.farmerId}`).emit('queue:cancelled', updated);
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updated;
  }
}
