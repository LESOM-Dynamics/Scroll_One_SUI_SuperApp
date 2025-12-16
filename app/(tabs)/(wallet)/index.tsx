import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Wallet, Send, ArrowDownToLine, ArrowLeftRight, ExternalLink } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useWalletStore, type Asset, type Transaction } from '@/store/walletStore';
import { shortenAddress } from '@/services/scroll/wallet';
import { formatTransactionTime, fetchTransactions } from '@/services/scroll/transactions';
import { scrollProvider } from '@/services/scroll/provider';

export default function WalletScreen() {
  const router = useRouter();
  const { address, balance, assets, transactions, setAssets, setTransactions, setBalance, setLoading } = useWalletStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (address) {
      loadWalletData();
    }
  }, [address]);

  const loadWalletData = async () => {
    if (!address) return;
    
    setLoading(true);
    setIsRefreshing(true);
    
    try {
      // Fetch real ETH balance
      const ethBalance = await scrollProvider.getBalance(address);
      const balanceNum = parseFloat(ethBalance);
      
      // For now, we'll use a simple USD conversion (you can integrate a price API later)
      const ethPrice = 2500; // Placeholder - should fetch from API
      const usdValue = (balanceNum * ethPrice).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      
      // Update total balance
      setBalance(usdValue);
      
      // Set assets with real ETH balance
      setAssets([
        { 
          symbol: 'ETH', 
          name: 'Ethereum', 
          balance: balanceNum.toFixed(4), 
          usdValue: usdValue, 
          change24h: 2.4, // Placeholder - should fetch from API
          icon: '⟠' 
        },
        // Note: ERC-20 tokens would need additional implementation
        // { symbol: 'USDC', name: 'USD Coin', balance: '0.00', usdValue: '0.00', change24h: 0.0, icon: '💵' },
        // { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.00', usdValue: '0.00', change24h: 0.0, icon: '₿' },
      ]);

      // Fetch real transactions
      const txList = await fetchTransactions(address);
      setTransactions(txList);
    } catch (error) {
      console.error('[WalletScreen] Error loading wallet data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity style={styles.assetItem}>
      <View style={styles.assetLeft}>
        <Text style={styles.assetIcon}>{item.icon}</Text>
        <View>
          <Text style={styles.assetSymbol}>{item.symbol}</Text>
          <Text style={styles.assetName}>{item.name}</Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetBalance}>{item.balance}</Text>
        <View style={styles.assetChangeRow}>
          <Text style={styles.assetValue}>${item.usdValue}</Text>
          <Text style={[styles.assetChange, item.change24h >= 0 ? styles.positive : styles.negative]}>
            {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(1)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => router.push(`/(tabs)/(wallet)/transaction/${item.id}` as any)}
    >
      <View style={[
        styles.transactionIcon,
        item.type === 'receive' ? styles.receiveIcon : styles.sendIcon
      ]}>
        {item.type === 'receive' ? (
          <ArrowDownToLine color={colors.accent.neonGreen} size={20} />
        ) : (
          <Send color={colors.accent.electricBlue} size={20} />
        )}
      </View>
      <View style={styles.transactionMiddle}>
        <Text style={styles.transactionType}>
          {item.type === 'receive' ? 'Received' : 'Sent'} {item.symbol}
        </Text>
        <Text style={styles.transactionTime}>{formatTransactionTime(item.timestamp)}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          item.type === 'receive' ? styles.positive : styles.negative
        ]}>
          {item.type === 'receive' ? '+' : '-'}{item.amount}
        </Text>
        <Text style={styles.transactionSymbol}>{item.symbol}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padding={false}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Wallet color={colors.text.primary} size={24} />
              <TouchableOpacity>
                <ExternalLink color={colors.text.secondary} size={20} />
              </TouchableOpacity>
            </View>
            
            <Card variant="glass" style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balance}>${balance}</Text>
              {address && (
                <Text style={styles.address}>{shortenAddress(address, 6)}</Text>
              )}
            </Card>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/send')}
              >
                <View style={styles.actionIcon}>
                  <Send color={colors.accent.neonGreen} size={22} />
                </View>
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/receive')}
              >
                <View style={styles.actionIcon}>
                  <ArrowDownToLine color={colors.accent.neonGreen} size={22} />
                </View>
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/swap')}
              >
                <View style={styles.actionIcon}>
                  <ArrowLeftRight color={colors.accent.neonGreen} size={22} />
                </View>
                <Text style={styles.actionText}>Swap</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assets</Text>
              {isRefreshing && assets.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent.neonGreen} />
                </View>
              ) : assets.length > 0 ? (
                assets.map((item) => (
                  <View key={item.symbol}>{renderAsset({ item })}</View>
                ))
              ) : (
                <Text style={styles.emptyText}>No assets found</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {isRefreshing && transactions.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent.neonGreen} />
                </View>
              ) : transactions.length > 0 ? (
                transactions.map((item) => (
                  <View key={item.id}>{renderTransaction({ item })}</View>
                ))
              ) : (
                <Text style={styles.emptyText}>No transactions yet</Text>
              )}
            </View>
          </View>
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
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  balance: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.base,
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
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  assetSymbol: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  assetName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  assetChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  assetChange: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  positive: {
    color: colors.status.success,
  },
  negative: {
    color: colors.status.error,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  receiveIcon: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  sendIcon: {
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
  },
  transactionMiddle: {
    flex: 1,
  },
  transactionType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  transactionTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  transactionSymbol: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    paddingVertical: spacing.xl,
  },
});
