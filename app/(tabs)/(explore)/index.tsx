import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, List, Grid } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { MINIAPPS, getFeaturedMiniApps, getCategories } from '@/miniapps/registry';
import { type MiniApp, useMiniAppStore } from '@/store/miniAppStore';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { MiniAppListCard } from '@/components/ui/MiniAppListCard';
import { MiniAppGridCard } from '@/components/ui/MiniAppGridCard';

const ITEMS_PER_PAGE = 6;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
              <Text style={styles.subtitle}>Discover dApps on Scroll</Text>
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
          <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured</Text>
                {viewMode === 'list' ? (
                  <View>
                    {featuredApps.map((item) => (
                      <MiniAppListCard
                        key={`featured-${item.id}`}
                        app={item}
                        onPress={() => navigateToApp(item)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {featuredApps.map((item) => (
                      <View key={`featured-${item.id}`} style={styles.gridItem}>
                        <MiniAppGridCard app={item} onPress={() => navigateToApp(item)} />
                      </View>
                    ))}
                  </View>
                )}
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
});
