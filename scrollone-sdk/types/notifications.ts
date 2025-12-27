/**
 * Notification types for WebView Bridge
 */

export interface NotificationRequest {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
}

