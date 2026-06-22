import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/user/userService';
import { badgeService } from '../services/user/badgeService';
import { reputationService } from '../services/user/reputationService';
import { createResponse, createErrorResponse } from '../utils/responses';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../config/logger';

export class UserController {
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress, suiId, scrollId, username, displayName, signature, message } = req.body;

      if (!walletAddress || !signature) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Wallet address and signature required'));
        return;
      }

      // Verify signature
      const { authService } = await import('../services/auth/authService');
      const isValid = await authService.verifyWalletSignature(walletAddress, message, signature);
      if (!isValid) {
        res.status(401).json(createErrorResponse('WALLET_VERIFICATION_FAILED', 'Invalid signature'));
        return;
      }

      // Check if user exists
      const existingUser = await userService.getUserByWalletAddress(walletAddress);
      if (existingUser) {
        res.status(409).json(createErrorResponse('DUPLICATE_ENTRY', 'User already exists'));
        return;
      }

      const user = await userService.createUser({
        walletAddress,
        suiId: suiId ?? scrollId,
        username,
        displayName,
      });

      res.status(201).json(createResponse(user));
    } catch (error: any) {
      logger.error('Create user error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async getUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const user = await userService.getUserByWalletAddress(walletAddress);
      if (!user) {
        res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      // Get badges
      const badges = await badgeService.getUserBadges(user.id);

      res.json(createResponse({
        ...user,
        badges,
      }));
    } catch (error: any) {
      logger.error('Get user error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const updates = req.body;

      if (req.user?.walletAddress !== walletAddress) {
        throw new AuthorizationError('Cannot update another user');
      }

      const user = await userService.updateUser(walletAddress, updates);
      res.json(createResponse(user));
    } catch (error: any) {
      logger.error('Update user error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async getUserBadges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const user = await userService.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new NotFoundError('User');
      }

      const badges = await badgeService.getUserBadges(user.id);
      res.json(createResponse(badges));
    } catch (error: any) {
      logger.error('Get user badges error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async awardBadge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const { badgeId, metadata } = req.body;

      if (!badgeId) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Badge ID required'));
        return;
      }

      const user = await userService.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new NotFoundError('User');
      }

      const badge = await badgeService.awardBadge(user.id, badgeId, metadata);
      
      // Award reputation for badge
      await reputationService.addReputationEvent(
        user.id,
        'badge_earned',
        reputationService.constructor.POINTS.BADGE_EARNED,
        { badgeId }
      );

      res.status(201).json(createResponse(badge));
    } catch (error: any) {
      logger.error('Award badge error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async getReputationHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const user = await userService.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new NotFoundError('User');
      }

      const history = await reputationService.getReputationHistory(user.id, limit, offset);
      const totalReputation = await reputationService.getTotalReputation(user.id);
      const level = await reputationService.calculateLevel(totalReputation);

      res.json(createResponse({
        totalReputation,
        level,
        history,
      }));
    } catch (error: any) {
      logger.error('Get reputation history error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }
}

export const userController = new UserController();

