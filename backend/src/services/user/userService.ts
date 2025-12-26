import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { NotFoundError, ConflictError } from '../../utils/errors';

export interface User {
  id: string;
  walletAddress: string;
  scrollId?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  level: number;
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export class UserService {
  async createUser(data: {
    walletAddress: string;
    scrollId?: string;
    username?: string;
    displayName?: string;
  }): Promise<User> {
    // Check if user already exists
    const existing = await this.getUserByWalletAddress(data.walletAddress);
    if (existing) {
      throw new ConflictError('User with this wallet address already exists');
    }

    // Check username uniqueness if provided
    if (data.username) {
      const usernameExists = await this.getUserByUsername(data.username);
      if (usernameExists) {
        throw new ConflictError('Username already taken');
      }
    }

    const query = `
      INSERT INTO users (wallet_address, scroll_id, username, display_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      data.walletAddress,
      data.scrollId,
      data.username,
      data.displayName,
    ]);
    
    logger.info(`User created: ${data.walletAddress}`);
    return this.mapRowToUser(result.rows[0]);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE wallet_address = $1';
    const result = await pool.query(query, [walletAddress]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  async updateUser(walletAddress: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }
    if (updates.avatar !== undefined) {
      fields.push(`avatar = $${paramIndex++}`);
      values.push(updates.avatar);
    }
    if (updates.preferences !== undefined) {
      fields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(updates.preferences));
    }

    if (fields.length === 0) {
      const user = await this.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new NotFoundError('User');
      }
      return user;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(walletAddress);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE wallet_address = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async updateLastActive(walletAddress: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_active_at = CURRENT_TIMESTAMP
      WHERE wallet_address = $1
    `;

    await pool.query(query, [walletAddress]);
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      scrollId: row.scroll_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      bio: row.bio,
      reputation: row.reputation,
      level: row.level,
      preferences: row.preferences || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActiveAt: row.last_active_at,
    };
  }
}

export const userService = new UserService();

