import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowDownUp, ChevronDown } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { useWalletStore } from '@/store/walletStore';
import { useUserStore } from '@/store/userStore';
import {
  executeDeepBookSwap,
  getDeepBookSwapQuote,
  getDeepBookSwapTokens,
  resolveDeepBookPair,
} from '@/services/sui/deepbook';
import { awardBackendBadge } from '@/services/api/users';
import { trackSwapComplete } from '@/services/api/analytics';
import { getTokenBalance , getTokenInfo } from '@/services/sui/tokens';

import { suiProvider } from '@/services/sui/provider';

export default function SwapScreen() {
  const router = useRouter();
  const { isTestnet } = useSettingsStore();
  const { address, addTransaction, isUnlocked } = useWalletStore();
  const { incrementReputation, earnBadge, badges } = useUserStore();

  const swapTokens = getDeepBookSwapTokens(isTestnet);
  const [fromAsset, setFromAsset] = useState('SUI');
  const [toAsset, setToAsset] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromBalance, setFromBalance] = useState('0');
  const [quoteLabel, setQuoteLabel] = useState('');
  const [deepFee, setDeepFee] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!address) return;
    const token = getTokenInfo(fromAsset, isTestnet);
    if (!token) return;
    const balance = await getTokenBalance(token.coinType, address, isTestnet);
    setFromBalance(balance);
  }, [address, fromAsset, isTestnet]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    let cancelled = false;
    const fetchQuote = async () => {
      const amount = parseFloat(fromAmount);
      if (!address || !amount || amount <= 0) {
        setToAmount('');
        setQuoteLabel('');
        setDeepFee('');
        return;
      }

      if (!resolveDeepBookPair(fromAsset, toAsset, isTestnet)) {
        setToAmount('');
        setQuoteLabel('No DeepBook pool for this pair');
        return;
      }

      setIsQuoting(true);
      try {
        const quote = await getDeepBookSwapQuote(fromAsset, toAsset, amount, isTestnet, address);
        if (cancelled) return;
        if (quote) {
          setToAmount(quote.toAmount.toFixed(6));
          setQuoteLabel(quote.priceLabel);
          setDeepFee(`${quote.deepRequired.toFixed(4)} DEEP`);
        } else {
          setToAmount('');
          setQuoteLabel('Unable to fetch DeepBook quote');
        }
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    };

    const timer = setTimeout(fetchQuote, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fromAmount, fromAsset, toAsset, isTestnet, address]);

  const handleFlip = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount(toAmount);
    setToAmount('');
  };

  const handleSwap = async () => {
    if (!address || !isUnlocked) {
      Alert.alert('Wallet locked', 'Unlock your wallet to swap via DeepBook.');
      return;
    }

    const amount = parseFloat(fromAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount to swap.');
      return;
    }

    if (!resolveDeepBookPair(fromAsset, toAsset, isTestnet)) {
      Alert.alert('Unsupported pair', 'This token pair is not available on DeepBook.');
      return;
    }

    setIsSwapping(true);
    try {
      const result = await executeDeepBookSwap(fromAsset, toAsset, amount, isTestnet, 100);
      const network = suiProvider.getConfig().chainName;

      addTransaction({
        id: result.digest,
        type: 'swap',
        amount: result.fromAmount,
        symbol: result.fromSymbol,
        to: result.toSymbol,
        timestamp: Date.now(),
        status: 'confirmed',
        hash: result.digest,
        fee: deepFee || '~0.001 SUI',
        network,
      });

      incrementReputation(15);
      const traderBadge = badges.find((b) => b.id === 'deepbook-trader');
      if (!traderBadge?.earned) {
        earnBadge('deepbook-trader');
        if (address) {
          try {
            await awardBackendBadge(address, 'deepbook-trader');
          } catch {
            // badge may already exist
          }
        }
      }

      await trackSwapComplete({
        from: result.fromSymbol,
        to: result.toSymbol,
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        digest: result.digest,
      });

      Alert.alert(
        'Swap successful',
        `Swapped ${result.fromAmount} ${result.fromSymbol} → ${result.toAmount} ${result.toSymbol} via DeepBook.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Swap failed';
      Alert.alert('DeepBook swap failed', message);
    } finally {
      setIsSwapping(false);
    }
  };

  const renderTokenPicker = (
    visible: boolean,
    onClose: () => void,
    onSelect: (symbol: string) => void,
    exclude: string
  ) => {
    if (!visible) return null;
    return (
      <Card style={styles.pickerCard}>
        {swapTokens
          .filter((t) => t !== exclude)
          .map((symbol) => (
            <TouchableOpacity
              key={symbol}
              style={styles.pickerItem}
              onPress={() => {
                onSelect(symbol);
                onClose();
              }}
            >
              <Text style={styles.pickerText}>{symbol}</Text>
            </TouchableOpacity>
          ))}
      </Card>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Swap (DeepBook)',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
        }}
      />
      <Screen scrollable>
        <Card variant="bordered" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Powered by DeepBook</Text>
          <Text style={styles.infoText}>
            On-chain orderbook swaps on Sui. Quotes and execution use the DeepBook V3 SDK.
          </Text>
        </Card>

        <Card style={styles.swapCard}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor={colors.text.tertiary}
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.assetButton}
              onPress={() => {
                setShowFromPicker(!showFromPicker);
                setShowToPicker(false);
              }}
            >
              <Text style={styles.asset}>{fromAsset}</Text>
              <ChevronDown color={colors.text.secondary} size={16} />
            </TouchableOpacity>
          </View>
          {renderTokenPicker(showFromPicker, () => setShowFromPicker(false), setFromAsset, toAsset)}
          <Text style={styles.balance}>Balance: {fromBalance} {fromAsset}</Text>
        </Card>

        <View style={styles.swapIconContainer}>
          <TouchableOpacity style={styles.swapIcon} onPress={handleFlip}>
            <ArrowDownUp color={colors.accent.primary} size={20} />
          </TouchableOpacity>
        </View>

        <Card style={styles.swapCard}>
          <Text style={styles.label}>To (estimated)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor={colors.text.tertiary}
              value={toAmount}
              editable={false}
            />
            <TouchableOpacity
              style={styles.assetButton}
              onPress={() => {
                setShowToPicker(!showToPicker);
                setShowFromPicker(false);
              }}
            >
              <Text style={styles.asset}>{toAsset}</Text>
              <ChevronDown color={colors.text.secondary} size={16} />
            </TouchableOpacity>
          </View>
          {renderTokenPicker(showToPicker, () => setShowToPicker(false), setToAsset, fromAsset)}
          {isQuoting && (
            <View style={styles.quotingRow}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
              <Text style={styles.balance}>Fetching DeepBook quote…</Text>
            </View>
          )}
        </Card>

        <Card variant="bordered" style={styles.rateCard}>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Rate</Text>
            <Text style={styles.rateValue}>{quoteLabel || '—'}</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>DeepBook fee token</Text>
            <Text style={styles.rateValue}>{deepFee || '—'}</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Slippage</Text>
            <Text style={styles.rateValue}>1.0%</Text>
          </View>
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Venue</Text>
            <Text style={styles.rateValue}>DeepBook V3</Text>
          </View>
        </Card>

        <Button
          onPress={handleSwap}
          disabled={!fromAmount || isSwapping || isQuoting}
          fullWidth
          style={styles.swapButton}
        >
          {isSwapping ? 'Swapping via DeepBook…' : 'Swap via DeepBook'}
        </Button>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  swapCard: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  assetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  asset: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  balance: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  quotingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  swapIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rateLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  rateValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    maxWidth: '60%',
    textAlign: 'right',
  },
  swapButton: {
    marginTop: spacing.base,
  },
  pickerCard: {
    marginTop: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  pickerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
