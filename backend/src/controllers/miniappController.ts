import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { miniappService } from '../services/miniapp/miniappService';
import { createResponse, createErrorResponse } from '../utils/responses';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger';

export class MiniAppController {
  async getMiniApps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await miniappService.getMiniApps(filters);
      res.json(createResponse(result));
    } catch (error: any) {
      logger.error('Get mini apps error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async getMiniApp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appId } = req.params;

      const app = await miniappService.getMiniAppById(appId);
      if (!app) {
        throw new NotFoundError('Mini app');
      }

      res.json(createResponse(app));
    } catch (error: any) {
      logger.error('Get mini app error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await miniappService.getCategories();
      res.json(createResponse(categories));
    } catch (error: any) {
      logger.error('Get categories error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async trackUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appId } = req.params;
      const { sessionStart, sessionEnd, actions } = req.body;

      if (!req.user) {
        res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
        return;
      }

      await miniappService.trackAppUsage(
        appId,
        req.user.id,
        new Date(sessionStart),
        sessionEnd ? new Date(sessionEnd) : undefined,
        actions || 0
      );

      res.json(createResponse({ success: true }));
    } catch (error: any) {
      logger.error('Track app usage error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }
}

export const miniappController = new MiniAppController();

