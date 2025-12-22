/**
 * Bridge Service
 * 
 * Initializes and manages the native bridge with all handlers
 */

import { NativeBridge, type HandlerContext, generateInjectedScript } from '@/scrollone-sdk';
import { BridgeMethod } from '@/scrollone-sdk';
import { scrollProvider } from '../scroll/provider';
import {
  createGetAccountHandler,
  createGetBalanceHandler,
  createSignTransactionHandler,
  createSignMessageHandler,
  createSignTypedDataHandler,
  createGetNetworkHandler,
  createEstimateGasHandler,
  executeTransaction,
} from './handlers';
import type { TransactionRequest } from '@/scrollone-sdk';

/**
 * Bridge Service Singleton
 */
class BridgeService {
  private nativeBridge: NativeBridge;
  private pendingTransactions: Map<string, { request: TransactionRequest; resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

  constructor() {
    // Initialize native bridge with security config
    this.nativeBridge = new NativeBridge({
      // Allow all origins for now (can be restricted per app)
      allowedOrigins: () => true,
      // Allow all methods
      allowedMethods: () => true,
    });

    // Register all handlers
    this.registerHandlers();
  }

  /**
   * Register all handlers
   */
  private registerHandlers(): void {
    this.nativeBridge.register(BridgeMethod.GET_ACCOUNT, createGetAccountHandler());
    this.nativeBridge.register(BridgeMethod.GET_BALANCE, createGetBalanceHandler());
    this.nativeBridge.register(BridgeMethod.SIGN_TRANSACTION, createSignTransactionHandler());
    this.nativeBridge.register(BridgeMethod.SIGN_MESSAGE, createSignMessageHandler());
    this.nativeBridge.register(BridgeMethod.SIGN_TYPED_DATA, createSignTypedDataHandler());
    this.nativeBridge.register(BridgeMethod.GET_NETWORK, createGetNetworkHandler());
    this.nativeBridge.register(BridgeMethod.ESTIMATE_GAS, createEstimateGasHandler());
  }

  /**
   * Handle message from WebView
   */
  async handleMessage(
    message: unknown,
    context: HandlerContext
  ) {
    return this.nativeBridge.handleMessage(message, context);
  }

  /**
   * Generate injected JavaScript
   */
  generateInjectedScript(config: {
    walletAddress: string | null;
    chainId: number;
    isWalletLocked: boolean;
    kycSharingEnabled: boolean;
  }): string {
    return generateInjectedScript(config);
  }

  /**
   * Execute a pending transaction (after user approval)
   */
  async executePendingTransaction(
    messageId: string,
    approved: boolean,
    context: HandlerContext
  ) {
    const pending = this.pendingTransactions.get(messageId);
    if (!pending) {
      throw new Error('Pending transaction not found');
    }

    this.pendingTransactions.delete(messageId);

    if (!approved) {
      pending.reject({
        code: 'USER_REJECTED',
        message: 'User rejected the transaction',
      });
      return;
    }

    try {
      const result = await executeTransaction(pending.request, context);
      pending.resolve(result);
    } catch (error) {
      pending.reject(error);
    }
  }

  /**
   * Store pending transaction for approval
   */
  storePendingTransaction(
    messageId: string,
    request: TransactionRequest,
    resolve: (value: any) => void,
    reject: (error: any) => void
  ) {
    this.pendingTransactions.set(messageId, { request, resolve, reject });
  }

  /**
   * Get pending transaction
   */
  getPendingTransaction(messageId: string) {
    return this.pendingTransactions.get(messageId);
  }
}

// Export singleton
export const bridgeService = new BridgeService();
