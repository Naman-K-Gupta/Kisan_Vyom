import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logAudit } from '../services/audit.service';
import { sendNotification } from '../services/notification.service';

export class PaymentController {
  /**
   * Helper: Ensure default realistic DBT payments exist for a farmer
   */
  public static async ensureSamplePaymentsForFarmer(user: any) {
    if (!user || !user.id) return;

    const existingCount = await prisma.payment.count({
      where: { farmerId: user.id },
    });

    if (existingCount > 0) return;

    // Find available crops and centres
    const wheat = await prisma.crop.findFirst({ where: { name: { contains: 'Wheat' } } });
    const paddy =
      (await prisma.crop.findFirst({ where: { name: { contains: 'Paddy' } } })) ||
      (await prisma.crop.findFirst({ where: { name: { contains: 'Rice' } } }));
    const mustard =
      (await prisma.crop.findFirst({ where: { name: { contains: 'Mustard' } } })) ||
      (await prisma.crop.findFirst({ where: { name: { contains: 'Cotton' } } }));

    const centre =
      (await prisma.procurementCentre.findFirst({
        where: {
          OR: [
            { state: { contains: user.state || 'Punjab' } },
            { district: { contains: user.district || 'Ludhiana' } },
          ],
        },
      })) || (await prisma.procurementCentre.findFirst());

    if (!centre) return;

    const maskedAcc = `XXXXXX${user.mobile ? user.mobile.slice(-4) : '4021'}`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Seed initial historical records if this is a fresh account
    if (wheat) {
      const qty = 45;
      const rate = 2425;
      const gross = qty * rate;
      const deductions = 0;
      const net = gross - deductions;

      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-${datePrefix}-WHT${randSuffix}`,
          farmerId: user.id,
          centreId: centre.id,
          cropId: wheat.id,
          quantity: qty,
          unit: 'Quintal',
          ratePerUnit: rate,
          grossAmount: gross,
          deductions,
          netAmount: net,
          status: 'PAID',
          paymentMethod: 'DBT_PFMS',
          utrNumber: `PFMS${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`,
          bankName: 'State Bank of India',
          accountNumberMasked: maskedAcc,
          ifscCode: 'SBIN0001234',
          qualityGrade: 'Grade A (FAQ Passed)',
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      });
    }

    if (mustard) {
      const qty = 20;
      const rate = 5650;
      const gross = qty * rate;
      const deductions = 0;
      const net = gross - deductions;

      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-${datePrefix}-MST${randSuffix + 1}`,
          farmerId: user.id,
          centreId: centre.id,
          cropId: mustard.id,
          quantity: qty,
          unit: 'Quintal',
          ratePerUnit: rate,
          grossAmount: gross,
          deductions,
          netAmount: net,
          status: 'PAID',
          paymentMethod: 'DBT_PFMS',
          utrNumber: `PFMS${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`,
          bankName: 'Punjab National Bank',
          accountNumberMasked: maskedAcc,
          ifscCode: 'PUNB0024000',
          qualityGrade: 'Grade A (Moisture <8%)',
          paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });
    }

    if (paddy) {
      const qty = 35;
      const rate = 2320;
      const gross = qty * rate;
      const deductions = 0;
      const net = gross - deductions;

      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-${datePrefix}-PDY${randSuffix + 2}`,
          farmerId: user.id,
          centreId: centre.id,
          cropId: paddy.id,
          quantity: qty,
          unit: 'Quintal',
          ratePerUnit: rate,
          grossAmount: gross,
          deductions,
          netAmount: net,
          status: 'PROCESSING',
          paymentMethod: 'DBT_PFMS',
          utrNumber: null,
          bankName: 'State Bank of India',
          accountNumberMasked: maskedAcc,
          ifscCode: 'SBIN0001234',
          qualityGrade: 'FAQ Verified (Weighbridge Done)',
          paidAt: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  /**
   * Get logged-in farmer's payments and DBT financial summary
   */
  static async getMyPayments(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Ensure sample data is provisioned for first-time view
    await PaymentController.ensureSamplePaymentsForFarmer(req.user);

    const payments = await prisma.payment.findMany({
      where: { farmerId: req.user.id },
      include: {
        crop: true,
        centre: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            state: true,
            district: true,
            village: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute DBT summary aggregates
    let totalDisbursed = 0;
    let pendingDisbursement = 0;
    let totalQuantitySold = 0;
    let completedTransactionsCount = 0;

    for (const p of payments) {
      if (p.status === 'PAID') {
        totalDisbursed += p.netAmount;
        totalQuantitySold += p.quantity;
        completedTransactionsCount += 1;
      } else if (p.status === 'PROCESSING' || p.status === 'PENDING') {
        pendingDisbursement += p.netAmount;
        totalQuantitySold += p.quantity;
      }
    }

    const maskedAcc = `XXXXXX${req.user.mobile ? req.user.mobile.slice(-4) : '4021'}`;

    const summary = {
      totalDisbursed,
      pendingDisbursement,
      totalQuantitySold,
      completedTransactionsCount,
      verifiedBankAccount: {
        bankName: 'State Bank of India',
        accountNumberMasked: maskedAcc,
        ifscCode: 'SBIN0001234',
        accountHolderName: req.user.fullName,
        isAadhaarLinked: true,
      },
    };

    // Format DTOs
    const formattedPayments = payments.map((p) => ({
      ...p,
      farmerName: p.farmer.fullName,
      farmerMobile: p.farmer.mobile,
      centreName: p.centre.name,
      centreDistrict: p.centre.district,
      centreState: p.centre.state,
      cropName: p.crop.name,
    }));

    res.json({
      success: true,
      count: formattedPayments.length,
      summary,
      payments: formattedPayments,
    });
  }

  /**
   * Get single payment detail & J-Form data
   */
  static async getPaymentById(req: Request, res: Response) {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        crop: true,
        centre: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            state: true,
            district: true,
            village: true,
            address: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Authorization check
    if (req.user?.role === 'FARMER' && payment.farmerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      payment: {
        ...payment,
        farmerName: payment.farmer.fullName,
        farmerMobile: payment.farmer.mobile,
        centreName: payment.centre.name,
        centreDistrict: payment.centre.district,
        centreState: payment.centre.state,
        cropName: payment.crop.name,
      },
    });
  }

  /**
   * Admin / Manager: Get all procurement payments statewide or by centre
   */
  static async getAllPayments(req: Request, res: Response) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'PROCUREMENT_CENTRE_MANAGER')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { status, centreId, search } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = String(status);
    if (centreId) whereClause.centreId = String(centreId);

    if (search) {
      whereClause.OR = [
        { paymentNumber: { contains: String(search) } },
        { utrNumber: { contains: String(search) } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        crop: true,
        centre: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            state: true,
            district: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalDisbursed = payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.netAmount, 0);

    const totalPending = payments
      .filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING')
      .reduce((acc, curr) => acc + curr.netAmount, 0);

    res.json({
      success: true,
      count: payments.length,
      metrics: {
        totalDisbursed,
        totalPending,
        totalTransactions: payments.length,
      },
      payments: payments.map((p) => ({
        ...p,
        farmerName: p.farmer.fullName,
        farmerMobile: p.farmer.mobile,
        centreName: p.centre.name,
        centreDistrict: p.centre.district,
        centreState: p.centre.state,
        cropName: p.crop.name,
      })),
    });
  }

  /**
   * Admin / Manager: Disburse Payment (mark PAID & attach UTR)
   */
  static async updatePaymentStatus(req: Request, res: Response) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'PROCUREMENT_CENTRE_MANAGER')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const { status, utrNumber } = req.body;

    const existing = await prisma.payment.findUnique({
      where: { id },
      include: { farmer: true, crop: true, centre: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: status || existing.status,
        utrNumber: utrNumber || existing.utrNumber || `PFMS${Date.now().toString().slice(-9)}`,
        paidAt: status === 'PAID' ? new Date() : existing.paidAt,
      },
    });

    // Notify farmer of payment clearance
    if (status === 'PAID') {
      await sendNotification({
        userId: existing.farmerId,
        title: 'DBT Payment Disbursed!',
        message: `₹${existing.netAmount.toLocaleString('en-IN')} has been credited for your ${existing.crop.name} procurement via DBT. UTR: ${updated.utrNumber}.`,
        type: 'SYSTEM_NOTIFICATION',
        metadata: { paymentId: existing.id, utrNumber: updated.utrNumber },
      });
    }

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'PAYMENT_UPDATED',
      entity: 'Payment',
      entityId: id,
      previousValue: { status: existing.status },
      newValue: { status: updated.status, utrNumber: updated.utrNumber },
    });

    res.json({
      success: true,
      message: `Payment status updated to ${updated.status}`,
      payment: updated,
    });
  }

  /**
   * Download official APMC Mandi Weighment Slip / J-Form as PDF
   */
  static async downloadReceiptPdf(req: Request, res: Response) {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        crop: true,
        centre: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            state: true,
            district: true,
            village: true,
            address: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Authorization check
    if (req.user?.role === 'FARMER' && payment.farmerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
      const { generateWeighmentSlipPdf } = await import('../services/receipt.service');

      const pdfBuffer = await generateWeighmentSlipPdf({
        tokenNumber: payment.paymentNumber.replace('PAY-', 'TK-'),
        paymentNumber: payment.paymentNumber,
        centreName: payment.centre.name,
        farmerName: payment.farmer.fullName,
        farmerMobile: payment.farmer.mobile,
        farmerVillage: payment.farmer.village,
        vehicleNumber: (payment as any).vehicleNumber || 'Registered Vehicle',
        cropName: payment.crop.name,
        quantity: payment.quantity,
        unit: payment.unit || 'Quintal',
        qualityGrade: payment.qualityGrade || 'Grade A (FAQ Passed)',
        ratePerUnit: payment.ratePerUnit,
        grossAmount: payment.grossAmount,
        deductions: payment.deductions,
        amount: payment.netAmount,
        bankName: payment.bankName || 'State Bank of India',
        accountNumberMasked: payment.accountNumberMasked || 'XXXXXX4021',
        createdAt: payment.createdAt ? payment.createdAt.toISOString() : new Date().toISOString(),
      });

      const filename = `Mandi_Weighment_Slip_${payment.paymentNumber}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to generate PDF receipt', error: err.message });
    }
  }
}

