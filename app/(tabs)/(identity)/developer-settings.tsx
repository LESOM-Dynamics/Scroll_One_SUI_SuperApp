import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, Network } from 'lucide-react-native';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/store/settingsStore';

export default function DeveloperSettingsScreen() {
  const router = useRouter();
  const { isTestnet, themeMode } = useSettingsStore();
  const styles = React.useMemo(() => createStyles(), [themeMode]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Developer Settings',
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
          <Text style={styles.sectionTitle}>Runtime Diagnostics</Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Network color={colors.accent.secondary} size={24} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Active Blockchain Network</Text>
                  <Text style={styles.settingDescription}>
                    {isTestnet ? 'Sui Testnet' : 'Sui Mainnet'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.inlineRow}>
                <ShieldCheck color={colors.accent.primary} size={18} />
                <Text style={styles.infoText}>
                  Mock wallet and transaction fixtures were removed from production runtime paths.
                </Text>
              </View>
            </View>
          </Card>
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
    infoBox: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
      flex: 1,
    },
    headerButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
    },
  });
