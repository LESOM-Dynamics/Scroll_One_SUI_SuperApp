import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { transactionService } from '../services/transaction/transactionService';
import { createResponse, createErrorResponse } from '../utils/responses';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger';
import { getPaginationParams } from '../utils/helpers';

export class TransactionController {
  async getTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const { page, limit, offset } = getPaginationParams(req.query);
      
      const filters = {
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
        limit,
        offset,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const { transactions, total } = await transactionService.getUserTransactions(walletAddress, filters);

      res.json(createResponse({
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }));
    } catch (error: any) {
      logger.error('Get transactions error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }

  async getTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { hash } = req.params;

      const transaction = await transactionService.getTransactionByHash(hash);
      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      res.json(createResponse(transaction));
    } catch (error: any) {
      logger.error('Get transaction error', error);
      if (error.statusCode) {
        res.status(error.statusCode).json(createErrorResponse(error.code, error.message));
      } else {
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
      }
    }
  }

  async getTransactionStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const stats = await transactionService.getTransactionStats(walletAddress);
      res.json(createResponse(stats));
    } catch (error: any) {
      logger.error('Get transaction stats error', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', error.message));
    }
  }
}

export const transactionController = new TransactionController();

