import { Request, Response } from 'express';
import { authService } from '../services/auth/authService';
import { SignatureVerifier } from '../services/blockchain/signatureVerifier';
import { createResponse, createErrorResponse } from '../utils/responses';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../config/logger';

export class AuthController {
  async verifyWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, message, signature } = req.body;

      if (!walletAddress || !message || !signature) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Wallet address, message, and signature required'));
        return;
      }

      const session = await authService.authenticateUser(
        walletAddress,
        message,
        signature,
        req.headers['x-device-id'] as string
      );

      res.json(createResponse({
        token: session.token,
        expiresIn: '7d',
        user: {
          walletAddress: session.walletAddress,
        },
      }));
    } catch (error: any) {
      logger.error('Wallet verification error', error);
      if (error instanceof AuthenticationError) {
        res.status(401).json(createErrorResponse('WALLET_VERIFICATION_FAILED', error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async generateAuthMessage(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Wallet address required'));
        return;
      }

      const message = SignatureVerifier.generateAuthMessage(walletAddress);

      res.json(createResponse({ message }));
    } catch (error: any) {
      logger.error('Generate auth message error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async validateSession(req: Request, res: Response): Promise<void> {
    try {
      // If we reach here, the middleware has already validated the token
      res.json(createResponse({ valid: true }));
    } catch (error: any) {
      logger.error('Validate session error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token || !req.user) {
        res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Not authenticated'));
        return;
      }

      // Invalidate session
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await authService.invalidateSession(req.user.id, tokenHash);

      res.json(createResponse({ success: true }));
    } catch (error: any) {
      logger.error('Logout error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }
}

export const authController = new AuthController();

