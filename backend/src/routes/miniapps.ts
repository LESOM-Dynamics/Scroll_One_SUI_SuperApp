import { Router } from 'express';
import { miniappController } from '../controllers/miniappController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  optionalAuth,
  miniappController.getMiniApps.bind(miniappController)
);

router.get(
  '/categories',
  optionalAuth,
  miniappController.getCategories.bind(miniappController)
);

router.get(
  '/:appId',
  optionalAuth,
  miniappController.getMiniApp.bind(miniappController)
);

router.post(
  '/:appId/usage',
  authenticateToken,
  miniappController.trackUsage.bind(miniappController)
);

export default router;

