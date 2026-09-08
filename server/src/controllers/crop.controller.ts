import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createCropSchema, createFarmerCropSchema, updateFarmerCropSchema } from '../validators';
import { logAudit } from '../services/audit.service';

export class CropController {
  /**
   * Master Crop Catalog (Public / Authenticated)
   */
  static async getAllCrops(req: Request, res: Response) {
    const { category, search } = req.query;

    const crops = await prisma.crop.findMany({
      where: {
        isActive: true,
        ...(category ? { category: String(category) } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { scientificName: { contains: String(search), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, count: crops.length, crops });
  }

  /**
   * Create Master Crop (Admin only)
   */
  static async createCrop(req: Request, res: Response) {
    const validated = createCropSchema.parse(req.body);

    const crop = await prisma.crop.create({
      data: validated,
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'CROP_CREATED',
        entity: 'Crop',
        entityId: crop.id,
        newValue: crop,
      });
    }

    res.status(201).json({ success: true, message: 'Crop added to catalog.', crop });
  }

  /**
   * Get Farmer's crops
   */
  static async getFarmerCrops(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.json({ success: true, crops: [] });
    }

    const crops = await prisma.farmerCrop.findMany({
      where: { farmerProfileId: profile.id },
      include: { crop: true },
      orderBy: { sowingDate: 'desc' },
    });

    res.json({ success: true, count: crops.length, crops });
  }

  /**
   * Add crop to farmer profile
   */
  static async addFarmerCrop(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validated = createFarmerCropSchema.parse(req.body);

    const profile = await prisma.farmerProfile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id },
      update: {},
    });

    const farmerCrop = await prisma.farmerCrop.create({
      data: {
        farmerProfileId: profile.id,
        cropId: validated.cropId,
        variety: validated.variety,
        landArea: validated.landArea,
        sowingDate: new Date(validated.sowingDate),
        expectedHarvestDate: new Date(validated.expectedHarvestDate),
        expectedProduction: validated.expectedProduction,
        unit: validated.unit,
        status: validated.status as any,
      },
      include: { crop: true },
    });

    res.status(201).json({
      success: true,
      message: 'Crop added to your farm portfolio.',
      crop: farmerCrop,
    });
  }

  /**
   * Update Farmer Crop
   */
  static async updateFarmerCrop(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;
    const validated = updateFarmerCropSchema.parse(req.body);

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const existing = await prisma.farmerCrop.findFirst({
      where: { id, farmerProfileId: profile.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Crop entry not found' });
    }

    const updated = await prisma.farmerCrop.update({
      where: { id },
      data: {
        variety: validated.variety,
        landArea: validated.landArea,
        sowingDate: validated.sowingDate ? new Date(validated.sowingDate) : undefined,
        expectedHarvestDate: validated.expectedHarvestDate
          ? new Date(validated.expectedHarvestDate)
          : undefined,
        expectedProduction: validated.expectedProduction,
        unit: validated.unit,
        status: validated.status as any,
      },
      include: { crop: true },
    });

    res.json({ success: true, message: 'Crop record updated.', crop: updated });
  }

  /**
   * Delete Farmer Crop
   */
  static async deleteFarmerCrop(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;

    const profile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    await prisma.farmerCrop.deleteMany({
      where: { id, farmerProfileId: profile.id },
    });

    res.json({ success: true, message: 'Crop removed from your farm.' });
  }
}
