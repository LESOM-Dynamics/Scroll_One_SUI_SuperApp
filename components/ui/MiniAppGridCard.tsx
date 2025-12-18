import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, Star } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { type MiniApp } from '@/store/miniAppStore';

interface MiniAppGridCardProps {
  app: MiniApp;
  onPress: () => void;
}

export function MiniAppGridCard({ app, onPress }: MiniAppGridCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{app.icon}</Text>
        {app.verified && (
          <View style={styles.verifiedBadge}>
            <Shield
              color={colors.accent.secondary}
              size={12}
              fill={colors.accent.secondary}
            />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {app.name}
      </Text>
      <Text style={styles.category} numberOfLines={1}>
        {app.category}
      </Text>
      {app.featured && (
        <View style={styles.featuredBadge}>
          <Star
            color={colors.accent.primary}
            size={10}
            fill={colors.accent.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative' as const,
  },
  icon: {
    fontSize: 28,
  },
  verifiedBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(110, 86, 207, 0.08)',
    borderRadius: 12,
    padding: 4,
  },
});
