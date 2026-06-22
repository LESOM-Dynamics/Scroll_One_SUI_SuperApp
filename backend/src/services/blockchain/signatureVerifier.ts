import { randomBytes } from 'crypto';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { logger } from '../../config/logger';

export class SignatureVerifier {
  static async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const publicKey = await verifyPersonalMessageSignature(messageBytes, signature, {
        address: walletAddress,
      });
      return normalizeSuiAddress(publicKey.toSuiAddress()) === normalizeSuiAddress(walletAddress);
    } catch (error) {
      logger.error('Signature verification error', error);
      return false;
    }
  }

  static generateAuthMessage(walletAddress: string, nonce?: string): string {
    const timestamp = Date.now();
    const nonceValue = nonce || randomBytes(16).toString('hex');

    return `Sign in to Sui One SuperApp

Wallet: ${walletAddress}
Nonce: ${nonceValue}
Timestamp: ${timestamp}

This signature proves you own this wallet and will not cost any gas.`;
  }

  static extractNonceFromMessage(message: string): string | null {
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    return nonceMatch ? nonceMatch[1] : null;
  }
}
