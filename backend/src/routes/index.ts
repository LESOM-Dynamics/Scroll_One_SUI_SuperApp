import { Router } from 'express';
import userRoutes from './users';
import miniappRoutes from './miniapps';
import transactionRoutes from './transactions';
import tokenRoutes from './tokens';
import notificationRoutes from './notifications';
import analyticsRoutes from './analytics';
import authRoutes from './auth';

const router = Router();

router.use('/users', userRoutes);
router.use('/miniapps', miniappRoutes);
router.use('/transactions', transactionRoutes);
router.use('/tokens', tokenRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);

export default router;

