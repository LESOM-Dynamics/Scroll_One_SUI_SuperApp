import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';
import { suiSignatureBody, suiWalletAddressBody, suiWalletAddressParam } from '../utils/suiValidators';

const router = Router();

router.post(
  '/',
  validate([
    suiWalletAddressBody('walletAddress'),
    suiSignatureBody('signature'),
    body('message').isString().notEmpty(),
  ]),
  userController.createUser.bind(userController)
);

router.get(
  '/:walletAddress',
  optionalAuth,
  validate([suiWalletAddressParam('walletAddress')]),
  userController.getUser.bind(userController)
);

router.put(
  '/:walletAddress',
  authenticateToken,
  validate([suiWalletAddressParam('walletAddress')]),
  userController.updateUser.bind(userController)
);

router.get(
  '/:walletAddress/badges',
  optionalAuth,
  validate([suiWalletAddressParam('walletAddress')]),
  userController.getUserBadges.bind(userController)
);

router.post(
  '/:walletAddress/badges/earn',
  authenticateToken,
  validate([
    suiWalletAddressParam('walletAddress'),
    body('badgeId').isString().notEmpty(),
  ]),
  userController.awardBadge.bind(userController)
);

router.get(
  '/:walletAddress/reputation',
  optionalAuth,
  validate([suiWalletAddressParam('walletAddress')]),
  userController.getReputationHistory.bind(userController)
);

export default router;
