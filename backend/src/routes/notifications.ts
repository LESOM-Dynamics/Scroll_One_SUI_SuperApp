import { Router } from 'express';
import { notificationService } from '../services/notification/notificationService';
import { authenticateToken } from '../middleware/auth';
import { createResponse, createErrorResponse } from '../utils/responses';
import { logger } from '../config/logger';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const { notifications, unreadCount } = await notificationService.getUserNotifications(
      req.user.id,
      {
        read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
        type: req.query.type as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      }
    );

    res.json(createResponse({ notifications, unreadCount }));
  } catch (error: any) {
    logger.error('Get notifications error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }

    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json(createResponse({ success: true }));
  } catch (error: any) {
    logger.error('Mark notification as read error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.post('/register-device', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const { pushToken, platform } = req.body as { pushToken?: string; platform?: string };
    if (!pushToken) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Push token required'));
      return;
    }

    const { userService } = await import('../services/user/userService');
    const user = await userService.getUserByWalletAddress(req.user.walletAddress);
    if (!user) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'User not found'));
      return;
    }

    await userService.updateUser(req.user.walletAddress, {
      preferences: {
        ...user.preferences,
        expoPushToken: pushToken,
        pushPlatform: platform ?? 'unknown',
        pushTokenUpdatedAt: new Date().toISOString(),
      },
    });

    res.json(createResponse({ success: true }));
  } catch (error: any) {
    logger.error('Register push device error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.post('/preferences', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const { type, enabled, channels } = req.body;
    const preferences = await notificationService.updateNotificationPreferences(
      req.user.id,
      type,
      enabled,
      channels
    );

    res.json(createResponse(preferences));
  } catch (error: any) {
    logger.error('Update notification preferences error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

export default router;

