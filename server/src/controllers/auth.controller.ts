import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { ENV } from '../utils/env';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators';
import { logAudit } from '../services/audit.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    const validated = registerSchema.parse(req.body);

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Check duplicate mobile
    const existingMobile = await prisma.user.findUnique({
      where: { mobile: validated.mobile },
    });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'An account with this mobile number already exists.',
      });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user and profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: validated.fullName,
          email: validated.email,
          mobile: validated.mobile,
          passwordHash,
          role: validated.role as any,
          state: validated.state,
          district: validated.district,
          village: validated.village,
          address: validated.address,
          preferredLanguage: validated.preferredLanguage,
          notificationPreference: {
            create: {
              inApp: true,
              sms: true,
              whatsapp: false,
              push: true,
            },
          },
        },
      });

      // If user is a farmer, create FarmerProfile
      if (validated.role === 'FARMER') {
        await tx.farmerProfile.create({
          data: {
            userId: newUser.id,
            landAreaTotal: validated.landAreaTotal || 0,
          },
        });
      }

      return newUser;
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      role: user.role,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        district: user.district,
        village: user.village,
        address: user.address,
        preferredLanguage: user.preferredLanguage,
      },
    });
  }

  static async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);

    // Support login via email or mobile number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.identifier },
          { mobile: validated.identifier },
        ],
      },
      include: {
        managedCentres: { select: { centreId: true } },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        district: user.district,
        village: user.village,
        address: user.address,
        preferredLanguage: user.preferredLanguage,
        managedCentreIds: user.managedCentres.map((mc) => mc.centreId),
      },
    });
  }

  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        state: true,
        district: true,
        village: true,
        address: true,
        preferredLanguage: true,
        isActive: true,
        createdAt: true,
        farmerProfile: {
          include: {
            crops: {
              include: { crop: true },
            },
          },
        },
        notificationPreference: true,
        managedCentres: {
          include: {
            centre: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
                totalCapacity: true,
                currentUsage: true,
                processingRate: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  }

  static async changePassword(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validated = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const newHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  }

  static async logout(req: Request, res: Response) {
    res.json({ success: true, message: 'Logged out successfully.' });
  }
}
