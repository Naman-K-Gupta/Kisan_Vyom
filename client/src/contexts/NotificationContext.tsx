import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationDTO } from '@smart-farmer/shared';
import { api } from '../api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

import {
  triggerFarmerAppNotification,
  requestNotificationPermissionForFarmer,
} from '../services/nativeNotification';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: string;
}

interface NotificationContextType {
  notifications: NotificationDTO[];
  unreadCount: number;
  toasts: ToastItem[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: string) => void;
  sendFarmerTestAlert: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAll();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Prompt for Android notification permission only for farmers
    if (user?.role === 'FARMER') {
      requestNotificationPermissionForFarmer(user.role);
    }
  }, [user]);

  // Listen for real-time notification socket event
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: NotificationDTO) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      showToast(notification.title, notification.message, notification.type);

      // APP NOTIFICATION ONLY FOR FARMERS (Not for center manager or admin)
      if (user?.role === 'FARMER') {
        triggerFarmerAppNotification(user.role, notification.title, notification.message, {
          notificationId: notification.id,
          type: notification.type,
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, user?.role]);

  const sendFarmerTestAlert = async (): Promise<boolean> => {
    if (user?.role !== 'FARMER') {
      showToast('Action Blocked', 'Device app notifications are configured exclusively for Farmers.', 'warning');
      return false;
    }
    const farmerName = user.fullName || 'Kisan';
    const testSms = `[VK-GOVMSP] Dear ${farmerName}, your mobile is active for real-time Mandi queue tokens, weighment receipts, and DBT payment SMS alerts. - APMC Mandi`;
    const success = await triggerFarmerAppNotification(
      user.role,
      'SMS: Service Active',
      testSms
    );
    if (success) {
      showToast('SMS Alert Received', testSms, 'success');
    }
    return success;
  };

  const showToast = (title: string, message: string, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        dismissToast,
        showToast,
        sendFarmerTestAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
