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
      select: { name: true, processingRate: true, totalCapacity: true, currentUsage: true, status: true },
    });

    if (!centre) return;

    const waitingTokens = await prisma.queueToken.findMany({
      where: {
        centreId,
        status: 'WAITING',
      },
      include: {
        farmer: { select: { id: true, fullName: true, mobile: true } },
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
        const farmerName = token.farmer?.fullName || 'Kisan';
        await sendNotification({
          userId: token.farmerId,
          title: 'SMS: Turn Approaching',
          message: `[VK-GOVMSP] Dear ${farmerName}, only 3 farmers ahead of Token ${token.tokenNumber} at ${centre.name || 'Mandi'}. Please stay ready near the entry gate. - APMC Mandi`,
          type: 'TURN_APPROACHING',
          metadata: { tokenId: token.id, centreId, farmerName },
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
    vehicleNumber?: string | null;
    vehicleType?: string | null;
  }) {
    const { farmerId, centreId, cropId, quantity, unit = 'Quintal', vehicleNumber, vehicleType } = params;

    // Verify centre operating status
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

    // Check crop acceptance
    const isSupported = centre.supportedCrops.some((sc) => sc.cropId === cropId && sc.isAccepting);
    if (!isSupported) {
      throw new Error('This centre is not currently accepting the selected crop.');
    }

    // Prevent duplicate active queue tokens for same farmer
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

    // Generate token sequence and estimate queue wait time
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
        vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : null,
        vehicleType: vehicleType || 'Tractor Trolley',
      },
      include: {
        centre: { select: { id: true, name: true, address: true, status: true } },
        crop: { select: { id: true, name: true, defaultUnit: true } },
        farmer: { select: { id: true, fullName: true, mobile: true, village: true } },
      },
    });

    // Notify farmer via SMS
    const farmerName = token.farmer?.fullName || 'Kisan';
    await sendNotification({
      userId: farmerId,
      title: 'SMS: Token Generated',
      message: `[VK-GOVMSP] Dear ${farmerName}, Token ${tokenNumber} for ${token.crop.name} (${quantity} ${unit}) is booked at ${centre.name}. Queue Position: #${position}. Approx wait: ${estimatedWaitMinutes} mins. - APMC Mandi`,
      type: 'TOKEN_GENERATED',
      metadata: { tokenId: token.id, centreId, farmerName },
    });

    // Broadcast queue update to mandi subscribers
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
    const farmerName = updatedToken.farmer?.fullName || 'Kisan';
    const vehicleInfo = token.vehicleNumber ? ` with vehicle ${token.vehicleNumber}` : '';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Token Called',
      message: `[VK-GOVMSP] Dear ${farmerName}, Token ${token.tokenNumber} is CALLED at ${token.centre.name}. Please report immediately to Weighbridge Bay${vehicleInfo}. - APMC Mandi`,
      type: 'TOKEN_CALLED',
      metadata: { tokenId: token.id, centreId: token.centreId, farmerName },
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

    const farmerNameProc = updatedToken.farmer?.fullName || 'Kisan';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Weighment Started',
      message: `[VK-GOVMSP] Dear ${farmerNameProc}, gross weighing and quality assay for Token ${token.tokenNumber} (${updatedToken.crop.name}) has commenced at ${token.centre.name}. - APMC Mandi`,
      type: 'PROCESSING_STARTED',
      metadata: { tokenId: token.id, centreId: token.centreId, farmerName: farmerNameProc },
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
   * Manager completes procurement for this token with quality assay and weighment
   */
  static async completeProcurement(
    tokenId: string,
    managerUserId: string,
    options?: {
      actualQuantity?: number;
      grossWeight?: number | null;
      tareWeight?: number | null;
      moisturePercentage?: number | null;
      foreignMatterPercentage?: number | null;
      damagedGrainPercentage?: number | null;
      qualityGrade?: string | null;
      deductions?: number | null;
      vehicleNumber?: string | null;
      vehicleType?: string | null;
      notes?: string | null;
    }
  ) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true, crop: true, farmer: true },
    });

    if (!token) throw new Error('Queue token not found');

    const finalQuantity =
      options?.actualQuantity && options.actualQuantity > 0
        ? options.actualQuantity
        : token.quantity;
    const finalVehicle =
      options?.vehicleNumber || token.vehicleNumber || 'Registered Vehicle';
    const finalVehicleType =
      options?.vehicleType || token.vehicleType || 'Tractor Trolley';

    // Update token to COMPLETED
    const updatedToken = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        vehicleNumber: finalVehicle,
        vehicleType: finalVehicleType,
      },
      include: {
        farmer: { select: { id: true, fullName: true, mobile: true, village: true } },
        crop: true,
        centre: true,
      },
    });

    // Automatically update centre currentUsage with actual weighed quantity!
    const newUsage = Math.min(
      token.centre.totalCapacity,
      token.centre.currentUsage + finalQuantity
    );
    const updatedCentre = await prisma.procurementCentre.update({
      where: { id: token.centreId },
      data: { currentUsage: newUsage },
    });

    // Lookup latest MSP price for crop or fallback to standard rate
    const mspRecord = await prisma.governmentCropPrice.findFirst({
      where: { cropId: token.cropId },
      orderBy: { effectiveFrom: 'desc' },
    });
    const mspRate = mspRecord ? mspRecord.price : 2275;
    const grossAmount = Math.round(finalQuantity * mspRate * 100) / 100;
    const deductions = Math.max(
      0,
      Math.round((options?.deductions || 0) * 100) / 100
    );
    const netAmount = Math.max(0, Math.round((grossAmount - deductions) * 100) / 100);

    let qualityGrade = options?.qualityGrade;
    if (!qualityGrade) {
      if (options?.moisturePercentage != null) {
        qualityGrade =
          options.moisturePercentage <= 12
            ? 'Grade A (FAQ Passed)'
            : 'Grade B (Moisture Cut)';
      } else {
        qualityGrade = 'Grade A (FAQ)';
      }
    }

    const farmer = await prisma.user.findUnique({ where: { id: token.farmerId } });
    const maskedAcc = `XXXXXX${farmer?.mobile ? farmer.mobile.slice(-4) : '4021'}`;
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentNumber = `PAY-${datePrefix}-${token.tokenNumber.slice(-4)}${randSuffix}`;

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        farmerId: token.farmerId,
        centreId: token.centreId,
        cropId: token.cropId,
        queueTokenId: token.id,
        quantity: finalQuantity,
        unit: token.unit,
        ratePerUnit: mspRate,
        grossAmount,
        deductions,
        netAmount,
        status: 'PROCESSING',
        paymentMethod: 'DBT_PFMS',
        bankName: 'State Bank of India',
        accountNumberMasked: maskedAcc,
        ifscCode: 'SBIN0001234',
        qualityGrade,
        vehicleNumber: finalVehicle,
      },
    });

    // Create procurement request record as COMPLETED with assay details
    const assayNotes = options?.notes || `Vehicle: ${finalVehicle} (${finalVehicleType}) | Moisture: ${options?.moisturePercentage ?? 11.5}% | Impurities: ${options?.foreignMatterPercentage ?? 0.5}% | Grade: ${qualityGrade}`;
    await prisma.procurementRequest.create({
      data: {
        farmerId: token.farmerId,
        centreId: token.centreId,
        cropId: token.cropId,
        quantity: finalQuantity,
        unit: token.unit,
        preferredDate: new Date(),
        status: 'COMPLETED',
        notes: assayNotes,
      },
    });

    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'PROCUREMENT_COMPLETED',
      entity: 'QueueToken',
      entityId: tokenId,
      previousValue: { status: token.status, currentUsage: token.centre.currentUsage },
      newValue: { status: 'COMPLETED', currentUsage: newUsage, netAmount, paymentNumber },
    });

    // Dispatch official APMC receipt confirmation via SMS
    const farmerNameComp = token.farmer?.fullName || 'Kisan';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Weighment Completed',
      message: `[VK-GOVMSP] Dear ${farmerNameComp}, ${finalQuantity} ${token.unit} of ${token.crop.name} weighed at ${token.centre.name} under Slip ${paymentNumber}. Net MSP amount Rs. ${netAmount.toLocaleString('en-IN')} initiated via DBT PFMS to A/c ending ${maskedAcc.slice(-4)}. - APMC Mandi`,
      type: 'PROCUREMENT_COMPLETED',
      metadata: {
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        paymentNumber,
        centreId: token.centreId,
        centreName: token.centre.name,
        farmerName: token.farmer?.fullName,
        farmerMobile: token.farmer?.mobile,
        farmerVillage: token.farmer?.village,
        cropName: token.crop.name,
        quantity: finalQuantity,
        unit: token.unit,
        grossWeight: options?.grossWeight,
        tareWeight: options?.tareWeight,
        ratePerUnit: mspRate,
        grossAmount,
        deductions,
        amount: netAmount,
        moisturePercentage: options?.moisturePercentage,
        foreignMatterPercentage: options?.foreignMatterPercentage,
        damagedGrainPercentage: options?.damagedGrainPercentage,
        qualityGrade,
        vehicleNumber: finalVehicle,
        vehicleType: finalVehicleType,
        accountNumberMasked: maskedAcc,
        isOfficialReceipt: true,
      },
    });

    // Broadcast events
    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:completed', {
        ...updatedToken,
        payment,
      });
      io.to(`user:${token.farmerId}`).emit('queue:completed', {
        ...updatedToken,
        payment,
      });
      io.emit('centre:capacityUpdated', {
        centreId: token.centreId,
        currentUsage: updatedCentre.currentUsage,
        totalCapacity: updatedCentre.totalCapacity,
        remainingCapacity: Math.max(0, updatedCentre.totalCapacity - updatedCentre.currentUsage),
        processingRate: updatedCentre.processingRate,
        addedQuantity: finalQuantity,
        farmerName: token.farmer?.fullName,
        tokenNumber: token.tokenNumber,
      });
    }

    await this.recalculateAndBroadcast(token.centreId);
    return { token: updatedToken, payment, centre: updatedCentre };
  }

  /**
   * Manager rejects consignment due to high moisture or impurities
   */
  static async rejectConsignment(
    tokenId: string,
    managerUserId: string,
    options: {
      reason: string;
      moisturePercentage?: number | null;
      foreignMatterPercentage?: number | null;
      advisoryNote?: string | null;
    }
  ) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true, crop: true, farmer: true },
    });

    if (!token) throw new Error('Queue token not found');

    const updatedToken = await prisma.queueToken.update({
      where: { id: tokenId },
      data: { status: 'CANCELLED' },
      include: { farmer: true, crop: true, centre: true },
    });

    await logAudit({
      userId: managerUserId,
      role: 'PROCUREMENT_CENTRE_MANAGER',
      action: 'CONSIGNMENT_REJECTED',
      entity: 'QueueToken',
      entityId: tokenId,
      previousValue: { status: token.status },
      newValue: { status: 'CANCELLED', reason: options.reason },
    });

    const farmerNameRej = token.farmer?.fullName || 'Kisan';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Quality Advisory',
      message: `[VK-GOVMSP] Dear ${farmerNameRej}, consignment for Token ${token.tokenNumber} (${token.crop.name}) not accepted at ${token.centre.name}. Reason: ${options.reason}. Please sun-dry produce before re-booking. - APMC Mandi`,
      type: 'TOKEN_CANCELLED',
      metadata: {
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        cropName: token.crop.name,
        moisturePercentage: options.moisturePercentage,
        foreignMatterPercentage: options.foreignMatterPercentage,
        reason: options.reason,
        advisoryNote: options.advisoryNote,
        farmerName: farmerNameRej,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`centre:${token.centreId}`).emit('queue:cancelled', updatedToken);
      io.to(`user:${token.farmerId}`).emit('queue:cancelled', updatedToken);
    }

    await this.recalculateAndBroadcast(token.centreId);
    return updatedToken;
  }

  /**
   * Skip Token (farmer was absent when called)
   */
  static async skipToken(tokenId: string, managerUserId: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true, farmer: true },
    });
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

    const farmerNameSkip = (token as any).farmer?.fullName || 'Kisan';
    const centreNameSkip = (token as any).centre?.name || 'Mandi';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Token Skipped',
      message: `[VK-GOVMSP] Dear ${farmerNameSkip}, Token ${token.tokenNumber} was SKIPPED due to non-arrival at weighing bay at ${centreNameSkip}. Please contact Mandi Helpdesk to re-activate. - APMC Mandi`,
      type: 'TOKEN_SKIPPED',
      metadata: { tokenId: token.id, centreId: token.centreId, farmerName: farmerNameSkip },
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
    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: { centre: true, farmer: true },
    });
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

    const farmerNameCancel = (token as any).farmer?.fullName || 'Kisan';
    const centreNameCancel = (token as any).centre?.name || 'Mandi';
    await sendNotification({
      userId: token.farmerId,
      title: 'SMS: Token Cancelled',
      message: `[VK-GOVMSP] Dear ${farmerNameCancel}, Token ${token.tokenNumber} has been CANCELLED at ${centreNameCancel}.${reason ? ` Reason: ${reason}.` : ''} - APMC Mandi`,
      type: 'TOKEN_CANCELLED',
      metadata: { tokenId: token.id, centreId: token.centreId, farmerName: farmerNameCancel },
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
