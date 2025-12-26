import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get(
  '/:walletAddress',
  optionalAuth,
  transactionController.getTransactions.bind(transactionController)
);

router.get(
  '/hash/:hash',
  optionalAuth,
  transactionController.getTransaction.bind(transactionController)
);

router.get(
  '/:walletAddress/stats',
  optionalAuth,
  transactionController.getTransactionStats.bind(transactionController)
);

export default router;

