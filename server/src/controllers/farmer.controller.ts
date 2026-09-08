import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { updateProfileSchema, notificationPreferenceSchema } from '../validators';
import { processUploadedFile } from '../middleware/upload.middleware';
import { logAudit } from '../services/audit.service';

export class FarmerController {
  static async getProfile(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const farmer = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        farmerProfile: {
          include: {
            crops: {
              include: { crop: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        notificationPreference: true,
      },
    });

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    res.json({ success: true, farmer });
  }

  static async updateProfile(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validated = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: validated.fullName,
        state: validated.state,
        district: validated.district,
        village: validated.village,
        address: validated.address,
        preferredLanguage: validated.preferredLanguage,
        farmerProfile: {
          upsert: {
            create: {
              bio: validated.bio,
              landAreaTotal: validated.landAreaTotal || 0,
            },
            update: {
              bio: validated.bio,
              landAreaTotal: validated.landAreaTotal,
            },
          },
        },
      },
      include: {
        farmerProfile: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  }

  static async uploadProfilePicture(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const imageUrl = await processUploadedFile(req.file);

    await prisma.farmerProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        profilePictureUrl: imageUrl,
      },
      update: {
        profilePictureUrl: imageUrl,
      },
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'PROFILE_PICTURE_UPLOADED',
      entity: 'FarmerProfile',
      entityId: req.user.id,
      newValue: { imageUrl },
    });

    res.json({
      success: true,
      message: 'Profile photo updated successfully.',
      imageUrl,
    });
  }

  static async deleteProfilePicture(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await prisma.farmerProfile.updateMany({
      where: { userId: req.user.id },
      data: { profilePictureUrl: null },
    });

    res.json({ success: true, message: 'Profile photo removed.' });
  }

  static async updateNotificationPreferences(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validated = notificationPreferenceSchema.parse(req.body);

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        inApp: validated.inApp ?? true,
        sms: validated.sms ?? true,
        whatsapp: validated.whatsapp ?? false,
        push: validated.push ?? true,
      },
      update: validated,
    });

    res.json({
      success: true,
      message: 'Notification preferences updated.',
      preferences,
    });
  }
}
