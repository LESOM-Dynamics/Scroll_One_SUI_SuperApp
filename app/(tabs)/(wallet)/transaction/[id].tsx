import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Clock, Copy } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/walletStore';
import { shortenAddress } from '@/services/sui/wallet';
import { formatTransactionTime, getTransactionStatus, getTransactionExplorerUrl } from '@/services/sui/transactions';
import { suiProvider } from '@/services/sui/provider';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, address } = useWalletStore();
  const [transaction, setTransaction] = useState(transactions.find(tx => tx.id === id));
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>(transaction?.status || 'pending');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id && transaction) {
      // Poll for transaction status if pending
      if (status === 'pending') {
        checkTransactionStatus();
        const interval = setInterval(checkTransactionStatus, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
      }
    }
  }, [id, status]);

  const checkTransactionStatus = async () => {
    if (!transaction?.hash) return;
    
    try {
      const txStatus = await getTransactionStatus(transaction.hash);
      setStatus(txStatus);
      
      // Update transaction in store if status changed
      if (txStatus !== status) {
        const updatedTx = { ...transaction, status: txStatus };
        setTransaction(updatedTx);
      }
    } catch (error) {
      console.error('[TransactionDetail] Error checking status:', error);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleViewOnExplorer = async () => {
    if (transaction?.hash) {
      const url = getTransactionExplorerUrl(transaction.hash);
      await WebBrowser.openBrowserAsync(url);
    }
  };

  if (!transaction) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Transaction',
            headerStyle: { backgroundColor: colors.background.primary },
            headerTintColor: colors.text.primary,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={colors.text.primary} size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <Screen>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Transaction not found</Text>
          </View>
        </Screen>
      </>
    );
  }

  const isOutgoing = transaction.type === 'send';
  const statusColor = status === 'confirmed' 
    ? colors.status.success 
    : status === 'failed' 
    ? colors.status.error 
    : colors.text.secondary;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Transaction',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen scrollable>
        <View style={styles.container}>
          {/* Status Card */}
          <Card variant="elevated" style={styles.statusCard}>
            <View style={styles.statusIcon}>
              {status === 'confirmed' ? (
                <CheckCircle color={colors.status.success} size={48} />
              ) : status === 'failed' ? (
                <XCircle color={colors.status.error} size={48} />
              ) : (
                <Clock color={colors.text.secondary} size={48} />
              )}
            </View>
            <Text style={styles.statusText}>
              {status === 'confirmed' 
                ? 'Confirmed' 
                : status === 'failed' 
                ? 'Failed' 
                : 'Pending'}
            </Text>
            <Text style={styles.amount}>
              {isOutgoing ? '-' : '+'}{transaction.amount} {transaction.symbol}
            </Text>
            <Text style={styles.time}>{formatTransactionTime(transaction.timestamp)}</Text>
          </Card>

          {/* Transaction Details */}
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {transaction.type === 'send' ? 'Send' : 
                 transaction.type === 'receive' ? 'Receive' : 
                 transaction.type === 'swap' ? 'Swap' : 
                 transaction.type === 'contract' ? 'Contract Interaction' : 'Transaction'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From</Text>
              <TouchableOpacity 
                style={styles.addressRow}
                onPress={() => handleCopy(transaction.from || '')}
              >
                <Text style={styles.detailValue}>{shortenAddress(transaction.from || '', 8)}</Text>
                <Copy color={colors.text.secondary} size={16} />
              </TouchableOpacity>
            </View>

            {transaction.to && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.addressRow}
                    onPress={() => handleCopy(transaction.to || '')}
                  >
                    <Text style={styles.detailValue}>{shortenAddress(transaction.to, 8)}</Text>
                    <Copy color={colors.text.secondary} size={16} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tx Hash</Text>
              <TouchableOpacity 
                style={styles.addressRow}
                onPress={() => handleCopy(transaction.hash)}
              >
                <Text style={styles.detailValue}>{shortenAddress(transaction.hash, 8)}</Text>
                <Copy color={colors.text.secondary} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {transaction.network && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Network</Text>
                  <Text style={styles.detailValue}>{transaction.network}</Text>
                </View>
              </>
            )}

            {transaction.crossChain && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={styles.crossChainBadge}>
                    <Text style={styles.crossChainText}>🌉 Cross-Chain Transaction</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>{transaction.fee} ETH</Text>
            </View>

            {transaction.gasUsed && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gas Used</Text>
                  <Text style={styles.detailValue}>{transaction.gasUsed}</Text>
                </View>
              </>
            )}
          </Card>

          {/* View on Explorer Button */}
          <TouchableOpacity 
            style={styles.explorerButton}
            onPress={handleViewOnExplorer}
          >
            <ExternalLink color={colors.accent.primary} size={20} />
            <Text style={styles.explorerButtonText}>View on SuiVision</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.base,
  },
  statusIcon: {
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  time: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  detailsCard: {
    marginBottom: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    maxWidth: '60%',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  explorerButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  crossChainBadge: {
    alignSelf: 'flex-end',
  },
  crossChainText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
