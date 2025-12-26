import { Router } from 'express';
import { analyticsService } from '../services/analytics/analyticsService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createResponse, createErrorResponse } from '../utils/responses';
import { logger } from '../config/logger';

const router = Router();

router.post('/event', optionalAuth, async (req, res) => {
  try {
    const { eventType, eventData, sessionId, deviceInfo, appVersion } = req.body;

    await analyticsService.trackEvent(
      eventType,
      eventData,
      req.user?.id,
      sessionId,
      deviceInfo,
      appVersion
    );

    res.json(createResponse({ success: true }));
  } catch (error: any) {
    logger.error('Track analytics event error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.get('/users/:walletAddress', authenticateToken, async (req, res) => {
  try {
    // Get user ID from wallet address
    const { userService } = await import('../services/user/userService');
    const user = await userService.getUserByWalletAddress(req.params.walletAddress);
    
    if (!user) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'User not found'));
      return;
    }

    const analytics = await analyticsService.getUserAnalytics(
      user.id,
      req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      req.query.toDate ? new Date(req.query.toDate as string) : undefined
    );

    res.json(createResponse(analytics));
  } catch (error: any) {
    logger.error('Get user analytics error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

export default router;

