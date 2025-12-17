import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, Modal, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { isAddress } from 'ethers';
import { parseEther, formatEther } from 'ethers';
import { QrCode } from 'lucide-react-native';

import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { sendTransaction, estimateTransactionFee } from '@/services/scroll/transactions';
import { getETHPrice } from '@/services/scroll/prices';
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
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [ethPrice, setEthPrice] = useState(2500);

  const ethBalance = assets.find(a => a.symbol === 'ETH')?.balance || '0';
  const usdValue = amount ? (parseFloat(amount) * ethPrice).toFixed(2) : '0.00';

  // Fetch ETH price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await getETHPrice();
        setEthPrice(priceData.price);
      } catch (error) {
        console.error('[SendScreen] Error fetching ETH price:', error);
        // Keep default fallback price
      }
    };
    fetchPrice();
  }, []);

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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // Extract address from QR code (could be just address or ethereum:address format)
    let scannedAddress = data.trim();
    
    // Handle ethereum: address format
    if (scannedAddress.startsWith('ethereum:')) {
      scannedAddress = scannedAddress.replace('ethereum:', '').split('?')[0];
    }
    
    // Handle EIP-681 format (ethereum:0x...@chainId)
    if (scannedAddress.includes('@')) {
      scannedAddress = scannedAddress.split('@')[0];
    }
    
    // Validate address
    if (isAddress(scannedAddress)) {
      setRecipient(scannedAddress);
      setShowScanner(false);
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Invalid Address', 'The scanned QR code does not contain a valid Ethereum address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes');
        return;
      }
    }
    
    if (permission && !permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes. Please enable it in settings.');
      return;
    }
    
    setShowScanner(true);
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor={colors.text.tertiary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleOpenScanner}
              activeOpacity={0.7}
            >
              <QrCode color={colors.accent.neonGreen} size={24} />
            </TouchableOpacity>
          </View>
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

        {/* QR Scanner Modal */}
        {showScanner && permission?.granted && (
          <Modal
            visible={showScanner}
            animationType="slide"
            onRequestClose={() => setShowScanner(false)}
          >
            <View style={styles.scannerContainer}>
              <CameraView
                style={styles.camera}
                facing={CameraType.back}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerText}>Position QR code within frame</Text>
                <Button
                  onPress={() => setShowScanner(false)}
                  variant="outline"
                  style={styles.closeScannerButton}
                >
                  Close Scanner
                </Button>
              </View>
            </View>
          </Modal>
        )}
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
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    paddingRight: 60,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
  },
  scanButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
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
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: colors.accent.neonGreen,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  scannerText: {
    marginTop: spacing.xl,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  closeScannerButton: {
    marginTop: spacing['2xl'],
    minWidth: 150,
  },
});
