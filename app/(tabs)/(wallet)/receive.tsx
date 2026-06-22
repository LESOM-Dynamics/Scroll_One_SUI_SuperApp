import React from 'react';
import { View, Text, StyleSheet, Share, Platform } from 'react-native';
import { Stack } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWalletStore } from '@/store/walletStore';
import { Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function ReceiveScreen() {
  const { address } = useWalletStore();

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[ReceiveScreen] Address copied to clipboard');
    }
  };

  const handleShare = async () => {
    if (address) {
      try {
        await Share.share({
          message: `Send assets to my Sui address:\n${address}`,
        });
      } catch (error) {
        console.error('[ReceiveScreen] Error sharing:', error);
      }
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Receive',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerLeft: () => null,
        }}
      />
      <Screen>
        <View style={styles.center}>
          <Card variant="elevated" style={styles.qrCard}>
            {address ? (
              <View style={styles.qrContainer}>
                <QRCode
                  value={address}
                  size={240}
                  color={colors.text.primary}
                  backgroundColor={colors.background.primary}
                />
              </View>
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>No Address</Text>
                <Text style={styles.qrSubtext}>Create a wallet first</Text>
              </View>
            )}
          </Card>

          <Text style={styles.addressLabel}>Your Sui Address</Text>
          <Card variant="glass" style={styles.addressCard}>
            <Text style={styles.address} numberOfLines={1}>
              {address || '0x...'}
            </Text>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              onPress={handleCopyAddress}
              variant="secondary"
              fullWidth
              icon={<Copy color={colors.text.primary} size={20} />}
            >
              Copy Address
            </Button>

            <Button
              onPress={handleShare}
              variant="outline"
              fullWidth
              style={styles.shareButton}
            >
              Share
            </Button>
          </View>

          <Card variant="bordered" style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 Only send assets on the Sui network to this address
            </Text>
          </Card>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
  },
  qrCard: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  qrContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  qrSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  addressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  addressCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  address: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    textAlign: 'center' as const,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  shareButton: {
    marginTop: 0,
  },
  infoCard: {
    marginTop: spacing.xl,
    width: '100%',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});
