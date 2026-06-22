import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Fingerprint, Lock, ArrowRight, Wallet } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { loadWallet } from '@/services/sui/wallet';
import { suiProvider } from '@/services/sui/provider';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { address, setAddress, setBalance, setUnlocked } = useWalletStore();
  const { biometricAuthEnabled } = useSettingsStore();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [useBiometric, setUseBiometric] = useState(true);

  const handleBiometricUnlock = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is only available on mobile devices.');
      return;
    }

    try {
      setIsUnlocking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Unavailable',
          'Your device does not support biometrics or no fingerprint/Face ID is enrolled. Please use PIN instead.'
        );
        setShowPinInput(true);
        setUseBiometric(false);
        setIsUnlocking(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your Sui wallet',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        await unlockWallet();
      } else {
        // User cancelled or failed - show PIN option
        if (result.error === 'user_cancel') {
          setShowPinInput(true);
          setUseBiometric(false);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('[Login] Error during biometric authentication:', error);
      Alert.alert('Error', 'Biometric authentication failed. Please try PIN instead.');
      setShowPinInput(true);
      setUseBiometric(false);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePINUnlock = async () => {
    // Dummy PIN validation - in production, you'd verify against stored hash
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter a valid PIN (at least 4 digits).');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // For demo: accept any 4+ digit PIN
    // In production: verify against SecureStore hash
    try {
      setIsUnlocking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Simulate PIN verification delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await unlockWallet();
    } catch (error) {
      console.error('[Login] Error during PIN unlock:', error);
      Alert.alert('Error', 'Invalid PIN. Please try again.');
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const unlockWallet = async () => {
    try {
      const wallet = await loadWallet();
      
      if (!wallet) {
        // No wallet exists, redirect to signup
        router.replace('/(auth)/signup');
        return;
      }

      setAddress(wallet.address);
      const balance = await suiProvider.getBalance(wallet.address);
      setBalance(balance);
      setUnlocked(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Login] Error unlocking wallet:', error);
      Alert.alert('Error', 'Failed to unlock wallet. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Auto-trigger biometric if enabled and available
  React.useEffect(() => {
    if (biometricAuthEnabled && useBiometric && Platform.OS !== 'web') {
      const checkAndUnlock = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          // Small delay to let UI render
          setTimeout(() => {
            handleBiometricUnlock();
          }, 300);
        } else {
          setShowPinInput(true);
          setUseBiometric(false);
        }
      };
      
      checkAndUnlock();
    }
  }, []);

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
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {address ? `Unlock your wallet to continue` : 'Sign in to your Sui wallet'}
            </Text>
          </View>

          {/* Wallet Address Preview (if exists) */}
          {address && (
            <View style={styles.addressPreview}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  {address.substring(0, 6)}...{address.substring(address.length - 4)}
                </Text>
              </View>
            </View>
          )}

          {/* Unlock Options */}
          <View style={styles.unlockOptions}>
            {biometricAuthEnabled && Platform.OS !== 'web' && !showPinInput && (
              <Button
                onPress={handleBiometricUnlock}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Fingerprint size={20} color={colors.surface} />}
                loading={isUnlocking}
                disabled={isUnlocking}
              >
                Unlock with Biometrics
              </Button>
            )}

            {showPinInput && (
              <View style={styles.pinContainer}>
                <View style={styles.pinHeader}>
                  <Lock size={20} color={colors.text.secondary} />
                  <Text style={styles.pinLabel}>Enter PIN</Text>
                </View>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter your PIN"
                  placeholderTextColor={colors.text.tertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  onPress={handlePINUnlock}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ArrowRight size={20} color={colors.surface} />}
                  loading={isUnlocking}
                  disabled={isUnlocking || pin.length < 4}
                  style={styles.pinButton}
                >
                  Unlock Wallet
                </Button>
              </View>
            )}

            {!showPinInput && (
              <Button
                onPress={() => {
                  setShowPinInput(true);
                  setUseBiometric(false);
                }}
                variant="ghost"
                size="md"
                fullWidth
                style={styles.pinFallback}
              >
                Use PIN Instead
              </Button>
            )}

            {showPinInput && (
              <Button
                onPress={() => {
                  setShowPinInput(false);
                  setPin('');
                  if (biometricAuthEnabled && Platform.OS !== 'web') {
                    setUseBiometric(true);
                  }
                }}
                variant="ghost"
                size="sm"
                fullWidth
                style={styles.biometricFallback}
              >
                {biometricAuthEnabled ? 'Use Biometrics Instead' : 'Back'}
              </Button>
            )}
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              {!address 
                ? "Don't have a wallet? Create one to get started."
                : "Forgot your PIN? You can reset it from settings, but make sure you have your private key backed up."
              }
            </Text>
          </View>

          {/* Create New Wallet Link */}
          {!address && (
            <Button
              onPress={() => router.replace('/(auth)/signup')}
              variant="ghost"
              size="md"
              fullWidth
            >
              Create New Wallet
            </Button>
          )}
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
  addressPreview: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  addressLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  addressContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  addressText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
    textAlign: 'center',
  },
  unlockOptions: {
    marginBottom: spacing.xl,
  },
  pinContainer: {
    gap: spacing.md,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pinLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  pinInput: {
    width: '100%',
    padding: spacing.lg,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinButton: {
    marginTop: spacing.md,
  },
  pinFallback: {
    marginTop: spacing.md,
  },
  biometricFallback: {
    marginTop: spacing.sm,
  },
  helpContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
