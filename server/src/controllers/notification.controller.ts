import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        ...(unreadOnly === 'true' ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  }

  static async markAsRead(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read.' });
  }

  static async markAllAsRead(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  }


  static async getTelegramStatus(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { ENV } = require('../utils/env');
    const { getTelegramLinkByMobile, getTelegramLinkByUserId, cleanMobileNumber } = require('../services/telegram.service');

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || ENV.TELEGRAM_BOT_USERNAME || 'Kisan_kendra_bot';
    const clean = cleanMobileNumber(req.user.mobile);
    const deepLink = clean ? `https://t.me/${botUsername}?start=${clean}` : `https://t.me/${botUsername}`;

    let link = null;
    if (clean) link = await getTelegramLinkByMobile(clean);
    if (!link && req.user.id) link = await getTelegramLinkByUserId(req.user.id);

    res.json({
      success: true,
      botUsername,
      deepLink,
      isLinked: Boolean(link?.chatId),
      chatId: link?.chatId || null,
      username: link?.username || null,
      firstName: link?.firstName || null,
      mobile: clean,
    });
  }

  static async linkTelegramManually(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ success: false, message: 'chatId is required' });

    const { ENV } = require('../utils/env');
    const { saveTelegramLink, cleanMobileNumber, sendTelegramMessage } = require('../services/telegram.service');
    const clean = cleanMobileNumber(req.user.mobile);

    const botToken = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN || '';
    const botId = botToken ? botToken.split(':')[0] : '8927569233';
    // Remove leading '#', '@', or whitespace if user typed "#8365953425"
    const trimmedChatId = chatId.toString().trim().replace(/^[#@]/, '');

    // Check if user accidentally entered the Bot ID
    if (trimmedChatId === botId || trimmedChatId === '8927569233') {
      return res.status(400).json({
        success: false,
        message: `${trimmedChatId} is the Bot ID itself! A Telegram bot cannot send messages to itself. To receive alerts on your phone, please tap "Connect Telegram" to open @Kisan_kendra_bot and tap START, or enter your personal user Chat ID (check with @userinfobot).`,
      });
    }

    // 1. Save link in database first
    let saved = null;
    try {
      saved = await saveTelegramLink({
        mobile: clean || req.user.mobile,
        chatId: trimmedChatId,
        userId: req.user.id,
        firstName: req.user.fullName,
      });
    } catch (saveErr: any) {
      return res.status(500).json({
        success: false,
        message: `Database error while saving Telegram link: ${saveErr.message}`,
      });
    }

    if (!saved) {
      return res.status(500).json({ success: false, message: 'Failed to save Telegram link in database' });
    }

    // 2. Attempt verification message (Non-blocking)
    let verifySuccess = false;
    let verifyError = '';
    try {
      const verifySend = await sendTelegramMessage(
        trimmedChatId,
        ` *Namaste ${req.user.fullName || 'Farmer'}!* \n\n *Aapka mobile number +91 ${clean || req.user.mobile} safaltapoorvak link ho gaya hai!*\nAb aapko Kisan Vyom ke sabhi live alerts Telegram par milenge.\n\n️ _APMC Mandi Portal_`
      );
      if (verifySend.success) {
        verifySuccess = true;
      } else {
        verifyError = verifySend.error || '';
      }
    } catch (msgErr: any) {
      verifyError = msgErr.message || '';
    }

    if (!verifySuccess) {
      return res.json({
        success: true,
        message: `Telegram Chat ID #${trimmedChatId} has been linked! Note: Please make sure to open @Kisan_kendra_bot and tap START in Telegram so the bot can deliver alerts.`,
        link: saved,
        warning: true,
      });
    }

    res.json({
      success: true,
      message: `Telegram successfully linked! A verification alert was sent to Chat ID #${trimmedChatId}.`,
      link: saved,
    });
  }

  static async sendTestTelegram(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { ENV } = require('../utils/env');
    const {
      getTelegramLinkByMobile,
      getTelegramLinkByUserId,
      sendTelegramMessage,
      cleanMobileNumber,
    } = require('../services/telegram.service');

    const botToken = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || ENV.TELEGRAM_BOT_USERNAME || 'Kisan_kendra_bot';

    if (!botToken) {
      return res.status(400).json({
        success: false,
        message: 'Telegram Bot is not configured. Please add TELEGRAM_BOT_TOKEN to server/.env',
      });
    }

    const clean = cleanMobileNumber(req.user.mobile);
    const deepLink = clean ? `https://t.me/${botUsername}?start=${clean}` : `https://t.me/${botUsername}`;

    // 1. Look up user's personal chat link
    let targetChatId = null;
    let link = null;
    if (clean) link = await getTelegramLinkByMobile(clean);
    if (!link && req.user.id) link = await getTelegramLinkByUserId(req.user.id);

    if (link && link.chatId) {
      targetChatId = link.chatId;
    } else if (process.env.TELEGRAM_CHAT_ID || ENV.TELEGRAM_CHAT_ID) {
      targetChatId = process.env.TELEGRAM_CHAT_ID || ENV.TELEGRAM_CHAT_ID;
    }

    if (!targetChatId) {
      return res.status(400).json({
        success: false,
        notLinked: true,
        botUsername,
        deepLink,
        message: `Your phone number (+91 ${clean}) is not yet connected to @${botUsername}. Tap "Connect Telegram" to start receiving alerts instantly!`,
      });
    }

    try {
      const nowStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const tgText = ` *Kisan Vyom Verification*\n━━━━━━━━━━━━━━━━━━━━\n *Telegram Alert Gateway Active!*\nNamaste *${req.user.fullName || 'Farmer'}*! Your Telegram notification channel is live.\n\n *Linked Mobile:* +91 ${clean || req.user.mobile}\n *Chat ID:* \`${targetChatId}\`\n\nYou will receive real-time APMC Mandi queue tokens, weighing bay callouts, quality inspection certificates, and DBT payment credits directly on Telegram.\n━━━━━━━━━━━━━━━━━━━━\n⏰ _${nowStr}_`;

      const response = await sendTelegramMessage(targetChatId, tgText);

      if (!response.success) {
        return res.status(400).json({
          success: false,
          message: `Telegram dispatch failed: ${response.error}`,
        });
      }

      return res.json({
        success: true,
        message: `Telegram test alert delivered successfully to +91${clean || req.user.mobile}!`,
        messageId: response.messageId,
        chatId: targetChatId,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: `Telegram dispatch failed: ${err.message}`,
      });
    }
  }
}
