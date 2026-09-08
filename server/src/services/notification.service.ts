import { prisma } from '../utils/prisma';
import { getIO } from '../sockets/socketHandler';
import { logger } from '../utils/logger';
import { ENV } from '../utils/env';
import twilio from 'twilio';

// Initialize Twilio client if credentials are provided
const twilioClient =
  ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN
    ? twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN)
    : null;

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
    // 1. Fetch user notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mobile: true, email: true },
    });

    // 2. In-App Notification (Always enabled by default unless explicitly disabled)
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

      // Emit real-time Socket.IO event to the user's room
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification:new', savedNotification);
      }
    }

    // 3. SMS Notification via Twilio
    if (preferences?.sms && user?.mobile && twilioClient && ENV.TWILIO_PHONE_NUMBER) {
      try {
        const formattedPhone = user.mobile.startsWith('+') ? user.mobile : `+91${user.mobile}`;
        await twilioClient.messages.create({
          body: `[Smart Farmer Assistance] ${title}: ${message}`,
          from: ENV.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        logger.info(`SMS successfully sent to ${user.mobile}`);
      } catch (smsError: any) {
        logger.warn(`External SMS dispatch failed for ${user.mobile}:`, smsError.message || smsError);
      }
    }

    // 4. WhatsApp Cloud API / Twilio WhatsApp (Stub/Integration)
    if (preferences?.whatsapp && user?.mobile) {
      logger.info(`WhatsApp delivery scheduled for ${user.mobile}`);
    }

    return savedNotification;
  } catch (error: any) {
    logger.error('Failed to create or send notification:', error.message || error);
    return null;
  }
}
