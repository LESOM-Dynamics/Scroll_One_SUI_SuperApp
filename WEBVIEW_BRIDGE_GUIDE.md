# WebView Bridge Integration - Complete Technical Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Native App Implementation](#native-app-implementation)
4. [dApp Side Implementation](#dapp-side-implementation)
5. [Message Protocol](#message-protocol)
6. [Security Considerations](#security-considerations)
7. [Implementation Steps](#implementation-steps)
8. [Testing Guide](#testing-guide)

---

## Overview

The WebView Bridge enables secure two-way communication between dApps (MiniApps) loaded in WebView and the Scroll One SuperApp native wallet. This allows dApps to:

- Request wallet connection
- Get account address and balance
- Sign and send transactions
- Sign messages and typed data
- Switch networks
- Estimate gas fees

---

## Architecture

### Communication Flow

```text
┌─────────────────┐
│   dApp (Web)    │
│  (WebView)      │
└────────┬────────┘
         │
         │ postMessage()
         ▼
┌─────────────────┐
│  Injected JS    │
│  Bridge SDK     │
└────────┬────────┘
         │
         │ React Native WebView
         │ onMessage event
         ▼
┌─────────────────┐
│ Bridge Handler  │
│ (React Native)  │
└────────┬────────┘
         │
         │ Service calls
         ▼
┌─────────────────┐
│ Wallet Service  │
│ Provider        │
└─────────────────┘
```

### Key Components

1. **Injected JavaScript Bridge** - Runs in WebView, provides `window.scrollOne` API
2. **Bridge Handler** - React Native component that processes messages
3. **Bridge Service** - Core logic for message routing and validation
4. **Transaction Approval UI** - Modal for user confirmation
5. **dApp SDK** - JavaScript library for dApp developers

---

## Native App Implementation

### File Structure

```text
services/
  bridge/
    bridgeService.ts       # Core bridge logic
    types.ts               # TypeScript types
    messageQueue.ts        # Request/response queue
miniapps/
  WebViewContainer.tsx     # Enhanced WebView wrapper
  WebViewBridgeHandler.tsx # Message handler component
components/
  bridge/
    TransactionApprovalModal.tsx  # Transaction approval UI
```

### Wallet Locking, Biometrics, and Settings

The bridge is sensitive to the native wallet lock state and certain privacy settings:

- The native app may require **biometric authentication** (Face ID / Touch ID / fingerprint or device passcode) before loading the wallet.
- Until the wallet is loaded, the WebView bridge treats the wallet as **locked** and may restrict signing and transaction-related methods.
- Users can configure these behaviors from the **Privacy & Security** screen in the app.

The injected `window.scrollOne` object currently includes:

```ts
window.scrollOne = {
  walletAddress: string;      // '' when wallet is not yet loaded / locked
  chainId: number;            // e.g. 534352
  isScrollOne: true;
  version: string;
  isWalletLocked: boolean;    // true when no unlocked wallet is available in the host app
};
```

> Note: Additional flags (for example, KYC sharing status) may be added in future revisions of the protocol. dApps should treat unknown properties as optional and feature-detect them rather than relying on a fixed shape.

### 1. Bridge Types (`services/bridge/types.ts`)

```typescript
export interface BridgeMessage {
  id: string;
  type: BridgeMessageType;
  payload?: any;
  timestamp: number;
}

export type BridgeMessageType =
  | 'GET_ACCOUNT'
  | 'GET_BALANCE'
  | 'SIGN_TRANSACTION'
  | 'SIGN_MESSAGE'
  | 'SIGN_TYPED_DATA'
  | 'GET_NETWORK'
  | 'SWITCH_NETWORK'
  | 'ESTIMATE_GAS'
  | 'GET_TRANSACTION_STATUS';

export interface BridgeResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface SignMessageRequest {
  message: string;
}

export interface SignTypedDataRequest {
  domain: any;
  types: any;
  value: any;
}
```

### 2. Bridge Service (`services/bridge/bridgeService.ts`)

```typescript
import { BridgeMessage, BridgeResponse, TransactionRequest } from './types';
import { scrollProvider } from '../scroll/provider';
import { signTransaction, signMessage, sendTransaction } from '../scroll/wallet';
import { parseEther, formatEther } from 'ethers';

class BridgeService {
  private pendingRequests: Map<string, (response: BridgeResponse) => void> = new Map();

  async handleMessage(
    message: BridgeMessage,
    walletAddress: string | null
  ): Promise<BridgeResponse> {
    // Validate message
    if (!this.validateMessage(message)) {
      return this.createErrorResponse(message.id, 'INVALID_MESSAGE', 'Invalid message format');
    }

    // Check wallet connection
    if (!walletAddress && this.requiresWallet(message.type)) {
      return this.createErrorResponse(message.id, 'WALLET_NOT_CONNECTED', 'Wallet not connected');
    }

    try {
      switch (message.type) {
        case 'GET_ACCOUNT':
          return this.handleGetAccount(message.id, walletAddress);
        
        case 'GET_BALANCE':
          return this.handleGetBalance(message.id, walletAddress!);
        
        case 'SIGN_TRANSACTION':
          return await this.handleSignTransaction(message.id, message.payload);
        
        case 'SIGN_MESSAGE':
          return await this.handleSignMessage(message.id, message.payload);
        
        case 'GET_NETWORK':
          return this.handleGetNetwork(message.id);
        
        case 'ESTIMATE_GAS':
          return await this.handleEstimateGas(message.id, message.payload);
        
        default:
          return this.createErrorResponse(message.id, 'UNSUPPORTED_METHOD', 'Method not supported');
      }
    } catch (error: any) {
      return this.createErrorResponse(
        message.id,
        'EXECUTION_ERROR',
        error.message || 'Unknown error'
      );
    }
  }

  private validateMessage(message: BridgeMessage): boolean {
    return !!(
      message.id &&
      message.type &&
      typeof message.timestamp === 'number'
    );
  }

  private requiresWallet(type: BridgeMessageType): boolean {
    return [
      'GET_ACCOUNT',
      'GET_BALANCE',
      'SIGN_TRANSACTION',
      'SIGN_MESSAGE',
      'SIGN_TYPED_DATA',
    ].includes(type);
  }

  private handleGetAccount(id: string, address: string | null): BridgeResponse {
    return {
      id,
      success: true,
      data: {
        address: address || null,
        isConnected: !!address,
      },
    };
  }

  private async handleGetBalance(id: string, address: string): Promise<BridgeResponse> {
    try {
      const balance = await scrollProvider.getBalance(address);
      return {
        id,
        success: true,
        data: {
          balance,
          formatted: formatEther(parseEther(balance)),
        },
      };
    } catch (error: any) {
      return this.createErrorResponse(id, 'BALANCE_ERROR', error.message);
    }
  }

  private async handleSignTransaction(
    id: string,
    payload: TransactionRequest
  ): Promise<BridgeResponse> {
    // This will be handled by the UI component for user approval
    // Return a pending response that will be resolved after user approval
    return {
      id,
      success: true,
      data: {
        pending: true,
        requiresApproval: true,
      },
    };
  }

  private async handleSignMessage(id: string, payload: SignMessageRequest): Promise<BridgeResponse> {
    try {
      const provider = scrollProvider.getProvider();
      const signature = await signMessage(payload.message);
      
      return {
        id,
        success: true,
        data: { signature },
      };
    } catch (error: any) {
      return this.createErrorResponse(id, 'SIGN_ERROR', error.message);
    }
  }

  private handleGetNetwork(id: string): BridgeResponse {
    const config = scrollProvider.getConfig();
    return {
      id,
      success: true,
      data: {
        chainId: config.chainId,
        chainName: config.chainName,
        rpcUrl: config.rpcUrl,
        isTestnet: config.chainId === 534351,
      },
    };
  }

  private async handleEstimateGas(
    id: string,
    payload: TransactionRequest
  ): Promise<BridgeResponse> {
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
        id,
        success: true,
        data: {
          gasLimit: gasEstimate.toString(),
          gasPrice: gasPrice.toString(),
          estimatedFee: formatEther(totalFee.toString()),
        },
      };
    } catch (error: any) {
      return this.createErrorResponse(id, 'GAS_ESTIMATE_ERROR', error.message);
    }
  }

  private createErrorResponse(
    id: string,
    code: string,
    message: string
  ): BridgeResponse {
    return {
      id,
      success: false,
      error: { code, message },
    };
  }
}

export const bridgeService = new BridgeService();
```

### 3. Enhanced WebViewContainer (`miniapps/WebViewContainer.tsx`)

```typescript
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, spacing, typography } from '@/theme';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { type MiniApp } from '@/store/miniAppStore';
import { WebViewBridgeHandler } from './WebViewBridgeHandler';
import { scrollProvider } from '@/services/scroll/provider';

interface WebViewContainerProps {
  app: MiniApp;
  onError?: (error: string) => void;
}

export function WebViewContainer({ app, onError }: WebViewContainerProps) {
  const webViewRef = useRef<RNWebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, balance } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const [bridgeReady, setBridgeReady] = useState(false);

  // Generate injected JavaScript with current wallet state
  const generateInjectedJavaScript = useCallback(() => {
    const config = scrollProvider.getConfig();
    
    return `
      (function() {
        if (window.scrollOne) {
          console.warn('Scroll One bridge already initialized');
          return;
        }

        const bridgeId = 'scroll_one_bridge_' + Date.now();
        let messageId = 0;
        const pendingRequests = new Map();

        // Initialize bridge
        window.scrollOne = {
          isScrollOne: true,
          version: '1.0.0',
          bridgeId: bridgeId,
          
          // Connection state
          walletAddress: ${address ? `'${address}'` : 'null'},
          chainId: ${config.chainId},
          isConnected: ${!!address},
          
          // Request queue
          _pendingRequests: pendingRequests,
          
          // Send message to native
          _sendMessage: function(type, payload) {
            return new Promise((resolve, reject) => {
              const id = bridgeId + '_' + (++messageId);
              const message = {
                id: id,
                type: type,
                payload: payload,
                timestamp: Date.now()
              };
              
              pendingRequests.set(id, { resolve, reject, timestamp: Date.now() });
              
              // Send to React Native
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
              } else {
                console.error('ReactNativeWebView not available');
                reject(new Error('Bridge not available'));
              }
              
              // Timeout after 30 seconds
              setTimeout(() => {
                if (pendingRequests.has(id)) {
                  pendingRequests.delete(id);
                  reject(new Error('Request timeout'));
                }
              }, 30000);
            });
          },
          
          // Handle response from native
          _handleResponse: function(response) {
            const request = pendingRequests.get(response.id);
            if (request) {
              pendingRequests.delete(response.id);
              if (response.success) {
                request.resolve(response.data);
              } else {
                request.reject(new Error(response.error?.message || 'Unknown error'));
              }
            }
          },
          
          // Public API methods
          getAccount: function() {
            return this._sendMessage('GET_ACCOUNT');
          },
          
          getBalance: function(tokenAddress) {
            return this._sendMessage('GET_BALANCE', { tokenAddress });
          },
          
          signTransaction: function(transaction) {
            return this._sendMessage('SIGN_TRANSACTION', transaction);
          },
          
          signMessage: function(message) {
            return this._sendMessage('SIGN_MESSAGE', { message });
          },
          
          signTypedData: function(domain, types, value) {
            return this._sendMessage('SIGN_TYPED_DATA', { domain, types, value });
          },
          
          getNetwork: function() {
            return this._sendMessage('GET_NETWORK');
          },
          
          estimateGas: function(transaction) {
            return this._sendMessage('ESTIMATE_GAS', transaction);
          },
          
          // Event listeners
          _listeners: {},
          on: function(event, callback) {
            if (!this._listeners[event]) {
              this._listeners[event] = [];
            }
            this._listeners[event].push(callback);
          },
          
          off: function(event, callback) {
            if (this._listeners[event]) {
              this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
            }
          },
          
          _emit: function(event, data) {
            if (this._listeners[event]) {
              this._listeners[event].forEach(callback => callback(data));
            }
          }
        };
        
        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'BRIDGE_RESPONSE' && window.scrollOne) {
              window.scrollOne._handleResponse(data.payload);
            } else if (data.type === 'BRIDGE_EVENT' && window.scrollOne) {
              window.scrollOne._emit(data.event, data.data);
            }
          } catch (e) {
            console.error('Error handling bridge message:', e);
          }
        });
        
        // Dispatch ready event
        window.dispatchEvent(new Event('scrollOneReady'));
        console.log('Scroll One bridge initialized:', bridgeId);
        
        true;
      })();
    `;
  }, [address, isTestnet]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[WebViewContainer] Message from WebView:', data);
      
      // Handle bridge messages
      if (data.id && data.type) {
        // Message will be handled by WebViewBridgeHandler
        // This is just for logging
      }
    } catch (error) {
      console.error('[WebViewContainer] Error parsing message:', error);
    }
  }, []);

  const sendResponseToWebView = useCallback((response: any) => {
    if (webViewRef.current) {
      const message = {
        type: 'BRIDGE_RESPONSE',
        payload: response,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  const sendEventToWebView = useCallback((event: string, data: any) => {
    if (webViewRef.current) {
      const message = {
        type: 'BRIDGE_EVENT',
        event,
        data,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    // Update bridge when wallet address changes
    if (bridgeReady && webViewRef.current) {
      const updateScript = `
        if (window.scrollOne) {
          window.scrollOne.walletAddress = ${address ? `'${address}'` : 'null'};
          window.scrollOne.isConnected = ${!!address};
          window.scrollOne._emit('accountChanged', { address: ${address ? `'${address}'` : 'null'} });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [address, bridgeReady]);

  useEffect(() => {
    // Update bridge when network changes
    if (bridgeReady && webViewRef.current) {
      const config = scrollProvider.getConfig();
      const updateScript = `
        if (window.scrollOne) {
          window.scrollOne.chainId = ${config.chainId};
          window.scrollOne._emit('networkChanged', { chainId: ${config.chainId} });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [isTestnet, bridgeReady]);

  const handleLoadEnd = () => {
    console.log('[WebViewContainer] WebView loaded successfully');
    setIsLoading(false);
    setBridgeReady(true);
  };

  const handleError = () => {
    setError('Failed to load the app');
    setIsLoading(false);
    onError?.('Failed to load the app');
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>
          MiniApps are best experienced on mobile devices
        </Text>
        <Text style={styles.webFallbackSubtext}>
          Open this app on your phone to access {app.name}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load {app.name}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebViewBridgeHandler
        webViewRef={webViewRef}
        onResponse={sendResponseToWebView}
        onEvent={sendEventToWebView}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.neonGreen} />
          <Text style={styles.loadingText}>Loading {app.name}...</Text>
        </View>
      )}
      <RNWebView
        ref={webViewRef}
        source={{ uri: app.url }}
        style={styles.webView}
        injectedJavaScript={generateInjectedJavaScript()}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onShouldStartLoadWithRequest={(request) => {
          // Allow navigation within the same domain
          return true;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 48,
    marginBottom: spacing.base,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center' as const,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center' as const,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  webFallbackText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center' as const,
  },
  webFallbackSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center' as const,
  },
});
```

### 4. Bridge Handler Component (`miniapps/WebViewBridgeHandler.tsx`)

```typescript
import { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { bridgeService } from '@/services/bridge/bridgeService';
import { useWalletStore } from '@/store/walletStore';
import { TransactionApprovalModal } from '@/components/bridge/TransactionApprovalModal';
import { TransactionRequest } from '@/services/bridge/types';
import { scrollProvider } from '@/services/scroll/provider';
import { sendTransaction } from '@/services/scroll/wallet';
import { parseEther } from 'ethers';

interface WebViewBridgeHandlerProps {
  webViewRef: React.RefObject<WebView>;
  onResponse: (response: any) => void;
  onEvent: (event: string, data: any) => void;
}

export function WebViewBridgeHandler({
  webViewRef,
  onResponse,
  onEvent,
}: WebViewBridgeHandlerProps) {
  const { address } = useWalletStore();
  const [pendingTransaction, setPendingTransaction] = useState<{
    id: string;
    request: TransactionRequest;
  } | null>(null);
  const messageHandlerRef = useRef<((event: any) => void) | null>(null);

  useEffect(() => {
    // Create message handler
    messageHandlerRef.current = async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent?.data || event.data);
        
        if (!data.id || !data.type) {
          return; // Not a bridge message
        }

        console.log('[BridgeHandler] Received message:', data);

        // Handle transaction signing separately (requires UI)
        if (data.type === 'SIGN_TRANSACTION') {
          setPendingTransaction({
            id: data.id,
            request: data.payload,
          });
          return;
        }

        // Handle other messages
        const response = await bridgeService.handleMessage(data, address);
        onResponse(response);
      } catch (error: any) {
        console.error('[BridgeHandler] Error handling message:', error);
        onResponse({
          id: 'unknown',
          success: false,
          error: {
            code: 'HANDLER_ERROR',
            message: error.message,
          },
        });
      }
    };

    // Note: The actual message handling is done in WebViewContainer's handleMessage
    // This component provides the transaction approval UI
  }, [address, onResponse]);

  const handleTransactionApproval = async (approved: boolean) => {
    if (!pendingTransaction) return;

    if (approved) {
      try {
        // Sign and send transaction
        const provider = scrollProvider.getProvider();
        
        const txRequest = {
          to: pendingTransaction.request.to,
          value: pendingTransaction.request.value
            ? parseEther(pendingTransaction.request.value)
            : undefined,
          data: pendingTransaction.request.data,
          gasLimit: pendingTransaction.request.gasLimit
            ? BigInt(pendingTransaction.request.gasLimit)
            : undefined,
        };

        const txResponse = await sendTransaction(txRequest, provider);
        
        onResponse({
          id: pendingTransaction.id,
          success: true,
          data: {
            hash: txResponse.hash,
            from: txResponse.from,
            to: txResponse.to,
          },
        });
      } catch (error: any) {
        onResponse({
          id: pendingTransaction.id,
          success: false,
          error: {
            code: 'TRANSACTION_ERROR',
            message: error.message,
          },
        });
      }
    } else {
      onResponse({
        id: pendingTransaction.id,
        success: false,
        error: {
          code: 'USER_REJECTED',
          message: 'User rejected the transaction',
        },
      });
    }

    setPendingTransaction(null);
  };

  return (
    <>
      {pendingTransaction && (
        <TransactionApprovalModal
          transaction={pendingTransaction.request}
          onApprove={() => handleTransactionApproval(true)}
          onReject={() => handleTransactionApproval(false)}
        />
      )}
    </>
  );
}
```

### 5. Transaction Approval Modal (`components/bridge/TransactionApprovalModal.tsx`)

```typescript
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { TransactionRequest } from '@/services/bridge/types';
import { formatEther } from 'ethers';

interface TransactionApprovalModalProps {
  transaction: TransactionRequest;
  onApprove: () => void;
  onReject: () => void;
}

export function TransactionApprovalModal({
  transaction,
  onApprove,
  onReject,
}: TransactionApprovalModalProps) {
  const valueEth = transaction.value
    ? formatEther(transaction.value)
    : '0';

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Review Transaction</Text>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>To:</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                {transaction.to}
              </Text>
            </View>

            {transaction.value && (
              <View style={styles.section}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>{valueEth} ETH</Text>
              </View>
            )}

            {transaction.data && (
              <View style={styles.section}>
                <Text style={styles.label}>Data:</Text>
                <Text style={styles.value} numberOfLines={3}>
                  {transaction.data}
                </Text>
              </View>
            )}

            {transaction.gasLimit && (
              <View style={styles.section}>
                <Text style={styles.label}>Gas Limit:</Text>
                <Text style={styles.value}>{transaction.gasLimit}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  button: {
    flex: 1,
    padding: spacing.base,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.background.secondary,
  },
  rejectButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  approveButton: {
    backgroundColor: colors.accent.neonGreen,
  },
  approveButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
```

---

## dApp Side Implementation

### JavaScript SDK for dApps

dApps need to include this SDK to communicate with the Scroll One wallet. The SDK is automatically injected, but dApps can also include it manually.

### SDK Usage Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My dApp</title>
</head>
<body>
  <h1>My Scroll dApp</h1>
  <button id="connectBtn">Connect Wallet</button>
  <button id="sendTxBtn">Send Transaction</button>
  
  <script>
    // Wait for Scroll One bridge to be ready
    window.addEventListener('scrollOneReady', () => {
      console.log('Scroll One bridge ready!');
      initializeApp();
    });

    // Or check if already ready
    if (window.scrollOne && window.scrollOne.isScrollOne) {
      initializeApp();
    }

    async function initializeApp() {
      const connectBtn = document.getElementById('connectBtn');
      const sendTxBtn = document.getElementById('sendTxBtn');

      // Check connection
      const account = await window.scrollOne.getAccount();
      if (account.isConnected) {
        console.log('Connected:', account.address);
        connectBtn.textContent = `Connected: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
      }

      // Connect wallet
      connectBtn.addEventListener('click', async () => {
        try {
          const account = await window.scrollOne.getAccount();
          if (account.isConnected) {
            alert('Already connected: ' + account.address);
          } else {
            alert('Please connect wallet in Scroll One app');
          }
        } catch (error) {
          console.error('Connection error:', error);
        }
      });

      // Send transaction
      sendTxBtn.addEventListener('click', async () => {
        try {
          // First estimate gas
          const gasEstimate = await window.scrollOne.estimateGas({
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            value: '0.01', // 0.01 ETH
          });

          console.log('Gas estimate:', gasEstimate);

          // Send transaction
          const result = await window.scrollOne.signTransaction({
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            value: '0.01',
            gasLimit: gasEstimate.gasLimit,
          });

          console.log('Transaction sent:', result.hash);
          alert('Transaction sent: ' + result.hash);
        } catch (error) {
          console.error('Transaction error:', error);
          alert('Transaction failed: ' + error.message);
        }
      });

      // Listen for account changes
      window.scrollOne.on('accountChanged', (data) => {
        console.log('Account changed:', data);
        if (data.address) {
          connectBtn.textContent = `Connected: ${data.address.slice(0, 6)}...${data.address.slice(-4)}`;
        } else {
          connectBtn.textContent = 'Connect Wallet';
        }
      });

      // Listen for network changes
      window.scrollOne.on('networkChanged', (data) => {
        console.log('Network changed:', data);
      });
    }
  </script>
</body>
</html>
```

### React/Next.js Integration Example

```typescript
// hooks/useScrollOne.ts
import { useEffect, useState } from 'react';

interface ScrollOneAccount {
  address: string | null;
  isConnected: boolean;
}

declare global {
  interface Window {
    scrollOne?: {
      isScrollOne: boolean;
      getAccount: () => Promise<ScrollOneAccount>;
      getBalance: () => Promise<any>;
      signTransaction: (tx: any) => Promise<any>;
      signMessage: (message: string) => Promise<any>;
      estimateGas: (tx: any) => Promise<any>;
      getNetwork: () => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      off: (event: string, callback: (data: any) => void) => void;
    };
  }
}

export function useScrollOne() {
  const [account, setAccount] = useState<ScrollOneAccount>({
    address: null,
    isConnected: false,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkBridge = () => {
      if (window.scrollOne && window.scrollOne.isScrollOne) {
        setIsReady(true);
        loadAccount();
      }
    };

    // Check immediately
    checkBridge();

    // Listen for ready event
    window.addEventListener('scrollOneReady', checkBridge);

    // Listen for account changes
    if (window.scrollOne) {
      window.scrollOne.on('accountChanged', (data: any) => {
        setAccount({
          address: data.address,
          isConnected: !!data.address,
        });
      });
    }

    return () => {
      window.removeEventListener('scrollOneReady', checkBridge);
    };
  }, []);

  const loadAccount = async () => {
    try {
      if (window.scrollOne) {
        const accountData = await window.scrollOne.getAccount();
        setAccount(accountData);
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  const sendTransaction = async (to: string, value: string) => {
    if (!isReady || !window.scrollOne) throw new Error('Bridge not ready');
    return await window.scrollOne.signTransaction({ to, value });
  };

  const signMessage = async (message: string) => {
    if (!isReady || !window.scrollOne) throw new Error('Bridge not ready');
    return await window.scrollOne.signMessage(message);
  };

  return {
    account,
    isReady,
    sendTransaction,
    signMessage,
    getBalance: () => window.scrollOne?.getBalance(),
    getNetwork: () => window.scrollOne?.getNetwork(),
  };
}

// Usage in component
function MyComponent() {
  const { account, isReady, sendTransaction } = useScrollOne();

  const handleSend = async () => {
    try {
      const result = await sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0.01'
      );
      console.log('Transaction hash:', result.hash);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {isReady ? (
        <>
          <p>Connected: {account.address}</p>
          <button onClick={handleSend}>Send Transaction</button>
        </>
      ) : (
        <p>Please open in Scroll One app</p>
      )}
    </div>
  );
}
```

---

## Message Protocol

### Request Format

```typescript
{
  id: string;           // Unique message ID
  type: string;         // Message type
  payload?: any;        // Optional payload
  timestamp: number;     // Unix timestamp
}
```

### Response Format

```typescript
{
  id: string;           // Matches request ID
  success: boolean;
  data?: any;           // Response data (if success)
  error?: {             // Error info (if failed)
    code: string;
    message: string;
  };
}
```

### Supported Message Types

1. **GET_ACCOUNT** - Get connected wallet address
2. **GET_BALANCE** - Get ETH balance
3. **SIGN_TRANSACTION** - Sign and send transaction
4. **SIGN_MESSAGE** - Sign arbitrary message
5. **SIGN_TYPED_DATA** - Sign EIP-712 typed data
6. **GET_NETWORK** - Get current network info
7. **ESTIMATE_GAS** - Estimate transaction gas

---

## Security Considerations

1. **Origin Validation** - Only accept messages from registered dApp URLs
2. **Message Validation** - Validate all message formats and types
3. **User Approval** - Always show approval UI for sensitive operations
4. **Rate Limiting** - Prevent message spam
5. **Timeout Handling** - Set timeouts for all async operations
6. **Error Handling** - Proper error messages without exposing sensitive data

---

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1)

1. Create `services/bridge/types.ts`
2. Create `services/bridge/bridgeService.ts`
3. Update `miniapps/WebViewContainer.tsx` with enhanced bridge
4. Test basic message passing

### Phase 2: Transaction Flow (Week 2)

1. Create `components/bridge/TransactionApprovalModal.tsx`
2. Create `miniapps/WebViewBridgeHandler.tsx`
3. Implement transaction signing flow
4. Test transaction approval and sending

### Phase 3: Advanced Features (Week 3)

1. Implement message signing
2. Implement typed data signing
3. Add network switching support
4. Add gas estimation

### Phase 4: Testing & Documentation (Week 4)

1. Create test dApp
2. Write integration tests
3. Update documentation
4. Create SDK examples

---

## Testing Guide

### Manual Testing

1. Load a test dApp in WebView
2. Test each bridge method
3. Verify transaction approval flow
4. Test error handling

### Test dApp

Create a simple HTML file to test all bridge functionality:

```html
<!-- test-dapp.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Bridge Test dApp</title>
</head>
<body>
  <h1>Scroll One Bridge Test</h1>
  <div id="status">Waiting for bridge...</div>
  <button onclick="testGetAccount()">Get Account</button>
  <button onclick="testGetBalance()">Get Balance</button>
  <button onclick="testSendTransaction()">Send Transaction</button>
  <pre id="output"></pre>

  <script>
    function log(message) {
      document.getElementById('output').textContent += message + '\n';
    }

    window.addEventListener('scrollOneReady', () => {
      document.getElementById('status').textContent = 'Bridge Ready!';
      log('Bridge initialized');
    });

    async function testGetAccount() {
      try {
        const account = await window.scrollOne.getAccount();
        log('Account: ' + JSON.stringify(account));
      } catch (error) {
        log('Error: ' + error.message);
      }
    }

    async function testGetBalance() {
      try {
        const balance = await window.scrollOne.getBalance();
        log('Balance: ' + JSON.stringify(balance));
      } catch (error) {
        log('Error: ' + error.message);
      }
    }

    async function testSendTransaction() {
      try {
        const result = await window.scrollOne.signTransaction({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          value: '0.001',
        });
        log('Transaction: ' + JSON.stringify(result));
      } catch (error) {
        log('Error: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

---

## Conclusion

This guide provides a complete implementation of the WebView Bridge for Scroll One SuperApp. Follow the phases sequentially, test thoroughly, and ensure security best practices are followed throughout.

For questions or issues, refer to the code examples and ensure all dependencies are properly installed.
