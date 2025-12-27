import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Send, ArrowDownToLine, ArrowLeftRight, FileCode, Filter, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useWalletStore, type Transaction } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { shortenAddress } from '@/services/scroll/wallet';
import { formatTransactionTime } from '@/services/scroll/transactions';
import { notificationService } from '@/services/notifications/notificationService';

type FilterType = 'all' | 'pending' | 'failed' | 'contract' | 'cross-chain';

export default function ActivityScreen() {
  const router = useRouter();
  const { transactions, isLoading } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Clear badge count when activity screen is focused
  useFocusEffect(
    React.useCallback(() => {
      notificationService.clearBadgeCount();
    }, [])
  );

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (activeFilter === 'pending') {
      filtered = filtered.filter(tx => tx.status === 'pending');
    } else if (activeFilter === 'failed') {
      filtered = filtered.filter(tx => tx.status === 'failed');
    } else if (activeFilter === 'contract') {
      filtered = filtered.filter(tx => tx.type === 'contract');
    } else if (activeFilter === 'cross-chain') {
      filtered = filtered.filter(tx => tx.crossChain === true);
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, activeFilter]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'receive':
        return <ArrowDownToLine color={colors.accent.primary} size={20} />;
      case 'send':
        return <Send color={colors.accent.secondary} size={20} />;
      case 'swap':
        return <ArrowLeftRight color={colors.accent.primary} size={20} />;
      case 'contract':
        return <FileCode color={colors.text.secondary} size={20} />;
      default:
        return <Send color={colors.text.secondary} size={20} />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return colors.status.success;
      case 'failed':
        return colors.status.error;
      case 'pending':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return 'Send';
      case 'receive':
        return 'Receive';
      case 'swap':
        return 'Swap';
      case 'contract':
        return 'Contract';
      default:
        return 'Transaction';
    }
  };

  const renderTransaction = (item: Transaction) => (
    <TouchableOpacity
      key={item.id}
      style={styles.transactionItem}
      onPress={() => router.push(`/(tabs)/(wallet)/transaction/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.transactionIcon,
        item.type === 'receive' ? styles.receiveIcon : 
        item.type === 'send' ? styles.sendIcon :
        item.type === 'swap' ? styles.swapIcon :
        styles.contractIcon
      ]}>
        {getTransactionIcon(item.type)}
      </View>
      
      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {getTypeLabel(item.type)} {item.symbol}
          </Text>
          <View style={styles.transactionAmountContainer}>
            <Text style={[
              styles.transactionAmount,
              item.type === 'receive' ? styles.positive : styles.negative
            ]}>
              {item.type === 'receive' ? '+' : '-'}{item.amount}
            </Text>
            <Text style={styles.transactionSymbol}>{item.symbol}</Text>
          </View>
        </View>
        
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.from ? shortenAddress(item.from, 6) : 'N/A'}
            </Text>
          </View>
          {item.to && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {shortenAddress(item.to, 6)}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          {item.network && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network:</Text>
              <Text style={styles.detailValue}>{item.network}</Text>
            </View>
          )}
          {item.crossChain && (
            <View style={styles.crossChainBadge}>
              <Text style={styles.crossChainText}>🌉 Cross-Chain</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee:</Text>
            <Text style={styles.detailValue}>{item.fee} ETH</Text>
          </View>
          <Text style={styles.transactionTime}>{formatTransactionTime(item.timestamp)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Contract', value: 'contract' },
    { label: 'Cross-Chain', value: 'cross-chain' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Activity',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: typography.fontWeight.semibold,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => setShowFilters(!showFilters)} 
              style={styles.headerButton}
            >
              <Filter color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen padding={false}>
        {/* Filter Bar */}
        {showFilters && (
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterChip,
                    activeFilter === filter.value && styles.filterChipActive
                  ]}
                  onPress={() => {
                    setActiveFilter(filter.value);
                    setShowFilters(false);
                  }}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilter === filter.value && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                  {activeFilter === filter.value && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveFilter('all');
                      }}
                      style={styles.filterClose}
                    >
                      <X color={colors.text.primary} size={14} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Active Filter Display */}
        {activeFilter !== 'all' && !showFilters && (
          <View style={styles.activeFilterBar}>
            <Text style={styles.activeFilterText}>
              Filter: {filterOptions.find(f => f.value === activeFilter)?.label}
            </Text>
            <TouchableOpacity onPress={() => setActiveFilter('all')}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && filteredTransactions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((item) => renderTransaction(item))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              {activeFilter !== 'all' && (
                <Text style={styles.emptySubtext}>
                  Try adjusting your filters
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginHorizontal: spacing.sm,
    padding: spacing.xs,
  },
  filterContainer: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.text.primary,
  },
  filterClose: {
    marginLeft: spacing.xs,
  },
  activeFilterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  activeFilterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  clearFilterText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  loadingContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  receiveIcon: {
    backgroundColor: 'rgba(110, 86, 207, 0.1)',
  },
  sendIcon: {
    backgroundColor: 'rgba(76, 61, 242, 0.1)',
  },
  swapIcon: {
    backgroundColor: 'rgba(110, 86, 207, 0.1)',
  },
  contractIcon: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  transactionType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  transactionSymbol: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  positive: {
    color: colors.status.success,
  },
  negative: {
    color: colors.status.error,
  },
  transactionDetails: {
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  crossChainBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  crossChainText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  transactionTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});

