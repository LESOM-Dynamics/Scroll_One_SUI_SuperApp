import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { isAddress } from 'ethers';
import { parseEther, formatEther } from 'ethers';

import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { sendTransaction, estimateTransactionFee } from '@/services/scroll/transactions';
import * as Haptics from 'expo-haptics';

export default function SendScreen() {
  const router = useRouter();
  const { address, assets, addTransaction } = useWalletStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAsset] = useState('ETH');
  const [estimatedFee, setEstimatedFee] = useState('0.002');
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ethBalance = assets.find(a => a.symbol === 'ETH')?.balance || '0';
  const ethPrice = 2500; // Placeholder - should fetch from API
  const usdValue = amount ? (parseFloat(amount) * ethPrice).toFixed(2) : '0.00';

  // Estimate fee when recipient and amount change
  useEffect(() => {
    const estimateFee = async () => {
      if (!recipient || !amount || !isAddress(recipient)) {
        setEstimatedFee('0.002');
        return;
      }

      try {
        setIsEstimatingFee(true);
        const fee = await estimateTransactionFee(recipient, amount);
        setEstimatedFee(fee);
      } catch (error) {
        console.error('[SendScreen] Error estimating fee:', error);
        setEstimatedFee('0.002');
      } finally {
        setIsEstimatingFee(false);
      }
    };

    const timeoutId = setTimeout(estimateFee, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [recipient, amount]);

  const validateInputs = (): boolean => {
    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }

    if (!isAddress(recipient)) {
      setError('Invalid recipient address');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(ethBalance);
    const feeNum = parseFloat(estimatedFee);

    if (amountNum + feeNum > balanceNum) {
      setError('Insufficient balance (including gas fee)');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    setError(null);

    if (!validateInputs()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSending(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Send the transaction
      const transaction = await sendTransaction(recipient, amount, selectedAsset);
      
      // Add to transaction list
      addTransaction(transaction);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to transaction detail
      router.replace(`/(tabs)/(wallet)/transaction/${transaction.id}`);
    } catch (error: any) {
      console.error('[SendScreen] Error sending transaction:', error);
      const errorMessage = error?.message || 'Failed to send transaction';
      setError(errorMessage);
      Alert.alert('Transaction Failed', errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Send',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => null,
        }}
      />
      <Screen scrollable>
        <Card style={styles.card}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor={colors.text.tertiary}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={colors.text.tertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.assetLabel}>{selectedAsset}</Text>
          </View>
          <Text style={styles.usdValue}>≈ ${usdValue}</Text>
        </Card>

        <Card variant="glass" style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Network Fee</Text>
            {isEstimatingFee ? (
              <ActivityIndicator size="small" color={colors.text.secondary} />
            ) : (
              <Text style={styles.feeValue}>~{estimatedFee} ETH</Text>
            )}
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {amount || '0'} {selectedAsset} + {estimatedFee} ETH
            </Text>
          </View>
        </Card>

        {error && (
          <Card variant="bordered" style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Button
          onPress={handleSend}
          disabled={!recipient || !amount || isSending || isEstimatingFee}
          fullWidth
          style={styles.sendButton}
        >
          {isSending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.text.primary} />
              <Text style={styles.sendButtonText}>Sending...</Text>
            </View>
          ) : (
            `Send ${selectedAsset}`
          )}
        </Button>

        <Text style={styles.balanceText}>
          Available: {ethBalance} ETH
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  assetLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  usdValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  feeCard: {
    marginBottom: spacing.xl,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  feeLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  feeValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  totalValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  sendButton: {
    marginTop: spacing.base,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  errorCard: {
    marginBottom: spacing.base,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
    textAlign: 'center' as const,
  },
  balanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing.md,
  },
});
