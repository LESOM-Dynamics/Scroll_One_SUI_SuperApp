import { body, param } from 'express-validator';
import { isValidSuiAddress } from '@mysten/sui/utils';

export function isSuiWalletAddress(value: string): boolean {
  if (typeof value !== 'string') return false;
  try {
    return isValidSuiAddress(value);
  } catch {
    return false;
  }
}

export const suiWalletAddressBody = (field = 'walletAddress') =>
  body(field)
    .isString()
    .custom((value) => {
      if (!isSuiWalletAddress(value)) {
        throw new Error('Invalid Sui wallet address');
      }
      return true;
    });

export const suiWalletAddressParam = (field = 'walletAddress') =>
  param(field)
    .isString()
    .custom((value) => {
      if (!isSuiWalletAddress(value)) {
        throw new Error('Invalid Sui wallet address');
      }
      return true;
    });

export const suiSignatureBody = (field = 'signature') =>
  body(field).isString().notEmpty().withMessage('Signature is required');
