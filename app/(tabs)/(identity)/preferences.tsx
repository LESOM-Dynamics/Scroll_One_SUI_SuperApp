import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Network, Moon } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/store/settingsStore';
import { scrollProvider } from '@/services/scroll/provider';
import { useWalletStore } from '@/store/walletStore';

export default function PreferencesScreen() {
  const router = useRouter();
  const { isTestnet, isLoading, setNetwork, loadNetworkPreference, themeMode, setTheme, loadThemePreference } = useSettingsStore();
  const { address, setBalance } = useWalletStore();
  const styles = React.useMemo(() => createStyles(), [themeMode]);

  useEffect(() => {
    loadNetworkPreference();
    loadThemePreference();
  }, [loadNetworkPreference, loadThemePreference]);

  const handleNetworkToggle = async (value: boolean) => {
    Alert.alert(
      'Switch Network',
      `Are you sure you want to switch to ${value ? 'Scroll Sepolia Testnet' : 'Scroll Mainnet'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          style: 'default',
          onPress: async () => {
            await setNetwork(value);
            scrollProvider.switchNetwork(value);
            
            // Refresh balance if wallet is connected
            if (address) {
              try {
                const balance = await scrollProvider.getBalance(address);
                setBalance(balance);
              } catch (error) {
                console.error('[Preferences] Error refreshing balance:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleThemeToggle = async (value: boolean) => {
    await setTheme(value ? 'dark' : 'light');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Preferences',
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
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Moon color={colors.accent.secondary} size={24} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Dark Mode</Text>
                    <Text style={styles.settingDescription}>
                      {themeMode === 'dark' ? 'On' : 'Off'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={handleThemeToggle}
                  trackColor={{
                    false: colors.border.medium,
                    true: colors.accent.primary + '80',
                  }}
                  thumbColor={themeMode === 'dark' ? colors.accent.primary : colors.text.tertiary}
                  ios_backgroundColor={colors.border.medium}
                />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network Settings</Text>
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Network color={colors.accent.secondary} size={24} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Network</Text>
                    <Text style={styles.settingDescription}>
                      {isTestnet ? 'Scroll Sepolia Testnet' : 'Scroll Mainnet'}
                    </Text>
                  </View>
                </View>
                {!isLoading && (
                  <Switch
                    value={isTestnet}
                    onValueChange={handleNetworkToggle}
                    trackColor={{
                      false: colors.border.medium,
                      true: colors.accent.primary + '80',
                    }}
                    thumbColor={isTestnet ? colors.accent.primary : colors.text.tertiary}
                    ios_backgroundColor={colors.border.medium}
                  />
                )}
              </View>
              <View style={styles.networkInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Chain ID:</Text>
                  <Text style={styles.infoValue}>
                    {isTestnet ? '534351' : '534352'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>RPC URL:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {isTestnet ? 'sepolia-rpc.scroll.io' : 'rpc.scroll.io'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                Switch between Scroll Mainnet and Scroll Sepolia Testnet. 
                Testnet is used for development and testing purposes.
              </Text>
            </Card>
          </View>
        </View>
      </Screen>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    content: {
      padding: spacing.base,
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
    settingCard: {
      padding: spacing.base,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingTextContainer: {
      marginLeft: spacing.md,
      flex: 1,
    },
    settingTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs / 2,
    },
    settingDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
    },
    networkInfo: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    infoLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.medium,
    },
    infoValue: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.mono,
      flex: 1,
      textAlign: 'right',
      marginLeft: spacing.md,
    },
    infoCard: {
      padding: spacing.base,
    },
    infoText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    headerButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
    },
  });
