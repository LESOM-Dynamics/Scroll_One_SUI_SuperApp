import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/wallet/verify',
  validate([
    body('walletAddress').isString().matches(/^0x[a-fA-F0-9]{40}$/),
    body('message').isString().notEmpty(),
    body('signature').isString().matches(/^0x[a-fA-F0-9]{130}$/),
  ]),
  authController.verifyWallet.bind(authController)
);

router.post(
  '/wallet/message',
  validate([body('walletAddress').isString().matches(/^0x[a-fA-F0-9]{40}$/)]),
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

