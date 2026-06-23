import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { User, Shield, Settings, LogOut, Code, Pencil, Cloud } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWalletStore } from '@/store/walletStore';
import {
  bundleToBadges,
  bundleToUserProfile,
  getCachedProfileBlobId,
  loadProfileFromWalrus,
} from '@/services/walrus/profile';

export default function IdentityScreen() {
  const { profile, badges, setProfile, setBadges } = useUserStore();
  const { address } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const router = useRouter();
  const { themeMode } = useSettingsStore();
  const styles = React.useMemo(() => createStyles(), [themeMode]);
  const [isLoadingWalrus, setIsLoadingWalrus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromWalrus = async () => {
      if (!address) return;
      setIsLoadingWalrus(true);
      try {
        const blobId = await getCachedProfileBlobId(address);
        if (!blobId || cancelled) return;

        const bundle = await loadProfileFromWalrus(address, isTestnet, blobId);
        if (!bundle || cancelled) return;

        setProfile({
          ...bundleToUserProfile(bundle, profile?.id),
          walrusBlobId: blobId,
        });
        setBadges(bundleToBadges(bundle));
      } catch (error) {
        console.error('[Identity] Walrus profile load failed:', error);
      } finally {
        if (!cancelled) setIsLoadingWalrus(false);
      }
    };

    hydrateFromWalrus();
    return () => {
      cancelled = true;
    };
  }, [address, isTestnet, setProfile, setBadges]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padding={false}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/(identity)/edit-profile')}
            >
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <User color={colors.text.primary} size={48} />
              )}
            </TouchableOpacity>
            <Text style={styles.name}>{profile?.displayName || 'Sui User'}</Text>
            <Text style={styles.suiId}>@{profile?.suiId || 'suiuser123'}</Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}
            {profile?.walrusBlobId ? (
              <View style={styles.walrusBadge}>
                <Cloud color={colors.accent.primary} size={14} />
                <Text style={styles.walrusBadgeText}>Stored on Walrus</Text>
              </View>
            ) : null}
            {isLoadingWalrus && (
              <ActivityIndicator size="small" color={colors.accent.primary} style={styles.loader} />
            )}
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(tabs)/(identity)/edit-profile')}
            >
              <Pencil color={colors.accent.primary} size={16} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
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

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/(identity)/developer-settings')}
              >
                <View style={styles.menuLeft}>
                  <Code color={colors.text.secondary} size={20} />
                  <Text style={styles.menuText}>Developer Settings</Text>
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
      overflow: 'hidden',
      ...shadows.sm,
    },
    avatarImage: {
      width: 96,
      height: 96,
    },
    name: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    suiId: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      fontFamily: typography.fontFamily.mono,
      marginBottom: spacing.sm,
    },
    bio: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    walrusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginBottom: spacing.sm,
    },
    walrusBadgeText: {
      fontSize: typography.fontSize.xs,
      color: colors.accent.primary,
      fontWeight: typography.fontWeight.medium,
    },
    loader: {
      marginBottom: spacing.sm,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
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
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.accent.primary,
    },
    editButtonText: {
      color: colors.accent.primary,
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.sm,
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
