import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Wallet, Plus, Check, Trash2, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { shortenAddress } from '@/services/scroll/wallet';
import { 
  getAllWallets, 
  setCurrentWallet, 
  createWallet, 
  deleteWalletById,
  getCurrentWalletId,
  loadWallet,
  type Wallet as WalletType 
} from '@/services/scroll/wallet';
import { useWalletStore } from '@/store/walletStore';

interface WalletSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WalletSelectionModal({ visible, onClose }: WalletSelectionModalProps) {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [currentWalletId, setCurrentWalletId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { address, setAddress } = useWalletStore();

  useEffect(() => {
    if (visible) {
      loadWallets();
    }
  }, [visible]);

  const loadWallets = async () => {
    try {
      const allWallets = await getAllWallets();
      setWallets(allWallets);
      
      // If no address in store, try to load wallet from storage
      if (!address) {
        const wallet = await loadWallet();
        if (wallet) {
          setAddress(wallet.address);
        }
      }
      
      // Get current wallet ID from storage
      const currentId = await getCurrentWalletId();
      
      if (currentId) {
        // Check if current wallet is in the list
        const current = allWallets.find(w => w.id === currentId);
        if (current) {
          setCurrentWalletId(currentId);
          // Ensure address is set
          if (!address || address.toLowerCase() !== current.address.toLowerCase()) {
            setAddress(current.address);
          }
        } else {
          // Current wallet ID exists but not in list (might be legacy)
          // Use address from store to find it
          const currentByAddress = allWallets.find(w => w.address.toLowerCase() === address?.toLowerCase());
          setCurrentWalletId(currentByAddress?.id || null);
        }
      } else {
        // No current wallet ID, try to find by address
        const currentByAddress = allWallets.find(w => w.address.toLowerCase() === address?.toLowerCase());
        setCurrentWalletId(currentByAddress?.id || null);
      }
    } catch (error) {
      console.error('[WalletSelectionModal] Error loading wallets:', error);
    }
  };

  const handleSelectWallet = async (walletId: string) => {
    try {
      await setCurrentWallet(walletId);
      const selectedWallet = wallets.find(w => w.id === walletId);
      if (selectedWallet) {
        setAddress(selectedWallet.address);
        setCurrentWalletId(walletId);
      }
      onClose();
    } catch (error) {
      console.error('[WalletSelectionModal] Error selecting wallet:', error);
      Alert.alert('Error', 'Failed to switch wallet');
    }
  };

  const handleCreateWallet = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const newWallet = await createWallet(newWalletName || undefined);
      setWallets(prev => [...prev, newWallet]);
      setCurrentWalletId(newWallet.id);
      setAddress(newWallet.address);
      setShowCreateForm(false);
      setNewWalletName('');
      onClose();
    } catch (error) {
      console.error('[WalletSelectionModal] Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWallet = (walletId: string, walletAddress: string) => {
    if (wallets.length <= 1) {
      Alert.alert('Error', 'You must have at least one wallet');
      return;
    }

    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete wallet ${shortenAddress(walletAddress)}? This action cannot be undone. Make sure you have backed up your private key.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWalletById(walletId);
              await loadWallets();
              if (currentWalletId === walletId) {
                // If deleted wallet was current, select first available
                const remainingWallets = wallets.filter(w => w.id !== walletId);
                if (remainingWallets.length > 0) {
                  await handleSelectWallet(remainingWallets[0].id);
                }
              }
            } catch (error) {
              console.error('[WalletSelectionModal] Error deleting wallet:', error);
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text.secondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Always show current wallet address at the top */}
            {address && !showCreateForm && (
              <Card style={styles.currentWalletCard}>
                <View style={styles.currentWalletHeader}>
                  <Text style={styles.currentWalletLabel}>Current Wallet</Text>
                  <Check color={colors.accent.primary} size={20} />
                </View>
                <Text style={styles.currentWalletAddress} numberOfLines={2} ellipsizeMode="middle">
                  {address}
                </Text>
                {currentWalletId && (
                  <Text style={styles.currentWalletName}>
                    {wallets.find(w => w.id === currentWalletId)?.name || 'Active'}
                  </Text>
                )}
              </Card>
            )}

            {wallets.length === 0 && !showCreateForm && !address && (
              <View style={styles.emptyState}>
                <Wallet color={colors.text.tertiary} size={48} />
                <Text style={styles.emptyText}>No wallets found</Text>
                <Text style={styles.emptySubtext}>Create your first wallet to get started</Text>
              </View>
            )}

            {wallets.map((wallet) => (
              <Card key={wallet.id} style={styles.walletCard}>
                <TouchableOpacity
                  style={styles.walletItem}
                  onPress={() => handleSelectWallet(wallet.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.walletLeft}>
                    <View style={[
                      styles.walletIcon,
                      currentWalletId === wallet.id && styles.walletIconActive
                    ]}>
                      <Wallet 
                        color={currentWalletId === wallet.id ? colors.accent.primary : colors.text.secondary} 
                        size={20} 
                      />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={styles.walletName}>
                        {wallet.name || `Wallet ${shortenAddress(wallet.address, 4)}`}
                      </Text>
                      <Text 
                        style={styles.walletAddress}
                        numberOfLines={2}
                        ellipsizeMode="middle"
                      >
                        {wallet.address}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.walletRight}>
                    {currentWalletId === wallet.id && (
                      <Check color={colors.accent.primary} size={20} />
                    )}
                    {wallets.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteWallet(wallet.id, wallet.address)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 color={colors.status.error} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            ))}

            {showCreateForm && (
              <Card style={styles.createCard}>
                <Text style={styles.createTitle}>Create New Wallet</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Wallet name (optional)"
                  placeholderTextColor={colors.text.tertiary}
                  value={newWalletName}
                  onChangeText={setNewWalletName}
                />
                <View style={styles.createActions}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      setShowCreateForm(false);
                      setNewWalletName('');
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleCreateWallet}
                    loading={isCreating}
                    style={styles.createButton}
                  >
                    Create
                  </Button>
                </View>
              </Card>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => setShowCreateForm(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Plus color={colors.accent.primary} size={20} />
              <Text style={styles.addButtonText}>Add Wallet</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius['2xl'],
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    flexShrink: 0,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    flexShrink: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  walletCard: {
    marginBottom: spacing.md,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  walletIconActive: {
    backgroundColor: colors.accent.primary + '20',
  },
  walletInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  walletName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  walletAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  currentWalletCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.accent.primary + '10',
    borderWidth: 1,
    borderColor: colors.accent.primary + '30',
  },
  currentWalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  currentWalletLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
  },
  currentWalletAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  currentWalletName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  createCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  createTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    flexShrink: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: 'transparent',
    gap: spacing.xs,
  },
  addButtonText: {
    color: colors.accent.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

