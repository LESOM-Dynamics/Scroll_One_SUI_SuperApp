import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export interface Badge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  metadata: Record<string, any>;
}

export class BadgeService {
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const query = `
      SELECT 
        ub.id,
        ub.user_id,
        ub.badge_id,
        ub.earned_at,
        ub.metadata,
        b.badge_id as badge_badge_id,
        b.name,
        b.description,
        b.icon,
        b.rarity,
        b.created_at as badge_created_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(this.mapRowToUserBadge);
  }

  async awardBadge(userId: string, badgeId: string, metadata?: Record<string, any>): Promise<UserBadge> {
    // First, get or create the badge definition
    let badge = await this.getBadgeByBadgeId(badgeId);
    
    if (!badge) {
      // Create badge definition if it doesn't exist
      badge = await this.createBadgeDefinition({
        badgeId,
        name: this.getBadgeName(badgeId),
        description: this.getBadgeDescription(badgeId),
        icon: this.getBadgeIcon(badgeId),
        rarity: this.getBadgeRarity(badgeId),
      });
    }

    // Check if user already has this badge
    const existingQuery = `
      SELECT * FROM user_badges
      WHERE user_id = $1 AND badge_id = $2
    `;
    const existing = await pool.query(existingQuery, [userId, badge.id]);

    if (existing.rows.length > 0) {
      return this.mapRowToUserBadge({
        ...existing.rows[0],
        badge_badge_id: badge.badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        badge_created_at: badge.createdAt,
      });
    }

    // Award the badge
    const insertQuery = `
      INSERT INTO user_badges (user_id, badge_id, metadata)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      userId,
      badge.id,
      JSON.stringify(metadata || {}),
    ]);

    logger.info(`Badge ${badgeId} awarded to user ${userId}`);

    return this.mapRowToUserBadge({
      ...result.rows[0],
      badge_badge_id: badge.badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
      badge_created_at: badge.createdAt,
    });
  }

  private async getBadgeByBadgeId(badgeId: string): Promise<Badge | null> {
    const query = 'SELECT * FROM badges WHERE badge_id = $1';
    const result = await pool.query(query, [badgeId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBadge(result.rows[0]);
  }

  private async createBadgeDefinition(data: {
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
  }): Promise<Badge> {
    const query = `
      INSERT INTO badges (badge_id, name, description, icon, rarity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      data.badgeId,
      data.name,
      data.description,
      data.icon,
      data.rarity,
    ]);

    return this.mapRowToBadge(result.rows[0]);
  }

  private getBadgeName(badgeId: string): string {
    const names: Record<string, string> = {
      first_transaction: 'First Transaction',
      power_user: 'Power User',
      early_adopter: 'Early Adopter',
      defi_master: 'DeFi Master',
      nft_collector: 'NFT Collector',
      high_roller: 'High Roller',
      social_butterfly: 'Social Butterfly',
    };
    return names[badgeId] || badgeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getBadgeDescription(badgeId: string): string {
    const descriptions: Record<string, string> = {
      first_transaction: 'Completed your first transaction on Scroll',
      power_user: 'Active user with 100+ transactions',
      early_adopter: 'Joined during the first month',
      defi_master: 'Completed 50+ DeFi transactions',
      nft_collector: 'Own 10+ NFTs',
      high_roller: 'Transacted over 10 ETH',
      social_butterfly: 'Connected with 10+ mini-apps',
    };
    return descriptions[badgeId] || `Earned the ${badgeId} badge`;
  }

  private getBadgeIcon(badgeId: string): string {
    const icons: Record<string, string> = {
      first_transaction: '🎉',
      power_user: '⚡',
      early_adopter: '🌟',
      defi_master: '💎',
      nft_collector: '🖼️',
      high_roller: '💰',
      social_butterfly: '🦋',
    };
    return icons[badgeId] || '🏆';
  }

  private getBadgeRarity(badgeId: string): 'common' | 'rare' | 'epic' | 'legendary' {
    const rarities: Record<string, 'common' | 'rare' | 'epic' | 'legendary'> = {
      first_transaction: 'common',
      power_user: 'rare',
      early_adopter: 'epic',
      defi_master: 'rare',
      nft_collector: 'epic',
      high_roller: 'legendary',
      social_butterfly: 'rare',
    };
    return rarities[badgeId] || 'common';
  }

  private mapRowToBadge(row: any): Badge {
    return {
      id: row.id,
      badgeId: row.badge_id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      rarity: row.rarity,
      createdAt: row.created_at,
    };
  }

  private mapRowToUserBadge(row: any): UserBadge {
    return {
      id: row.id,
      userId: row.user_id,
      badgeId: row.badge_id,
      badge: {
        id: row.badge_id,
        badgeId: row.badge_badge_id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        rarity: row.rarity,
        createdAt: row.badge_created_at,
      },
      earnedAt: row.earned_at,
      metadata: row.metadata || {},
    };
  }
}

export const badgeService = new BadgeService();

