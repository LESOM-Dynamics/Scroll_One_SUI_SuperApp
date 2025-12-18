import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { User, Shield, Settings, LogOut } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function IdentityScreen() {
  const { profile } = useUserStore();
  const router = useRouter();
  const { themeMode } = useSettingsStore();
  const styles = React.useMemo(() => createStyles(), [themeMode]);

  const badges = [
    { id: '1', icon: '🏆', name: 'Early Adopter', earned: true },
    { id: '2', icon: '⚡', name: 'Power User', earned: true },
    { id: '3', icon: '🎯', name: 'Accuracy Master', earned: false },
    { id: '4', icon: '🔥', name: 'Streak Champion', earned: false },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padding={false}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <User color={colors.text.primary} size={48} />
            </View>
            <Text style={styles.name}>{profile?.displayName || 'Scroll User'}</Text>
            <Text style={styles.scrollId}>@{profile?.scrollId || 'scrolluser123'}</Text>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.reputation || 0}</Text>
                <Text style={styles.statLabel}>Reputation</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.level || 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <Card
                  key={badge.id}
                  variant={badge.earned ? 'elevated' : 'default'}
                  style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
                    {badge.name}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Card style={styles.menuCard}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/(identity)/privacy-security')}
              >
                <View style={styles.menuLeft}>
                  <Shield color={colors.accent.secondary} size={20} />
                  <Text style={styles.menuText}>Privacy & Security</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/(identity)/preferences')}
              >
                <View style={styles.menuLeft}>
                  <Settings color={colors.text.secondary} size={20} />
                  <Text style={styles.menuText}>Preferences</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <LogOut color={colors.status.error} size={20} />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const createStyles = () =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    profileSection: {
      alignItems: 'center',
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.base,
      ...shadows.sm,
    },
    name: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    scrollId: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      fontFamily: typography.fontFamily.mono,
      marginBottom: spacing.lg,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    statValue: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      color: colors.accent.primary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border.medium,
    },
    content: {
      flex: 1,
      backgroundColor: colors.background.secondary,
    },
    section: {
      padding: spacing.base,
      marginBottom: spacing.base,
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    badgeCard: {
      width: '47%',
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    badgeCardLocked: {
      opacity: 0.4,
    },
    badgeIcon: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    badgeName: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary,
      textAlign: 'center' as const,
    },
    badgeNameLocked: {
      color: colors.text.tertiary,
    },
    menuCard: {
      padding: 0,
    },
    menuItem: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuText: {
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      marginLeft: spacing.md,
      fontWeight: typography.fontWeight.medium,
    },
    menuTextDanger: {
      color: colors.status.error,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border.subtle,
      marginHorizontal: spacing.base,
    },
    scrollContent: {
      paddingBottom: spacing.xl * 2,
    },
  });
