import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminService } from '../services/admin/adminService';
import { createResponse, createErrorResponse } from '../utils/responses';
import { logger } from '../config/logger';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(createResponse(stats));
    } catch (error: any) {
      logger.error('Get dashboard stats error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Get users list
   */
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        role: req.query.role as string | undefined,
        status: req.query.status as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
      };

      const result = await adminService.getUsers(filters);
      res.json(createResponse(result));
    } catch (error: any) {
      logger.error('Get users error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Update user
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, status } = req.body;

      if (!role && !status) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'role or status required'));
        return;
      }

      const updates: any = {};
      if (role) updates.role = role;
      if (status) updates.status = status;

      const user = await adminService.updateUser(userId, updates);

      // Log admin action
      await adminService.logAdminAction(
        req.user!.id,
        'user_update',
        'user',
        userId,
        { updates },
        req.ip,
        req.get('user-agent')
      );

      res.json(createResponse(user));
    } catch (error: any) {
      logger.error('Update user error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        minValue: req.query.minValue as string | undefined,
        maxValue: req.query.maxValue as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await adminService.getTransactions(filters);
      res.json(createResponse(result));
    } catch (error: any) {
      logger.error('Get transactions error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Update mini-app
   */
  async updateMiniApp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appId } = req.params;
      const { verified, featured } = req.body;

      if (verified === undefined && featured === undefined) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'verified or featured required'));
        return;
      }

      const updates: any = {};
      if (verified !== undefined) updates.verified = verified;
      if (featured !== undefined) updates.featured = featured;

      const app = await adminService.updateMiniApp(appId, updates);

      // Log admin action
      await adminService.logAdminAction(
        req.user!.id,
        'miniapp_update',
        'miniapp',
        appId,
        { updates },
        req.ip,
        req.get('user-agent')
      );

      res.json(createResponse(app));
    } catch (error: any) {
      logger.error('Update mini-app error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Get admin actions log
   */
  async getAdminActions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        adminId: req.query.adminId as string | undefined,
        actionType: req.query.actionType as string | undefined,
        resourceType: req.query.resourceType as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await adminService.getAdminActions(filters);
      res.json(createResponse(result));
    } catch (error: any) {
      logger.error('Get admin actions error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        eventType: req.query.eventType as string | undefined,
        userId: req.query.userId as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await adminService.getSecurityEvents(filters);
      res.json(createResponse(result));
    } catch (error: any) {
      logger.error('Get security events error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req: AuthRequest, res: Response): Promise<void> {
    try {
      const health = await adminService.getSystemHealth();
      res.json(createResponse(health));
    } catch (error: any) {
      logger.error('Get system health error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }
}

export const adminController = new AdminController();

