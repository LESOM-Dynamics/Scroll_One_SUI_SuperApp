import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { X, Search, AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { importTokenByAddress, getTokenMetadata, isValidCoinType } from '@/services/sui/tokens';
import { useSettingsStore } from '@/store/settingsStore';
import { shortenAddress } from '@/services/sui/wallet';

interface ImportTokenModalProps {
  visible: boolean;
  onClose: () => void;
  onTokenImported?: () => void;
}

export function ImportTokenModal({ visible, onClose, onTokenImported }: ImportTokenModalProps) {
  const { isTestnet } = useSettingsStore();
  const [address, setAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<{
    symbol: string;
    name: string;
    decimals: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleValidateAddress = async () => {
    if (!address.trim()) {
      setError('Please enter a token address');
      setTokenMetadata(null);
      return;
    }

    setIsValidating(true);
    setError(null);
    setTokenMetadata(null);

    try {
      // Validate address format
      if (!address.trim().includes('::')) {
        throw new Error('Invalid coin type format. Use 0xPACKAGE::module::Coin');
      }

      const isValid = await isValidCoinType(address.trim(), isTestnet);
      if (!isValid) {
        throw new Error(`Address is not a valid coin type on ${isTestnet ? 'testnet' : 'mainnet'}`);
      }

      const metadata = await getTokenMetadata(address.trim(), isTestnet);
      if (!metadata) {
        throw new Error('Could not fetch token information');
      }

      setTokenMetadata(metadata);
    } catch (err: any) {
      setError(err.message || 'Failed to validate token address');
      setTokenMetadata(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!tokenMetadata) return;

    setIsImporting(true);
    setError(null);

    try {
      await importTokenByAddress(address.trim(), isTestnet);
      
      Alert.alert(
        'Token Imported',
        `${tokenMetadata.name} (${tokenMetadata.symbol}) has been added to your token list.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAddress('');
              setTokenMetadata(null);
              onTokenImported?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to import token');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setAddress('');
    setTokenMetadata(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Token</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X color={colors.text.secondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card style={styles.card}>
              <Text style={styles.label}>Coin Type</Text>
              <Text style={styles.description}>
                Enter the Sui coin type to import (e.g. 0x2::sui::SUI)
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="0x...::module::Coin"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isValidating && !isImporting}
                />
                <TouchableOpacity
                  style={[styles.searchButton, (isValidating || !address.trim()) && styles.searchButtonDisabled]}
                  onPress={handleValidateAddress}
                  disabled={isValidating || !address.trim()}
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color={colors.text.primary} />
                  ) : (
                    <Search color={colors.text.primary} size={20} />
                  )}
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle color={colors.status.error} size={16} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {tokenMetadata && (
                <View style={styles.tokenInfoContainer}>
                  <View style={styles.tokenInfoHeader}>
                    <CheckCircle color={colors.status.success} size={20} />
                    <Text style={styles.tokenInfoTitle}>Token Found</Text>
                  </View>
                  <View style={styles.tokenInfo}>
                    <View style={styles.tokenInfoRow}>
                      <Text style={styles.tokenInfoLabel}>Name:</Text>
                      <Text style={styles.tokenInfoValue}>{tokenMetadata.name}</Text>
                    </View>
                    <View style={styles.tokenInfoRow}>
                      <Text style={styles.tokenInfoLabel}>Symbol:</Text>
                      <Text style={styles.tokenInfoValue}>{tokenMetadata.symbol}</Text>
                    </View>
                    <View style={styles.tokenInfoRow}>
                      <Text style={styles.tokenInfoLabel}>Decimals:</Text>
                      <Text style={styles.tokenInfoValue}>{tokenMetadata.decimals}</Text>
                    </View>
                    <View style={styles.tokenInfoRow}>
                      <Text style={styles.tokenInfoLabel}>Address:</Text>
                      <Text style={styles.tokenInfoValue}>{shortenAddress(address.trim(), 6)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </Card>

            <Text style={styles.warningText}>
              ⚠️ Always verify token addresses from trusted sources. Importing unknown tokens may pose security risks.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              onPress={handleImport}
              disabled={!tokenMetadata || isImporting}
              loading={isImporting}
              variant="primary"
              fullWidth
            >
              Import Token
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '85%',
    maxHeight: '90%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    minHeight: 400,
  },
  card: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  searchButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.status.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
    flex: 1,
  },
  tokenInfoContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.success + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.success + '30',
  },
  tokenInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tokenInfoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.status.success,
  },
  tokenInfo: {
    gap: spacing.sm,
  },
  tokenInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  tokenInfoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
});

