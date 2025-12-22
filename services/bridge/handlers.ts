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

/**
 * Get account handler
 */
export function createGetAccountHandler() {
  return async (_payload: unknown, context: HandlerContext): Promise<AccountInfo> => {
    return {
      address: context.walletAddress,
      isConnected: !!context.walletAddress,
    };
  };
}

/**
 * Get balance handler
 */
export function createGetBalanceHandler() {
  return async (payload: { tokenAddress?: string } | undefined, context: HandlerContext): Promise<BalanceInfo> => {
    if (!context.walletAddress) {
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }

    // For now, only support ETH balance
    // TODO: Add ERC-20 token support
    if (payload?.tokenAddress) {
      throw createBridgeError(
        BridgeErrorCode.UNSUPPORTED_METHOD,
        'Token balance not yet supported'
      );
    }

    try {
      const balance = await scrollProvider.getBalance(context.walletAddress);
      return {
        balance,
        formatted: formatEther(parseEther(balance)),
        symbol: 'ETH',
      };
    } catch (error) {
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
    // Validation
    if (!payload.to) {
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Transaction "to" address is required'
      );
    }

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
    if (!context.walletAddress) {
      throw createBridgeError(
        BridgeErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected'
      );
    }

    if (!payload.message) {
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Message is required'
      );
    }

    try {
      const signature = await signMessage(payload.message);
      return { signature };
    } catch (error) {
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
    const config = scrollProvider.getConfig();
    return {
      chainId: config.chainId,
      chainName: config.chainName,
      rpcUrl: config.rpcUrl,
      isTestnet: config.chainId === 534351,
    };
  };
}

/**
 * Estimate gas handler
 */
export function createEstimateGasHandler() {
  return async (payload: TransactionRequest, context: HandlerContext): Promise<GasEstimate> => {
    if (!payload.to) {
      throw createBridgeError(
        BridgeErrorCode.INVALID_PAYLOAD,
        'Transaction "to" address is required'
      );
    }

    try {
      const provider = scrollProvider.getProvider();
      const gasEstimate = await scrollProvider.estimateGas({
        to: payload.to,
        value: payload.value ? parseEther(payload.value) : undefined,
        data: payload.data,
      });
      
      const gasPrice = await scrollProvider.getGasPrice();
      const totalFee = gasEstimate * gasPrice;
      
      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        estimatedFee: formatEther(totalFee.toString()),
      };
    } catch (error) {
      throw createBridgeError(
        BridgeErrorCode.GAS_ESTIMATION_FAILED,
        `Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  };
}
