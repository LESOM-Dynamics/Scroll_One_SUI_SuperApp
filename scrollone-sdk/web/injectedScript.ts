/**
 * ScrollOne SDK v1 - Injected JavaScript
 * 
 * This script is injected into WebView to initialize window.scrollOne
 * Must be self-contained and framework-agnostic
 */

import { SDK_VERSION, BridgeMethod, BridgeEvent, REQUEST_TIMEOUT, MAX_PENDING_REQUESTS } from '../core/constants';

/**
 * Generate the injected JavaScript code
 */
export function generateInjectedScript(config: {
  walletAddress: string | null;
  chainId: number;
  isWalletLocked: boolean;
  kycSharingEnabled: boolean;
}): string {
  const { walletAddress, chainId, isWalletLocked, kycSharingEnabled } = config;

  return `
(function() {
  'use strict';
  
  // Prevent double initialization
  if (window.scrollOne && window.scrollOne.isScrollOne) {
    console.warn('[ScrollOne] Bridge already initialized');
    return;
  }

  const SDK_VERSION = '${SDK_VERSION}';
  const REQUEST_TIMEOUT = ${REQUEST_TIMEOUT};
  const MAX_PENDING_REQUESTS = ${MAX_PENDING_REQUESTS};
  
  const bridgeId = 'scroll_one_bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let messageId = 0;
  const pendingRequests = new Map();
  const listeners = new Map();

  // Initial state
  let state = {
    walletAddress: ${walletAddress ? `'${walletAddress}'` : 'null'},
    chainId: ${chainId},
    isWalletLocked: ${isWalletLocked},
    kycSharingEnabled: ${kycSharingEnabled},
  };

  // Emit event helper
  function emit(event, data) {
    const eventListeners = listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[ScrollOne] Error in event listener:', error);
        }
      });
    }
  }

  // Handle response from native
  function handleResponse(response) {
    if (!response || typeof response !== 'object') return;
    
    const request = pendingRequests.get(response.id);
    if (!request) {
      console.warn('[ScrollOne] Received response for unknown request:', response.id);
      return;
    }

    clearTimeout(request.timeoutId);
    pendingRequests.delete(response.id);

    if (response.success) {
      request.resolve(response.data);
    } else {
      const error = new Error(response.error?.message || 'Unknown error');
      error.name = 'BridgeError';
      if (response.error?.code) {
        error.code = response.error.code;
      }
      request.reject(error);
    }
  }

  // Handle event from native
  function handleEvent(event, data) {
    emit(event, data);
  }

  // Listen for messages from native
  window.addEventListener('message', function(event) {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data.type === 'BRIDGE_RESPONSE' && data.payload) {
        handleResponse(data.payload);
      } else if (data.type === 'BRIDGE_EVENT' && data.event) {
        handleEvent(data.event, data.data);
      }
    } catch (error) {
      console.error('[ScrollOne] Error handling native message:', error);
    }
  });

  // Send message to native
  function sendMessage(type, payload) {
    return new Promise((resolve, reject) => {
      // Check pending request limit
      if (pendingRequests.size >= MAX_PENDING_REQUESTS) {
        reject(new Error('RATE_LIMIT_EXCEEDED: Too many pending requests'));
        return;
      }

      const id = bridgeId + '_' + (++messageId);
      const message = {
        id: id,
        source: 'web',
        type: type,
        payload: payload,
        timestamp: Date.now()
      };

      const timeoutId = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('TIMEOUT: Request timeout'));
      }, REQUEST_TIMEOUT);

      pendingRequests.set(id, {
        resolve: resolve,
        reject: reject,
        timestamp: Date.now(),
        timeoutId: timeoutId
      });

      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else {
          console.error('[ScrollOne] ReactNativeWebView not available');
          pendingRequests.delete(id);
          clearTimeout(timeoutId);
          reject(new Error('EXECUTION_ERROR: ReactNativeWebView not available'));
        }
      } catch (error) {
        pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(new Error('EXECUTION_ERROR: ' + (error.message || 'Unknown error')));
      }
    });
  }

  // Public API
  window.scrollOne = {
    isScrollOne: true,
    version: SDK_VERSION,
    bridgeId: bridgeId,

    // State (read-only)
    get walletAddress() { return state.walletAddress; },
    get chainId() { return state.chainId; },
    get isConnected() { return !!state.walletAddress; },
    get isWalletLocked() { return state.isWalletLocked; },
    get kycSharingEnabled() { return state.kycSharingEnabled; },

    // Methods
    getAccount: function() {
      return sendMessage('GET_ACCOUNT');
    },

    getBalance: function(tokenAddress) {
      return sendMessage('GET_BALANCE', { tokenAddress: tokenAddress });
    },

    signTransaction: function(transaction) {
      return sendMessage('SIGN_TRANSACTION', transaction);
    },

    signMessage: function(message) {
      return sendMessage('SIGN_MESSAGE', { message: message });
    },

    signTypedData: function(domain, types, value) {
      return sendMessage('SIGN_TYPED_DATA', { domain: domain, types: types, value: value });
    },

    getNetwork: function() {
      return sendMessage('GET_NETWORK');
    },

    estimateGas: function(transaction) {
      return sendMessage('ESTIMATE_GAS', transaction);
    },

    // Event system
    on: function(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
    },

    off: function(event, callback) {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    },

    // Internal: Update state (called by native)
    _updateState: function(newState) {
      if (newState.walletAddress !== undefined) {
        const oldAddress = state.walletAddress;
        state.walletAddress = newState.walletAddress;
        if (oldAddress !== newState.walletAddress) {
          emit('accountChanged', { address: newState.walletAddress });
        }
      }
      if (newState.chainId !== undefined) {
        const oldChainId = state.chainId;
        state.chainId = newState.chainId;
        if (oldChainId !== newState.chainId) {
          emit('networkChanged', { chainId: newState.chainId });
        }
      }
      if (newState.isWalletLocked !== undefined) {
        const wasLocked = state.isWalletLocked;
        state.isWalletLocked = newState.isWalletLocked;
        if (wasLocked !== newState.isWalletLocked) {
          emit(newState.isWalletLocked ? 'walletLocked' : 'walletUnlocked', {});
        }
      }
      if (newState.kycSharingEnabled !== undefined) {
        state.kycSharingEnabled = newState.kycSharingEnabled;
      }
    }
  };

  // Dispatch ready event
  window.dispatchEvent(new Event('scrollOneReady'));
  console.log('[ScrollOne] Bridge initialized:', bridgeId);
  
  true;
})();
  `.trim();
}
