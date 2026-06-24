import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';
import { suiSignatureBody, suiWalletAddressBody } from '../utils/suiValidators';

const router = Router();

router.post(
  '/wallet/verify',
  validate([
    suiWalletAddressBody('walletAddress'),
    body('message').isString().notEmpty(),
    suiSignatureBody('signature'),
  ]),
  authController.verifyWallet.bind(authController)
);

router.post(
  '/wallet/message',
  validate([suiWalletAddressBody('walletAddress')]),
  authController.generateAuthMessage.bind(authController)
);

router.get(
  '/session/validate',
  authenticateToken,
  authController.validateSession.bind(authController)
);

router.delete(
  '/session',
  authenticateToken,
  authController.logout.bind(authController)
);

export default router;
