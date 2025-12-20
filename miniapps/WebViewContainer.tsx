import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, spacing, typography } from '@/theme';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { type MiniApp } from '@/store/miniAppStore';

interface WebViewContainerProps {
  app: MiniApp;
  onError?: (error: string) => void;
}

export function WebViewContainer({ app, onError }: WebViewContainerProps) {
  const webViewRef = useRef<RNWebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isUnlocked } = useWalletStore();
  const { kycSharingEnabled } = useSettingsStore();

  const isWalletLocked = !isUnlocked || !address;

  const injectedJavaScript = `
    (function() {
      window.scrollOne = {
        walletAddress: ${isWalletLocked ? "''" : `'${address || ''}'`},
        chainId: 534352,
        isScrollOne: true,
        version: '1.0.0',
        // Indicates whether the native wallet is currently locked.
        // When true, sensitive actions (signing, transactions) may be blocked by the host app.
        isWalletLocked: ${isWalletLocked ? 'true' : 'false'},
        // Indicates whether the user has allowed sharing of KYC verification status
        // with trusted mini-apps. This does NOT expose any personal data or documents.
        kycSharingEnabled: ${kycSharingEnabled ? 'true' : 'false'},
      };
      
      window.addEventListener('message', function(event) {
        console.log('Message received in WebView:', event.data);
      });
      
      console.log('Scroll One bridge initialized');
      
      true;
    })();
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[WebViewContainer] Message from WebView:', data);
      
      if (data.type === 'SIGN_TRANSACTION') {
        console.log('[WebViewContainer] Sign transaction request:', data.payload);
      } else if (data.type === 'GET_BALANCE') {
        console.log('[WebViewContainer] Get balance request');
      }
    } catch (error) {
      console.error('[WebViewContainer] Error parsing message:', error);
    }
  };

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
        injectedJavaScript={injectedJavaScript}
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
