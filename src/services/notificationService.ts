// ============================================================
// WasteWise — Notification API Service
// ============================================================
import { apiRequest } from './api';
import type { Notification } from '../types';

interface BackendNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function mapNotification(n: BackendNotification): Notification {
  return {
    id: String(n.id),
    type: n.type as any,
    title: n.title,
    message: n.message,
    isRead: n.is_read,
    timestamp: n.created_at,
  };
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await apiRequest<BackendNotification[]>('/api/notifications');
    return res.map(mapNotification);
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiRequest<BackendNotification>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
    return mapNotification(res);
  },

  async markAllAsRead(): Promise<void> {
    await apiRequest('/api/notifications/mark-all-read', { method: 'PUT' });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
  },
};
