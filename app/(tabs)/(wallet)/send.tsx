import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
import { QrCode, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Info, Shield, X } from 'lucide-react-native';

import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';
import { sendTransaction, estimateTransactionFee } from '@/services/sui/transactions';
import { getSUIPrice } from '@/services/sui/prices';
import { shortenAddress } from '@/services/sui/wallet';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUI_GAS_EXPLAINER_SHOWN_KEY = '@sui_one:gas_explainer_shown';

type Step = 'intent' | 'review' | 'confirmation';

export default function SendScreen() {
  const router = useRouter();
  const { address, assets, addTransaction } = useWalletStore();
  const { isTestnet } = useSettingsStore();
  const [step, setStep] = useState<Step>('intent');
  const [recipient, setRecipient] = useState('');
  const [recipientDisplay, setRecipientDisplay] = useState(''); // For ENS or formatted address
  const [amount, setAmount] = useState('');
  const [selectedAsset] = useState('SUI');
  const [estimatedFee, setEstimatedFee] = useState('0.002');
  const [feeUsd, setFeeUsd] = useState('0.00');
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showGasExplainer, setShowGasExplainer] = useState(false);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [suiPrice, setSuiPrice] = useState(2.5);
  const [contractRisk, setContractRisk] = useState<'none' | 'low' | 'medium' | 'high'>('none');

  const suiBalance = assets.find(a => a.symbol === 'SUI')?.balance || '0';
  const usdValue = amount ? (parseFloat(amount) * suiPrice).toFixed(2) : '0.00';
  const totalCost = (parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(6);
  const totalCostUsd = ((parseFloat(amount || '0') + parseFloat(estimatedFee)) * suiPrice).toFixed(2);
  const networkName = isTestnet ? 'Sui Testnet' : 'Sui Mainnet';

  // Fetch SUI price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await getSUIPrice();
        setSuiPrice(priceData.price);
      } catch (error) {
        console.error('[SendScreen] Error fetching SUI price:', error);
      }
    };
    fetchPrice();

    AsyncStorage.getItem(SUI_GAS_EXPLAINER_SHOWN_KEY).then((value) => {
      setHasSeenExplainer(value === 'true');
    });
  }, []);

  // Resolve ENS or format address
  useEffect(() => {
    const resolveRecipient = async () => {
      if (!recipient) {
        setRecipientDisplay('');
        return;
      }

      // Check if it's an address
      if (isValidSuiAddress(recipient)) {
        setRecipientDisplay(shortenAddress(recipient, 6));
        // TODO: Check if it's a contract address for risk assessment
        // For now, assume it's a regular address (low risk)
        setContractRisk('none');
      } else {
        // Could be ENS - for now just show as-is
        // TODO: Implement ENS resolution
        setRecipientDisplay(recipient);
        setContractRisk('none');
      }
    };

    resolveRecipient();
  }, [recipient]);

  // Estimate fee when recipient and amount change
  useEffect(() => {
    const estimateFee = async () => {
      if (!recipient || !amount || !isValidSuiAddress(recipient)) {
        setEstimatedFee('0.002');
        setFeeUsd('0.00');
        return;
      }

      try {
        setIsEstimatingFee(true);
        const fee = await estimateTransactionFee(recipient, amount);
        setEstimatedFee(fee);
        setFeeUsd((parseFloat(fee) * suiPrice).toFixed(2));
      } catch (error) {
        console.error('[SendScreen] Error estimating fee:', error);
        setEstimatedFee('0.002');
        setFeeUsd('0.00');
      } finally {
        setIsEstimatingFee(false);
      }
    };

    const timeoutId = setTimeout(estimateFee, 500);
    return () => clearTimeout(timeoutId);
  }, [recipient, amount, suiPrice]);

  const validateInputs = (): boolean => {
    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }

    if (!isValidSuiAddress(recipient)) {
      setError('Invalid recipient address');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(suiBalance);
    const feeNum = parseFloat(estimatedFee);

    if (amountNum + feeNum > balanceNum) {
      setError('Insufficient balance (including gas fee)');
      return false;
    }

    return true;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    let scannedAddress = data.trim();
    
    if (scannedAddress.startsWith('sui:')) {
      scannedAddress = scannedAddress.replace('sui:', '').split('?')[0];
    }
    
    if (scannedAddress.includes('@')) {
      scannedAddress = scannedAddress.split('@')[0];
    }
    
    if (isValidSuiAddress(scannedAddress)) {
      setRecipient(normalizeSuiAddress(scannedAddress));
      setShowScanner(false);
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Invalid Address', 'The scanned QR code does not contain a valid Sui address');
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

  const handleContinueToReview = () => {
    if (!validateInputs()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError(null);
    setStep('review');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinueToConfirmation = () => {
    setStep('confirmation');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShowGasExplainer = () => {
    setShowGasExplainer(true);
  };

  const handleDismissExplainer = async () => {
    setShowGasExplainer(false);
    await AsyncStorage.setItem(SUI_GAS_EXPLAINER_SHOWN_KEY, 'true');
    setHasSeenExplainer(true);
  };

  const handleSignAndSubmit = async () => {
    setError(null);
    setIsSigning(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Simulate signing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSigning(false);
      setIsSubmitting(true);

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
      setIsSigning(false);
      setIsSubmitting(false);
      Alert.alert('Transaction Failed', errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('intent');
    } else if (step === 'confirmation') {
      setStep('review');
    } else {
      router.back();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // STEP 1: INTENT SCREEN
  const renderIntentScreen = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepActive}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}>
          <Text style={[styles.stepNumber, styles.stepNumberInactive]}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}>
          <Text style={[styles.stepNumber, styles.stepNumberInactive]}>3</Text>
        </View>
      </View>

      <Text style={styles.stepTitle}>You are sending</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Recipient Address</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="0x... or ENS name"
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
            <QrCode color={colors.accent.primary} size={24} />
          </TouchableOpacity>
        </View>
        {recipientDisplay && (
          <Text style={styles.recipientDisplay}>{recipientDisplay}</Text>
        )}
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

      <Card variant="bordered" style={styles.networkCard}>
        <View style={styles.networkRow}>
          <View style={styles.networkInfo}>
            <Text style={styles.networkLabel}>Network</Text>
            <Text style={styles.networkValue}>{networkName}</Text>
          </View>
          <CheckCircle color={colors.status.success} size={20} />
        </View>
      </Card>

      {error && (
        <Card variant="bordered" style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      <Button
        onPress={handleContinueToReview}
        disabled={!recipient || !amount || isEstimatingFee}
        fullWidth
        style={styles.continueButton}
      >
        Continue
        <ArrowRight color={colors.text.primary} size={20} />
      </Button>

      <Text style={styles.balanceText}>
        Available: {suiBalance} SUI
      </Text>
    </ScrollView>
  );

  // STEP 2: REVIEW SCREEN
  const renderReviewScreen = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepCompleted}>
          <CheckCircle color={colors.text.primary} size={16} />
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepActive}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}>
          <Text style={[styles.stepNumber, styles.stepNumberInactive]}>3</Text>
        </View>
      </View>

      <Text style={styles.stepTitle}>Review Transaction</Text>

      {/* Exact Asset Change */}
      <Card variant="elevated" style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>You are sending</Text>
        <View style={styles.assetChangeRow}>
          <Text style={styles.assetChangeAmount}>-{amount} {selectedAsset}</Text>
          <Text style={styles.assetChangeUsd}>≈ ${usdValue}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.destinationRow}>
          <Text style={styles.destinationLabel}>To:</Text>
          <Text style={styles.destinationValue}>{recipientDisplay || shortenAddress(recipient, 8)}</Text>
        </View>
      </Card>

      {/* Gas Fee */}
      <Card style={styles.reviewCard}>
        <View style={styles.feeRow}>
          <View>
            <Text style={styles.feeLabel}>Network Fee</Text>
            {isEstimatingFee ? (
              <ActivityIndicator size="small" color={colors.text.secondary} style={styles.feeLoader} />
            ) : (
              <Text style={styles.feeSubtext}>Estimated gas cost</Text>
            )}
          </View>
          <View style={styles.feeValueContainer}>
            <Text style={styles.feeValue}>{estimatedFee} SUI</Text>
            <Text style={styles.feeUsdValue}>≈ ${feeUsd}</Text>
          </View>
        </View>
      </Card>

      {/* Total Cost */}
      <Card variant="bordered" style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValue}>{totalCost} SUI</Text>
            <Text style={styles.totalUsdValue}>≈ ${totalCostUsd}</Text>
          </View>
        </View>
      </Card>

      {/* Reversibility Warning */}
      <Card variant="bordered" style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <AlertTriangle color={colors.status.warning} size={20} />
          <Text style={styles.warningTitle}>Transaction is irreversible</Text>
        </View>
        <Text style={styles.warningText}>
          Once confirmed, this transaction cannot be undone. Please verify the recipient address and amount before proceeding.
        </Text>
      </Card>

      {/* Contract Risk (if applicable) */}
      {contractRisk !== 'none' && (
        <Card variant="bordered" style={[styles.warningCard, contractRisk === 'high' && styles.highRiskCard]}>
          <View style={styles.warningHeader}>
            <Shield color={contractRisk === 'high' ? colors.status.error : colors.status.warning} size={20} />
            <Text style={styles.warningTitle}>
              Contract Interaction {contractRisk === 'high' ? '(High Risk)' : contractRisk === 'medium' ? '(Medium Risk)' : '(Low Risk)'}
            </Text>
          </View>
          <Text style={styles.warningText}>
            This transaction interacts with a smart contract. Review the contract details carefully before proceeding.
          </Text>
        </Card>
      )}

      {/* Sui gas info */}
      <Card variant="bordered" style={styles.scrollCard}>
        <View style={styles.scrollHeader}>
          <Info color={colors.accent.primary} size={20} />
          <Text style={styles.scrollTitle}>This transaction runs on Sui</Text>
        </View>
        <Text style={styles.scrollText}>
          Sui uses an object-based model with fast finality and low gas fees paid in SUI.
        </Text>
        {!hasSeenExplainer && (
          <TouchableOpacity
            style={styles.explainerButton}
            onPress={handleShowGasExplainer}
          >
            <Text style={styles.explainerButtonText}>Learn about Sui gas</Text>
          </TouchableOpacity>
        )}
      </Card>

      <Button
        onPress={handleContinueToConfirmation}
        fullWidth
        style={styles.continueButton}
      >
        Continue to Sign
        <ArrowRight color={colors.text.primary} size={20} />
      </Button>
    </ScrollView>
  );

  // STEP 3: CONFIRMATION SCREEN
  const renderConfirmationScreen = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepCompleted}>
          <CheckCircle color={colors.text.primary} size={16} />
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepCompleted}>
          <CheckCircle color={colors.text.primary} size={16} />
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepActive}>
          <Text style={styles.stepNumber}>3</Text>
        </View>
      </View>

      <Text style={styles.stepTitle}>Sign & Submit</Text>

      {isSigning ? (
        <View style={styles.signingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.signingText}>Signing transaction...</Text>
          <Text style={styles.signingSubtext}>Please confirm in your wallet</Text>
        </View>
      ) : isSubmitting ? (
        <View style={styles.signingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.signingText}>Submitting transaction...</Text>
          <Text style={styles.signingSubtext}>This may take a few moments</Text>
        </View>
      ) : (
        <>
          <Card variant="elevated" style={styles.confirmationCard}>
            <View style={styles.confirmationSummary}>
              <Text style={styles.confirmationAmount}>-{amount} {selectedAsset}</Text>
              <Text style={styles.confirmationUsd}>≈ ${usdValue}</Text>
              <View style={styles.confirmationDivider} />
              <View style={styles.confirmationDetails}>
                <View style={styles.confirmationDetailRow}>
                  <Text style={styles.confirmationDetailLabel}>To:</Text>
                  <Text style={styles.confirmationDetailValue}>{recipientDisplay || shortenAddress(recipient, 8)}</Text>
                </View>
                <View style={styles.confirmationDetailRow}>
                  <Text style={styles.confirmationDetailLabel}>Network Fee:</Text>
                  <Text style={styles.confirmationDetailValue}>{estimatedFee} SUI (≈ ${feeUsd})</Text>
                </View>
                <View style={styles.confirmationDetailRow}>
                  <Text style={styles.confirmationDetailLabel}>Network:</Text>
                  <Text style={styles.confirmationDetailValue}>{networkName}</Text>
                </View>
              </View>
            </View>
          </Card>

          {error && (
            <Card variant="bordered" style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          <Button
            onPress={handleSignAndSubmit}
            disabled={isSigning || isSubmitting}
            fullWidth
            style={styles.signButton}
          >
            Sign & Submit
          </Button>
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: step === 'intent' ? 'Send' : step === 'review' ? 'Review' : 'Confirm',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ArrowLeft color={colors.text.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen padding={false}>
        {step === 'intent' && renderIntentScreen()}
        {step === 'review' && renderReviewScreen()}
        {step === 'confirmation' && renderConfirmationScreen()}

        {/* QR Scanner Modal */}
        {showScanner && permission?.granted && (
          <Modal
            visible={showScanner}
            animationType="fade"
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

        {/* Sui gas explainer modal */}
        {showGasExplainer && (
          <Modal
            visible={showGasExplainer}
            animationType="slide"
            transparent
            onRequestClose={handleDismissExplainer}
          >
            <View style={styles.modalOverlay}>
              <Card style={styles.explainerModal}>
                <View style={styles.explainerHeader}>
                  <Text style={styles.explainerModalTitle}>How Sui gas works</Text>
                  <TouchableOpacity onPress={handleDismissExplainer}>
                    <X color={colors.text.secondary} size={24} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.explainerModalText}>
                  Sui transactions pay a small gas fee in SUI. Fees cover computation and storage, with unused storage cost rebated. This means:
                </Text>
                <View style={styles.explainerList}>
                  <Text style={styles.explainerListItem}>• Lower gas fees (often 10-100x cheaper)</Text>
                  <Text style={styles.explainerListItem}>• Faster transaction confirmation</Text>
                  <Text style={styles.explainerListItem}>• Same security guarantees as Ethereum</Text>
                </View>
                <Text style={styles.explainerModalText}>
                  Your transaction will be executed on the Sui network with fast finality and predictable low fees.
                </Text>
                <Button onPress={handleDismissExplainer} fullWidth style={styles.explainerButton}>
                  Got it
                </Button>
              </Card>
            </View>
          </Modal>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl * 2,
  },
  headerButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  stepActive: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInactive: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  stepNumberInactive: {
    color: colors.text.secondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.medium,
    marginHorizontal: spacing.xs,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
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
  recipientDisplay: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.mono,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
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
  networkCard: {
    marginBottom: spacing.xl,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkInfo: {
    flex: 1,
  },
  networkLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  networkValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  continueButton: {
    marginTop: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  reviewCard: {
    marginBottom: spacing.base,
  },
  reviewSectionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  assetChangeRow: {
    marginBottom: spacing.md,
  },
  assetChangeAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  assetChangeUsd: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  destinationValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    flex: 1,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  feeSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },
  feeLoader: {
    marginTop: spacing.xs,
  },
  feeValueContainer: {
    alignItems: 'flex-end',
  },
  feeValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.semibold,
  },
  feeUsdValue: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  totalCard: {
    marginBottom: spacing.base,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  totalValueContainer: {
    alignItems: 'flex-end',
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
  },
  totalUsdValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  warningCard: {
    marginBottom: spacing.base,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderColor: colors.status.warning + '40',
  },
  highRiskCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: colors.status.error + '40',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  scrollCard: {
    marginBottom: spacing.base,
    backgroundColor: 'rgba(110, 86, 207, 0.05)',
    borderColor: colors.accent.primary + '40',
  },
  scrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scrollTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    flex: 1,
  },
  scrollText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  explainerButton: {
    marginTop: spacing.xs,
  },
  explainerButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmationContainer: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  confirmationCard: {
    marginBottom: spacing.xl,
  },
  confirmationSummary: {
    alignItems: 'center',
  },
  confirmationAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  confirmationUsd: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  confirmationDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.subtle,
    marginBottom: spacing.lg,
  },
  confirmationDetails: {
    width: '100%',
  },
  confirmationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  confirmationDetailLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  confirmationDetailValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    flex: 1,
    textAlign: 'right',
  },
  signingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  signingText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  signingSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  signButton: {
    marginTop: spacing.base,
  },
  errorCard: {
    marginBottom: spacing.base,
    backgroundColor: 'rgba(220, 38, 38, 0.04)',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
    textAlign: 'center',
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
    backgroundColor: colors.overlay.light,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  scannerText: {
    marginTop: spacing.xl,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  closeScannerButton: {
    marginTop: spacing['2xl'],
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  explainerModal: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.lg,
  },
  explainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  explainerModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  explainerModalText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  explainerList: {
    marginBottom: spacing.md,
  },
  explainerListItem: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  explainerButton: {
    marginTop: spacing.md,
  },
});
