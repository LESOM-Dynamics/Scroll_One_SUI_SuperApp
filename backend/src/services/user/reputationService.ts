import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export interface ReputationEvent {
  id: string;
  userId: string;
  eventType: string;
  points: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class ReputationService {
  async addReputationEvent(
    userId: string,
    eventType: string,
    points: number,
    metadata?: Record<string, any>
  ): Promise<ReputationEvent> {
    const query = `
      INSERT INTO reputation_events (user_id, event_type, points, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      eventType,
      points,
      JSON.stringify(metadata || {}),
    ]);

    // Update user reputation
    await this.updateUserReputation(userId);

    logger.info(`Reputation event added: ${eventType} (+${points} points) for user ${userId}`);
    return this.mapRowToReputationEvent(result.rows[0]);
  }

  async getTotalReputation(userId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(points), 0) as total
      FROM reputation_events
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total, 10);
  }

  async getReputationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ReputationEvent[]> {
    const query = `
      SELECT *
      FROM reputation_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(this.mapRowToReputationEvent);
  }

  async calculateLevel(reputation: number): number {
    // Level calculation: sqrt(reputation / 100)
    return Math.floor(Math.sqrt(reputation / 100)) + 1;
  }

  private async updateUserReputation(userId: string): Promise<void> {
    const totalReputation = await this.getTotalReputation(userId);
    const level = this.calculateLevel(totalReputation);

    const query = `
      UPDATE users
      SET reputation = $1, level = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await pool.query(query, [totalReputation, level, userId]);
  }

  private mapRowToReputationEvent(row: any): ReputationEvent {
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type,
      points: row.points,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }

  // Reputation point values
  static readonly POINTS = {
    TRANSACTION: 10,
    FIRST_TRANSACTION: 50,
    APP_USAGE: 5,
    BADGE_EARNED: 25,
    REFERRAL: 100,
    DAILY_ACTIVE: 5,
  };
}

export const reputationService = new ReputationService();

