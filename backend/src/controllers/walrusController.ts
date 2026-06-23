import { Request, Response } from 'express';
import { userService } from '../services/user/userService';
import { createResponse } from '../utils/responses';
import { logger } from '../config/logger';

export class WalrusController {
  async getProfileBlob(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const user = await userService.getUserByWalletAddress(walletAddress);

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      const walrusBlobId = user.preferences?.walrusBlobId as string | undefined;
      const contentHash = user.preferences?.profileContentHash as string | undefined;

      res.json(
        createResponse({
          walrusBlobId: walrusBlobId ?? null,
          contentHash: contentHash ?? null,
        })
      );
    } catch (error) {
      logger.error('Get Walrus profile blob error', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Walrus profile reference' } });
    }
  }

  async saveProfileBlob(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const { walrusBlobId, contentHash } = req.body as {
        walrusBlobId: string;
        contentHash?: string;
      };

      const user = await userService.getUserByWalletAddress(walletAddress);
      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      const updated = await userService.updateUser(walletAddress, {
        preferences: {
          ...user.preferences,
          walrusBlobId,
          profileContentHash: contentHash,
          walrusUpdatedAt: new Date().toISOString(),
        },
      });

      res.json(
        createResponse({
          walrusBlobId: updated.preferences?.walrusBlobId,
          contentHash: updated.preferences?.profileContentHash,
        })
      );
    } catch (error) {
      logger.error('Save Walrus profile blob error', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save Walrus profile reference' } });
    }
  }
}

export const walrusController = new WalrusController();
