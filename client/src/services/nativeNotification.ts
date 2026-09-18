import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Distinct channel ID for Farmer Alerts on Android 8.0+
export const FARMER_NOTIFICATION_CHANNEL_ID = 'farmer_alerts';

let isChannelCreated = false;

/**
 * Ensures the dedicated Android notification channel is registered
 */
export async function setupFarmerNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isChannelCreated) return;

  try {
    await LocalNotifications.createChannel({
      id: FARMER_NOTIFICATION_CHANNEL_ID,
      name: 'Kisan Sahayak Alerts',
      description: 'Real-time APMC Mandi queue tokens, bay calls, quality assays, and MSP advisories',
      importance: 5, // High priority (heads-up banner + sound)
      visibility: 1, // Public on lockscreen
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#16a34a',
    });
    isChannelCreated = true;
    console.log('Android Farmer Notification Channel initialized');
  } catch (err) {
    console.warn('Could not create Android notification channel:', err);
  }
}

/**
 * Request notification permissions from the Android OS (especially Android 13+ POST_NOTIFICATIONS)
 */
export async function requestNotificationPermissionForFarmer(userRole?: string): Promise<boolean> {
  // Center Managers and Admins never request or receive mobile device notifications
  if (userRole !== 'FARMER') {
    return false;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
  } catch (err) {
    console.warn('Error requesting farmer notification permission:', err);
  }
  return false;
}

/**
 * Main Gatekeeper function: Sends a device notification ONLY if the user is a FARMER.
 * Managers and Admins are strictly rejected.
 */
export async function triggerFarmerAppNotification(
  userRole: string | undefined,
  title: string,
  body: string,
  extraData?: Record<string, any>
): Promise<boolean> {
  // Device notifications are intended specifically for farmer accounts
  if (userRole !== 'FARMER') {
    console.log(`[NotificationGatekeeper] Skipped app notification for role "${userRole}". Only Farmers receive device alerts.`);
    return false;
  }

  try {
    await setupFarmerNotificationChannel();

    if (Capacitor.isNativePlatform()) {
      // Check permission before scheduling
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const requested = await LocalNotifications.requestPermissions();
        if (requested.display !== 'granted') {
          console.warn('[Notification] Permission not granted by farmer.');
          return false;
        }
      }

      const notifId = Math.floor(Math.random() * 2147483647);
      const displayTitle = title?.startsWith('[') ? title : (title?.startsWith('SMS') ? `[VK-GOVMSP] ${title}` : `[VK-GOVMSP] ${title || 'SMS Alert'}`);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: displayTitle,
            body: body || 'You have an update regarding your APMC token or crop.',
            channelId: FARMER_NOTIFICATION_CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 100) }, // fire immediately
            extra: extraData || null,
          },
        ],
      });
      console.log(`[Notification] Android Notification dispatched to Farmer (ID: ${notifId})`);
      return true;
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      // Browser / PWA fallback for farmers
      const displayTitle = title?.startsWith('[') ? title : (title?.startsWith('SMS') ? `[VK-GOVMSP] ${title}` : `[VK-GOVMSP] ${title || 'SMS Alert'}`);
      new Notification(displayTitle, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: extraData,
      });
      return true;
    }
  } catch (err) {
    console.warn('Failed to trigger farmer app notification:', err);
  }

  return false;
}
