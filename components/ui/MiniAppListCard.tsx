import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Shield, Star } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { type MiniApp } from '@/store/miniAppStore';

interface MiniAppListCardProps {
  app: MiniApp;
  onPress: () => void;
}

const isImageUrl = (icon: string): boolean => {
  const trimmed = icon.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

export function MiniAppListCard({ app, onPress }: MiniAppListCardProps) {
  const [imageError, setImageError] = useState(false);
  const isUrl = isImageUrl(app.icon);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {isUrl && !imageError ? (
          <Image 
            source={{ uri: app.icon.trim() }} 
            style={styles.iconImage}
            contentFit="contain"
            onError={() => setImageError(true)}
            transition={200}
          />
        ) : (
          <Text style={styles.icon}>{app.icon}</Text>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name}>{app.name}</Text>
          {app.verified && (
            <Shield
              color={colors.accent.secondary}
              size={16}
              fill={colors.accent.secondary}
            />
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {app.description}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{app.category}</Text>
          {app.featured && (
            <View style={styles.featuredBadge}>
              <Star
                color={colors.accent.primary}
                size={12}
                fill={colors.accent.primary}
              />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 86, 207, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  featuredText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.primary,
    marginLeft: 4,
    fontWeight: typography.fontWeight.medium,
  },
});
