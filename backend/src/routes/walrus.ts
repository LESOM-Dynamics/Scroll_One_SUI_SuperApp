import { Router } from 'express';
import { body } from 'express-validator';
import { walrusController } from '../controllers/walrusController';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { suiWalletAddressParam } from '../utils/suiValidators';

const router = Router();

router.get(
  '/profile/:walletAddress',
  optionalAuth,
  validate([suiWalletAddressParam('walletAddress')]),
  walrusController.getProfileBlob.bind(walrusController)
);

router.put(
  '/profile/:walletAddress',
  optionalAuth,
  validate([
    suiWalletAddressParam('walletAddress'),
    body('walrusBlobId').isString().notEmpty(),
    body('contentHash').optional().isString(),
  ]),
  walrusController.saveProfileBlob.bind(walrusController)
);

export default router;
