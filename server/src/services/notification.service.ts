import { prisma } from '../utils/prisma';
import { getIO } from '../sockets/socketHandler';
import { logger } from '../utils/logger';
import { ENV } from '../utils/env';
import axios from 'axios';

/**
 * Format any phone number into standard E.164 format (+[country code][number])
 */
export function formatE164(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  // Standard Indian 10-digit mobile number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // 12-digit Indian number starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // 11-digit number starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export interface SendNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: any; // NotificationType
  metadata?: Record<string, any>;
}

export async function sendNotification(options: SendNotificationOptions) {
  const { userId, title, message, type, metadata } = options;

  try {
    // User preferences & contact info
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mobile: true, email: true, fullName: true },
    });

    // In-app notification record and socket dispatch
    let savedNotification = null;
    if (!preferences || preferences.inApp) {
      savedNotification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: type || 'SYSTEM_NOTIFICATION',
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', savedNotification);
      }
    }

    return savedNotification;
  } catch (error: any) {
    logger.error('Failed to create or send notification:', error.message || error);
    return null;
  }
}

