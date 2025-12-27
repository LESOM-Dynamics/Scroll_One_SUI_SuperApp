/**
 * Bridge Handlers
 * 
 * App-specific handlers that use the SDK's native bridge
 */

import { BridgeMethod } from '@/scrollone-sdk';
import type { HandlerContext } from '@/scrollone-sdk';
import type { 
  AccountInfo,
  BalanceInfo,
  NetworkInfo,
  TransactionRequest,
  TransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTypedDataRequest,
  SignTypedDataResponse,
  GasEstimate,
} from '@/scrollone-sdk';
import { scrollProvider } from '../scroll/provider';
import { signMessage, sendTransaction } from '../scroll/wallet';
import { formatEther, parseEther } from 'ethers';
import { BridgeErrorCode, createBridgeError } from '@/scrollone-sdk';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../notifications/notificationService';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Get account handler
 */
export function createGetAccountHandler() {
  return async (_payload: unknown, context: HandlerContext): Promise<AccountInfo> => {
    console.log('[Handler:GET_ACCOUNT] Handler invoked with context:', {
      walletAddress: context.walletAddress,
      isWalletLocked: context.isWalletLocked,
      chainId: context.chainId,
      origin: context.origin,
    });
    const result = {
      address: context.walletAddress,
      isConnected: !!context.walletAddress,
    };
    console.log('[Handler:GET_ACCOUNT] Returning result:', result);
    return result;
  };
}

/**
 * Get balance handler
 */
export function createGetBalanceHandler() {
  return async (payload: { tokenAddress?: string } | undefined, context: HandlerContext): Promise<BalanceInfo> => {
    console.log('[Handler:GET_BALANCE] Handler invoked with payload:', payload, 'context:', {
      walletAddress: context.walletAddress,
      isWalletLocked: context.isWalletLocked,
      chainId: context.chainId,
    });
    
    if (!context.walletAddress) {
      console.error('[Handler:GET_BALANCE] Wallet not connected');
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }

    // For now, only support ETH balance
    // TODO: Add ERC-20 token support
    if (payload?.tokenAddress) {
      console.warn('[Handler:GET_BALANCE] Token balance requested but not supported:', payload.tokenAddress);
      throw createBridgeError(
        BridgeErrorCode.UNSUPPORTED_METHOD,
        'Token balance not yet supported'
      );
    }

    try {
      console.log('[Handler:GET_BALANCE] Fetching balance for address:', context.walletAddress);
      const balance = await scrollProvider.getBalance(context.walletAddress);
      const result = {
        balance,
        formatted: formatEther(parseEther(balance)),
        symbol: 'ETH',
      };
      console.log('[Handler:GET_BALANCE] Balance fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('[Handler:GET_BALANCE] Error fetching balance:', error);
      throw createBridgeError(
        BridgeErrorCode.NETWORK_ERROR,
        `Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };
}

/**
 * Sign transaction handler
 * Note: This returns a pending response. The actual signing happens after user approval.
 */
export function createSignTransactionHandler() {
  return async (payload: TransactionRequest, context: HandlerContext): Promise<{ pending: boolean; requiresApproval: true }> => {
    console.log('[Handler:SIGN_TRANSACTION] Handler invoked with payload:', JSON.stringify(payload, null, 2));
    console.log('[Handler:SIGN_TRANSACTION] Context:', {
      walletAddress: context.walletAddress,
      isWalletLocked: context.isWalletLocked,
      chainId: context.chainId,
      origin: context.origin,
    });
    
    // Validation
    if (!payload.to) {
      console.error('[Handler:SIGN_TRANSACTION] Validation failed: missing "to" address');
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Transaction "to" address is required'
      );
    }

    console.log('[Handler:SIGN_TRANSACTION] Transaction validated, returning pending response');
    // Return pending - actual execution happens after user approval
    return {
      pending: true,
      requiresApproval: true,
    };
  };
}

/**
 * Execute transaction (called after user approval)
 */
export async function executeTransaction(
  payload: TransactionRequest,
  context: HandlerContext
): Promise<TransactionResponse> {
  if (!context.walletAddress) {
    throw createBridgeError(
      BridgeErrorCode.WALLET_NOT_CONNECTED,
      'Wallet not connected'
    );
  }

  try {
    const provider = scrollProvider.getProvider();
    
    const txRequest = {
      to: payload.to,
      value: payload.value ? parseEther(payload.value) : undefined,
      data: payload.data,
      gasLimit: payload.gasLimit ? BigInt(payload.gasLimit) : undefined,
      gasPrice: payload.gasPrice ? BigInt(payload.gasPrice) : undefined,
    };

    const txResponse = await sendTransaction(txRequest, provider);
    
    return {
      hash: txResponse.hash,
      from: txResponse.from,
      to: txResponse.to || null,
    };
  } catch (error) {
    throw createBridgeError(
      BridgeErrorCode.TRANSACTION_FAILED,
      `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Sign message handler
 */
export function createSignMessageHandler() {
  return async (payload: SignMessageRequest, context: HandlerContext): Promise<SignMessageResponse> => {
    console.log('[Handler:SIGN_MESSAGE] Handler invoked with payload:', payload);
    
    if (!context.walletAddress) {
      console.error('[Handler:SIGN_MESSAGE] Wallet not connected');
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }

    if (!payload.message) {
      console.error('[Handler:SIGN_MESSAGE] Message is required');
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Message is required'
      );
    }

    try {
      console.log('[Handler:SIGN_MESSAGE] Signing message...');
      const signature = await signMessage(payload.message);
      console.log('[Handler:SIGN_MESSAGE] Message signed successfully');
      return { signature };
    } catch (error) {
      console.error('[Handler:SIGN_MESSAGE] Error signing message:', error);
      throw createBridgeError(
        BridgeErrorCode.SIGN_FAILED,
        `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };
}

/**
 * Sign typed data handler
 */
export function createSignTypedDataHandler() {
  return async (payload: SignTypedDataRequest, context: HandlerContext): Promise<SignTypedDataResponse> => {
    if (!context.walletAddress) {
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }

    // TODO: Implement EIP-712 signing
    // For now, throw unsupported
    throw createBridgeError(
      BridgeErrorCode.UNSUPPORTED_METHOD,
      'Typed data signing not yet implemented'
    );
  };
}

/**
 * Get network handler
 */
export function createGetNetworkHandler() {
  return async (_payload: unknown, context: HandlerContext): Promise<NetworkInfo> => {
    console.log('[Handler:GET_NETWORK] Handler invoked');
    const config = scrollProvider.getConfig();
    const result = {
      chainId: config.chainId,
      chainName: config.chainName,
      rpcUrl: config.rpcUrl,
      isTestnet: config.chainId === 534351,
    };
    console.log('[Handler:GET_NETWORK] Returning network info:', result);
    return result;
  };
}

/**
 * Estimate gas handler
 */
export function createEstimateGasHandler() {
  return async (payload: TransactionRequest, context: HandlerContext): Promise<GasEstimate> => {
    console.log('[Handler:ESTIMATE_GAS] Handler invoked with payload:', payload);
    
    if (!payload.to) {
      console.error('[Handler:ESTIMATE_GAS] Validation failed: missing "to" address');
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Transaction "to" address is required'
      );
    }

    try {
      console.log('[Handler:ESTIMATE_GAS] Estimating gas...');
      const provider = scrollProvider.getProvider();
      const gasEstimate = await scrollProvider.estimateGas({
        to: payload.to,
        value: payload.value ? parseEther(payload.value) : undefined,
        data: payload.data,
      });
      
      const gasPrice = await scrollProvider.getGasPrice();
      const totalFee = gasEstimate * gasPrice;
      
      const result = {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        estimatedFee: formatEther(totalFee.toString()),
      };
      console.log('[Handler:ESTIMATE_GAS] Gas estimation complete:', result);
      return result;
    } catch (error) {
      console.error('[Handler:ESTIMATE_GAS] Error estimating gas:', error);
      throw createBridgeError(
        BridgeErrorCode.GAS_ESTIMATION_FAILED,
        `Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };
}

// Rate limiting for notifications per origin
const notificationRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_NOTIFICATIONS_PER_MINUTE = 5;

/**
 * Request notification handler
 * Allows mini-apps to request notifications from the SuperApp
 */
export function createRequestNotificationHandler() {
  return async (
    payload: {
      title: string;
      body: string;
      data?: Record<string, any>;
      badge?: number;
      sound?: boolean;
    },
    context: HandlerContext
  ): Promise<{ success: boolean; notificationId?: string }> => {
    console.log('[Handler:REQUEST_NOTIFICATION] Handler invoked with payload:', payload);
    
    // Check if notifications are enabled
    const { notificationsEnabled } = useSettingsStore.getState();
    if (!notificationsEnabled) {
      console.warn('[Handler:REQUEST_NOTIFICATION] Notifications disabled in settings');
      throw createBridgeError(
        BridgeErrorCode.UNSUPPORTED_METHOD,
        'Notifications are disabled in settings'
      );
    }

    // Validate payload
    if (!payload.title || !payload.body) {
      console.error('[Handler:REQUEST_NOTIFICATION] Validation failed: missing title or body');
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Notification title and body are required'
      );
    }

    // Rate limiting per origin
    const origin = context.origin || 'unknown';
    const now = Date.now();
    const limit = notificationRateLimit.get(origin);
    
    if (limit && limit.resetAt > now) {
      if (limit.count >= MAX_NOTIFICATIONS_PER_MINUTE) {
        console.warn('[Handler:REQUEST_NOTIFICATION] Rate limit exceeded for origin:', origin);
        throw createBridgeError(
          BridgeErrorCode.RATE_LIMIT_EXCEEDED,
          'Notification rate limit exceeded. Please wait before requesting more notifications.'
        );
      }
      limit.count++;
    } else {
      notificationRateLimit.set(origin, { count: 1, resetAt: now + 60000 }); // 1 minute window
    }

    // Security: Limit notification payload size and sanitize
    const title = String(payload.title).slice(0, 100); // Max 100 chars
    const body = String(payload.body).slice(0, 500); // Max 500 chars
    
    // Sanitize data (only allow safe keys, add origin tracking)
    const safeData: Record<string, any> = {
      origin: context.origin || 'unknown',
      timestamp: Date.now(),
      type: 'miniapp_notification',
    };
    
    // Merge user data if provided, but sanitize it
    if (payload.data && typeof payload.data === 'object') {
      Object.keys(payload.data).slice(0, 10).forEach(key => {
        // Only allow string, number, boolean values
        const value = payload.data![key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeData[key] = String(value).slice(0, 100); // Limit each value to 100 chars
        }
      });
    }

    try {
      // Schedule notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: safeData,
          sound: payload.sound !== false, // Default to true
          badge: payload.badge,
        },
        trigger: null, // Show immediately
      });

      console.log('[Handler:REQUEST_NOTIFICATION] Notification scheduled:', notificationId);
      
      return {
        success: true,
        notificationId: notificationId.toString(),
      };
    } catch (error) {
      console.error('[Handler:REQUEST_NOTIFICATION] Error scheduling notification:', error);
      throw createBridgeError(
        BridgeErrorCode.EXECUTION_ERROR,
        `Failed to schedule notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };
}
