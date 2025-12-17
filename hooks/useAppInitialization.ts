import { useEffect, useRef } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { loadWallet, createWallet } from '@/services/scroll/wallet';
import { scrollProvider } from '@/services/scroll/provider';

export function useAppInitialization() {
  const { address, setAddress, setBalance } = useWalletStore();
  const { profile, setProfile, setBadges } = useUserStore();
  const { isTestnet, isLoading: settingsLoading, loadNetworkPreference } = useSettingsStore();
  const initializedRef = useRef(false);
  const lastNetworkRef = useRef<boolean | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Initializing Scroll One...');

      // Load network preference first
      await loadNetworkPreference();
    };

    initializeApp();
  }, [loadNetworkPreference]);

  // Initial wallet setup - only runs once
  useEffect(() => {
    // Wait for settings to load before initializing wallet
    if (settingsLoading || initializedRef.current) {
      return;
    }

    const initializeWallet = async () => {
      // Initialize provider with current network preference
      scrollProvider.switchNetwork(isTestnet);
      lastNetworkRef.current = isTestnet;

      let wallet = await loadWallet();
      if (!wallet) {
        console.log('[App] No wallet found, creating new one...');
        wallet = await createWallet();
      }

      if (wallet) {
        setAddress(wallet.address);
        console.log('[App] Wallet connected:', wallet.address);

        const balance = await scrollProvider.getBalance(wallet.address);
        setBalance(balance);
        console.log('[App] Balance loaded:', balance);

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

        initializedRef.current = true;
        console.log('[App] Initialization complete');
      }
    };

    initializeWallet();
  }, [settingsLoading, setAddress, setBalance, setProfile, setBadges, profile]);

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
