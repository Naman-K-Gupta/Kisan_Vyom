import { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { createGovernmentPriceSchema } from '../validators';
import { ENV } from '../utils/env';
import { logAudit } from '../services/audit.service';
import { logger } from '../utils/logger';

export class PriceController {
  /**
   * Get Official Government MSP Prices
   */
  static async getGovernmentPrices(req: Request, res: Response) {
    const { season, marketingYear, cropName, status } = req.query;

    const prices = await prisma.governmentCropPrice.findMany({
      where: {
        ...(season ? { season: String(season) } : {}),
        ...(marketingYear ? { marketingYear: String(marketingYear) } : {}),
        ...(status ? { status: String(status) } : { status: 'ACTIVE' }),
        ...(cropName ? { cropName: { contains: String(cropName), mode: 'insensitive' } } : {}),
      },
      include: {
        crop: true,
      },
      orderBy: [{ marketingYear: 'desc' }, { cropName: 'asc' }],
    });

    res.json({ success: true, count: prices.length, prices });
  }

  /**
   * Create Government MSP Price (Admin only)
   * Prevents duplicate active price for: Crop + Season + Marketing Year
   */
  static async createGovernmentPrice(req: Request, res: Response) {
    const validated = createGovernmentPriceSchema.parse(req.body);

    const existing = await prisma.governmentCropPrice.findFirst({
      where: {
        cropName: validated.cropName,
        season: validated.season,
        marketingYear: validated.marketingYear,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An active MSP price already exists for ${validated.cropName} (${validated.season} - ${validated.marketingYear}).`,
      });
    }

    const priceRecord = await prisma.governmentCropPrice.create({
      data: {
        cropId: validated.cropId || null,
        cropName: validated.cropName,
        season: validated.season,
        marketingYear: validated.marketingYear,
        price: validated.price,
        unit: validated.unit,
        effectiveFrom: new Date(validated.effectiveFrom),
        effectiveTo: validated.effectiveTo ? new Date(validated.effectiveTo) : null,
        source: validated.source,
        status: validated.status,
        createdById: req.user?.id || null,
      },
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'MSP_PRICE_CREATED',
        entity: 'GovernmentCropPrice',
        entityId: priceRecord.id,
        newValue: priceRecord,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Government MSP price created successfully.',
      price: priceRecord,
    });
  }

  /**
   * Update Government MSP Price (Admin only)
   */
  static async updateGovernmentPrice(req: Request, res: Response) {
    const { id } = req.params;
    const { price, status, effectiveTo, source } = req.body;

    const existing = await prisma.governmentCropPrice.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Price record not found' });
    }

    const updated = await prisma.governmentCropPrice.update({
      where: { id },
      data: {
        price: price !== undefined ? Number(price) : undefined,
        status: status !== undefined ? String(status) : undefined,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
        source: source !== undefined ? String(source) : undefined,
      },
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'MSP_PRICE_UPDATED',
        entity: 'GovernmentCropPrice',
        entityId: id,
        previousValue: existing,
        newValue: updated,
      });
    }

    res.json({ success: true, message: 'MSP price updated.', price: updated });
  }

  /**
   * Delete / Deactivate MSP Price (Admin only)
   */
  static async deleteGovernmentPrice(req: Request, res: Response) {
    const { id } = req.params;

    const existing = await prisma.governmentCropPrice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Price record not found' });

    await prisma.governmentCropPrice.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'MSP_PRICE_DEACTIVATED',
        entity: 'GovernmentCropPrice',
        entityId: id,
      });
    }

    res.json({ success: true, message: 'MSP price deactivated.' });
  }

  /**
   * Live APMC Mandi Market Prices (data.gov.in / Database)
   */
  static async getMarketPrices(req: Request, res: Response) {
    const { state, district, cropName } = req.query;

    // Try fetching from data.gov.in if API key is provided
    if (ENV.DATA_GOV_API_KEY) {
      try {
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${ENV.DATA_GOV_API_KEY}&format=json&limit=50${
          state ? `&filters[state]=${encodeURIComponent(String(state))}` : ''
        }${district ? `&filters[district]=${encodeURIComponent(String(district))}` : ''}`;

        const apiRes = await axios.get(url, { timeout: 5000 });
        if (apiRes.data?.records?.length > 0) {
          const records = apiRes.data.records.map((r: any) => ({
            cropName: r.commodity || r.commodity_name,
            market: r.market || r.market_name,
            state: r.state,
            district: r.district,
            price: Number(r.modal_price || r.price || 0),
            unit: 'Quintal',
            arrivalDate: r.arrival_date,
            source: 'data.gov.in (Agmarknet)',
          }));
          return res.json({ success: true, source: 'data.gov.in', count: records.length, records });
        }
      } catch (err: any) {
        logger.warn('data.gov.in API call failed, falling back to database records:', err.message);
      }
    }

    // Fallback to database recorded market prices
    const dbPrices = await prisma.marketPrice.findMany({
      where: {
        ...(state ? { state: String(state) } : {}),
        ...(district ? { district: String(district) } : {}),
        ...(cropName ? { cropName: { contains: String(cropName), mode: 'insensitive' } } : {}),
      },
      orderBy: { arrivalDate: 'desc' },
      take: 50,
    });

    if (dbPrices.length === 0) {
      return res.json({
        success: true,
        source: 'database',
        count: 0,
        records: [],
        message: 'Live market price data is currently unavailable.',
      });
    }

    res.json({ success: true, source: 'database', count: dbPrices.length, records: dbPrices });
  }
}
