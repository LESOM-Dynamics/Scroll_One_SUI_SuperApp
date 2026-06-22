import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Fingerprint, Wallet, ArrowRight, Sparkles } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { createWallet } from '@/services/sui/wallet';
import { suiProvider } from '@/services/sui/provider';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

export default function SignUpScreen() {
  const router = useRouter();
  const { setAddress, setBalance, setUnlocked } = useWalletStore();
  const { setBiometricAuthEnabled } = useSettingsStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isEnablingBiometrics, setIsEnablingBiometrics] = useState(false);

  const handleCreateWallet = async () => {
    try {
      setIsCreating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create new wallet
      const wallet = await createWallet();
      
      if (wallet) {
        setAddress(wallet.address);
        const balance = await suiProvider.getBalance(wallet.address);
        setBalance(balance);
        setUnlocked(true);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[SignUp] Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateWithBiometrics = async () => {
    try {
      setIsEnablingBiometrics(true);
      
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Biometric authentication is only available on mobile devices.');
        setIsEnablingBiometrics(false);
        return;
      }

      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Unavailable',
          'Your device does not support biometrics or no fingerprint/Face ID is enrolled. Please set up biometrics in your device settings first.'
        );
        setIsEnablingBiometrics(false);
        return;
      }

      // Test biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric unlock',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
      });

      if (!result.success) {
        setIsEnablingBiometrics(false);
        return;
      }

      // Enable biometrics in settings
      await setBiometricAuthEnabled(true);
      
      // Create wallet
      await handleCreateWallet();
    } catch (error) {
      console.error('[SignUp] Error setting up biometrics:', error);
      Alert.alert('Error', 'Failed to set up biometric authentication.');
    } finally {
      setIsEnablingBiometrics(false);
    }
  };

  const handleImportWallet = () => {
    // For now, just show an alert - can be implemented later
    Alert.alert(
      'Import Wallet',
      'Wallet import functionality will be available soon. For now, please create a new wallet.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Screen scrollable padding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Wallet size={32} color={colors.accent.primary} />
              </View>
              <View style={styles.sparkleContainer}>
                <Sparkles size={16} color={colors.accent.secondary} />
              </View>
            </View>
            <Text style={styles.title}>Welcome to Sui One</Text>
            <Text style={styles.subtitle}>
              Your gateway to the Sui blockchain ecosystem
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Wallet size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Secure Wallet</Text>
                <Text style={styles.featureDescription}>
                  Your keys, your crypto. Fully decentralized.
                </Text>
              </View>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Fingerprint size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Biometric Security</Text>
                <Text style={styles.featureDescription}>
                  Protect your wallet with Face ID or fingerprint.
                </Text>
              </View>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Sparkles size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Mini-App Ecosystem</Text>
                <Text style={styles.featureDescription}>
                  Access DeFi, NFTs, gaming, and more in one app.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              onPress={handleCreateWithBiometrics}
              variant="primary"
              size="lg"
              fullWidth
              icon={<Fingerprint size={20} color={colors.surface} />}
              loading={isEnablingBiometrics || isCreating}
              disabled={isCreating || isEnablingBiometrics}
            >
              Create Wallet with Biometrics
            </Button>

            <Button
              onPress={handleCreateWallet}
              variant="secondary"
              size="lg"
              fullWidth
              icon={<Wallet size={20} color={colors.text.primary} />}
              loading={isCreating}
              disabled={isCreating || isEnablingBiometrics}
              style={styles.secondaryButton}
            >
              Create Wallet
            </Button>

            <Button
              onPress={handleImportWallet}
              variant="ghost"
              size="md"
              fullWidth
              style={styles.importButton}
            >
              Import Existing Wallet
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to Sui One's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    marginBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  importButton: {
    marginTop: spacing.xs,
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
