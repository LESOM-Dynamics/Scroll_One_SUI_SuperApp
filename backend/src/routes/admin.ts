import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/adminAuth';

const router = Router();

// All admin routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));

// Users
router.get('/users', adminController.getUsers.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));

// Transactions
router.get('/transactions', adminController.getTransactions.bind(adminController));

// Mini-apps
router.put('/miniapps/:appId', adminController.updateMiniApp.bind(adminController));

// Admin actions log
router.get('/actions', adminController.getAdminActions.bind(adminController));

// Security
router.get('/security/events', adminController.getSecurityEvents.bind(adminController));

// System health
router.get('/system/health', adminController.getSystemHealth.bind(adminController));

export default router;

