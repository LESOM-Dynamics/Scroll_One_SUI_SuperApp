/**
 * ScrollOne SDK v1 - Web Bridge
 * 
 * Implements window.scrollOne API for dApps
 * Framework-agnostic, zero dependencies
 */

import { BridgeMethod, BridgeEvent, REQUEST_TIMEOUT, MAX_PENDING_REQUESTS, SDK_VERSION } from '../core/constants';
import { BridgeMessage, BridgeResponse, createBridgeMessage } from '../core/protocol';
import { BridgeErrorCode, createBridgeError } from '../core/errors';
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
} from '../types';

/**
 * Pending request state
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Event listener type
 */
type EventListener = (data: unknown) => void;

/**
 * ScrollOne Web Bridge Implementation
 */
export class ScrollOneWebBridge {
  private bridgeId: string;
  private messageId: number = 0;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private listeners: Map<string, EventListener[]> = new Map();
  private isReady: boolean = false;
  private walletAddress: string | null = null;
  private chainId: number | null = null;
  private isWalletLocked: boolean = true;
  private kycSharingEnabled: boolean = false;

  constructor() {
    this.bridgeId = `scroll_one_bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initialize();
  }

  /**
   * Initialize the bridge
   */
  private initialize(): void {
    // Check if we're in a browser/WebView environment
    if (typeof window === 'undefined') {
      // Expected in React Native - bridge will be initialized via injected script
      return;
    }

    // Check if addEventListener is available
    if (typeof window.addEventListener !== 'function') {
      // Expected in React Native - bridge will be initialized via injected script
      return;
    }

    // Listen for messages from native
    try {
      window.addEventListener('message', this.handleNativeMessage.bind(this));
      // Mark as ready
      this.isReady = true;
      this.emit(BridgeEvent.READY, {});
    } catch (error) {
      // Silently fail - expected in React Native environment
    }
  }

  /**
   * Handle messages from native
   */
  private handleNativeMessage(event: MessageEvent): void {
    try {
      const data = typeof event.data === 'string' 
        ? JSON.parse(event.data) 
        : event.data;

      // Handle bridge responses
      if (data.type === 'BRIDGE_RESPONSE' && data.payload) {
        this.handleResponse(data.payload as BridgeResponse);
        return;
      }

      // Handle bridge events
      if (data.type === 'BRIDGE_EVENT' && data.event) {
        this.emit(data.event, data.data);
        return;
      }
    } catch (error) {
      console.error('[ScrollOne] Error handling native message:', error);
    }
  }

  /**
   * Handle response from native
   */
  private handleResponse(response: BridgeResponse): void {
    const request = this.pendingRequests.get(response.id);
    if (!request) {
      console.warn('[ScrollOne] Received response for unknown request:', response.id);
      return;
    }

    // Clear timeout
    clearTimeout(request.timeoutId);
    this.pendingRequests.delete(response.id);

    // Resolve or reject
    if (response.success) {
      request.resolve(response.data);
    } else {
      const error = createBridgeError(
        response.error?.code || BridgeErrorCode.UNKNOWN_ERROR,
        response.error?.message || 'Unknown error'
      );
      request.reject(error);
    }
  }

  /**
   * Send message to native
   */
  private sendMessage<T>(
    type: BridgeMethod,
    payload?: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if we're in a valid environment
      if (typeof window === 'undefined') {
        reject(createBridgeError(
          BridgeErrorCode.EXECUTION_ERROR,
          'Bridge not available - window is undefined'
        ));
        return;
      }

      if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
        reject(createBridgeError(
          BridgeErrorCode.EXECUTION_ERROR,
          'Bridge not available - not running in React Native WebView'
        ));
        return;
      }

      // Check if bridge is ready
      if (!this.isReady) {
        reject(createBridgeError(
          BridgeErrorCode.EXECUTION_ERROR,
          'Bridge not ready'
        ));
        return;
      }

      // Check pending request limit
      if (this.pendingRequests.size >= MAX_PENDING_REQUESTS) {
        reject(createBridgeError(
          BridgeErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many pending requests'
        ));
        return;
      }

      // Generate message ID
      const id = `${this.bridgeId}_${++this.messageId}`;
      
      // Create message
      const message = createBridgeMessage(id, 'web', type, payload);

      // Store pending request
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(createBridgeError(
          BridgeErrorCode.TIMEOUT,
          'Request timeout'
        ));
      }, REQUEST_TIMEOUT);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
        timeoutId,
      });

      // Send to native
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(createBridgeError(
          BridgeErrorCode.EXECUTION_ERROR,
          `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
        ));
      }
    });
  }

  /**
   * Emit event
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[ScrollOne] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Public API Methods
   */

  /**
   * Get account information
   */
  async getAccount(): Promise<AccountInfo> {
    return this.sendMessage<AccountInfo>(BridgeMethod.GET_ACCOUNT);
  }

  /**
   * Get balance
   */
  async getBalance(tokenAddress?: string): Promise<BalanceInfo> {
    return this.sendMessage<BalanceInfo>(BridgeMethod.GET_BALANCE, { tokenAddress });
  }

  /**
   * Sign and send transaction
   */
  async signTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    return this.sendMessage<TransactionResponse>(BridgeMethod.SIGN_TRANSACTION, transaction);
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<SignMessageResponse> {
    return this.sendMessage<SignMessageResponse>(BridgeMethod.SIGN_MESSAGE, { message });
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(
    domain: any,
    types: any,
    value: any
  ): Promise<SignTypedDataResponse> {
    return this.sendMessage<SignTypedDataResponse>(
      BridgeMethod.SIGN_TYPED_DATA,
      { domain, types, value }
    );
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<NetworkInfo> {
    return this.sendMessage<NetworkInfo>(BridgeMethod.GET_NETWORK);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: TransactionRequest): Promise<GasEstimate> {
    return this.sendMessage<GasEstimate>(BridgeMethod.ESTIMATE_GAS, transaction);
  }

  /**
   * Event listeners
   */
  on(event: string, callback: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Update internal state (called by native)
   */
  updateState(state: {
    walletAddress?: string | null;
    chainId?: number;
    isWalletLocked?: boolean;
    kycSharingEnabled?: boolean;
  }): void {
    if (state.walletAddress !== undefined) {
      const oldAddress = this.walletAddress;
      this.walletAddress = state.walletAddress;
      if (oldAddress !== state.walletAddress) {
        this.emit(BridgeEvent.ACCOUNT_CHANGED, { address: state.walletAddress });
      }
    }
    if (state.chainId !== undefined) {
      const oldChainId = this.chainId;
      this.chainId = state.chainId;
      if (oldChainId !== state.chainId) {
        this.emit(BridgeEvent.NETWORK_CHANGED, { chainId: state.chainId });
      }
    }
    if (state.isWalletLocked !== undefined) {
      this.isWalletLocked = state.isWalletLocked;
      this.emit(
        state.isWalletLocked ? BridgeEvent.WALLET_LOCKED : BridgeEvent.WALLET_UNLOCKED,
        {}
      );
    }
    if (state.kycSharingEnabled !== undefined) {
      this.kycSharingEnabled = state.kycSharingEnabled;
    }
  }

  /**
   * Get current state (read-only properties)
   */
  getState() {
    return {
      isScrollOne: true,
      version: SDK_VERSION,
      bridgeId: this.bridgeId,
      walletAddress: this.walletAddress,
      chainId: this.chainId,
      isConnected: !!this.walletAddress,
      isWalletLocked: this.isWalletLocked,
      kycSharingEnabled: this.kycSharingEnabled,
    };
  }
}

/**
 * Create and initialize the bridge
 */
export function createScrollOneBridge(): ScrollOneWebBridge {
  return new ScrollOneWebBridge();
}

/**
 * Declare global types for window.scrollOne
 */
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    scrollOne?: ScrollOneWebBridge;
  }
}
