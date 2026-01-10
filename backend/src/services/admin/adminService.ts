import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    suspended: number;
    banned: number;
  };
  transactions: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    failed: number;
    totalVolume: string;
  };
  miniapps: {
    total: number;
    verified: number;
    featured: number;
    pendingVerification: number;
    totalUsers: number;
  };
  tokens: {
    total: number;
    verified: number;
    withPrices: number;
  };
  analytics: {
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
    avgSessionDuration: number;
  };
  security: {
    securityEvents24h: number;
    failedLogins24h: number;
    suspiciousActivities: number;
  };
}

export interface UserListFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransactionFilters {
  status?: string;
  type?: string;
  fromDate?: Date;
  toDate?: Date;
  minValue?: string;
  maxValue?: string;
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Users stats
      const usersStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_today,
          COUNT(*) FILTER (WHERE created_at >= $2) as new_week,
          COUNT(*) FILTER (WHERE created_at >= $3) as new_month,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
          COUNT(*) FILTER (WHERE status = 'banned') as banned
        FROM users
      `, [today, weekAgo, monthAgo]);

      // Transactions stats
      const txStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE timestamp >= $1) as today,
          COUNT(*) FILTER (WHERE timestamp >= $2) as week,
          COUNT(*) FILTER (WHERE timestamp >= $3) as month,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COALESCE(SUM(value), 0) as total_volume
        FROM transactions
      `, [today, weekAgo, monthAgo]);

      // Mini-apps stats
      const appStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE verified = true) as verified,
          COUNT(*) FILTER (WHERE featured = true) as featured,
          COUNT(*) FILTER (WHERE verified = false) as pending_verification,
          COALESCE(SUM((stats->>'totalUsers')::int), 0) as total_users
        FROM miniapps
      `);

      // Tokens stats
      const tokenStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE verified = true) as verified,
          COUNT(*) FILTER (WHERE last_price_update IS NOT NULL) as with_prices
        FROM tokens
      `);

      // Analytics stats
      const analyticsStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= $1) as active_24h,
          COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= $2) as active_7d,
          COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= $3) as active_30d,
          COUNT(DISTINCT session_id) FILTER (WHERE timestamp >= $2) as total_sessions
        FROM analytics_events
      `, [dayAgo, weekAgo, monthAgo]);

      // Security stats
      const securityStats = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE created_at >= $1) as events_24h,
          COUNT(*) FILTER (WHERE event_type = 'login_failed' AND created_at >= $1) as failed_logins_24h,
          COUNT(*) FILTER (WHERE event_type IN ('suspicious_activity', 'fraud_detected') AND created_at >= $1) as suspicious
        FROM security_events
      `, [dayAgo]);

      const users = usersStats.rows[0];
      const transactions = txStats.rows[0];
      const miniapps = appStats.rows[0];
      const tokens = tokenStats.rows[0];
      const analytics = analyticsStats.rows[0];
      const security = securityStats.rows[0];

      return {
        users: {
          total: parseInt(users.total) || 0,
          active: parseInt(users.active) || 0,
          newToday: parseInt(users.new_today) || 0,
          newThisWeek: parseInt(users.new_week) || 0,
          newThisMonth: parseInt(users.new_month) || 0,
          suspended: parseInt(users.suspended) || 0,
          banned: parseInt(users.banned) || 0,
        },
        transactions: {
          total: parseInt(transactions.total) || 0,
          today: parseInt(transactions.today) || 0,
          thisWeek: parseInt(transactions.week) || 0,
          thisMonth: parseInt(transactions.month) || 0,
          pending: parseInt(transactions.pending) || 0,
          failed: parseInt(transactions.failed) || 0,
          totalVolume: transactions.total_volume || '0',
        },
        miniapps: {
          total: parseInt(miniapps.total) || 0,
          verified: parseInt(miniapps.verified) || 0,
          featured: parseInt(miniapps.featured) || 0,
          pendingVerification: parseInt(miniapps.pending_verification) || 0,
          totalUsers: parseInt(miniapps.total_users) || 0,
        },
        tokens: {
          total: parseInt(tokens.total) || 0,
          verified: parseInt(tokens.verified) || 0,
          withPrices: parseInt(tokens.with_prices) || 0,
        },
        analytics: {
          activeUsers24h: parseInt(analytics.active_24h) || 0,
          activeUsers7d: parseInt(analytics.active_7d) || 0,
          activeUsers30d: parseInt(analytics.active_30d) || 0,
          totalSessions: parseInt(analytics.total_sessions) || 0,
          avgSessionDuration: 0, // Calculate separately if needed
        },
        security: {
          securityEvents24h: parseInt(security.events_24h) || 0,
          failedLogins24h: parseInt(security.failed_logins_24h) || 0,
          suspiciousActivities: parseInt(security.suspicious) || 0,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard stats', error);
      throw error;
    }
  }

  /**
   * Get users list with filters
   */
  async getUsers(filters: UserListFilters = {}) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        wallet_address ILIKE $${paramIndex} OR 
        username ILIKE $${paramIndex} OR 
        display_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);
    const countParamIndex = paramIndex;
    const limitParamIndex = paramIndex + 1;
    const offsetParamIndex = paramIndex + 2;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const usersQuery = `
      SELECT 
        id, wallet_address, scroll_id, username, display_name, avatar,
        reputation, level, role, status, created_at, updated_at, last_active_at
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    
    const usersResult = await pool.query(usersQuery, params);
    
    return {
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all transactions with filters
   */
  async getTransactions(filters: TransactionFilters = {}) {
    const {
      status,
      type,
      fromDate,
      toDate,
      minValue,
      maxValue,
      page = 1,
      limit = 50,
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    if (minValue) {
      conditions.push(`value >= $${paramIndex}`);
      params.push(minValue);
      paramIndex++;
    }

    if (maxValue) {
      conditions.push(`value <= $${paramIndex}`);
      params.push(maxValue);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);
    const limitParamIndex = paramIndex + 1;
    const offsetParamIndex = paramIndex + 2;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM transactions ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    // Get transactions
    const txQuery = `
      SELECT 
        id, hash, from_address, to_address, value, gas_used, gas_price, fee,
        status, block_number, transaction_index, timestamp, network, type,
        token_transfers, metadata, created_at
      FROM transactions
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;
    
    const txResult = await pool.query(txQuery, params);
    
    return {
      transactions: txResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user role or status
   */
  async updateUser(userId: string, updates: { role?: string; status?: string }) {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.role) {
      fields.push(`role = $${paramIndex}`);
      params.push(updates.role);
      paramIndex++;
    }

    if (updates.status) {
      fields.push(`status = $${paramIndex}`);
      params.push(updates.status);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(userId);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    adminId: string,
    actionType: string,
    resourceType: string,
    resourceId: string | null,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    const query = `
      INSERT INTO admin_actions 
        (admin_id, action_type, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      adminId,
      actionType,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress || null,
      userAgent || null,
    ]);

    return result.rows[0];
  }

  /**
   * Get admin actions log
   */
  async getAdminActions(filters: {
    adminId?: string;
    actionType?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { adminId, actionType, resourceType, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (adminId) {
      conditions.push(`admin_id = $${paramIndex}`);
      params.push(adminId);
      paramIndex++;
    }

    if (actionType) {
      conditions.push(`action_type = $${paramIndex}`);
      params.push(actionType);
      paramIndex++;
    }

    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex}`);
      params.push(resourceType);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM admin_actions ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        aa.*,
        u.wallet_address as admin_wallet_address,
        u.username as admin_username
      FROM admin_actions aa
      LEFT JOIN users u ON aa.admin_id = u.id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, params);
    return {
      actions: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get security events
   */
  async getSecurityEvents(filters: {
    eventType?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { eventType, userId, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      params.push(eventType);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM security_events ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        se.*,
        u.wallet_address,
        u.username
      FROM security_events se
      LEFT JOIN users u ON se.user_id = u.id
      ${whereClause}
      ORDER BY se.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, params);
    return {
      events: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update mini-app (verify, feature, etc.)
   */
  async updateMiniApp(appId: string, updates: { verified?: boolean; featured?: boolean }) {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.verified !== undefined) {
      fields.push(`verified = $${paramIndex}`);
      params.push(updates.verified);
      paramIndex++;
    }

    if (updates.featured !== undefined) {
      fields.push(`featured = $${paramIndex}`);
      params.push(updates.featured);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(appId);

    const query = `
      UPDATE miniapps 
      SET ${fields.join(', ')}
      WHERE app_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    const query = `
      SELECT 
        metric_type,
        AVG(metric_value) as avg_value,
        MAX(metric_value) as max_value,
        MIN(metric_value) as min_value,
        MAX(timestamp) as last_updated
      FROM system_health
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
      GROUP BY metric_type
      ORDER BY metric_type
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

export const adminService = new AdminService();

