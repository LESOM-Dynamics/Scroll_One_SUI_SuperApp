import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  type: string;
  enabled: boolean;
  channels: string[];
}

export class NotificationService {
  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    // Check if user has notifications enabled for this type
    const preferences = await this.getNotificationPreferences(userId, type);
    if (!preferences.enabled) {
      logger.debug(`Notifications disabled for user ${userId}, type ${type}`);
      // Still create the notification but don't send push
    }

    const query = `
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      type,
      title,
      body,
      JSON.stringify(data || {}),
    ]);

    // Send push notification if enabled
    if (preferences.enabled && preferences.channels.includes('push')) {
      // This would integrate with FCM/Expo push service
      // await pushService.send(userId, title, body, data);
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  async getUserNotifications(
    userId: string,
    filters: {
      read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.read !== undefined) {
      conditions.push(`read = $${paramIndex++}`);
      params.push(filters.read);
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(filters.type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get unread count
    const countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`;
    const countResult = await pool.query(countQuery, [userId]);
    const unreadCount = parseInt(countResult.rows[0].count, 10);

    // Get notifications
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT *
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    const notifications = result.rows.map(this.mapRowToNotification);

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE id = $1 AND user_id = $2
    `;

    await pool.query(query, [notificationId, userId]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read = true
      WHERE user_id = $1 AND read = false
    `;

    await pool.query(query, [userId]);
  }

  async getNotificationPreferences(
    userId: string,
    type: string
  ): Promise<NotificationPreferences> {
    const query = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1 AND type = $2
    `;

    const result = await pool.query(query, [userId, type]);

    if (result.rows.length === 0) {
      // Default preferences
      return {
        userId,
        type,
        enabled: true,
        channels: ['push', 'in-app'],
      };
    }

    return this.mapRowToPreferences(result.rows[0]);
  }

  async updateNotificationPreferences(
    userId: string,
    type: string,
    enabled: boolean,
    channels: string[]
  ): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO notification_preferences (user_id, type, enabled, channels)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, type) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        channels = EXCLUDED.channels
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      type,
      enabled,
      JSON.stringify(channels),
    ]);

    return this.mapRowToPreferences(result.rows[0]);
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      body: row.body,
      data: row.data || {},
      read: row.read,
      createdAt: row.created_at,
    };
  }

  private mapRowToPreferences(row: any): NotificationPreferences {
    return {
      userId: row.user_id,
      type: row.type,
      enabled: row.enabled,
      channels: row.channels || ['push', 'in-app'],
    };
  }
}

export const notificationService = new NotificationService();

