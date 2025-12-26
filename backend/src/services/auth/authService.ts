import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { config } from '../../config/environment';
import { logger } from '../../config/logger';
import { SignatureVerifier } from '../blockchain/signatureVerifier';
import { userService } from '../user/userService';
import { AuthenticationError } from '../../utils/errors';

export interface Session {
  id: string;
  userId: string;
  walletAddress: string;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  async verifyWalletSignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    return SignatureVerifier.verifySignature(walletAddress, message, signature);
  }

  async createSession(userId: string, walletAddress: string, deviceId?: string): Promise<Session> {
    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        walletAddress,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );

    // Hash token for storage
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days default

    // Store session in database
    const query = `
      INSERT INTO sessions (user_id, wallet_address, device_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      walletAddress,
      deviceId || null,
      tokenHash,
      expiresAt,
    ]);

    // Log security event
    await this.logSecurityEvent(userId, 'login', null, null);

    return {
      id: result.rows[0].id,
      userId,
      walletAddress,
      token,
      expiresAt,
    };
  }

  async invalidateSession(userId: string, tokenHash?: string): Promise<void> {
    if (tokenHash) {
      const query = 'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2';
      await pool.query(query, [userId, tokenHash]);
    } else {
      // Invalidate all sessions for user
      const query = 'DELETE FROM sessions WHERE user_id = $1';
      await pool.query(query, [userId]);
    }

    await this.logSecurityEvent(userId, 'logout', null, null);
  }

  async authenticateUser(
    walletAddress: string,
    message: string,
    signature: string,
    deviceId?: string
  ): Promise<Session> {
    // Verify signature
    const isValid = await this.verifyWalletSignature(walletAddress, message, signature);
    if (!isValid) {
      throw new AuthenticationError('Invalid wallet signature');
    }

    // Get or create user
    let user = await userService.getUserByWalletAddress(walletAddress);
    if (!user) {
      // Create new user
      user = await userService.createUser({
        walletAddress,
      });
    }

    // Update last active
    await userService.updateLastActive(walletAddress);

    // Create session
    return await this.createSession(user.id, walletAddress, deviceId);
  }

  private async logSecurityEvent(
    userId: string,
    eventType: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<void> {
    const query = `
      INSERT INTO security_events (user_id, event_type, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [userId, eventType, ipAddress, userAgent]);
  }
}

export const authService = new AuthService();

