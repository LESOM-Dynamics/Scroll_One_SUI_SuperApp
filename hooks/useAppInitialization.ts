import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWalletStore } from '@/store/walletStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { loadWallet, createWallet } from '@/services/scroll/wallet';
import { scrollProvider } from '@/services/scroll/provider';

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
      console.log('[App] Initializing Scroll One...');

      // Load persisted preferences first
      await Promise.all([loadNetworkPreference(), loadBiometricPreference()]);
    };

    initializeApp();
  }, [loadNetworkPreference, loadBiometricPreference]);

  // Initial wallet setup - only runs once
  useEffect(() => {
    // Wait for settings to load before initializing wallet
    if (settingsLoading || initializedRef.current) {
      return;
    }

    const initializeWallet = async () => {
      // Start locked until we successfully load (and optionally unlock) the wallet
      setUnlocked(false);
      // Initialize provider with current network preference
      scrollProvider.switchNetwork(isTestnet);
      lastNetworkRef.current = isTestnet;

      // Check if wallet exists (don't auto-create - let signup handle it)
      const wallet = await loadWallet();
      
      if (wallet) {
        // Always load wallet address (it's public info)
        setAddress(wallet.address);
        console.log('[App] Wallet address loaded:', wallet.address);

        // If biometric auth is enabled, require successful device authentication to unlock
        let shouldUnlock = true;
        
        if (biometricAuthEnabled && Platform.OS !== 'web') {
          try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
              console.warn('[App] Biometric auth enabled but not available/enrolled on device');
              // Continue without biometrics
            } else {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock your Scroll wallet',
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
            // If biometrics fail unexpectedly, continue without blocking so user is not locked out
          }
        }

        if (shouldUnlock) {
          // Unlock wallet and load balance
          const balance = await scrollProvider.getBalance(wallet.address);
          setBalance(balance);
          console.log('[App] Balance loaded:', balance);
          setUnlocked(true);

          // Only set profile and badges if they don't exist
          if (!profile) {
            setProfile({
              id: '1',
              username: 'scrolluser',
              displayName: 'Scroll User',
              scrollId: 'scrolluser123',
              reputation: 1250,
              level: 5,
              joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
            });

            setBadges([
              { id: '1', name: 'Early Adopter', description: 'Joined in beta', icon: '🏆', earned: true, rarity: 'epic', earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
              { id: '2', name: 'Power User', description: 'Made 100 transactions', icon: '⚡', earned: true, rarity: 'rare', earnedAt: Date.now() - 15 * 24 * 60 * 60 * 1000 },
              { id: '3', name: 'Accuracy Master', description: 'Complete 50 swaps', icon: '🎯', earned: false, rarity: 'epic' },
              { id: '4', name: 'Streak Champion', description: 'Active for 30 days', icon: '🔥', earned: false, rarity: 'legendary' },
            ]);
          }
        } else {
          // Wallet is locked - don't load balance or unlock
          setUnlocked(false);
        }

        initializedRef.current = true;
        console.log('[App] Initialization complete');
      } else {
        // No wallet exists - user needs to sign up
        console.log('[App] No wallet found - user needs to sign up');
        initializedRef.current = true;
      }
    };

    initializeWallet();
  }, [settingsLoading, isTestnet, biometricAuthEnabled, setAddress, setBalance, setProfile, setBadges, profile]);

  // Handle network changes - refresh balance when network switches
  useEffect(() => {
    if (!initializedRef.current || settingsLoading) {
      return;
    }

    // Only refresh if network actually changed
    if (lastNetworkRef.current !== null && lastNetworkRef.current !== isTestnet) {
      const refreshBalance = async () => {
        scrollProvider.switchNetwork(isTestnet);
        lastNetworkRef.current = isTestnet;
        
        if (address) {
          try {
            const balance = await scrollProvider.getBalance(address);
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
