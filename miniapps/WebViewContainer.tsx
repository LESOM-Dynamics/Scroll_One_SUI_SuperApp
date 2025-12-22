import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, spacing, typography } from '@/theme';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { type MiniApp } from '@/store/miniAppStore';
import { bridgeService } from '@/services/bridge/bridgeService';
import { BridgeMethod } from '@/scrollone-sdk';
import { scrollProvider } from '@/services/scroll/provider';
import { TransactionApprovalModal } from '@/components/bridge/TransactionApprovalModal';
import type { TransactionRequest } from '@/scrollone-sdk';

interface WebViewContainerProps {
  app: MiniApp;
  onError?: (error: string) => void;
}

export function WebViewContainer({ app, onError }: WebViewContainerProps) {
  const webViewRef = useRef<RNWebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<{
    id: string;
    request: TransactionRequest;
  } | null>(null);
  const { address, isUnlocked } = useWalletStore();
  const { kycSharingEnabled, isTestnet } = useSettingsStore();

  const isWalletLocked = !isUnlocked || !address;
  const config = scrollProvider.getConfig();

  // Generate injected script using SDK
  const generateInjectedScript = useCallback(() => {
    return bridgeService.generateInjectedScript({
      walletAddress: isWalletLocked ? null : address,
      chainId: config.chainId,
      isWalletLocked,
      kycSharingEnabled,
    });
  }, [address, isWalletLocked, kycSharingEnabled, config.chainId]);

  // Handle messages from WebView
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Only handle bridge messages
      if (!data.id || !data.type || data.source !== 'web') {
        return;
      }

      console.log('[WebViewContainer] Bridge message from WebView:', data);

      // Create handler context
      const context = {
        walletAddress: isWalletLocked ? null : address,
        isWalletLocked,
        chainId: config.chainId,
        origin: app.url,
      };

      // Handle message
      const response = await bridgeService.handleMessage(data, context);

      // Check if transaction requires approval
      if (data.type === BridgeMethod.SIGN_TRANSACTION && response.success && response.data?.requiresApproval) {
        // Store pending transaction
        bridgeService.storePendingTransaction(
          data.id,
          data.payload as TransactionRequest,
          (result) => {
            sendResponseToWebView({
              id: data.id,
              success: true,
              data: result,
            });
          },
          (error) => {
            sendResponseToWebView({
              id: data.id,
              success: false,
              error: {
                code: error.code || 'EXECUTION_ERROR',
                message: error.message || 'Unknown error',
              },
            });
          }
        );
        
        // Show approval modal
        setPendingTransaction({
          id: data.id,
          request: data.payload as TransactionRequest,
        });
        return;
      }

      // Send response
      sendResponseToWebView(response);
    } catch (error) {
      console.error('[WebViewContainer] Error handling message:', error);
      sendResponseToWebView({
        id: 'unknown',
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }, [address, isWalletLocked, config.chainId, app.url]);

  // Send response to WebView
  const sendResponseToWebView = useCallback((response: any) => {
    if (webViewRef.current) {
      const message = {
        type: 'BRIDGE_RESPONSE',
        payload: response,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  // Send event to WebView
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

  // Handle transaction approval
  const handleTransactionApproval = useCallback(async (approved: boolean) => {
    if (!pendingTransaction) return;

    const context = {
      walletAddress: isWalletLocked ? null : address,
      isWalletLocked,
      chainId: config.chainId,
      origin: app.url,
    };

    try {
      await bridgeService.executePendingTransaction(
        pendingTransaction.id,
        approved,
        context
      );
    } catch (error) {
      console.error('[WebViewContainer] Error executing transaction:', error);
    }

    setPendingTransaction(null);
  }, [pendingTransaction, address, isWalletLocked, config.chainId, app.url]);

  // Update bridge state when wallet/network changes
  useEffect(() => {
    if (!isLoading && webViewRef.current) {
      const updateScript = `
        if (window.scrollOne && window.scrollOne._updateState) {
          window.scrollOne._updateState({
            walletAddress: ${isWalletLocked ? 'null' : (address ? `'${address}'` : 'null')},
            chainId: ${config.chainId},
            isWalletLocked: ${isWalletLocked},
            kycSharingEnabled: ${kycSharingEnabled},
          });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [address, isWalletLocked, config.chainId, kycSharingEnabled, isLoading]);

  const handleError = () => {
    setError('Failed to load the app');
    setIsLoading(false);
  };

  const handleLoadEnd = () => {
    console.log('[WebViewContainer] WebView loaded successfully');
    setIsLoading(false);
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
      {pendingTransaction && (
        <TransactionApprovalModal
          transaction={pendingTransaction.request}
          onApprove={() => handleTransactionApproval(true)}
          onReject={() => handleTransactionApproval(false)}
        />
      )}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading {app.name}...</Text>
        </View>
      )}
      <RNWebView
        ref={webViewRef}
        source={{ uri: app.url }}
        style={styles.webView}
        injectedJavaScript={generateInjectedScript()}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
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
