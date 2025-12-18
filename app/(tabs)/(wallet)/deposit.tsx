import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, Wallet as WalletIcon, ArrowRightLeft, ExternalLink } from 'lucide-react-native';

import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';

type OnrampProviderId = 'ramp' | 'moonpay' | 'transak';

interface OnrampProvider {
  id: OnrampProviderId;
  name: string;
  description: string;
  fees: string;
}

const ONRAMP_PROVIDERS: OnrampProvider[] = [
  {
    id: 'ramp',
    name: 'Ramp Network',
    description: 'Buy crypto with cards, bank transfer, Apple Pay.',
    fees: 'From ~2–3% depending on region and payment method.',
  },
  {
    id: 'moonpay',
    name: 'MoonPay',
    description: 'Global fiat on-ramp with multiple payment options.',
    fees: 'Dynamic fees by region and payment method.',
  },
  {
    id: 'transak',
    name: 'Transak',
    description: 'Supports cards, bank transfers, and local methods.',
    fees: 'Varies per country and payment rail.',
  },
];

export default function DepositScreen() {
  const router = useRouter();
  const { address } = useWalletStore();
  const { isTestnet } = useSettingsStore();

  const networkLabel = isTestnet ? 'Scroll Sepolia (Testnet)' : 'Scroll Mainnet';

  const handleOpenOnramp = (provider: OnrampProvider) => {
    if (!address) {
      Alert.alert(
        'Wallet not ready',
        'Your wallet address is still loading. Please go back to Wallet and wait a moment, then try again.',
      );
      return;
    }

    router.push(`/(tabs)/(wallet)/onramp/${provider.id}`);
  };

  const handleGoToReceive = () => {
    router.push('/(tabs)/(wallet)/receive');
  };

  const handleOpenScrollBridge = () => {
    if (!address) {
      Alert.alert(
        'Wallet not ready',
        'Your wallet address is still loading. Please go back to Wallet and wait a moment, then try again.',
      );
      return;
    }
    router.push('/(tabs)/(wallet)/bridge');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Deposit',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
        }}
      />
      <Screen padding={false}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.networkPill}>
              <Text style={styles.networkPillText}>{networkLabel}</Text>
            </View>
            <Text style={styles.title}>Deposit to Scroll Wallet</Text>
            <Text style={styles.subtitle}>
              Add funds using fiat on-ramps or by sending crypto from another wallet or exchange.
            </Text>

            <Card variant="glass" style={styles.addressCard}>
              <Text style={styles.addressLabel}>Your Scroll Address</Text>
              <Text style={styles.addressValue} numberOfLines={1}>
                {address || 'Loading wallet address...'}
              </Text>
            </Card>

            {!address && (
              <Card variant="bordered" style={styles.warningCard}>
                <Text style={styles.warningTitle}>Wallet still initializing</Text>
                <Text style={styles.warningText}>
                  Your wallet address is not ready yet. Go back to the Wallet tab and wait a few
                  seconds for initialization to complete, then return here.
                </Text>
                <Button
                  variant="outline"
                  fullWidth
                  style={styles.warningButton}
                  onPress={() => router.back()}
                >
                  Go back to Wallet
                </Button>
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <CreditCard color={colors.accent.neonGreen} size={20} />
                <Text style={styles.sectionTitle}>Fiat On-Ramp</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Buy crypto with cards, bank transfers, or local payment methods. Providers will send
                assets directly to your Scroll wallet address.
              </Text>
            </View>

            {ONRAMP_PROVIDERS.map((provider) => (
              <Card key={provider.id} style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <ExternalLink color={colors.text.secondary} size={18} />
                </View>
                <Text style={styles.providerDescription}>{provider.description}</Text>
                <Text style={styles.providerFees}>{provider.fees}</Text>

                <Button
                  fullWidth
                  style={styles.providerButton}
                  onPress={() => handleOpenOnramp(provider)}
                >
                  Continue with {provider.name}
                </Button>
              </Card>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <WalletIcon color={colors.accent.electricBlue} size={20} />
                <Text style={styles.sectionTitle}>Crypto Deposit (Non-fiat)</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Send existing crypto from another wallet or exchange directly to your Scroll
                address.
              </Text>
            </View>

            <Card style={styles.stepsCard}>
              <Text style={styles.stepTitle}>From another wallet</Text>
              <Text style={styles.stepText}>
                1. Copy or scan your Scroll address using the Receive screen.
              </Text>
              <Text style={styles.stepText}>
                2. In the external wallet, choose the Scroll network and paste your address.
              </Text>
              <Text style={styles.stepText}>
                3. Confirm the transaction and wait for confirmation.
              </Text>

              <Button
                variant="outline"
                fullWidth
                style={styles.stepButton}
                onPress={handleGoToReceive}
              >
                View Receive QR & Address
              </Button>
            </Card>

            <Card style={styles.stepsCard}>
              <View style={styles.sectionTitleRow}>
                <ArrowRightLeft color={colors.accent.primary} size={18} />
                <Text style={styles.stepTitle}>From other chains / exchanges</Text>
              </View>
              <Text style={styles.stepText}>
                1. Use the official Scroll Bridge or a supported CEX withdrawal to move funds to
                Scroll.
              </Text>
              <Text style={styles.stepText}>
                2. Always double-check that you are withdrawing to the Scroll network and using the
                correct address.
              </Text>

              <Button fullWidth style={styles.stepButton} onPress={handleOpenScrollBridge}>
                Open Scroll Bridge
              </Button>
            </Card>
          </View>

          <View style={styles.section}>
            <Card variant="bordered" style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>Important</Text>
              <Text style={styles.disclaimerText}>
                On-ramp providers are third-party services. Scroll One does not custody your funds
                and is not responsible for delays, fees, or issues with those services. Always
                double-check the network and destination address before confirming a deposit.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  networkPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    marginBottom: spacing.sm,
  },
  networkPillText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  addressCard: {
    marginTop: spacing.lg,
  },
  addressLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  addressValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  warningCard: {
    marginTop: spacing.lg,
  },
  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.status.warning,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  warningButton: {
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  providerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  providerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  providerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  providerFees: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  providerButton: {
    marginTop: spacing.xs,
  },
  stepsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  stepButton: {
    marginTop: spacing.sm,
  },
  disclaimerCard: {
    marginBottom: spacing.lg,
  },
  disclaimerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  disclaimerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
});


