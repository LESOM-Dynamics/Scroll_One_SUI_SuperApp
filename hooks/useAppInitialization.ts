import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWalletStore } from '@/store/walletStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { loadWallet } from '@/services/sui/wallet';
import { suiProvider } from '@/services/sui/provider';
import {
  getCachedProfileBlobId,
  loadProfileFromWalrus,
  bundleToUserProfile,
  bundleToBadges,
} from '@/services/walrus/profile';
import { fetchWalrusProfileFromBackend } from '@/services/walrus/api';
import { authenticateWithBackend } from '@/services/api/auth';
import { fetchBackendProfile } from '@/services/api/users';
import { trackAppOpen } from '@/services/api/analytics';
import { registerPushToken } from '@/services/api/notifications';
import { notificationService } from '@/services/notifications/notificationService';

const DEFAULT_BADGES = [
  { id: 'deepbook-trader', name: 'DeepBook Trader', description: 'Completed a DeepBook swap', icon: '📖', earned: false, rarity: 'epic' as const },
  { id: 'walrus-pioneer', name: 'Walrus Pioneer', description: 'Saved profile to Walrus', icon: '☁️', earned: false, rarity: 'rare' as const },
];

function mergeBadges(earned: ReturnType<typeof useUserStore.getState>['badges']) {
  const earnedIds = new Set(earned.filter((b) => b.earned).map((b) => b.id));
  const merged = [...earned];
  for (const badge of DEFAULT_BADGES) {
    if (!merged.some((b) => b.id === badge.id)) {
      merged.push({ ...badge, earned: earnedIds.has(badge.id) });
    }
  }
  return merged;
}

export function useAppInitialization() {
  const { address, setAddress, setBalance, setUnlocked } = useWalletStore();
  const { profile, setProfile, setBadges } = useUserStore();
  const {
    isTestnet,
    isLoading: settingsLoading,
    loadNetworkPreference,
    loadBiometricPreference,
    biometricAuthEnabled,
  } = useSettingsStore();
  const initializedRef = useRef(false);
  const lastNetworkRef = useRef<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Initializing Sui One...');
      await Promise.all([loadNetworkPreference(), loadBiometricPreference()]);
    };

    initializeApp();
  }, [loadNetworkPreference, loadBiometricPreference]);

  useEffect(() => {
    if (settingsLoading || initializedRef.current) {
      return;
    }

    const initializeWallet = async () => {
      setUnlocked(false);
      suiProvider.switchNetwork(isTestnet);
      lastNetworkRef.current = isTestnet;

      const wallet = await loadWallet();

      if (wallet) {
        setAddress(wallet.address);
        console.log('[App] Wallet address loaded:', wallet.address);

        let shouldUnlock = true;

        if (biometricAuthEnabled && Platform.OS !== 'web') {
          try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
              console.warn('[App] Biometric auth enabled but not available/enrolled on device');
            } else {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock your Sui wallet',
                fallbackLabel: 'Use device passcode',
                cancelLabel: 'Cancel',
              });

              if (!result.success) {
                console.log('[App] Biometric authentication cancelled or failed, leaving wallet locked');
                shouldUnlock = false;
              }
            }
          } catch (error) {
            console.error('[App] Error during biometric authentication:', error);
          }
        }

        if (shouldUnlock) {
          const balance = await suiProvider.getBalance(wallet.address);
          setBalance(balance);
          console.log('[App] Balance loaded:', balance);
          setUnlocked(true);

          await authenticateWithBackend(wallet.address);

          const backendData = await fetchBackendProfile(wallet.address);
          if (backendData.profile) {
            setProfile(backendData.profile);
            setBadges(mergeBadges(backendData.badges));
          } else if (!profile) {
            setProfile({
              id: wallet.address,
              username: `user_${wallet.address.slice(-6)}`,
              displayName: 'Sui User',
              suiId: wallet.address,
              reputation: 0,
              level: 1,
              joinedAt: Date.now(),
            });
            setBadges(DEFAULT_BADGES);
          }

          try {
            let blobId = await getCachedProfileBlobId(wallet.address);

            if (!blobId) {
              const backendWalrus = await fetchWalrusProfileFromBackend(wallet.address);
              blobId = backendWalrus?.walrusBlobId ?? null;
            }

            if (blobId) {
              const bundle = await loadProfileFromWalrus(wallet.address, isTestnet, blobId);
              if (bundle) {
                setProfile({
                  ...bundleToUserProfile(bundle, profile?.id ?? wallet.address),
                  walrusBlobId: blobId,
                  profileContentHash: bundle.contentHash,
                });
                setBadges(mergeBadges(bundleToBadges(bundle)));
              }
            }
          } catch (walrusError) {
            console.warn('[App] Walrus profile hydration skipped:', walrusError);
          }

          await trackAppOpen();

          const hasNotificationPermission = await notificationService.hasPermissions();
          if (!hasNotificationPermission) {
            await notificationService.requestPermissions();
          }
          const pushToken = notificationService.getPushToken();
          if (pushToken) {
            await registerPushToken(pushToken);
          }
        } else {
          setUnlocked(false);
        }

        initializedRef.current = true;
        console.log('[App] Initialization complete');
      } else {
        console.log('[App] No wallet found - user needs to sign up');
        initializedRef.current = true;
      }
    };

    initializeWallet();
  }, [settingsLoading, isTestnet, biometricAuthEnabled, setAddress, setBalance, setProfile, setBadges, profile]);

  useEffect(() => {
    if (!initializedRef.current || settingsLoading) {
      return;
    }

    if (lastNetworkRef.current !== null && lastNetworkRef.current !== isTestnet) {
      const refreshBalance = async () => {
        suiProvider.switchNetwork(isTestnet);
        lastNetworkRef.current = isTestnet;

        if (address) {
          try {
            const balance = await suiProvider.getBalance(address);
            setBalance(balance);
            console.log('[App] Balance refreshed after network switch:', balance);
          } catch (error) {
            console.error('[App] Error refreshing balance after network switch:', error);
          }
        }
      };

      refreshBalance();
    }
  }, [isTestnet, address, setBalance, settingsLoading]);
}
