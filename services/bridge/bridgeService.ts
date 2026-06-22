/**
 * Bridge Service
 * 
 * Initializes and manages the native bridge with all handlers
 */

import { NativeBridge, type HandlerContext, generateInjectedScript } from '@/scrollone-sdk';
import { BridgeMethod } from '@/scrollone-sdk';
import { suiProvider } from '../sui/provider';
import {
  createGetAccountHandler,
  createGetBalanceHandler,
  createSignTransactionHandler,
  createSignMessageHandler,
  createSignTypedDataHandler,
  createGetNetworkHandler,
  createEstimateGasHandler,
  createRequestNotificationHandler,
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
    console.log('[BridgeService] Initializing BridgeService...');
    // Initialize native bridge with security config
    this.nativeBridge = new NativeBridge({
      // Allow all origins for now (can be restricted per app)
      allowedOrigins: () => true,
      // Allow all methods
      allowedMethods: () => true,
    });
    console.log('[BridgeService] NativeBridge initialized');

    // Register all handlers
    this.registerHandlers();
    console.log('[BridgeService] BridgeService initialization complete');
  }

  /**
   * Register all handlers
   */
  private registerHandlers(): void {
    console.log('[BridgeService] Registering handlers...');
    this.nativeBridge.register(BridgeMethod.GET_ACCOUNT, createGetAccountHandler());
    console.log('[BridgeService] Registered handler: GET_ACCOUNT');
    this.nativeBridge.register(BridgeMethod.GET_BALANCE, createGetBalanceHandler());
    console.log('[BridgeService] Registered handler: GET_BALANCE');
    this.nativeBridge.register(BridgeMethod.SIGN_TRANSACTION, createSignTransactionHandler());
    console.log('[BridgeService] Registered handler: SIGN_TRANSACTION');
    this.nativeBridge.register(BridgeMethod.SIGN_MESSAGE, createSignMessageHandler());
    console.log('[BridgeService] Registered handler: SIGN_MESSAGE');
    this.nativeBridge.register(BridgeMethod.SIGN_TYPED_DATA, createSignTypedDataHandler());
    console.log('[BridgeService] Registered handler: SIGN_TYPED_DATA');
    this.nativeBridge.register(BridgeMethod.GET_NETWORK, createGetNetworkHandler());
    console.log('[BridgeService] Registered handler: GET_NETWORK');
    this.nativeBridge.register(BridgeMethod.ESTIMATE_GAS, createEstimateGasHandler());
    console.log('[BridgeService] Registered handler: ESTIMATE_GAS');
    this.nativeBridge.register(BridgeMethod.REQUEST_NOTIFICATION, createRequestNotificationHandler());
    console.log('[BridgeService] Registered handler: REQUEST_NOTIFICATION');
    console.log('[BridgeService] All handlers registered');
  }

  /**
   * Handle message from WebView
   */
  async handleMessage(
    message: unknown,
    context: HandlerContext
  ) {
    console.log('[BridgeService] Handling message:', JSON.stringify(message, null, 2));
    console.log('[BridgeService] Context:', { 
      walletAddress: context.walletAddress, 
      isWalletLocked: context.isWalletLocked, 
      chainId: context.chainId, 
      origin: context.origin 
    });
    const response = await this.nativeBridge.handleMessage(message, context);
    console.log('[BridgeService] Response:', JSON.stringify(response, null, 2));
    return response;
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
    console.log('[BridgeService] Generating injected script with config:', config);
    const script = generateInjectedScript(config);
    console.log('[BridgeService] Generated script length:', script.length);
    return script;
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
