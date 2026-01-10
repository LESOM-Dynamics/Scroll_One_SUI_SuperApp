import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthorizationError } from '../utils/errors';
import { pool } from '../config/database';
import { logger } from '../config/logger';

/**
 * Middleware to check if user is a Super Admin
 * Must be used after authenticateToken middleware
 */
export async function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Check user role in database
    const userQuery = `
      SELECT role, status 
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      throw new AuthorizationError('User not found');
    }

    const user = userResult.rows[0];

    // Check if user is banned or suspended
    if (user.status !== 'active') {
      throw new AuthorizationError(`Account is ${user.status}`);
    }

    // Check if user is Super Admin
    if (user.role !== 'super_admin') {
      logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
      throw new AuthorizationError('Super Admin access required');
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      next(error);
    } else {
      logger.error('Admin auth error', error);
      next(new AuthorizationError('Admin authentication failed'));
    }
  }
}

/**
 * Optional admin check - doesn't throw error if not admin
 */
export async function optionalAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user) {
      const userQuery = `
        SELECT role, status 
        FROM users 
        WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [req.user.id]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        if (user.role === 'super_admin' || user.role === 'admin') {
          (req as any).isAdmin = true;
          (req as any).isSuperAdmin = user.role === 'super_admin';
        }
      }
    }
    next();
  } catch (error) {
    // Continue without admin privileges
    next();
  }
}

