'use client';

import { useState, useCallback, useEffect } from 'react';
import { Notification } from '@/types';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Hook for managing drinking window notifications in React components
 */
export function useDrinkingWindowNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getUserNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  return {
    notifications,
    loading,
    refetch: fetchNotifications,
    markAsRead
  };
}