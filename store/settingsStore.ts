import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setThemeMode, type ThemeMode } from '@/theme/colors';

const NETWORK_PREFERENCE_KEY = '@scroll_one:network_preference';
const THEME_PREFERENCE_KEY = '@scroll_one:theme_mode';

interface SettingsState {
  isTestnet: boolean;
  isLoading: boolean;
  themeMode: ThemeMode;
  
  setNetwork: (isTestnet: boolean) => Promise<void>;
  loadNetworkPreference: () => Promise<void>;

  setTheme: (mode: ThemeMode) => Promise<void>;
  loadThemePreference: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isTestnet: false, // Default to mainnet
  isLoading: true,
  themeMode: 'light',
  
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

  setTheme: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
      setThemeMode(mode);
      set({ themeMode: mode });
      console.log('[SettingsStore] Theme preference saved:', mode);
    } catch (error) {
      console.error('[SettingsStore] Error saving theme preference:', error);
    }
  },

  loadThemePreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      const mode: ThemeMode = stored === 'dark' ? 'dark' : 'light';
      setThemeMode(mode);
      set({ themeMode: mode });
      console.log('[SettingsStore] Theme preference loaded:', mode);
    } catch (error) {
      console.error('[SettingsStore] Error loading theme preference:', error);
      // Fallback to light
      setThemeMode('light');
      set({ themeMode: 'light' });
    }
  },
}));

