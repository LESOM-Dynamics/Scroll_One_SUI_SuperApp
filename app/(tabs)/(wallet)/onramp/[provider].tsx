import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { WebViewContainer } from '@/miniapps/WebViewContainer';
import { type MiniApp } from '@/store/miniAppStore';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Button } from '@/components/ui/Button';

const PROVIDER_CONFIG = {
  ramp: {
    name: 'Ramp Network',
    buildUrl: (address: string, isTestnet: boolean) =>
      isTestnet
        ? `https://ramp.network/buy/?defaultAsset=ETH_SCROLL_SEPOLIA&userAddress=${encodeURIComponent(
            address,
          )}`
        : `https://ramp.network/buy/?defaultAsset=ETH_SCROLL&userAddress=${encodeURIComponent(
            address,
          )}`,
  },
  moonpay: {
    name: 'MoonPay',
    buildUrl: (address: string, isTestnet: boolean) =>
      isTestnet
        ? `https://buy.moonpay.com/?walletAddress=${encodeURIComponent(
            address,
          )}&currencyCode=eth&blockchain=scroll-sepolia`
        : `https://buy.moonpay.com/?walletAddress=${encodeURIComponent(
            address,
          )}&currencyCode=eth&blockchain=scroll`,
  },
  transak: {
    name: 'Transak',
    buildUrl: (address: string, isTestnet: boolean) =>
      isTestnet
        ? `https://global.transak.com/?walletAddress=${encodeURIComponent(
            address,
          )}&cryptoCurrencyCode=ETH&network=scroll-sepolia`
        : `https://global.transak.com/?walletAddress=${encodeURIComponent(
            address,
          )}&cryptoCurrencyCode=ETH&network=scroll`,
  },
} as const;

type ProviderKey = keyof typeof PROVIDER_CONFIG;

export default function OnrampProviderScreen() {
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const { address } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const router = useRouter();

  const networkLabel = isTestnet ? 'Scroll Sepolia (Testnet)' : 'Scroll Mainnet';

  const config = useMemo(() => {
    if (!provider) return undefined;
    const key = provider as ProviderKey;
    return PROVIDER_CONFIG[key];
  }, [provider]);

  if (!config || !address) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'On-ramp',
            headerStyle: { backgroundColor: colors.background.primary },
            headerTintColor: colors.text.primary,
          }}
        />
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Unable to open provider</Text>
          <Text style={styles.fallbackText}>
            Your wallet address is not ready or this provider is not recognized. Go back to Deposit
            and try again after the wallet fully initializes.
          </Text>
          <Button
            variant="outline"
            fullWidth
            style={styles.fallbackButton}
            onPress={() => router.back()}
          >
            Go back to Deposit
          </Button>
        </View>
      </>
    );
  }

  const app: MiniApp = {
    id: `onramp-${provider}`,
    name: config.name,
    url: config.buildUrl(address, isTestnet),
    icon: '💳',
    description: `${config.name} on-ramp`,
    category: 'Onramp',
    featured: false,
    verified: true,
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: config.name,
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
        }}
      />
      <View style={styles.container}>
        <View style={styles.networkPill}>
          <Text style={styles.networkPillText}>{networkLabel}</Text>
        </View>
        <WebViewContainer app={app} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  networkPill: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
  },
  networkPillText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fallbackTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fallbackButton: {
    marginTop: spacing.md,
  },
});

