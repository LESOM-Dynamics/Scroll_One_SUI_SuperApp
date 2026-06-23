import { Router } from 'express';
import { body } from 'express-validator';
import { walrusController } from '../controllers/walrusController';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.get(
  '/profile/:walletAddress',
  optionalAuth,
  walrusController.getProfileBlob.bind(walrusController)
);

router.put(
  '/profile/:walletAddress',
  optionalAuth,
  validate([
    body('walrusBlobId').isString().notEmpty(),
    body('contentHash').optional().isString(),
  ]),
  walrusController.saveProfileBlob.bind(walrusController)
);

export default router;
