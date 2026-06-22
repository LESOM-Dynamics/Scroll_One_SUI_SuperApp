import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Lock, Key, RefreshCw, ShieldCheck, Fingerprint } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getPrivateKey, resetWallet, shortenAddress } from '@/services/sui/wallet';
import { suiProvider } from '@/services/sui/provider';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { address, setAddress, setBalance, setAssets, setTransactions, reset } = useWalletStore();
  const {
    kycSharingEnabled,
    setKycSharingEnabled,
    themeMode,
    biometricAuthEnabled,
    setBiometricAuthEnabled,
  } = useSettingsStore();

  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isRevealingKey, setIsRevealingKey] = useState(false);
  const [isResettingWallet, setIsResettingWallet] = useState(false);
  const [isUpdatingBiometrics, setIsUpdatingBiometrics] = useState(false);

  const styles = React.useMemo(() => createStyles(), [themeMode]);

  const handleRevealPrivateKey = () => {
    Alert.alert(
      'Reveal Private Key',
      'Your private key controls full access to your funds. Never share it with anyone. Are you sure you want to reveal it on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRevealingKey(true);
              const key = await getPrivateKey();
              if (!key) {
                Alert.alert('No Private Key', 'No wallet private key is available on this device.');
                return;
              }
              setPrivateKey(key);
            } catch (error) {
              console.error('[PrivacySecurity] Error revealing private key:', error);
              Alert.alert('Error', 'Failed to load private key.');
            } finally {
              setIsRevealingKey(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyPrivateKey = async () => {
    if (!privateKey) return;
    await Clipboard.setStringAsync(privateKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Private key copied to clipboard. Be extremely careful where you paste it.');
  };

  const handleResetWallet = () => {
    Alert.alert(
      'Reset Wallet Address',
      'This will create a brand new wallet and disconnect the current one. Make sure you have backed up your existing private key before continuing. You may lose access to funds if you have not backed it up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Wallet',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResettingWallet(true);

              // Clear local wallet store first
              reset();

              // Create new wallet and persist it
              const newWallet = await resetWallet();

              // Update store with new address
              setAddress(newWallet.address);

              // Reset balances and portfolio data
              setAssets([]);
              setTransactions([]);

              try {
                const balance = await suiProvider.getBalance(newWallet.address);
                setBalance(balance);
              } catch (balanceError) {
                console.error('[PrivacySecurity] Error fetching new wallet balance:', balanceError);
                setBalance('0.00');
              }

              Alert.alert('Wallet Reset', 'A new wallet address has been created.');
            } catch (error) {
              console.error('[PrivacySecurity] Error resetting wallet:', error);
              Alert.alert('Error', 'Failed to reset wallet. Please try again.');
            } finally {
              setIsResettingWallet(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleKycSharing = (value: boolean) => {
    setKycSharingEnabled(value);
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Biometric authentication is only available on iOS and Android devices.');
      return;
    }

    setIsUpdatingBiometrics(true);

    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometrics Unavailable',
            'Your device does not support biometrics, or no fingerprint/Face ID is enrolled. Please configure biometrics in your device settings first.'
          );
          await setBiometricAuthEnabled(false);
          return;
        }

        await setBiometricAuthEnabled(true);
      } else {
        await setBiometricAuthEnabled(false);
      }
    } catch (error) {
      console.error('[PrivacySecurity] Error updating biometric setting:', error);
      Alert.alert('Error', 'Failed to update biometric settings. Please try again.');
    } finally {
      setIsUpdatingBiometrics(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy & Security',
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: typography.fontWeight.semibold,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen scrollable>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Security</Text>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Lock color={colors.accent.secondary} size={22} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>Backup & Recovery</Text>
                  <Text style={styles.cardDescription}>
                    Securely view and back up your private key. Anyone with this key can control your funds.
                  </Text>
                </View>
              </View>

              <Button
                onPress={handleRevealPrivateKey}
                fullWidth
                style={styles.button}
                variant="secondary"
                disabled={isRevealingKey}
                icon={<Key color={colors.text.primary} size={18} />}
              >
                {isRevealingKey ? 'Loading Private Key...' : 'Reveal Private Key'}
              </Button>

              {privateKey && (
                <View style={styles.secretContainer}>
                  <Text style={styles.secretLabel}>Private Key</Text>
                  <Card variant="glass" style={styles.secretCard}>
                    <Text style={styles.secretValue} numberOfLines={3}>
                      {privateKey}
                    </Text>
                  </Card>
                  <Button
                    onPress={handleCopyPrivateKey}
                    fullWidth
                    variant="outline"
                    style={styles.button}
                  >
                    Copy Private Key
                  </Button>
                  <Text style={styles.warningText}>
                    Never share this key with anyone. Sui One will never ask for it.
                  </Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  This wallet is generated directly from a private key and does not currently expose a seed phrase. 
                  Make sure you securely store your private key backup.
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Lock & Biometrics</Text>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Fingerprint color={colors.accent.secondary} size={22} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>Biometric Unlock</Text>
                  <Text style={styles.cardDescription}>
                    Require Face ID / Touch ID / fingerprint (or your device passcode) to unlock your Sui wallet when the app starts.
                  </Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Use biometrics to unlock wallet</Text>
                  <Text style={styles.settingSubtitle}>
                    When enabled, the app will prompt for biometric authentication before loading your wallet and exposing it to mini-apps via the bridge.
                  </Text>
                </View>
                <Switch
                  value={biometricAuthEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={isUpdatingBiometrics}
                  trackColor={{
                    false: colors.border.medium,
                    true: colors.accent.primary + '80',
                  }}
                  thumbColor={biometricAuthEnabled ? colors.accent.primary : colors.text.tertiary}
                  ios_backgroundColor={colors.border.medium}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Biometric prompts are handled by your device. The Sui One app never receives your fingerprint or Face ID data—only a simple success or failure result.
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Management</Text>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconCircleDanger}>
                  <RefreshCw color={colors.status.error} size={22} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>Reset Wallet Address</Text>
                  <Text style={styles.cardDescription}>
                    Create a brand new wallet and address on this device. Your current wallet will be disconnected.
                  </Text>
                  {address && (
                    <Text style={styles.currentAddress}>
                      Current: {shortenAddress(address)}
                    </Text>
                  )}
                </View>
              </View>

              <Button
                onPress={handleResetWallet}
                fullWidth
                variant="outline"
                style={styles.button}
                disabled={isResettingWallet}
              >
                {isResettingWallet ? 'Resetting Wallet...' : 'Reset Wallet Address'}
              </Button>

              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>Important</Text>
                <Text style={styles.warningBody}>
                  This action cannot be undone. You must back up your existing private key before resetting, 
                  otherwise you may permanently lose access to any assets associated with the current address.
                </Text>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KYC & Data Sharing</Text>
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <ShieldCheck color={colors.accent.secondary} size={22} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>KYC Sharing</Text>
                  <Text style={styles.cardDescription}>
                    Control whether your verified KYC status can be shared with trusted mini-apps to streamline onboarding.
                  </Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingTitle}>Share KYC status with mini-apps</Text>
                  <Text style={styles.settingSubtitle}>
                    When enabled, supported apps can read a simple "verified / not verified" flag. No documents are shared.
                  </Text>
                </View>
                <Switch
                  value={kycSharingEnabled}
                  onValueChange={handleToggleKycSharing}
                  trackColor={{
                    false: colors.border.medium,
                    true: colors.accent.primary + '80',
                  }}
                  thumbColor={kycSharingEnabled ? colors.accent.primary : colors.text.tertiary}
                  ios_backgroundColor={colors.border.medium}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Full KYC verification flows are handled by integrated partners and mini-apps. 
                  This setting only controls whether they can see that your account is KYC-verified.
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    content: {
      padding: spacing.base,
      paddingBottom: spacing['2xl'],
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    card: {
      padding: spacing.base,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    iconCircleDanger: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      backgroundColor: colors.status.error + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    cardDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    currentAddress: {
      marginTop: spacing.sm,
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      fontFamily: typography.fontFamily.mono,
    },
    button: {
      marginTop: spacing.md,
    },
    secretContainer: {
      marginTop: spacing.lg,
    },
    secretLabel: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    secretCard: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.background.primary,
    },
    secretValue: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.mono,
    },
    warningText: {
      marginTop: spacing.sm,
      fontSize: typography.fontSize.xs,
      color: colors.status.error,
    },
    warningBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.status.error + '08',
    },
    warningTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.status.error,
      marginBottom: spacing.xs,
    },
    warningBody: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    infoBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.secondary,
    },
    infoText: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    settingRow: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    settingLeft: {
      flex: 1,
    },
    settingTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    settingSubtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    headerButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
    },
  });

