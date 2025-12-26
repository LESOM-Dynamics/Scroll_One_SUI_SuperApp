import { pool } from '../../config/database';
import { cacheService } from '../../config/redis';
import { logger } from '../../config/logger';
import { getPaginationParams } from '../../utils/helpers';

export interface MiniApp {
  id: string;
  appId: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  featured: boolean;
  verified: boolean;
  metadata: Record<string, any>;
  stats: {
    totalUsers: number;
    activeUsers: number;
    avgRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MiniAppService {
  async getMiniApps(filters: {
    category?: string;
    featured?: boolean;
    verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ apps: MiniApp[]; pagination: any }> {
    const { page, limit, offset } = getPaginationParams(filters);

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.featured !== undefined) {
      conditions.push(`featured = $${paramIndex++}`);
      params.push(filters.featured);
    }

    if (filters.verified !== undefined) {
      conditions.push(`verified = $${paramIndex++}`);
      params.push(filters.verified);
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM miniapps ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get apps
    const query = `
      SELECT *
      FROM miniapps
      ${whereClause}
      ORDER BY featured DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    const apps = result.rows.map(this.mapRowToMiniApp);

    return {
      apps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMiniAppById(appId: string): Promise<MiniApp | null> {
    const cacheKey = `miniapp:${appId}`;
    const cached = await cacheService.get<MiniApp>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const query = 'SELECT * FROM miniapps WHERE app_id = $1';
    const result = await pool.query(query, [appId]);

    if (result.rows.length === 0) {
      return null;
    }

    const app = this.mapRowToMiniApp(result.rows[0]);
    await cacheService.set(cacheKey, app, 3600); // Cache for 1 hour

    return app;
  }

  async getCategories(): Promise<string[]> {
    const cacheKey = 'miniapp:categories';
    const cached = await cacheService.get<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const query = 'SELECT DISTINCT category FROM miniapps ORDER BY category';
    const result = await pool.query(query);
    const categories = result.rows.map((row) => row.category);

    await cacheService.set(cacheKey, categories, 3600);
    return categories;
  }

  async trackAppUsage(
    appId: string,
    userId: string,
    sessionStart: Date,
    sessionEnd?: Date,
    actions: number = 0
  ): Promise<void> {
    const query = `
      INSERT INTO app_usage (app_id, user_id, session_start, session_end, actions)
      VALUES (
        (SELECT id FROM miniapps WHERE app_id = $1),
        $2,
        $3,
        $4,
        $5
      )
    `;

    await pool.query(query, [appId, userId, sessionStart, sessionEnd || null, actions]);

    // Update app stats
    await this.updateAppStats(appId);
  }

  private async updateAppStats(appId: string): Promise<void> {
    const query = `
      UPDATE miniapps
      SET stats = jsonb_set(
        jsonb_set(
          jsonb_set(
            stats,
            '{totalUsers}',
            to_jsonb((SELECT COUNT(DISTINCT user_id) FROM app_usage WHERE app_id = miniapps.id)::text)
          ),
          '{activeUsers}',
          to_jsonb((SELECT COUNT(DISTINCT user_id) FROM app_usage WHERE app_id = miniapps.id AND session_start > NOW() - INTERVAL '7 days')::text)
        ),
        '{avgRating}',
        COALESCE((SELECT AVG(rating) FROM app_ratings WHERE app_id = miniapps.id), 0)::text::jsonb
      )
      WHERE app_id = $1
    `;

    await pool.query(query, [appId]);
    await cacheService.delete(`miniapp:${appId}`);
  }

  private mapRowToMiniApp(row: any): MiniApp {
    return {
      id: row.id,
      appId: row.app_id,
      name: row.name,
      url: row.url,
      icon: row.icon,
      description: row.description,
      category: row.category,
      featured: row.featured,
      verified: row.verified,
      metadata: row.metadata || {},
      stats: row.stats || {
        totalUsers: 0,
        activeUsers: 0,
        avgRating: 0,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const miniappService = new MiniAppService();

