import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Code } from 'lucide-react-native';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/store/settingsStore';

export default function DeveloperSettingsScreen() {
  const router = useRouter();
  const { 
    useMockData,
    setUseMockData,
    loadMockDataPreference,
    themeMode,
  } = useSettingsStore();
  const styles = React.useMemo(() => createStyles(), [themeMode]);

  useEffect(() => {
    loadMockDataPreference();
  }, [loadMockDataPreference]);

  const handleMockDataToggle = async (value: boolean) => {
    await setUseMockData(value);
  };

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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mock Data</Text>
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Code color={colors.accent.secondary} size={24} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Use Mock Data</Text>
                    <Text style={styles.settingDescription}>
                      {useMockData ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={useMockData}
                  onValueChange={handleMockDataToggle}
                  trackColor={{
                    false: colors.border.medium,
                    true: colors.accent.primary + '80',
                  }}
                  thumbColor={useMockData ? colors.accent.primary : colors.text.tertiary}
                  ios_backgroundColor={colors.border.medium}
                />
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  When enabled, the Wallet Tab will display mock data for demonstration purposes. 
                  This setting is useful for testing and showcasing the app without requiring real wallet connections.
                </Text>
              </View>
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
    infoBox: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
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

