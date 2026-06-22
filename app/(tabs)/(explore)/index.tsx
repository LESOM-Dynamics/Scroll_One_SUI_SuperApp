import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Search, List, Grid, Shield } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { MINIAPPS, getFeaturedMiniApps, getCategories } from '@/miniapps/registry';
import { type MiniApp, useMiniAppStore } from '@/store/miniAppStore';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { MiniAppListCard } from '@/components/ui/MiniAppListCard';
import { MiniAppGridCard } from '@/components/ui/MiniAppGridCard';

const ITEMS_PER_PAGE = 6;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isImageUrl = (icon: string): boolean => {
  const trimmed = icon.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

interface FeaturedCarouselItemProps {
  item: MiniApp;
  onPress: (app: MiniApp) => void;
}

function FeaturedCarouselItem({ item, onPress }: FeaturedCarouselItemProps) {
  const [imageError, setImageError] = useState(false);
  const isUrl = isImageUrl(item.icon);

  return (
    <View style={styles.featuredCarouselItem}>
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredCardContent}>
          <View style={styles.featuredIconContainer}>
            {isUrl && !imageError ? (
              <Image 
                source={{ uri: item.icon.trim() }} 
                style={styles.featuredIconImage}
                contentFit="contain"
                onError={() => setImageError(true)}
                transition={200}
              />
            ) : (
              <Text style={styles.featuredIcon}>{item.icon}</Text>
            )}
            {item.verified && (
              <View style={styles.featuredVerifiedBadge}>
                <Shield
                  color={colors.accent.secondary}
                  size={16}
                  fill={colors.accent.secondary}
                />
              </View>
            )}
          </View>
          <Text style={styles.featuredName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.featuredDescription} numberOfLines={3}>
            {item.description}
          </Text>
          <Text style={styles.featuredCategory}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const {
    viewMode,
    toggleViewMode,
    selectedCategory,
    setCategory,
    page,
    loadMore,
    resetPagination,
  } = useMiniAppStore();

  const featuredApps = getFeaturedMiniApps();
  const categories = getCategories();
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const featuredCarouselRef = useRef<FlatList>(null);

  const filteredApps = useMemo(() => {
    let apps = MINIAPPS.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return apps.slice(0, page * ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, page]);

  const hasMore = filteredApps.length < MINIAPPS.length;

  const handleCategoryChange = (category: string | null) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setCategory(category);
    resetPagination();
  };

  const handleViewModeToggle = () => {
    toggleViewMode();
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      loadMore();
      setLoadingMore(false);
    }, 500);
  };

  const navigateToApp = (app: MiniApp) => {
    router.push(`/(tabs)/(explore)/${app.id}` as any);
  };

  const onFeaturedScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = SCREEN_WIDTH - spacing.base * 4;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentFeaturedIndex(index);
  };

  const renderFeaturedCarouselItem = ({ item }: { item: MiniApp }) => (
    <FeaturedCarouselItem item={item} onPress={navigateToApp} />
  );

  const renderFeaturedPagination = () => {
    if (featuredApps.length <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        {featuredApps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentFeaturedIndex && styles.paginationDotActive,
              index < featuredApps.length - 1 && styles.paginationDotMargin,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padding={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Explore</Text>
              <Text style={styles.subtitle}>Discover dApps on Sui</Text>
            </View>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={handleViewModeToggle}
              activeOpacity={0.7}
            >
              {viewMode === 'list' ? (
                <Grid color={colors.text.primary} size={24} />
              ) : (
                <List color={colors.text.primary} size={24} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search color={colors.text.secondary} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isNearBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
            if (isNearBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {featuredApps.length > 0 && !searchQuery && !selectedCategory && (
              <View style={styles.featuredSection}>
                <Text style={styles.sectionTitle}>Featured</Text>
                <FlatList
                  ref={featuredCarouselRef}
                  data={featuredApps}
                  renderItem={renderFeaturedCarouselItem}
                  keyExtractor={(item) => `featured-${item.id}`}
                  horizontal
                  pagingEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SCREEN_WIDTH - spacing.base * 4}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  contentContainerStyle={styles.featuredCarouselContent}
                  onScroll={onFeaturedScroll}
                  scrollEventThrottle={16}
                  getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH - spacing.base * 4,
                    offset: (SCREEN_WIDTH - spacing.base * 4) * index,
                    index,
                  })}
                />
                {renderFeaturedPagination()}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory || 'All'} Apps ({filteredApps.length})
              </Text>
              {viewMode === 'list' ? (
                <View>
                  {filteredApps.map((item) => (
                    <MiniAppListCard
                      key={item.id}
                      app={item}
                      onPress={() => navigateToApp(item)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {filteredApps.map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      <MiniAppGridCard app={item} onPress={() => navigateToApp(item)} />
                    </View>
                  ))}
                </View>
              )}
            </View>
            {renderFooter()}
          </Animated.View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: SCREEN_WIDTH / 2 - spacing.base * 1.5,
    marginBottom: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  featuredSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  featuredCarouselContent: {
    paddingHorizontal: spacing.base,
  },
  featuredCarouselItem: {
    width: SCREEN_WIDTH - spacing.base * 4,
    paddingHorizontal: spacing.sm,
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.md,
    minHeight: 200,
  },
  featuredCardContent: {
    alignItems: 'center',
  },
  featuredIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative' as const,
  },
  featuredIcon: {
    fontSize: 40,
  },
  featuredIconImage: {
    width: 40,
    height: 40,
  },
  featuredVerifiedBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 4,
    ...shadows.sm,
  },
  featuredName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  featuredDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  featuredCategory: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.subtle,
  },
  paginationDotMargin: {
    marginRight: spacing.xs,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: colors.accent.primary,
  },
});
