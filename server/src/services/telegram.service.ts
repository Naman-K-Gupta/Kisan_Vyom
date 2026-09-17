import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { ENV } from '../utils/env';
import { generateWeighmentSlipPdf } from './receipt.service';

export interface TelegramLinkRecord {
  id: string;
  mobile: string;
  userId?: string | null;
  chatId: string;
  username?: string | null;
  firstName?: string | null;
  isActive: boolean | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendTelegramOptions {
  mobile?: string;
  userId?: string;
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, any>;
}

/**
 * Normalizes any phone number into clean 10-digit Indian mobile number
 */
export function cleanMobileNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Get active Telegram link for a given mobile number
 */
export async function getTelegramLinkByMobile(mobile: string): Promise<TelegramLinkRecord | null> {
  const clean = cleanMobileNumber(mobile);
  if (!clean || clean.length < 10) return null;

  try {
    const records = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM "FarmerTelegramLink" WHERE ("mobile" = ? OR "mobile" = ?) AND "isActive" = 1 ORDER BY "updatedAt" DESC LIMIT 1`,
      clean,
      `+91${clean}`
    );
    if (Array.isArray(records) && records.length > 0) {
      return records[0] as TelegramLinkRecord;
    }
  } catch (err: any) {
    logger.warn('Failed to query FarmerTelegramLink by mobile:', err.message);
  }
  return null;
}

/**
 * Get active Telegram link for a given user ID
 */
export async function getTelegramLinkByUserId(userId: string): Promise<TelegramLinkRecord | null> {
  if (!userId) return null;

  try {
    const records = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM "FarmerTelegramLink" WHERE "userId" = ? AND "isActive" = 1 ORDER BY "updatedAt" DESC LIMIT 1`,
      userId
    );
    if (Array.isArray(records) && records.length > 0) {
      return records[0] as TelegramLinkRecord;
    }
  } catch (err: any) {
    logger.warn('Failed to query FarmerTelegramLink by userId:', err.message);
  }
  return null;
}

/**
 * Save or update a farmer's Telegram chat link
 */
export async function saveTelegramLink(params: {
  mobile: string;
  chatId: string | number;
  username?: string;
  firstName?: string;
  userId?: string;
}): Promise<TelegramLinkRecord | null> {
  const clean = cleanMobileNumber(params.mobile);
  if (!clean || clean.length < 10) return null;
  const chatIdStr = params.chatId.toString();

  try {
    let resolvedUserId = params.userId;
    let farmerName = params.firstName;

    // Look up user by userId or mobile to retrieve official profile username / fullName
    let dbUser = null;
    if (resolvedUserId) {
      dbUser = await (prisma as any).user.findUnique({
        where: { id: resolvedUserId },
        select: { id: true, fullName: true, mobile: true },
      });
    }

    if (!dbUser) {
      const users = await (prisma as any).user.findMany({
        where: {
          OR: [
            { mobile: clean },
            { mobile: `+91${clean}` },
            { mobile: { contains: clean } },
          ],
        },
        select: { id: true, fullName: true, mobile: true },
        take: 1,
      });

      if (users.length > 0) {
        dbUser = users[0];
        resolvedUserId = dbUser.id;
      }
    }

    // Always prioritize the official profile full name / username from portal
    if (dbUser && dbUser.fullName) {
      farmerName = dbUser.fullName;
    }

    // Check if a link already exists for this mobile number
    const existing = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM "FarmerTelegramLink" WHERE "mobile" = ? OR "mobile" = ? LIMIT 1`,
      clean,
      `+91${clean}`
    );

    const now = new Date().toISOString();

    if (Array.isArray(existing) && existing.length > 0) {
      const rec = existing[0];
      await (prisma as any).$executeRawUnsafe(
        `UPDATE "FarmerTelegramLink" SET "chatId" = ?, "username" = ?, "firstName" = ?, "userId" = ?, "isActive" = 1, "updatedAt" = ? WHERE "id" = ?`,
        chatIdStr,
        params.username || rec.username || null,
        farmerName || rec.firstName || null,
        resolvedUserId || rec.userId || null,
        now,
        rec.id
      );
      logger.success(`🔗 [Telegram] Updated farmer link: +91${clean} -> Chat ID ${chatIdStr} (${farmerName || 'Farmer'})`);
      return {
        id: rec.id,
        mobile: clean,
        userId: resolvedUserId || rec.userId,
        chatId: chatIdStr,
        username: params.username || rec.username,
        firstName: farmerName || rec.firstName,
        isActive: 1,
      };
    } else {
      const newId = crypto.randomUUID();
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "FarmerTelegramLink" ("id", "mobile", "userId", "chatId", "username", "firstName", "isActive", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        newId,
        clean,
        resolvedUserId || null,
        chatIdStr,
        params.username || null,
        farmerName || null,
        now,
        now
      );
      logger.success(`🔗 [Telegram] New farmer link established: +91${clean} -> Chat ID ${chatIdStr} (${farmerName || 'Farmer'})`);
      return {
        id: newId,
        mobile: clean,
        userId: resolvedUserId,
        chatId: chatIdStr,
        username: params.username,
        firstName: farmerName,
        isActive: 1,
      };
    }
  } catch (err: any) {
    logger.error('Failed to save FarmerTelegramLink:', err.message);
    return null;
  }
}

/**
 * Send a raw message to a Telegram Chat ID via Bot API
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: { parseMode?: 'Markdown' | 'HTML'; replyMarkup?: any } = {}
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  const parseMode = options.parseMode ?? 'Markdown';

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };

    if (parseMode) {
      payload.parse_mode = parseMode;
    }
    if (options.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, {
      timeout: 8000,
    });

    if (response.data?.ok) {
      return { success: true, messageId: response.data.result?.message_id };
    }
    return { success: false, error: response.data?.description || 'Unknown Telegram error' };
  } catch (err: any) {
    // If Markdown parsing failed, retry once with plain text without formatting
    if (parseMode && err.response?.data?.description?.includes("can't parse entities")) {
      try {
        const plainText = text.replace(/[*_`\[\]()]/g, '');
        const retryRes = await axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: chatId,
            text: plainText,
          },
          { timeout: 8000 }
        );
        if (retryRes.data?.ok) {
          return { success: true, messageId: retryRes.data.result?.message_id };
        }
      } catch (retryErr: any) {
        return { success: false, error: retryErr.response?.data?.description || retryErr.message };
      }
    }
    return { success: false, error: err.response?.data?.description || err.message };
  }
}

/**
 * Send a document/file (e.g. PDF receipt) to a Telegram Chat ID via Bot API
 */
export async function sendTelegramDocument(
  chatId: string | number,
  fileBuffer: Buffer,
  filename: string,
  caption?: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    formData.append('document', blob, filename);
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const data: any = await response.json();
    if (data?.ok) {
      return { success: true, messageId: data.result?.message_id };
    }
    return { success: false, error: data?.description || 'Unknown Telegram error' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Formats a notification nicely for Telegram delivery
 */
export function formatTelegramNotification(options: {
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, any>;
  farmerName?: string;
}): string {
  const { title, message, type, metadata, farmerName } = options;

  let headerIcon = '🌾';
  if (type === 'TOKEN_GENERATED' || type === 'TOKEN_CALLED') headerIcon = '🎫';
  else if (type === 'PROCESSING_STARTED') headerIcon = '⚖️';
  else if (type === 'PROCUREMENT_COMPLETED') headerIcon = '✅';
  else if (type === 'PAYMENT_DISBURSED') headerIcon = '💰';
  else if (type === 'TURN_APPROACHING') headerIcon = '🔔';
  else if (type === 'TOKEN_SKIPPED' || type === 'TOKEN_CANCELLED') headerIcon = '⚠️';

  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Dedicated Official Mandi Weighment Slip (Tulai Parchi) formatting
  if (type === 'PROCUREMENT_COMPLETED' || metadata?.isOfficialReceipt) {
    const centreName = metadata?.centreName || 'APMC Procurement Yard';
    const slipNo = metadata?.paymentNumber || `PAY-${metadata?.tokenNumber ? metadata.tokenNumber.slice(-4) : 'REC'}`;
    const tokenNo = metadata?.tokenNumber || 'N/A';
    const cropName = metadata?.cropName || 'Grain Consignment';
    const vehicleNo = metadata?.vehicleNumber || 'Registered Vehicle';
    const qty = metadata?.quantity ? `${metadata.quantity} ${metadata.unit || 'Quintal'}` : 'N/A';
    const moisture = metadata?.moisturePercentage != null ? `${metadata.moisturePercentage}%` : 'Standard (FAQ)';
    const foreignMatter = metadata?.foreignMatterPercentage != null ? `${metadata.foreignMatterPercentage}%` : 'Normal';
    const grade = metadata?.qualityGrade || 'Grade A (FAQ Passed)';
    const rate = metadata?.ratePerUnit ? `₹${metadata.ratePerUnit}/Qtl` : 'Official MSP';
    const gross = metadata?.grossAmount ? `₹${Number(metadata.grossAmount).toLocaleString('en-IN')}` : 'N/A';
    const deductions = metadata?.deductions ? `-₹${Number(metadata.deductions).toLocaleString('en-IN')}` : '₹0.00';
    const net = metadata?.amount ? `₹${Number(metadata.amount).toLocaleString('en-IN')}` : 'N/A';
    const acc = metadata?.accountNumberMasked || 'XXXXXX4021';
    const resolvedFarmer = farmerName || metadata?.farmerName || 'Kisan Bhai';

    return `🧾 *OFFICIAL APMC MANDI WEIGHMENT SLIP*
*तुलाई पर्ची एवं गुणवत्ता रिपोर्ट*
━━━━━━━━━━━━━━━━━━━━
👨‍🌾 *Farmer / किसान:* *${resolvedFarmer}*
🏛️ *Centre:* ${centreName}
📋 *Slip No:* \`${slipNo}\`
🎫 *Token:* \`${tokenNo}\`
🚛 *Vehicle No:* *${vehicleNo}*
🌾 *Crop:* *${cropName}*

⚖️ *WEIGHMENT & QUALITY METRICS*
• Net Weighed Quantity: *${qty}*
• Moisture Content: *${moisture}*
• Foreign Matter: *${foreignMatter}*
• FAQ Classification: *${grade}*

💰 *MSP BILLING & DBT SETTLEMENT*
• MSP Rate Applied: *${rate}*
• Gross Lot Value: *${gross}*
• Quality Value Cut: *${deductions}*
━━━━━━━━━━━━━━━━━━━━
✅ *Net Payable DBT Amount: ${net}*
🏦 *Disbursement:* PFMS Direct Bank Transfer to State Bank of India (${acc})
━━━━━━━━━━━━━━━━━━━━
📌 _Certified digital procurement receipt under APMC guidelines. Keep this slip for your official records._
🏛️ _Kisan Vyom Portal_
⏰ _${timeStr}_`;
  }

  let extraLines = '';
  if (metadata) {
    const extras: string[] = [];
    if (metadata.tokenNumber) extras.push(`• *Token:* \`${metadata.tokenNumber}\``);
    if (metadata.bayNumber) extras.push(`• *Bay / Dock:* *${metadata.bayNumber}*`);
    if (metadata.cropName) extras.push(`• *Crop:* ${metadata.cropName}`);
    if (metadata.vehicleNumber) extras.push(`• *Vehicle:* *${metadata.vehicleNumber}*`);
    if (metadata.quantity) extras.push(`• *Quantity:* ${metadata.quantity} ${metadata.unit || 'Qtl'}`);
    if (metadata.amount) extras.push(`• *Amount:* ₹${Number(metadata.amount).toLocaleString('en-IN')}`);
    if (metadata.utrNumber) extras.push(`• *UTR No:* \`${metadata.utrNumber}\``);
    if (extras.length > 0) {
      extraLines = `\n━━━━━━━━━━━━━━━━━━━━\n📋 *Details:*\n${extras.join('\n')}`;
    }
  }

  const farmerHeader = farmerName ? `👨‍🌾 *Farmer / किसान:* *${farmerName}*\n` : '';

  return `${headerIcon} *Kisan Vyom | किसान व्योम*\n━━━━━━━━━━━━━━━━━━━━\n${farmerHeader}📌 *${title}*\n\n${message}${extraLines}\n━━━━━━━━━━━━━━━━━━━━\n🏛️ _APMC Mandi Procurement Portal_\n⏰ _${timeStr}_`;
}

/**
 * Main dispatch function: Sends any dashboard notification to the farmer on Telegram
 */
export async function sendTelegramNotificationToFarmer(
  options: SendTelegramOptions
): Promise<{ success: boolean; chatId?: string; reason?: string; messageId?: number; deepLink?: string }> {
  const { mobile, userId, title, message, type, metadata } = options;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || ENV.TELEGRAM_BOT_USERNAME || 'Kisan_kendra_bot';

  if (!botToken) {
    return { success: false, reason: 'TELEGRAM_BOT_TOKEN_MISSING' };
  }

  const clean = cleanMobileNumber(mobile);

  // Resolve active chat link by mobile or user id
  let link: TelegramLinkRecord | null = null;
  if (clean) {
    link = await getTelegramLinkByMobile(clean);
  }
  if (!link && userId) {
    link = await getTelegramLinkByUserId(userId);
  }

  // Always resolve latest profile username/fullName from database
  let resolvedFarmerName = metadata?.farmerName || link?.firstName;
  try {
    const dbUser = await (prisma as any).user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(clean ? [{ mobile: clean }, { mobile: `+91${clean}` }] : []),
        ],
      },
      select: { fullName: true },
    });
    if (dbUser?.fullName) {
      resolvedFarmerName = dbUser.fullName;
    }
  } catch (e) {}

  const formattedText = formatTelegramNotification({
    title,
    message,
    type,
    metadata,
    farmerName: resolvedFarmerName,
  });

  // Direct bot dispatch to linked farmer
  if (link && link.chatId) {
    // Generate and attach PDF weighment slip on procurement completion
    if ((type === 'PROCUREMENT_COMPLETED' || metadata?.isOfficialReceipt) && metadata) {
      try {
        const pdfBuffer = await generateWeighmentSlipPdf({
          tokenNumber: metadata.tokenNumber || 'TK-REC',
          paymentNumber: metadata.paymentNumber || `PAY-${(metadata.tokenNumber || '').slice(-4)}`,
          centreName: metadata.centreName || 'APMC Procurement Yard',
          farmerName: resolvedFarmerName || link.firstName || metadata.farmerName || 'Kisan Bhai',
          farmerMobile: clean || link.mobile,
          farmerVillage: metadata.farmerVillage,
          vehicleNumber: metadata.vehicleNumber || 'Registered Vehicle',
          vehicleType: metadata.vehicleType,
          cropName: metadata.cropName || 'Grain Consignment',
          quantity: metadata.quantity || 0,
          unit: metadata.unit || 'Quintal',
          moisturePercentage: metadata.moisturePercentage,
          foreignMatterPercentage: metadata.foreignMatterPercentage,
          qualityGrade: metadata.qualityGrade,
          ratePerUnit: metadata.ratePerUnit || 0,
          grossAmount: metadata.grossAmount || 0,
          deductions: metadata.deductions || 0,
          amount: metadata.amount || 0,
          bankName: metadata.bankName || 'State Bank of India',
          accountNumberMasked: metadata.accountNumberMasked || 'XXXXXX4021',
          createdAt: metadata.createdAt || new Date().toISOString(),
        });

        const filename = `Mandi_Weighment_Slip_${metadata.paymentNumber || metadata.tokenNumber || 'Receipt'}.pdf`;
        const docCaption = `🧾 *Official APMC Mandi Weighment Slip (तुलाई पर्ची)*\n🌾 *Crop:* ${metadata.cropName || 'Produce'} • *Qty:* ${metadata.quantity || 0} ${metadata.unit || 'Qtl'}\n🚛 *Vehicle:* ${metadata.vehicleNumber || 'N/A'}\n💰 *Net DBT Payable:* ₹${Number(metadata.amount || 0).toLocaleString('en-IN')}\n\nTap above to view and download your official APMC receipt.`;

        await sendTelegramMessage(link.chatId, formattedText);

        const docRes = await sendTelegramDocument(link.chatId, pdfBuffer, filename, docCaption);
        if (docRes.success) {
          logger.info(`[Telegram] Sent weighment receipt PDF to ${link.chatId}`);
          return { success: true, chatId: link.chatId, messageId: docRes.messageId };
        } else {
          logger.warn(`Failed to send PDF receipt on Telegram: ${docRes.error}`);
        }
      } catch (pdfErr: any) {
        logger.error('Error generating weighment slip PDF for Telegram dispatch:', pdfErr.message);
      }
    }

    const res = await sendTelegramMessage(link.chatId, formattedText);
    if (res.success) {
      logger.info(`[Telegram] Delivered notification to +91${clean || link.mobile} (Chat ID: ${link.chatId})`);
      return { success: true, chatId: link.chatId, messageId: res.messageId };
    } else {
      logger.warn(`Failed to send Telegram message to Chat ID ${link.chatId}: ${res.error}`);
    }
  }

  // Fallback broadcast channel if configured
  const fallbackChatId = process.env.TELEGRAM_CHAT_ID || ENV.TELEGRAM_CHAT_ID;
  if (fallbackChatId) {
    if ((type === 'PROCUREMENT_COMPLETED' || metadata?.isOfficialReceipt) && metadata) {
      try {
        const pdfBuffer = await generateWeighmentSlipPdf({
          tokenNumber: metadata.tokenNumber,
          paymentNumber: metadata.paymentNumber,
          centreName: metadata.centreName,
          farmerName: metadata.farmerName || 'Kisan Bhai',
          farmerMobile: clean,
          vehicleNumber: metadata.vehicleNumber,
          vehicleType: metadata.vehicleType,
          cropName: metadata.cropName,
          quantity: metadata.quantity,
          unit: metadata.unit,
          moisturePercentage: metadata.moisturePercentage,
          foreignMatterPercentage: metadata.foreignMatterPercentage,
          qualityGrade: metadata.qualityGrade,
          ratePerUnit: metadata.ratePerUnit,
          grossAmount: metadata.grossAmount,
          deductions: metadata.deductions,
          amount: metadata.amount,
          accountNumberMasked: metadata.accountNumberMasked,
        });
        const filename = `Mandi_Weighment_Slip_${metadata.paymentNumber || metadata.tokenNumber || 'Receipt'}.pdf`;
        await sendTelegramMessage(fallbackChatId, formattedText);
        const docRes = await sendTelegramDocument(fallbackChatId, pdfBuffer, filename, `🧾 Official Mandi Weighment Slip`);
        if (docRes.success) {
          return { success: true, chatId: fallbackChatId, messageId: docRes.messageId };
        }
      } catch (e) {}
    }
    const res = await sendTelegramMessage(fallbackChatId, formattedText);
    if (res.success) {
      logger.info(`📬 [Telegram Bot] Delivered to default chat ID ${fallbackChatId}`);
      return { success: true, chatId: fallbackChatId, messageId: res.messageId };
    }
  }

  // Optional SMS/Telegram Gateway verification fallback
  const gatewayToken = process.env.TELEGRAM_GATEWAY_TOKEN || ENV.TELEGRAM_GATEWAY_TOKEN;
  if (gatewayToken && clean) {
    try {
      const e164 = `+91${clean}`;
      const gwRes = await axios.post(
        'https://gatewayapi.telegram.org/sendVerificationMessage',
        {
          phone_number: e164,
          code_length: 6,
          ttl: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${gatewayToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        }
      );
      if (gwRes.data?.ok) {
        logger.info(`[Telegram Gateway] Verification dispatch sent to ${e164}`);
        return { success: true, reason: 'TELEGRAM_GATEWAY_DELIVERED' };
      }
    } catch (gwErr: any) {
      logger.warn(`Telegram Gateway dispatch error:`, gwErr.response?.data || gwErr.message);
    }
  }

  // Provide bot deeplink if farmer has not yet linked
  const deepLink = clean
    ? `https://t.me/${botUsername}?start=${clean}`
    : `https://t.me/${botUsername}`;

  logger.info(
    `[Telegram] Farmer (+91${clean || 'unknown'}) not linked yet. Deep link: ${deepLink}`
  );

  return {
    success: false,
    reason: 'NOT_YET_LINKED',
    deepLink,
  };
}

/**
 * Background polling listener for @Kisan_kendra_bot
 * Automatically handles /start <phone>, /start, and contact sharing
 */
export function startTelegramBotListener() {
  const token = process.env.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || ENV.TELEGRAM_BOT_USERNAME || 'Kisan_kendra_bot';

  if (!token) {
    logger.warn('Telegram Bot Token not set. Telegram bot listener will not start.');
    return;
  }

  logger.success(`🤖 Starting Telegram Bot Listener for @${botUsername}...`);

  let lastUpdateId = 0;
  let isRunning = true;

  const poll = async () => {
    while (isRunning) {
      try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
          params: {
            offset: lastUpdateId + 1,
            timeout: 20,
            allowed_updates: ['message'],
          },
          timeout: 30000,
        });

        const updates = response.data?.result || [];
        for (const update of updates) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          const msg = update.message;
          if (!msg) continue;

          const chatId = msg.chat?.id;
          const fromUser = msg.from || {};
          const text = (msg.text || '').trim();

          // Look up if this chat ID is already associated with a registered farmer profile
          let linkedUser: { fullName: string; mobile: string } | null = null;
          try {
            const existingLinks = await (prisma as any).$queryRawUnsafe(
              `SELECT * FROM "FarmerTelegramLink" WHERE "chatId" = ? AND "isActive" = 1 LIMIT 1`,
              chatId.toString()
            );
            if (Array.isArray(existingLinks) && existingLinks.length > 0) {
              const el = existingLinks[0];
              const dbUser = await (prisma as any).user.findFirst({
                where: {
                  OR: [
                    ...(el.userId ? [{ id: el.userId }] : []),
                    { mobile: el.mobile },
                    { mobile: `+91${el.mobile}` },
                  ],
                },
                select: { fullName: true, mobile: true },
              });
              if (dbUser) {
                linkedUser = dbUser;
              } else if (el.firstName) {
                linkedUser = { fullName: el.firstName, mobile: el.mobile };
              }
            }
          } catch (e) {}

          // Farmer shared contact card
          if (msg.contact && msg.contact.phone_number) {
            const rawPhone = msg.contact.phone_number;
            const cleanPhone = cleanMobileNumber(rawPhone);
            const saved = await saveTelegramLink({
              mobile: cleanPhone,
              chatId,
              username: fromUser.username,
              firstName: fromUser.first_name || msg.contact.first_name,
            });

            const farmerDisplayName = saved?.firstName || fromUser.first_name || 'Kisan Bhai';

            await sendTelegramMessage(
              chatId,
              `🌾 *Namaste ${farmerDisplayName}!* 🌾\n\n✅ *Aapka mobile number +91 ${cleanPhone} Kisan Vyom Bot se safaltapoorvak link ho gaya hai!*\n\nAb aapko APMC Mandi ke sabhi updates:\n• 🎫 Gate Pass & Queue Tokens\n• 🔔 Turn Approaching Callouts\n• ⚖️ Weighbridge & Bay Instructions\n• 💰 Direct Benefit Transfer (DBT) Payment Alerts\n\nDirect isi Telegram chat par praapt honge.\n\n🏛️ _Kisan Vyom - Digital APMC Mandi Assistance_`,
              {
                replyMarkup: { remove_keyboard: true },
              }
            );
            continue;
          }

          // Deep link start command with attached phone
          const startWithPhoneMatch = text.match(/^\/start\s+(\+?91)?([6-9]\d{9})/i);
          if (startWithPhoneMatch) {
            const phone = startWithPhoneMatch[2];
            const saved = await saveTelegramLink({
              mobile: phone,
              chatId,
              username: fromUser.username,
              firstName: fromUser.first_name,
            });

            const farmerDisplayName = saved?.firstName || fromUser.first_name || 'Kisan Bhai';

            await sendTelegramMessage(
              chatId,
              `🌾 *Namaste ${farmerDisplayName}!* 🌾\n\n✅ *Mobile Number +91 ${phone} Safalta se jud gaya hai!*\n\nAapko Mandi tokens, bay calls, weighing status, aur DBT payment updates turant yahan milenge.\n\n🏛️ _Kisan Vyom Digital Mandi Portal_`,
              {
                replyMarkup: { remove_keyboard: true },
              }
            );
            continue;
          }

          // Direct 10-digit mobile message
          const rawPhoneMatch = text.match(/\b([6-9]\d{9})\b/);
          if (rawPhoneMatch) {
            const phone = rawPhoneMatch[1];
            const saved = await saveTelegramLink({
              mobile: phone,
              chatId,
              username: fromUser.username,
              firstName: fromUser.first_name,
            });

            const farmerDisplayName = saved?.firstName || fromUser.first_name || 'Kisan Bhai';

            await sendTelegramMessage(
              chatId,
              `✅ *Mobile Number +91 ${phone} Safalta se jud gaya hai, ${farmerDisplayName}!* 🌾\n\nKisan Vyom portal ke sabhi Mandi notifications ab aapko is chat par milenge.\n\n🏛️ _Kisan Vyom Support_`,
              {
                replyMarkup: { remove_keyboard: true },
              }
            );
            continue;
          }

          // Default welcome prompt
          if (text === '/start' || text.startsWith('/start')) {
            if (linkedUser) {
              await sendTelegramMessage(
                chatId,
                `🌾 *Namaste ${linkedUser.fullName}!* 🌾\n\n✅ *Aapka Kisan Vyom Account Pehle Se Linked Hai.*\n📱 *Registered Mobile:* +91 ${cleanMobileNumber(linkedUser.mobile)}\n\nAapko Mandi queue tokens, bay calls, weighment slips, aur DBT payments ke live alerts automatically yahan milte rahenge.\n\n🏛️ _Kisan Vyom — Digital Mandi Assistance_`
              );
              continue;
            }

            await sendTelegramMessage(
              chatId,
              `🌾 *Namaste, Kisan Vyom mein aapka swaagat hai!* 🌾\n\nApna Mandi account connect karne ke liye:\n1️⃣ Niche दिए gaye button par click karke apna *Mobile Number Share* karein, ya\n2️⃣ Apna 10-digit registered mobile number yahan type karke send karein.\n\n_Ek baar judte hi aapko Gate Token, Bay Calling, aur DBT Payment ke live notifications milenge._`,
              {
                replyMarkup: {
                  keyboard: [
                    [
                      {
                        text: '📱 Share Registered Mobile Number',
                        request_contact: true,
                      },
                    ],
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true,
                },
              }
            );
            continue;
          }

          // Help and fallback query
          if (text === '/help' || text.startsWith('/help')) {
            const greeting = linkedUser?.fullName ? `Namaste ${linkedUser.fullName}!` : 'Kisan Vyom Bot Help';
            const accountInfo = linkedUser
              ? `👤 *Farmer Profile:* *${linkedUser.fullName}*\n📱 *Mobile:* +91 ${cleanMobileNumber(linkedUser.mobile)}\n✅ Status: Linked & Active\n━━━━━━━━━━━━━━━━━━━━\n`
              : '• Apna 10-digit phone number bhejein apna account link karne ke liye.\n';

            await sendTelegramMessage(
              chatId,
              `🌾 *${greeting}*\n━━━━━━━━━━━━━━━━━━━━\n${accountInfo}• Sabhi Mandi alerts (Tokens, Bay Calling, Tulai Parchi) yahan milenge.\n• Portal Web: http://localhost:5173\n━━━━━━━━━━━━━━━━━━━━\n🏛️ _Digital APMC Mandi Support_`
            );
          }
        }
      } catch (err: any) {
        // Wait 4 seconds on error before polling again to avoid aggressive spin
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
  };

  poll().catch((err) => {
    logger.error('Telegram bot listener crashed:', err);
  });

  return () => {
    isRunning = false;
  };
}
