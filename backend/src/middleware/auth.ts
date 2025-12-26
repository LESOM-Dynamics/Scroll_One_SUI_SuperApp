import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { AuthenticationError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    username?: string;
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Authentication token required');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      walletAddress: string;
    };

    // Verify session exists and is valid
    const sessionQuery = `
      SELECT s.*, u.username
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    const sessionResult = await pool.query(sessionQuery, [decoded.userId]);

    if (sessionResult.rows.length === 0) {
      throw new AuthenticationError('Invalid or expired session');
    }

    req.user = {
      id: decoded.userId,
      walletAddress: decoded.walletAddress,
      username: sessionResult.rows[0].username,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      logger.error('Authentication error', error);
      next(new AuthenticationError('Invalid authentication token'));
    }
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        walletAddress: string;
      };

      const sessionQuery = `
        SELECT s.*, u.username
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1 AND s.expires_at > NOW()
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      const sessionResult = await pool.query(sessionQuery, [decoded.userId]);

      if (sessionResult.rows.length > 0) {
        req.user = {
          id: decoded.userId,
          walletAddress: decoded.walletAddress,
          username: sessionResult.rows[0].username,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

