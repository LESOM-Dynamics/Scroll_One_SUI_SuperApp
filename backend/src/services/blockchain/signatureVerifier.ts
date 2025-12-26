import { ethers } from 'ethers';
import { logger } from '../../config/logger';

export class SignatureVerifier {
  /**
   * Verify wallet signature
   */
  static verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      logger.error('Signature verification error', error);
      return false;
    }
  }

  /**
   * Generate authentication message
   */
  static generateAuthMessage(walletAddress: string, nonce?: string): string {
    const timestamp = Date.now();
    const nonceValue = nonce || ethers.randomBytes(16).toString('hex');
    
    return `Sign in to Scroll One SuperApp

Wallet: ${walletAddress}
Nonce: ${nonceValue}
Timestamp: ${timestamp}

This signature proves you own this wallet and will not cost any gas.`;
  }

  /**
   * Verify and extract nonce from message
   */
  static extractNonceFromMessage(message: string): string | null {
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    return nonceMatch ? nonceMatch[1] : null;
  }
}

