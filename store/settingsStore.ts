import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NETWORK_PREFERENCE_KEY = '@scroll_one:network_preference';

interface SettingsState {
  isTestnet: boolean;
  isLoading: boolean;
  
  setNetwork: (isTestnet: boolean) => Promise<void>;
  loadNetworkPreference: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isTestnet: false, // Default to mainnet
  isLoading: true,
  
  setNetwork: async (isTestnet: boolean) => {
    try {
      await AsyncStorage.setItem(NETWORK_PREFERENCE_KEY, JSON.stringify(isTestnet));
      set({ isTestnet });
      console.log('[SettingsStore] Network preference saved:', isTestnet ? 'Testnet' : 'Mainnet');
    } catch (error) {
      console.error('[SettingsStore] Error saving network preference:', error);
    }
  },
  
  loadNetworkPreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(NETWORK_PREFERENCE_KEY);
      if (stored !== null) {
        const isTestnet = JSON.parse(stored);
        set({ isTestnet, isLoading: false });
        console.log('[SettingsStore] Network preference loaded:', isTestnet ? 'Testnet' : 'Mainnet');
      } else {
        set({ isLoading: false });
        console.log('[SettingsStore] No network preference found, using default (Mainnet)');
      }
    } catch (error) {
      console.error('[SettingsStore] Error loading network preference:', error);
      set({ isLoading: false });
    }
  },
}));
