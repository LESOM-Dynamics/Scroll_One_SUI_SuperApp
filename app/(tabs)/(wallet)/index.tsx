import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Wallet, Send, ArrowDownToLine, ArrowLeftRight, ExternalLink, ChevronDown, ChevronUp, Banknote, Eye, EyeOff, Copy, RefreshCw, Plus } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useWalletStore, type Asset, type Transaction } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { shortenAddress } from '@/services/scroll/wallet';
import { formatTransactionTime, fetchTransactions } from '@/services/scroll/transactions';
import { scrollProvider } from '@/services/scroll/provider';
import { getETHPrice, getTokenPrice } from '@/services/scroll/prices';
import { getTokenBalances, getAllAvailableTokens, getAllTokens } from '@/services/scroll/tokens';
import { WalletSelectionModal } from '@/components/wallet/WalletSelectionModal';
import { ImportTokenModal } from '@/components/tokens/ImportTokenModal';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function WalletScreen() {
  const router = useRouter();
  const { address, balance, assets, transactions, setAssets, setTransactions, setBalance, setLoading } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isBalanceMasked, setIsBalanceMasked] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (address) {
      loadWalletData();
    }
  }, [address, isTestnet]); // Refresh when network changes

  // Animation effect for refresh icon
  useEffect(() => {
    if (isRefreshing) {
      const rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotation.start();
      return () => rotation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isRefreshing, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadWalletData = async () => {
    if (!address) return;
    
    setLoading(true);
    setIsRefreshing(true);
    
    try {
      // Get available tokens for current network (built-in + custom)
      const availableTokens = await getAllAvailableTokens(isTestnet);
      
      // Fetch ETH balance and price
      const [ethBalance, ethPriceData] = await Promise.all([
        scrollProvider.getBalance(address),
        getETHPrice(),
      ]);
      
      const ethBalanceNum = parseFloat(ethBalance);
      const ethPrice = ethPriceData.price;
      const ethUsdValue = ethBalanceNum * ethPrice;
      
      // Fetch ERC-20 token balances
      const tokenBalances = await getTokenBalances(address, availableTokens, isTestnet);
      
      // Fetch prices for all tokens in parallel
      const pricePromises = ['ETH', ...availableTokens].map(async (symbol) => {
        if (symbol === 'ETH') {
          return { symbol, price: ethPriceData.price, change24h: ethPriceData.change24h };
        }
        const priceData = await getTokenPrice(symbol);
        return { symbol, price: priceData.price, change24h: priceData.change24h };
      });
      
      const prices = await Promise.all(pricePromises);
      const priceMap = new Map(prices.map(p => [p.symbol, p]));
      
      // Get all tokens (built-in + custom) for token info
      const allTokens = await getAllTokens(isTestnet);
      
      // Build assets array
      const assetsList: Asset[] = [];
      
      // Add ETH asset
      assetsList.push({
        symbol: 'ETH',
        name: 'Ethereum',
        balance: ethBalanceNum.toFixed(4),
        usdValue: ethUsdValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        change24h: ethPriceData.change24h,
        icon: '⟠',
      });
      
      // Add ERC-20 token assets
      for (const symbol of availableTokens) {
        const balance = tokenBalances.get(symbol) || '0.0';
        const balanceNum = parseFloat(balance);
        const tokenInfo = allTokens[symbol.toUpperCase()];
        const priceData = priceMap.get(symbol);
        
        // Only show tokens with non-zero balance or if we have price data
        if (balanceNum > 0 || priceData) {
          const price = priceData?.price || 0;
          const usdValue = balanceNum * price;
          
          assetsList.push({
            symbol: symbol,
            name: tokenInfo?.name || symbol,
            balance: balanceNum.toFixed(balanceNum >= 1 ? 2 : 6),
            usdValue: usdValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            change24h: priceData?.change24h || 0,
            icon: tokenInfo?.icon || '💱',
          });
        }
      }
      
      // Calculate total USD value
      const totalUsdValue = assetsList.reduce((sum, asset) => {
        return sum + parseFloat(asset.usdValue.replace(/,/g, ''));
      }, 0);
      
      // Update total balance
      setBalance(totalUsdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));
      
      // Set assets
      setAssets(assetsList);

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

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[WalletScreen] Address copied to clipboard');
    }
  };

  const handleRefresh = async () => {
    if (!address || isRefreshing) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Refresh real wallet data - loadWalletData manages isRefreshing state
      await loadWalletData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[WalletScreen] Wallet data refreshed successfully');
    } catch (error) {
      console.error('[WalletScreen] Error refreshing wallet data:', error);
      setIsRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
          <ArrowDownToLine color={colors.accent.primary} size={20} />
        ) : (
          <Send color={colors.accent.secondary} size={20} />
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
              <TouchableOpacity 
                onPress={() => setShowWalletModal(true)}
                activeOpacity={0.7}
                style={styles.walletIconButton}
              >
                <Wallet color={colors.text.primary} size={24} />
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={handleRefresh}
                  disabled={isRefreshing || !address}
                  activeOpacity={0.7}
                  style={styles.refreshButton}
                >
                  <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <RefreshCw 
                      color={isRefreshing ? colors.accent.primary : colors.text.secondary} 
                      size={20}
                    />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <ExternalLink color={colors.text.secondary} size={20} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Card variant="elevated" style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balance}>
                  {isBalanceMasked ? '••••••' : `$${balance}`}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsBalanceMasked(!isBalanceMasked)}
                  style={styles.eyeIconButton}
                  activeOpacity={0.7}
                >
                  {isBalanceMasked ? (
                    <EyeOff color={colors.text.secondary} size={20} />
                  ) : (
                    <Eye color={colors.text.secondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {address && (
                <View style={styles.addressRow}>
                  <Text style={styles.address}>{shortenAddress(address, 6)}</Text>
                  <TouchableOpacity
                    onPress={handleCopyAddress}
                    style={styles.copyIconButton}
                    activeOpacity={0.7}
                  >
                    <Copy color={colors.text.secondary} size={16} />
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/send')}
              >
                <View style={styles.actionIcon}>
                  <Send color={colors.accent.primary} size={22} />
                </View>
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/receive')}
              >
                <View style={styles.actionIcon}>
                  <ArrowDownToLine color={colors.accent.primary} size={22} />
                </View>
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/deposit')}
              >
                <View style={styles.actionIcon}>
                  <Banknote color={colors.accent.primary} size={22} />
                </View>
                <Text style={styles.actionText}>Deposit</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/(wallet)/swap')}
              >
                <View style={styles.actionIcon}>
                  <ArrowLeftRight color={colors.accent.primary} size={22} />
                </View>
                <Text style={styles.actionText}>Swap</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assets</Text>
                <View style={styles.sectionHeaderRight}>
                  <TouchableOpacity
                    onPress={() => setShowImportModal(true)}
                    style={styles.importButton}
                    activeOpacity={0.7}
                  >
                    <Plus color={colors.accent.primary} size={18} />
                    <Text style={styles.importButtonText}>Import</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAssetsExpanded((prev) => !prev)}
                    style={styles.sectionToggle}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionToggleText}>
                      {assetsExpanded ? 'Hide' : 'Show'}
                    </Text>
                    {assetsExpanded ? (
                      <ChevronUp color={colors.text.secondary} size={16} />
                    ) : (
                      <ChevronDown color={colors.text.secondary} size={16} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {assetsExpanded && (
                <>
                  {isRefreshing && assets.length === 0 ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.accent.primary} />
                    </View>
                  ) : assets.length > 0 ? (
                    assets.map((item) => (
                      <View key={item.symbol}>{renderAsset({ item })}</View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No assets found</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {transactions.length > 0 && (
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/(wallet)/activity' as any)}
                    style={styles.viewAllButton}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isRefreshing && transactions.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : transactions.length > 0 ? (
                transactions.slice(0, 5).map((item) => (
                  <View key={item.id}>{renderTransaction({ item })}</View>
                ))
              ) : (
                <Text style={styles.emptyText}>No transactions yet</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </Screen>

      <WalletSelectionModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      
      <ImportTokenModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onTokenImported={loadWalletData}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  refreshButton: {
    padding: spacing.xs,
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  balance: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  eyeIconButton: {
    padding: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  copyIconButton: {
    padding: spacing.xs,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary + '15',
  },
  importButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  viewAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionToggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
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
    backgroundColor: 'rgba(110, 86, 207, 0.08)',
  },
  sendIcon: {
    backgroundColor: 'rgba(76, 61, 242, 0.08)',
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
  walletIconButton: {
    padding: spacing.xs,
  },
});
