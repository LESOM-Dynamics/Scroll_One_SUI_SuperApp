import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';
import type { TransactionRequest } from '@/scrollone-sdk';
import { formatEther } from 'ethers';

interface TransactionApprovalModalProps {
  transaction: TransactionRequest;
  onApprove: () => void;
  onReject: () => void;
}

export function TransactionApprovalModal({
  transaction,
  onApprove,
  onReject,
}: TransactionApprovalModalProps) {
  const valueEth = transaction.value
    ? formatEther(transaction.value)
    : transaction.value || '0';

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Review Transaction</Text>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>To:</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                {transaction.to}
              </Text>
            </View>

            {transaction.value && (
              <View style={styles.section}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>
                  {typeof transaction.value === 'string' && !transaction.value.startsWith('0x')
                    ? transaction.value
                    : valueEth} ETH
                </Text>
              </View>
            )}

            {transaction.data && (
              <View style={styles.section}>
                <Text style={styles.label}>Data:</Text>
                <Text style={styles.value} numberOfLines={3}>
                  {transaction.data}
                </Text>
              </View>
            )}

            {transaction.gasLimit && (
              <View style={styles.section}>
                <Text style={styles.label}>Gas Limit:</Text>
                <Text style={styles.value}>{transaction.gasLimit}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  button: {
    flex: 1,
    padding: spacing.base,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.background.secondary,
  },
  rejectButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  approveButton: {
    backgroundColor: colors.accent.primary,
  },
  approveButtonText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
