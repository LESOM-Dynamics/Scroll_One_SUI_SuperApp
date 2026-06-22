import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { WebViewContainer } from '@/miniapps/WebViewContainer';
import { type MiniApp } from '@/store/miniAppStore';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function BridgeScreen() {
  const { address } = useWalletStore();
  const { isTestnet } = useSettingsStore();

  const networkLabel = isTestnet ? 'Sui Testnet' : 'Sui Mainnet';

  const bridgeUrl = isTestnet
    ? 'https://portalbridge.com/sui'
    : 'https://portalbridge.com/sui';

  const app: MiniApp = {
    id: isTestnet ? 'wormhole-bridge-testnet' : 'wormhole-bridge',
    name: 'Wormhole Bridge',
    url: bridgeUrl,
    icon: '🌉',
    description: 'Bridge assets to and from Sui.',
    category: 'Bridge',
    featured: false,
    verified: true,
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sui Bridge',
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
});

