import { Platform } from 'react-native';
import { apiRequestOptional } from './client';
import type { BackendNotification } from './types';

export async function registerPushToken(pushToken: string): Promise<void> {
  await apiRequestOptional('/notifications/register-device', {
    method: 'POST',
    body: JSON.stringify({
      pushToken,
      platform: Platform.OS,
    }),
  });
}

export async function fetchBackendNotifications(): Promise<{
  notifications: BackendNotification[];
  unreadCount: number;
} | null> {
  return apiRequestOptional('/notifications');
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiRequestOptional(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}
