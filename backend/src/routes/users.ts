import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/',
  validate([
    body('walletAddress').isString().matches(/^0x[a-fA-F0-9]{40}$/),
    body('signature').isString().matches(/^0x[a-fA-F0-9]{130}$/),
    body('message').isString().notEmpty(),
  ]),
  userController.createUser.bind(userController)
);

router.get(
  '/:walletAddress',
  optionalAuth,
  userController.getUser.bind(userController)
);

router.put(
  '/:walletAddress',
  authenticateToken,
  userController.updateUser.bind(userController)
);

router.get(
  '/:walletAddress/badges',
  optionalAuth,
  userController.getUserBadges.bind(userController)
);

router.post(
  '/:walletAddress/badges/earn',
  authenticateToken,
  validate([body('badgeId').isString().notEmpty()]),
  userController.awardBadge.bind(userController)
);

router.get(
  '/:walletAddress/reputation',
  optionalAuth,
  userController.getReputationHistory.bind(userController)
);

export default router;

