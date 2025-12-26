import { Router } from 'express';
import { tokenService } from '../services/token/tokenService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createResponse, createErrorResponse } from '../utils/responses';
import { logger } from '../config/logger';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const tokens = await tokenService.getTokens({
      chainId: req.query.chainId ? parseInt(req.query.chainId as string) : undefined,
      verified: req.query.verified === 'true' ? true : undefined,
    });
    res.json(createResponse(tokens));
  } catch (error: any) {
    logger.error('Get tokens error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.get('/:address', optionalAuth, async (req, res) => {
  try {
    const token = await tokenService.getTokenByAddress(req.params.address);
    if (!token) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Token not found'));
      return;
    }
    res.json(createResponse(token));
  } catch (error: any) {
    logger.error('Get token error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.get('/:address/price', optionalAuth, async (req, res) => {
  try {
    const price = await tokenService.getTokenPrice(req.params.address);
    if (!price) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Price not found'));
      return;
    }
    res.json(createResponse(price));
  } catch (error: any) {
    logger.error('Get token price error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

router.get('/balances/:walletAddress', authenticateToken, async (req, res) => {
  try {
    const balances = await tokenService.getTokenBalances(req.params.walletAddress);
    res.json(createResponse(balances));
  } catch (error: any) {
    logger.error('Get token balances error', error);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
  }
});

export default router;

