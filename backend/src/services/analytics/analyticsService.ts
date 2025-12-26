import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: string;
  eventData: Record<string, any>;
  sessionId?: string;
  deviceInfo: Record<string, any>;
  appVersion?: string;
  timestamp: Date;
}

export class AnalyticsService {
  async trackEvent(
    eventType: string,
    eventData: Record<string, any>,
    userId?: string,
    sessionId?: string,
    deviceInfo?: Record<string, any>,
    appVersion?: string
  ): Promise<void> {
    const query = `
      INSERT INTO analytics_events (user_id, event_type, event_data, session_id, device_info, app_version)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      userId || null,
      eventType,
      JSON.stringify(eventData),
      sessionId || null,
      JSON.stringify(deviceInfo || {}),
      appVersion || null,
    ]);

    logger.debug(`Analytics event tracked: ${eventType}`, { userId, sessionId });
  }

  async getUserAnalytics(
    userId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    sessions: number;
    lastActive: Date | null;
  }> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (fromDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(toDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total events
    const totalQuery = `SELECT COUNT(*) FROM analytics_events ${whereClause}`;
    const totalResult = await pool.query(totalQuery, params);
    const totalEvents = parseInt(totalResult.rows[0].count, 10);

    // Get events by type
    const typeQuery = `
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      ${whereClause}
      GROUP BY event_type
    `;
    const typeResult = await pool.query(typeQuery, params);
    const eventsByType: Record<string, number> = {};
    typeResult.rows.forEach((row) => {
      eventsByType[row.event_type] = parseInt(row.count, 10);
    });

    // Get unique sessions
    const sessionQuery = `
      SELECT COUNT(DISTINCT session_id) as sessions
      FROM analytics_events
      ${whereClause}
    `;
    const sessionResult = await pool.query(sessionQuery, params);
    const sessions = parseInt(sessionResult.rows[0].sessions || '0', 10);

    // Get last active
    const lastActiveQuery = `
      SELECT MAX(timestamp) as last_active
      FROM analytics_events
      ${whereClause}
    `;
    const lastActiveResult = await pool.query(lastActiveQuery, params);
    const lastActive = lastActiveResult.rows[0].last_active || null;

    return {
      totalEvents,
      eventsByType,
      sessions,
      lastActive,
    };
  }
}

export const analyticsService = new AnalyticsService();

