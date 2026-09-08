import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createAlertSchema } from '../validators';
import { logAudit } from '../services/audit.service';
import { getIO } from '../sockets/socketHandler';

export class AlertController {
  static async getAlerts(req: Request, res: Response) {
    const { cropId, location } = req.query;

    const alerts = await prisma.alert.findMany({
      where: {
        isPublished: true,
        expiryTime: { gte: new Date() },
        ...(cropId ? { cropId: String(cropId) } : {}),
        ...(location
          ? {
              OR: [{ location: null }, { location: String(location) }],
            }
          : {}),
      },
      include: {
        crop: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: alerts.length, alerts });
  }

  static async createAlert(req: Request, res: Response) {
    const validated = createAlertSchema.parse(req.body);

    const alert = await prisma.alert.create({
      data: {
        title: validated.title,
        message: validated.message,
        priority: validated.priority as any,
        cropId: validated.cropId || null,
        location: validated.location || null,
        startTime: validated.startTime ? new Date(validated.startTime) : new Date(),
        expiryTime: new Date(validated.expiryTime),
        createdById: req.user?.id || null,
      },
      include: { crop: true },
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'ALERT_CREATED',
        entity: 'Alert',
        entityId: alert.id,
        newValue: alert,
      });
    }

    // Broadcast urgent alerts via socket
    const io = getIO();
    if (io) {
      io.emit('alert:new', alert);
    }

    res.status(201).json({ success: true, message: 'Alert published successfully.', alert });
  }

  static async deleteAlert(req: Request, res: Response) {
    const { id } = req.params;

    await prisma.alert.delete({ where: { id } });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'ALERT_DELETED',
        entity: 'Alert',
        entityId: id,
      });
    }

    res.json({ success: true, message: 'Alert removed.' });
  }
}
